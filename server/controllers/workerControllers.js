const catchAsync = require("../utils/catchAsync");
const Worker = require("../models/workerModel");
const Report = require("../models/reportModel");
const AppError = require("../utils/appError");
const { sendAssignmentNotification: sendTelegramNotification, getAllUpdates, getBotInfo, isConfigured: isTelegramConfigured } = require("../services/telegramService");
const { sendAssignmentNotification: sendWhatsAppNotification, buildWhatsAppLink, buildNotificationText } = require("../services/whatsappService");

// ── CRUD ──
exports.createWorker = catchAsync(async (req, res, next) => {
  const worker = await Worker.create(req.body);
  res.status(201).json({ status: "success", data: { worker } });
});

exports.getAllWorkers = catchAsync(async (req, res, next) => {
  const filter = {};
  if (req.query.department) filter.department = req.query.department;
  if (req.query.active) filter.isActive = req.query.active === 'true';
  const workers = await Worker.find(filter).populate("assignedReports", "title status category aiAnalysis.urgency");
  res.status(200).json({ status: "success", results: workers.length, data: { workers } });
});

exports.getWorkerById = catchAsync(async (req, res, next) => {
  const worker = await Worker.findById(req.params.id).populate("assignedReports");
  if (!worker) return next(new AppError("No worker found", 404));
  res.status(200).json({ status: "success", data: { worker } });
});

exports.updateWorker = catchAsync(async (req, res, next) => {
  const worker = await Worker.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!worker) return next(new AppError("No worker found", 404));
  res.status(200).json({ status: "success", data: { worker } });
});

exports.deleteWorker = catchAsync(async (req, res, next) => {
  const worker = await Worker.findByIdAndDelete(req.params.id);
  if (!worker) return next(new AppError("No worker found", 404));
  res.status(204).json({ status: "success", data: null });
});

// ── GET WORKERS BY DEPARTMENT ──
exports.getWorkersByDepartment = catchAsync(async (req, res, next) => {
  const dept = decodeURIComponent(req.params.department);
  const workers = await Worker.find({ department: dept, isActive: true })
    .populate("assignedReports", "title status");
  res.status(200).json({ status: "success", data: { workers } });
});

// ── TELEGRAM: Get recent bot messages to find chat IDs ──
exports.getTelegramUpdates = catchAsync(async (req, res, next) => {
  // First check if bot is configured
  if (!isTelegramConfigured()) {
    return res.status(200).json({
      status: "success",
      data: {
        configured: false,
        message: "Bot token not configured. Add TELEGRAM_BOT_TOKEN to your server .env file.",
        chatIds: [],
      },
    });
  }

  // Verify the bot token works
  const botInfo = await getBotInfo();
  if (!botInfo.ok) {
    return res.status(200).json({
      status: "success",
      data: {
        configured: false,
        message: `Bot token invalid: ${botInfo.description || 'Unknown error'}`,
        botName: null,
        chatIds: [],
      },
    });
  }

  // Get all updates (without offset, so we see all historical messages)
  const result = await getAllUpdates();

  if (!result.ok) {
    return res.status(200).json({
      status: "success",
      data: {
        configured: true,
        botName: botInfo.result?.username || 'Unknown',
        message: result.description || "Could not fetch updates from Telegram",
        chatIds: [],
      },
    });
  }

  // Extract unique chat IDs from all message types
  const chatMap = {};
  (result.result || []).forEach(update => {
    // Check various update types for chat info
    const sources = [
      update.message,
      update.edited_message,
      update.channel_post,
      update.my_chat_member,
    ];

    for (const source of sources) {
      const chat = source?.chat || source?.from;
      if (chat?.id) {
        const existing = chatMap[chat.id];
        const msgText = source?.text || '';
        chatMap[chat.id] = {
          chatId: String(chat.id),
          firstName: chat.first_name || existing?.firstName || '',
          lastName: chat.last_name || existing?.lastName || '',
          username: chat.username || existing?.username || '',
          lastMessage: msgText || existing?.lastMessage || '',
          type: chat.type || 'private',
        };
      }
    }
  });

  res.status(200).json({
    status: "success",
    data: {
      configured: true,
      botName: botInfo.result?.username || 'Unknown',
      totalUpdates: (result.result || []).length,
      chatIds: Object.values(chatMap),
    },
  });
});

// ── ASSIGN REPORT TO WORKER (Telegram + WhatsApp) ──
exports.assignReport = catchAsync(async (req, res, next) => {
  const { workerId, reportId } = req.params;

  const worker = await Worker.findById(workerId);
  if (!worker) return next(new AppError("Worker not found", 404));

  const report = await Report.findById(reportId).populate("author", "name");
  if (!report) return next(new AppError("Report not found", 404));

  // Add report to worker's assignments (avoid duplicates)
  if (!worker.assignedReports.some(r => r.toString() === reportId)) {
    worker.assignedReports.push(reportId);
    await worker.save();
  }

  // Update report
  report.assignedTo = workerId;
  if (['received', 'under-review', 'pending'].includes(report.status)) {
    report.status = 'assigned';
    report.statusHistory.push({ status: 'assigned', timestamp: new Date(), note: `Assigned to ${worker.name}` });
  }
  await report.save();

  // Send Telegram notification
  let telegramSent = false;
  let telegramError = null;
  if (worker.telegramChatId) {
    try {
      const tgResult = await sendTelegramNotification(worker, report);
      telegramSent = tgResult.ok === true;
      if (!telegramSent) telegramError = tgResult.description || 'Unknown error';
    } catch (err) {
      telegramError = err.message;
    }
  }

  // Send WhatsApp notification
  let whatsappSent = false;
  let whatsappLink = null;
  let whatsappError = null;
  if (worker.whatsappNumber) {
    try {
      const waResult = await sendWhatsAppNotification(worker, report);
      whatsappSent = waResult.ok === true;
      whatsappLink = waResult.whatsappLink || null;
      if (!whatsappSent && waResult.method !== 'deeplink') {
        whatsappError = waResult.description;
      }
      // If API wasn't configured, generate deep link as fallback
      if (!whatsappLink && !whatsappSent) {
        const text = buildNotificationText(worker, report);
        whatsappLink = buildWhatsAppLink(worker.whatsappNumber, text);
      }
    } catch (err) {
      whatsappError = err.message;
      const text = buildNotificationText(worker, report);
      whatsappLink = buildWhatsAppLink(worker.whatsappNumber, text);
    }
  }

  res.status(200).json({
    status: "success",
    data: {
      worker,
      report,
      telegramSent,
      telegramError,
      whatsappSent,
      whatsappLink,
      whatsappError,
    },
  });
});

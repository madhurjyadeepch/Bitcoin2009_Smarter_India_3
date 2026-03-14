const catchAsync = require("../utils/catchAsync");
const Worker = require("../models/workerModel");
const Report = require("../models/reportModel");
const AppError = require("../utils/appError");
const { sendAssignmentNotification, getUpdates } = require("../services/telegramService");

// Build WhatsApp deep link message
const buildWhatsAppLink = (worker, report) => {
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(report.address || "")}`;
  const msg =
    `*CIVIC ISSUE ASSIGNED*\n\n` +
    `Title: ${report.title}\n` +
    `Category: ${report.category}\n` +
    `Urgency: ${report.aiAnalysis?.urgency || "N/A"}\n` +
    `Priority: ${report.aiAnalysis?.priorityScore || "N/A"}/100\n` +
    `Location: ${report.address}\n` +
    `Maps: ${mapsLink}\n\n` +
    `Description: ${report.description}\n` +
    `Reported By: ${report.author?.name || "Anonymous"}`;

  const phone = worker.whatsappNumber.replace(/[^0-9]/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
};

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
  const result = await getUpdates();

  if (!result.ok) {
    return res.status(200).json({
      status: "success",
      data: {
        configured: false,
        message: result.description || "Bot token not configured or invalid",
        chatIds: [],
      },
    });
  }

  // Extract unique chat IDs from messages
  const chatMap = {};
  (result.result || []).forEach(update => {
    const msg = update.message || update.edited_message;
    if (msg?.chat) {
      const chat = msg.chat;
      chatMap[chat.id] = {
        chatId: String(chat.id),
        firstName: chat.first_name || '',
        lastName: chat.last_name || '',
        username: chat.username || '',
        lastMessage: msg.text || '',
      };
    }
  });

  res.status(200).json({
    status: "success",
    data: {
      configured: true,
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
      const tgResult = await sendAssignmentNotification(worker, report);
      telegramSent = tgResult.ok === true;
      if (!telegramSent) telegramError = tgResult.description || 'Unknown error';
    } catch (err) {
      telegramError = err.message;
    }
  }

  // Build WhatsApp link
  let whatsappLink = null;
  if (worker.whatsappNumber) {
    whatsappLink = buildWhatsAppLink(worker, report);
  }

  res.status(200).json({
    status: "success",
    data: {
      worker,
      report,
      telegramSent,
      telegramError,
      whatsappLink,
    },
  });
});

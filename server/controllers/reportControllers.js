const catchAsync = require("../utils/catchAsync");
const Report = require("../models/reportModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const multer = require("multer");
const path = require("path");
const { analyzeReport, extractCity } = require("../services/aiService");
const { recalculateTrust } = require("../services/trustService");
const { notifyStatusChange } = require("../services/notificationService");
const { analyzeImage } = require("../services/imageAnalysisService");

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });
exports.uploadReportFile = upload.single("image");

// ── CREATE REPORT (with AI pipeline) ──
exports.createReport = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError("Please upload an image.", 400));

  const city = extractCity(req.body.address);

  const reportData = {
    ...req.body,
    author: req.user._id,
    image: req.file.path,
    city,
  };

  const newReport = await Report.create(reportData);

  // AI analysis (runs async, updates report after creation so user isn't blocked)
  analyzeReport(req.body.title, req.body.description, req.body.category, req.body.address)
    .then(async (analysis) => {
      await Report.findByIdAndUpdate(newReport._id, {
        aiAnalysis: { ...analysis, analyzedAt: new Date() },
      });
      // Recalculate trust score for the reporting user
      recalculateTrust(req.user._id).catch(() => {});
    })
    .catch((err) => console.error("AI pipeline error:", err.message));

  res.status(201).json({
    status: "success",
    data: { report: newReport },
  });
});

// ── GET ALL REPORTS (with city filter) ──
exports.getAllReports = catchAsync(async (req, res, next) => {
  const filter = {};
  if (req.query.city) filter.city = new RegExp(req.query.city, "i");
  if (req.query.status) filter.status = req.query.status;

  const sort = req.query.sort === "priority"
    ? { "aiAnalysis.priorityScore": -1 }
    : { createdAt: -1 };

  const reports = await Report.find(filter).populate("author", "name email trustScore").sort(sort);

  res.status(200).json({
    status: "success",
    results: reports.length,
    data: { reports },
  });
});

// ── GET REPORT BY ID ──
exports.getReportById = catchAsync(async (req, res, next) => {
  const reportId = req.params.id || req.body.reportId;
  const report = await Report.findById(reportId).populate("author", "name email trustScore").populate("assignedTo");
  if (!report) return next(new AppError("No report found with that ID", 404));

  res.status(200).json({ status: "success", data: { report } });
});

// ── CHANGE PROGRESS ──
exports.changeProgress = catchAsync(async (req, res, next) => {
  const { reportId, progress } = req.body;
  if (!reportId || !progress) return next(new AppError("Provide reportId and progress", 400));

  const validProgress = [
    "received", "under-review", "assigned",
    "work-in-progress", "verification", "resolved", "closed",
  ];
  if (!validProgress.includes(progress)) return next(new AppError("Invalid progress", 400));

  const report = await Report.findById(reportId).populate("author");
  if (!report) return next(new AppError("No report found", 404));

  report.status = progress;
  report.statusHistory.push({ status: progress, timestamp: new Date() });
  await report.save();

  // Send push notification to report author
  if (report.author) {
    notifyStatusChange(report.author, report, progress).catch(() => {});
  }

  // Recalculate trust when report is resolved
  if (progress === "resolved" && report.author) {
    recalculateTrust(report.author._id || report.author).catch(() => {});
  }

  res.status(200).json({ status: "success", data: { report } });
});

// ── DELETE REPORT ──
exports.deleteReport = catchAsync(async (req, res, next) => {
  const report = await Report.findById(req.params.id);
  if (!report) return next(new AppError("No report found", 404));
  if (report.author.toString() !== req.user._id.toString()) {
    return next(new AppError("You can only delete your own reports", 403));
  }
  await Report.findByIdAndDelete(req.params.id);
  res.status(204).json({ status: "success", data: null });
});

// ── UPVOTE / DOWNVOTE ──
exports.upvoteReport = catchAsync(async (req, res, next) => {
  const report = await Report.findById(req.params.id);
  if (!report) return next(new AppError("No report found", 404));

  const userId = req.user._id;
  const alreadyUpvoted = report.upvotedBy.some(id => id.toString() === userId.toString());

  if (alreadyUpvoted) {
    report.upvotedBy = report.upvotedBy.filter(id => id.toString() !== userId.toString());
  } else {
    report.upvotedBy.push(userId);
    report.downvotedBy = report.downvotedBy.filter(id => id.toString() !== userId.toString());
  }

  await report.save();

  // Recalculate trust for the report author when votes change
  if (report.author) recalculateTrust(report.author).catch(() => {});

  res.status(200).json({ status: "success", data: { report } });
});

exports.downvoteReport = catchAsync(async (req, res, next) => {
  const report = await Report.findById(req.params.id);
  if (!report) return next(new AppError("No report found", 404));

  const userId = req.user._id;
  const alreadyDownvoted = report.downvotedBy.some(id => id.toString() === userId.toString());

  if (alreadyDownvoted) {
    report.downvotedBy = report.downvotedBy.filter(id => id.toString() !== userId.toString());
  } else {
    report.downvotedBy.push(userId);
    report.upvotedBy = report.upvotedBy.filter(id => id.toString() !== userId.toString());
  }

  await report.save();
  res.status(200).json({ status: "success", data: { report } });
});

// ── USER STATS ──
exports.getUserStats = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const totalReports = await Report.countDocuments({ author: userId });
  const resolvedReports = await Report.countDocuments({ author: userId, status: "resolved" });

  const userReports = await Report.find({ author: userId });
  let totalUpvotes = 0;
  userReports.forEach(r => { totalUpvotes += r.upvotedBy?.length || 0; });

  res.status(200).json({
    status: "success",
    data: { totalReports, resolvedReports, totalUpvotes },
  });
});

// ── MY REPORTS ──
exports.myReports = catchAsync(async (req, res, next) => {
  const reports = await Report.find({ author: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ status: "success", results: reports.length, data: { reports } });
});

// ── AI INSIGHTS (for admin dashboard) ──
exports.getAiInsights = catchAsync(async (req, res, next) => {
  const reports = await Report.find().populate("author", "name trustScore");

  // Urgency distribution
  const urgencyDist = { low: 0, medium: 0, high: 0, critical: 0 };
  // Department load
  const departmentLoad = {};
  // Priority tiers
  const priorityTiers = { critical: 0, high: 0, medium: 0, low: 0 };
  // Cities
  const cityCounts = {};

  reports.forEach(r => {
    const ai = r.aiAnalysis;
    if (ai?.urgency) urgencyDist[ai.urgency] = (urgencyDist[ai.urgency] || 0) + 1;
    if (ai?.department) departmentLoad[ai.department] = (departmentLoad[ai.department] || 0) + 1;
    if (ai?.priorityScore != null) {
      if (ai.priorityScore >= 80) priorityTiers.critical++;
      else if (ai.priorityScore >= 60) priorityTiers.high++;
      else if (ai.priorityScore >= 40) priorityTiers.medium++;
      else priorityTiers.low++;
    }
    if (r.city) cityCounts[r.city] = (cityCounts[r.city] || 0) + 1;
  });

  // Top priority unresolved reports
  const topPriority = reports
    .filter(r => r.status !== "resolved" && r.aiAnalysis?.priorityScore != null)
    .sort((a, b) => (b.aiAnalysis.priorityScore || 0) - (a.aiAnalysis.priorityScore || 0))
    .slice(0, 5);

  res.status(200).json({
    status: "success",
    data: {
      totalReports: reports.length,
      urgencyDistribution: urgencyDist,
      departmentLoad,
      priorityTiers,
      cityCounts,
      topPriorityReports: topPriority,
    },
  });
});

// ── GET ALL CITIES (for filter dropdowns) ──
exports.getCities = catchAsync(async (req, res, next) => {
  const cities = await Report.distinct("city");
  res.status(200).json({ status: "success", data: { cities: cities.filter(c => c && c !== 'Unknown') } });
});

// ── ADMIN UPDATE (edit any report field) ──
exports.adminUpdate = catchAsync(async (req, res, next) => {
  const allowed = ['status', 'category', 'title', 'description', 'address', 'city'];
  const aiAllowed = ['urgency', 'priorityScore', 'department', 'aiSummary', 'verifiedCategory'];

  const update = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });

  const aiUpdate = {};
  aiAllowed.forEach(f => { if (req.body[f] !== undefined) aiUpdate[f] = req.body[f]; });

  if (Object.keys(aiUpdate).length > 0) {
    Object.keys(aiUpdate).forEach(k => { update[`aiAnalysis.${k}`] = aiUpdate[k]; });
  }

  // Handle status change: add to history and notify
  if (req.body.status) {
    const report = await Report.findById(req.params.id).populate("author");
    if (report) {
      update.$push = { statusHistory: { status: req.body.status, timestamp: new Date() } };
      // Send push notification
      if (report.author) {
        notifyStatusChange(report.author, report, req.body.status).catch(() => {});
      }
      if (req.body.status === 'resolved' && report.author) {
        recalculateTrust(report.author._id || report.author).catch(() => {});
      }
    }
  }

  const report = await Report.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
    .populate("author", "name email trustScore")
    .populate("assignedTo");

  if (!report) return next(new AppError("No report found", 404));
  res.status(200).json({ status: "success", data: { report } });
});

// ── AI AUTO-FILL (suggest title/desc/category from user text) ──
exports.aiAutofill = catchAsync(async (req, res, next) => {
  const { text, address } = req.body;
  if (!text) return next(new AppError("Provide 'text' to analyze", 400));

  const Groq = require("groq-sdk");
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You help citizens quickly file civic issue reports. Given a rough description of a problem, generate:
1. A concise, professional title (max 10 words)
2. A detailed description (2-3 sentences, formal tone)
3. The most appropriate category from: pothole, garbage, streetlight, drainage, vandalism, general

Respond ONLY in valid JSON:
{"suggestedTitle": "string", "suggestedDescription": "string", "suggestedCategory": "string"}`
      },
      {
        role: "user",
        content: `Problem: ${text}${address ? `\nLocation: ${address}` : ''}\n\nRespond with JSON only.`
      }
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.4,
    max_tokens: 200,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  const parsed = JSON.parse(raw);

  res.status(200).json({
    status: "success",
    data: {
      suggestedTitle: parsed.suggestedTitle || "",
      suggestedDescription: parsed.suggestedDescription || "",
      suggestedCategory: parsed.suggestedCategory || "general",
    },
  });
});

// ── AI IMAGE AUTO-FILL (analyze uploaded photo to suggest title/desc/category) ──
exports.uploadAnalysisImage = upload.single("image");
exports.aiImageAutofill = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError("Please upload an image to analyze.", 400));

  const hint = req.body.hint || req.body.text || '';
  const result = await analyzeImage(req.file.path, hint);

  res.status(200).json({
    status: "success",
    data: {
      suggestedTitle: result.suggestedTitle || '',
      suggestedDescription: result.suggestedDescription || '',
      suggestedCategory: result.suggestedCategory || 'general',
      confidence: result.confidence || 'medium',
    },
  });
});


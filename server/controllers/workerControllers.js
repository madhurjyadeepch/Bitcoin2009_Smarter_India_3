const catchAsync = require("../utils/catchAsync");
const Worker = require("../models/workerModel");
const Report = require("../models/reportModel");
const AppError = require("../utils/appError");

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

// ── GET WORKERS BY DEPARTMENT (with assignment counts) ──
exports.getWorkersByDepartment = catchAsync(async (req, res, next) => {
  const dept = decodeURIComponent(req.params.department);
  const workers = await Worker.find({ department: dept, isActive: true })
    .populate("assignedReports", "title status");
  res.status(200).json({ status: "success", data: { workers } });
});

// ── ASSIGN REPORT TO WORKER ──
exports.assignReport = catchAsync(async (req, res, next) => {
  const { workerId, reportId } = req.params;

  const worker = await Worker.findById(workerId);
  if (!worker) return next(new AppError("Worker not found", 404));

  const report = await Report.findById(reportId).populate("author", "name");
  if (!report) return next(new AppError("Report not found", 404));

  // Add report to worker's assignments (avoid duplicates)
  if (!worker.assignedReports.includes(reportId)) {
    worker.assignedReports.push(reportId);
    await worker.save();
  }

  // Update report with assigned worker info
  report.assignedTo = workerId;
  if (report.status === 'pending') report.status = 'in-progress';
  await report.save();

  // Generate WhatsApp deep link
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(report.address || '')}`;
  const message = `*CIVIC ISSUE ASSIGNED*\n\n` +
    `*Title:* ${report.title}\n` +
    `*Category:* ${report.category}\n` +
    `*Urgency:* ${report.aiAnalysis?.urgency || 'N/A'}\n` +
    `*Priority:* ${report.aiAnalysis?.priorityScore || 'N/A'}/100\n` +
    `*Description:* ${report.description}\n` +
    `*Location:* ${report.address}\n` +
    `*Maps:* ${mapsLink}\n` +
    `*Reported By:* ${report.author?.name || 'Anonymous'}\n\n` +
    `Please resolve this issue and update status.`;

  const whatsappLink = `https://wa.me/${worker.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;

  res.status(200).json({
    status: "success",
    data: {
      worker,
      report,
      whatsappLink,
    },
  });
});

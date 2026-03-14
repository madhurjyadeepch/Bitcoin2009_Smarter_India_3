const express = require("express");
const reportController = require("../controllers/reportControllers");
const authController = require("../controllers/authControllers");

const router = express.Router();

// Public routes (no auth needed)
router.get("/", reportController.getAllReports);
router.get("/cities", reportController.getCities);
router.get("/ai-insights", reportController.getAiInsights);
router.patch("/changeProgress", reportController.changeProgress);
router.patch("/:id/admin-update", reportController.adminUpdate);

// Protected routes that MUST be above /:id to avoid being caught by the wildcard
router.get("/my-reports", authController.protect, reportController.myReports);
router.get("/user-stats", authController.protect, reportController.getUserStats);
router.post("/create", authController.protect, reportController.uploadReportFile, reportController.createReport);
router.post("/ai-autofill", authController.protect, reportController.aiAutofill);

// This must be AFTER all named routes to avoid catching /my-reports, /cities, etc.
router.get("/:id", reportController.getReportById);

// More protected routes
router.post("/getOne", authController.protect, reportController.getReportById);
router.delete("/:id", authController.protect, reportController.deleteReport);
router.patch("/:id/upvote", authController.protect, reportController.upvoteReport);
router.patch("/:id/downvote", authController.protect, reportController.downvoteReport);

module.exports = router;

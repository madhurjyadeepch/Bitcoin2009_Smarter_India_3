const express = require("express");
const reportController = require("../controllers/reportControllers");
const authController = require("../controllers/authControllers");

const router = express.Router();

// Public routes
router.get("/", reportController.getAllReports);
router.get("/cities", reportController.getCities);
router.get("/ai-insights", reportController.getAiInsights);
router.patch("/changeProgress", reportController.changeProgress);

// Protected routes
router.use(authController.protect);

router.get("/my-reports", reportController.myReports);
router.get("/user-stats", reportController.getUserStats);

router.post(
  "/create",
  reportController.uploadReportFile,
  reportController.createReport
);

router.post("/getOne", reportController.getReportById);
router.get("/:id", reportController.getReportById);
router.delete("/:id", reportController.deleteReport);
router.patch("/:id/upvote", reportController.upvoteReport);
router.patch("/:id/downvote", reportController.downvoteReport);

module.exports = router;

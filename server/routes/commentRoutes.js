const express = require("express");
const commentController = require("../controllers/commentControllers");
const authController = require("../controllers/authControllers");

const router = express.Router();

// Public: anyone can read comments
router.get("/:reportId", commentController.getCommentsByReport);

// Protected: must be logged in to create
router.use(authController.protect);
router.post("/:reportId", commentController.createComment);

module.exports = router;

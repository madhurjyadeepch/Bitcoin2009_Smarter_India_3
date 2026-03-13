const catchAsync = require("../utils/catchAsync");
const Comment = require("../models/commentModel");
const AppError = require("../utils/appError");

exports.getCommentsByReport = catchAsync(async (req, res, next) => {
  const comments = await Comment.find({ report: req.params.reportId }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    status: "success",
    results: comments.length,
    data: { comments },
  });
});

exports.createComment = catchAsync(async (req, res, next) => {
  const { text } = req.body;

  if (!text) {
    return next(new AppError("Comment text is required", 400));
  }

  const comment = await Comment.create({
    text,
    author: req.user._id,
    report: req.params.reportId,
  });

  // Populate author for the response
  await comment.populate({ path: "author", select: "name" });

  res.status(201).json({
    status: "success",
    data: { comment },
  });
});

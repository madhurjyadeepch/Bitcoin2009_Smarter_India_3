const mongoose = require("mongoose");

const commentSchema = mongoose.Schema({
  text: {
    type: String,
    required: [true, "A comment must have text"],
    trim: true,
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "A comment must have an author"],
  },
  report: {
    type: mongoose.Schema.ObjectId,
    ref: "Report",
    required: [true, "A comment must belong to a report"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Populate author name on find queries
commentSchema.pre(/^find/, function (next) {
  this.populate({ path: "author", select: "name" });
  next();
});

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;

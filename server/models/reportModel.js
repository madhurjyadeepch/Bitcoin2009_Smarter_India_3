const mongoose = require("mongoose");

const reportSchema = mongoose.Schema({
  title: {
    type: String,
    required: [true, "A report must have a title"],
  },
  description: {
    type: String,
    required: [true, "A report must have a description"],
  },
  category: {
    type: String,
    required: [true, "A report must have a category"],
  },
  address: {
    type: String,
    required: [true, "A report must have an address"],
  },
  city: {
    type: String,
    default: "Unknown",
    index: true,
  },
  image: {
    type: String,
    required: [true, "A report must have an image"],
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: [
      "received",
      "under-review",
      "assigned",
      "work-in-progress",
      "verification",
      "resolved",
      "closed",
    ],
    default: "received",
  },
  statusHistory: [
    {
      status: String,
      timestamp: { type: Date, default: Date.now },
      note: { type: String, default: "" },
    },
  ],
  assignedTo: {
    type: mongoose.Schema.ObjectId,
    ref: "Worker",
    default: null,
  },
  upvotedBy: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
  downvotedBy: [{ type: mongoose.Schema.ObjectId, ref: "User" }],

  // Analysis fields
  aiAnalysis: {
    verifiedCategory: { type: String, default: null },
    urgency: {
      type: String,
      enum: ["low", "medium", "high", "critical", null],
      default: null,
    },
    priorityScore: { type: Number, default: null, min: 0, max: 100 },
    department: { type: String, default: null },
    aiSummary: { type: String, default: null },
    analyzedAt: { type: Date, default: null },
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual fields for counts
reportSchema.virtual("upvotes").get(function () {
  return this.upvotedBy ? this.upvotedBy.length : 0;
});

reportSchema.virtual("downvotes").get(function () {
  return this.downvotedBy ? this.downvotedBy.length : 0;
});

// Ensure virtuals are included in JSON output
reportSchema.set("toJSON", { virtuals: true });
reportSchema.set("toObject", { virtuals: true });

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;

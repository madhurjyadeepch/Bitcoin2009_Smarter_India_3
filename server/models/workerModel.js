const mongoose = require("mongoose");

const workerSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "A worker must have a name"],
  },
  phone: {
    type: String,
    required: [true, "A worker must have a phone number"],
  },
  telegramChatId: {
    type: String,
    default: "",
  },
  whatsappNumber: {
    type: String,
    default: "",
  },
  department: {
    type: String,
    required: [true, "A worker must belong to a department"],
    enum: [
      "Road & Infrastructure",
      "Sanitation & Waste Management",
      "Electricity & Lighting",
      "Water & Drainage",
      "Law Enforcement & Security",
      "General Municipal Services",
      "Public Works Department (PWD)",
      "Urban Development & Housing",
      "Fire & Emergency Services",
      "Health & Family Welfare",
      "Environment & Forest",
      "Transport & Traffic",
      "Revenue & Land Records",
      "Education & Literacy",
      "Social Welfare & Women Development",
      "Panchayati Raj & Rural Development",
      "Disaster Management Authority",
      "Food & Civil Supplies",
      "Telecommunications & IT",
      "Municipal Corporation Administration",
    ],
  },
  assignedReports: [{
    type: mongoose.Schema.ObjectId,
    ref: "Report",
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

workerSchema.virtual("assignmentCount").get(function () {
  return this.assignedReports ? this.assignedReports.length : 0;
});

workerSchema.set("toJSON", { virtuals: true });
workerSchema.set("toObject", { virtuals: true });

const Worker = mongoose.model("Worker", workerSchema);
module.exports = Worker;

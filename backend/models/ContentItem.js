const mongoose = require("mongoose");

const contentItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["hackathon", "activity", "internship", "profile", "work-experience"],
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    sort_order: {
      type: Number,
      default: 0
    },
    github: {
      type: String,
      default: ""
    },
    skills: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContentItem", contentItemSchema);

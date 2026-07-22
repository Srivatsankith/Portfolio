const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },    
    description: { type: String, required: true },
    image: { type: String },
    techStack: [{ type: String }],
    metrics: [{ type: String }],
    githubUrl: { type: String },
    liveUrl: { type: String },
    videoUrl: { type: String },
    category: { type: String, default: "General" },
    featured: { type: Boolean, default: false },
    year: { type: Number },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Project", projectSchema);
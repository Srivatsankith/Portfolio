const router = require("express").Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const mongoose = require("mongoose");

const auth = require("../middleware/authMiddleware");
const Project = require("../models/Project");

const uploadDir = path.join(__dirname, "../uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    const safeName = `${Date.now()}-${file.fieldname}${extension}`;
    cb(null, safeName);
  }
});

const upload = multer({ storage });

function serializeProject(project) {
  return {
    id: project._id.toString(),
    title: project.title,
    subtitle: project.subtitle,
    description: project.description,
    image: project.image,
    techStack: project.techStack,
    highlights: project.highlights,
    metrics: project.metrics,
    githubUrl: project.githubUrl,
    liveUrl: project.liveUrl,
    videoUrl: project.videoUrl,
    category: project.category || "",
    featured: project.featured,
    year: project.year,
    // Legacy fields for backward compatibility if needed
    github: project.github || project.githubUrl || ""
  };
}

router.get("/", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: 1 });
    res.json(projects.map(serializeProject));
  } catch (err) {
    console.error("Project fetch failed:", err);
    res.status(500).json({ message: "Database error" });
  }
});

router.post("/upload", auth, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Image upload failed." });
  }

  res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

router.post("/", auth, async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: "Title and description are required." });
  }

  try {
    const newProject = new Project({
      title: req.body.title,
      subtitle: req.body.subtitle,
      description: req.body.description,
      image: req.body.image,
      techStack: req.body.techStack || [],
      highlights: req.body.highlights || [],
      metrics: req.body.metrics || [],
      githubUrl: req.body.githubUrl,
      liveUrl: req.body.liveUrl,
      videoUrl: req.body.videoUrl,
      category: req.body.category || "General",
      featured: req.body.featured || false,
      year: req.body.year,
      github: req.body.githubUrl || req.body.github, // Maintain legacy field
    });
    const project = await newProject.save();

    res.json({ message: "Project added", projectId: project._id.toString() });
  } catch (err) {
    console.error("Project insert failed:", err);
    res.status(500).json({ message: "Insert failed" });
  }
});

router.put("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: "Title and description are required." });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: "Project not found." });
  }

  try {
    const updateData = {
      title: req.body.title,
      subtitle: req.body.subtitle,
      description: req.body.description,
      image: req.body.image,
      techStack: req.body.techStack || [],
      highlights: req.body.highlights || [],
      metrics: req.body.metrics || [],
      githubUrl: req.body.githubUrl,
      liveUrl: req.body.liveUrl,
      videoUrl: req.body.videoUrl,
      category: req.body.category || "General",
      featured: req.body.featured || false,
      year: req.body.year,
      github: req.body.githubUrl || req.body.github, // Maintain legacy field
    };

    const project = await Project.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    res.json({ message: "Project updated" });
  } catch (err) {
    console.error("Project update failed:", err);
    res.status(500).json({ message: "Update failed" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: "Project not found." });
  }

  try {
    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    res.json({ message: "Project deleted" });
  } catch (err) {
    console.error("Project delete failed:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;

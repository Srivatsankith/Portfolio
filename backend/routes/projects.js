const router = require("express").Router();
const mongoose = require("mongoose");

const auth = require("../middleware/authMiddleware");
const Project = require("../models/Project");

function serializeProject(project) {
  return {
    id: project._id.toString(),
    title: project.title,
    description: project.description,
    image: project.image,
    techStack: project.techStack,
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

function buildProjectData(body) {
  const data = {
    title: body.title,
    description: body.description,
    techStack: body.techStack || [],
    metrics: body.metrics || [],
    githubUrl: body.githubUrl,
    liveUrl: body.liveUrl,
    videoUrl: body.videoUrl,
    category: body.category || "General",
    featured: body.featured || false,
    year: body.year,
  };
  if (body.image !== undefined) {
    data.image = body.image;
  }
  return data;
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

router.post("/", auth, async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: "Title and description are required." });
  }

  try {
    const newProject = new Project(buildProjectData(req.body));
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
    const updateData = buildProjectData(req.body);

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

    res.status(500).json({
      message: err.message,
      error: err
    });
  }
});

router.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: "Project not found." });
  }

  try {
    // Future enhancement: If you were using a cloud service, you would delete the image here.
    // const projectToDelete = await Project.findById(id);
    // if (projectToDelete && projectToDelete.image) {
    //   // Call cloud service to delete image
    // }

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

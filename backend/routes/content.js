const router = require("express").Router();
const mongoose = require("mongoose");

const auth = require("../middleware/authMiddleware");
const ContentItem = require("../models/ContentItem");

const allowedTypes = new Set(["hackathon", "activity", "work-experience", "profile"]);

function isAllowedType(type) {
  return allowedTypes.has(type);
}

function serializeContentItem(item) {
  return {
    id: item._id.toString(),
    type: item.type,
    title: item.title,
    description: item.description,
    sort_order: item.sort_order || 0,
    github: item.github || "",
    skills: item.skills || []
  };
}

router.get("/:type", async (req, res) => {
  const { type } = req.params;

  if (!isAllowedType(type)) {
    return res.status(400).json({ message: "Invalid content type." });
  }

  try {
    const sort = type === "profile" ? { updatedAt: -1, createdAt: -1 } : { sort_order: 1, createdAt: 1 };
    const rows = await ContentItem.find({ type }).sort(sort);
    res.json(rows.map(serializeContentItem));
  } catch (err) {
    console.error("Content fetch failed:", err);
    res.status(500).json({ message: "Database error" });
  }
});

router.post("/:type", auth, async (req, res) => {
  const { type } = req.params;
  const { title, description, sort_order, skills } = req.body;

  if (!isAllowedType(type)) {
    return res.status(400).json({ message: "Invalid content type." });
  }

  if (type !== "profile" && (!title || !description)) {
    return res.status(400).json({ message: "Title and description are required." });
  }

  try {
    if (type === "profile") {
      const item = await ContentItem.findOneAndUpdate(
        { type },
        {
          type,
          title,
          description,
          sort_order: 0,
          skills: []
        },
        { upsert: true, new: true, setDefaultsOnInsert: true, sort: { updatedAt: -1, createdAt: -1 } }
      );

      return res.json({ message: "Profile updated", itemId: item._id.toString() });
    }

    const lastItem = await ContentItem.findOne({ type }).sort({ sort_order: -1 });
    const nextOrder = lastItem ? lastItem.sort_order + 1 : 1;
    const item = await ContentItem.create({
      type,
      title,
      description,
      sort_order: Number(sort_order) || nextOrder,
      skills: type === "work-experience" ? skills : []
    });

    res.json({ message: "Content item added", itemId: item._id.toString() });
  } catch (err) {
    console.error("Content insert failed:", err);
    res.status(500).json({ message: "Insert failed" });
  }
});

router.put("/:type/:id", auth, async (req, res) => {
  const { type, id } = req.params;
  const { title, description, sort_order, skills } = req.body;

  if (!isAllowedType(type)) {
    return res.status(400).json({ message: "Invalid content type." });
  }

  if (type !== "profile" && (!title || !description)) {
    return res.status(400).json({ message: "Title and description are required." });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: "Content item not found." });
  }

  try {
    const item = await ContentItem.findOneAndUpdate(
      { _id: id, type },
      {
        title,
        description,
        sort_order: Number(sort_order) || 0,
        skills: type === "work-experience" ? skills : []
      },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: "Content item not found." });
    }

    res.json({ message: "Content item updated" });
  } catch (err) {
    console.error("Content update failed:", err);
    res.status(500).json({ message: "Update failed" });
  }
});

router.delete("/:type/:id", auth, async (req, res) => {
  const { type, id } = req.params;

  if (!isAllowedType(type)) {
    return res.status(400).json({ message: "Invalid content type." });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: "Content item not found." });
  }

  try {
    const item = await ContentItem.findOneAndDelete({ _id: id, type });

    if (!item) {
      return res.status(404).json({ message: "Content item not found." });
    }

    res.json({ message: "Content item deleted" });
  } catch (err) {
    console.error("Content delete failed:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDatabase = require("./db");
const seedDatabase = require("./seed");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "..")));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/content", require("./routes/content"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../admin.html"));
});

async function startServer() {
  try {
    await connectDatabase();
    await seedDatabase();

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");

const SECRET = process.env.JWT_SECRET || "chitti_secret_key";

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  try {
    const user = await Admin.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id.toString(), username: user.username }, SECRET, { expiresIn: "1d" });
    res.json({ token });
  } catch (err) {
    console.error("Auth query failed:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

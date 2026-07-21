const router = require("express").Router();
const nodemailer = require("nodemailer");

const Contact = require("../models/Contact");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

router.post("/", async (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: "Name, email, and message are required." });
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.CONTACT_TO_EMAIL,
    subject: `New contact message from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || "N/A"}\n\nMessage:\n${message}`,
    html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Phone:</strong> ${phone || "N/A"}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g, "<br />")}</p>`
  };

  try {
    await Contact.create({ name, email, phone: phone || "", message });
  } catch (err) {
    console.error("Contact insert failed:", err);
    return res.status(500).json({ message: "Database error" });
  }

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: "Message sent successfully" });
  } catch (mailErr) {
    console.error("Email send failed:", mailErr);
    res.status(500).json({ message: "Unable to send email at this time." });
  }
});

module.exports = router;

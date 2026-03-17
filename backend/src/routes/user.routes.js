const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const { readCSV, writeCSV } = require("../services/csv.service");
const path = require("path");

const usersFile = path.join(__dirname, "../data/users.csv");

/* ================= GET USER PROFILE ================= */
router.get("/profile", auth, async (req, res) => {
  try {
    const users = await readCSV(usersFile);
    const user = users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Exclude password hash from response
    const { password_hash, ...userProfile } = user;
    res.json(userProfile);
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Failed to get user profile" });
  }
});

/* ================= UPDATE REPORT PREFERENCES ================= */
router.put("/preferences/reports", auth, async (req, res) => {
  try {
    const { reportFrequency, reportFormat, receiveScheduledReports } = req.body;

    // Validate inputs
    const validFrequencies = ["none", "daily", "weekly", "monthly"];
    const validFormats = ["pdf", "xlsx"];

    if (reportFrequency && !validFrequencies.includes(reportFrequency)) {
      return res.status(400).json({
        error: "Invalid reportFrequency. Must be: none, daily, weekly, or monthly",
      });
    }

    if (reportFormat && !validFormats.includes(reportFormat)) {
      return res.status(400).json({
        error: "Invalid reportFormat. Must be: pdf or xlsx",
      });
    }

    // Read users file
    let users = await readCSV(usersFile);
    const userIndex = users.findIndex(u => u.id === req.user.id);

    if (userIndex === -1) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update preferences
    if (reportFrequency) {
      users[userIndex].reportFrequency = reportFrequency;
    }
    if (reportFormat) {
      users[userIndex].reportFormat = reportFormat;
    }
    if (receiveScheduledReports !== undefined) {
      users[userIndex].receiveScheduledReports =
        receiveScheduledReports ? "true" : "false";
    }

    // Write back to CSV
    await writeCSV(usersFile, users);

    res.json({
      message: "Preferences updated successfully",
      preferences: {
        reportFrequency: users[userIndex].reportFrequency,
        reportFormat: users[userIndex].reportFormat,
        receiveScheduledReports: users[userIndex].receiveScheduledReports,
      },
    });
  } catch (err) {
    console.error("Update preferences error:", err);
    res.status(500).json({ message: "Failed to update preferences" });
  }
});

/* ================= GET REPORT PREFERENCES ================= */
router.get("/preferences/reports", auth, async (req, res) => {
  try {
    const users = await readCSV(usersFile);
    let user = users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Provide defaults if not set
    user.reportFrequency = user.reportFrequency || "none";
    user.reportFormat = user.reportFormat || "pdf";
    user.receiveScheduledReports =
      (user.receiveScheduledReports || "false") === "true";

    res.json({
      reportFrequency: user.reportFrequency,
      reportFormat: user.reportFormat,
      receiveScheduledReports: user.receiveScheduledReports,
    });
  } catch (err) {
    console.error("Get preferences error:", err);
    res.status(500).json({ message: "Failed to get preferences" });
  }
});

/* ================= ADMIN: GET ANY USER'S PREFERENCES ================= */
router.get("/:userId/preferences/reports", auth, async (req, res) => {
  try {
    // Check if requester is admin (owner or accountant)
    if (req.user.role !== "OWNER" && req.user.role !== "ACCOUNTANT") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const users = await readCSV(usersFile);
    let user = users.find(u => u.id === req.params.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Provide defaults if not set
    user.reportFrequency = user.reportFrequency || "none";
    user.reportFormat = user.reportFormat || "pdf";
    user.receiveScheduledReports =
      (user.receiveScheduledReports || "false") === "true";

    res.json({
      reportFrequency: user.reportFrequency,
      reportFormat: user.reportFormat,
      receiveScheduledReports: user.receiveScheduledReports,
    });
  } catch (err) {
    console.error("Get user preferences error:", err);
    res.status(500).json({ message: "Failed to get preferences" });
  }
});

/* ================= ADMIN: UPDATE ANY USER'S PREFERENCES ================= */
router.put("/:userId/preferences/reports", auth, async (req, res) => {
  try {
    // Check if requester is admin (owner or accountant)
    if (req.user.role !== "OWNER" && req.user.role !== "ACCOUNTANT") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const { reportFrequency, reportFormat, receiveScheduledReports } = req.body;

    // Validate inputs
    const validFrequencies = ["none", "daily", "weekly", "monthly"];
    const validFormats = ["pdf", "xlsx"];

    if (reportFrequency && !validFrequencies.includes(reportFrequency)) {
      return res.status(400).json({
        error: "Invalid reportFrequency. Must be: none, daily, weekly, or monthly",
      });
    }

    if (reportFormat && !validFormats.includes(reportFormat)) {
      return res.status(400).json({
        error: "Invalid reportFormat. Must be: pdf or xlsx",
      });
    }

    // Read users file
    let users = await readCSV(usersFile);
    const userIndex = users.findIndex(u => u.id === req.params.userId);

    if (userIndex === -1) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update preferences
    if (reportFrequency !== undefined) {
      users[userIndex].reportFrequency = reportFrequency;
    }
    if (reportFormat !== undefined) {
      users[userIndex].reportFormat = reportFormat;
    }
    if (receiveScheduledReports !== undefined) {
      users[userIndex].receiveScheduledReports =
        receiveScheduledReports ? "true" : "false";
    }

    // Write back to CSV
    await writeCSV(usersFile, users);

    res.json({
      message: "Preferences updated successfully",
      preferences: {
        reportFrequency: users[userIndex].reportFrequency,
        reportFormat: users[userIndex].reportFormat,
        receiveScheduledReports: users[userIndex].receiveScheduledReports === "true",
      },
    });
  } catch (err) {
    console.error("Update user preferences error:", err);
    res.status(500).json({ message: "Failed to update preferences" });
  }
});

module.exports = router;

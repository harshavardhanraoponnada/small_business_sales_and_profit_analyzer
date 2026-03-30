const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const prisma = require("../services/prisma.service");

// Helper to parse user ID (handle both string and integer IDs from req.user)
const getUserId = (id) => {
  if (typeof id === 'string') {
    return parseInt(id, 10);
  }
  return id;
};

/* ================= GET USER PROFILE ================= */
router.get("/profile", auth, async (req, res) => {
  try {
    const userId = getUserId(req.user.id);
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        reportFrequency: true,
        reportFormat: true,
        receiveScheduledReports: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Failed to get user profile" });
  }
});

/* ================= UPDATE REPORT PREFERENCES ================= */
router.put("/preferences/reports", auth, async (req, res) => {
  try {
    const { reportFrequency, reportFormat, receiveScheduledReports } = req.body;
    const userId = getUserId(req.user.id);

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

    // Build update object
    const updateData = {};
    if (reportFrequency !== undefined) {
      updateData.reportFrequency = reportFrequency;
    }
    if (reportFormat !== undefined) {
      updateData.reportFormat = reportFormat;
    }
    if (receiveScheduledReports !== undefined) {
      updateData.receiveScheduledReports = Boolean(receiveScheduledReports);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        reportFrequency: true,
        reportFormat: true,
        receiveScheduledReports: true,
      },
    });

    res.json({
      message: "Preferences updated successfully",
      preferences: user,
    });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: "User not found" });
    }
    console.error("Update preferences error:", err);
    res.status(500).json({ message: "Failed to update preferences" });
  }
});

/* ================= GET REPORT PREFERENCES ================= */
router.get("/preferences/reports", auth, async (req, res) => {
  try {
    const userId = getUserId(req.user.id);
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        reportFrequency: true,
        reportFormat: true,
        receiveScheduledReports: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Provide defaults if not set
    const preferences = {
      reportFrequency: user.reportFrequency || "none",
      reportFormat: user.reportFormat || "pdf",
      receiveScheduledReports: Boolean(user.receiveScheduledReports),
    };

    res.json(preferences);
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

    const userId = parseInt(req.params.userId, 10);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        reportFrequency: true,
        reportFormat: true,
        receiveScheduledReports: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Provide defaults if not set
    const preferences = {
      reportFrequency: user.reportFrequency || "none",
      reportFormat: user.reportFormat || "pdf",
      receiveScheduledReports: Boolean(user.receiveScheduledReports),
    };

    res.json(preferences);
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

    const userId = parseInt(req.params.userId, 10);
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

    // Build update object
    const updateData = {};
    if (reportFrequency !== undefined) {
      updateData.reportFrequency = reportFrequency;
    }
    if (reportFormat !== undefined) {
      updateData.reportFormat = reportFormat;
    }
    if (receiveScheduledReports !== undefined) {
      updateData.receiveScheduledReports = Boolean(receiveScheduledReports);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        reportFrequency: true,
        reportFormat: true,
        receiveScheduledReports: true,
      },
    });

    res.json({
      message: "Preferences updated successfully",
      preferences: user,
    });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: "User not found" });
    }
    console.error("Update user preferences error:", err);
    res.status(500).json({ message: "Failed to update preferences" });
  }
});

module.exports = router;

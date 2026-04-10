const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const prisma = require("../services/prisma.service");

const VALID_FREQUENCIES = ["none", "daily", "weekly", "monthly"];
const VALID_FORMATS = ["pdf", "xlsx"];
const VALID_WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const DEFAULT_SCHEDULE_TIME = "09:00";
const DEFAULT_SCHEDULE_WEEKDAY = "monday";

// Normalize ID values to persisted string keys (Prisma User.id is TEXT/cuid)
const getUserId = (id) => {
  return String(id ?? "").trim();
};

const normalizeOptionalValue = (value) => {
  if (value === undefined || value === null) {
    return undefined;
  }
  return String(value).trim();
};

const normalizePreferencePayload = (body = {}) => {
  const rawFrequency = normalizeOptionalValue(body.reportFrequency);
  const rawFormat = normalizeOptionalValue(body.reportFormat);
  const rawScheduleTime = normalizeOptionalValue(body.reportScheduleTime);
  const rawScheduleWeekday = normalizeOptionalValue(body.reportScheduleWeekday);

  return {
    reportFrequency: rawFrequency ? rawFrequency.toLowerCase() : undefined,
    reportFormat: rawFormat ? rawFormat.toLowerCase() : undefined,
    reportScheduleTime: rawScheduleTime || undefined,
    reportScheduleWeekday: rawScheduleWeekday ? rawScheduleWeekday.toLowerCase() : undefined,
    receiveScheduledReports:
      body.receiveScheduledReports !== undefined
        ? Boolean(body.receiveScheduledReports)
        : undefined,
  };
};

const isValidScheduleTime = (value) => {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
};

const formatPreferences = (user) => {
  return {
    reportFrequency: user.reportFrequency || "none",
    reportFormat: user.reportFormat || "pdf",
    reportScheduleTime: user.reportScheduleTime || DEFAULT_SCHEDULE_TIME,
    reportScheduleWeekday: user.reportScheduleWeekday || DEFAULT_SCHEDULE_WEEKDAY,
    receiveScheduledReports: Boolean(user.receiveScheduledReports),
  };
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
        reportScheduleTime: true,
        reportScheduleWeekday: true,
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
    if (req.user.role !== "OWNER") {
      return res.status(403).json({ message: "Access denied. Owner only." });
    }

    const {
      reportFrequency,
      reportFormat,
      reportScheduleTime,
      reportScheduleWeekday,
      receiveScheduledReports,
    } = normalizePreferencePayload(req.body);
    const userId = getUserId(req.user.id);

    // Validate inputs
    if (reportFrequency && !VALID_FREQUENCIES.includes(reportFrequency)) {
      return res.status(400).json({
        error: "Invalid reportFrequency. Must be: none, daily, weekly, or monthly",
      });
    }

    if (reportFormat && !VALID_FORMATS.includes(reportFormat)) {
      return res.status(400).json({
        error: "Invalid reportFormat. Must be: pdf or xlsx",
      });
    }

    if (reportScheduleTime && !isValidScheduleTime(reportScheduleTime)) {
      return res.status(400).json({
        error: "Invalid reportScheduleTime. Use 24-hour HH:MM format (e.g., 09:00)",
      });
    }

    if (reportScheduleWeekday && !VALID_WEEKDAYS.includes(reportScheduleWeekday)) {
      return res.status(400).json({
        error: "Invalid reportScheduleWeekday. Must be monday, tuesday, wednesday, thursday, friday, saturday, or sunday",
      });
    }

    if (receiveScheduledReports === true && reportFrequency === "none") {
      return res.status(400).json({
        error: "reportFrequency cannot be none when receiveScheduledReports is enabled",
      });
    }

    // Build update object
    const updateData = {};
    if (reportFrequency !== undefined) {
      updateData.reportFrequency = reportFrequency;

      if (reportFrequency !== "weekly" && reportScheduleWeekday === undefined) {
        updateData.reportScheduleWeekday = null;
      }
      if (reportFrequency === "weekly" && reportScheduleWeekday === undefined) {
        updateData.reportScheduleWeekday = DEFAULT_SCHEDULE_WEEKDAY;
      }
    }
    if (reportFormat !== undefined) {
      updateData.reportFormat = reportFormat;
    }
    if (reportScheduleTime !== undefined) {
      updateData.reportScheduleTime = reportScheduleTime;
    }
    if (reportScheduleWeekday !== undefined) {
      updateData.reportScheduleWeekday = reportScheduleWeekday;
    }
    if (receiveScheduledReports !== undefined) {
      updateData.receiveScheduledReports = receiveScheduledReports;

      if (receiveScheduledReports === false) {
        if (reportFrequency === undefined) {
          updateData.reportFrequency = "none";
        }
        if (reportScheduleWeekday === undefined) {
          updateData.reportScheduleWeekday = null;
        }
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        reportFrequency: true,
        reportFormat: true,
        reportScheduleTime: true,
        reportScheduleWeekday: true,
        receiveScheduledReports: true,
      },
    });

    res.json({
      message: "Preferences updated successfully",
      preferences: formatPreferences(user),
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
        reportScheduleTime: true,
        reportScheduleWeekday: true,
        receiveScheduledReports: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(formatPreferences(user));
  } catch (err) {
    console.error("Get preferences error:", err);
    res.status(500).json({ message: "Failed to get preferences" });
  }
});

/* ================= ADMIN: GET ANY USER'S PREFERENCES ================= */
router.get("/:userId/preferences/reports", auth, async (req, res) => {
  try {
    if (req.user.role !== "OWNER") {
      return res.status(403).json({ message: "Access denied. Owner only." });
    }

    const userId = getUserId(req.params.userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        reportFrequency: true,
        reportFormat: true,
        reportScheduleTime: true,
        reportScheduleWeekday: true,
        receiveScheduledReports: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(formatPreferences(user));
  } catch (err) {
    console.error("Get user preferences error:", err);
    res.status(500).json({ message: "Failed to get preferences" });
  }
});

/* ================= ADMIN: UPDATE ANY USER'S PREFERENCES ================= */
router.put("/:userId/preferences/reports", auth, async (req, res) => {
  try {
    if (req.user.role !== "OWNER") {
      return res.status(403).json({ message: "Access denied. Owner only." });
    }

    const userId = getUserId(req.params.userId);
    const {
      reportFrequency,
      reportFormat,
      reportScheduleTime,
      reportScheduleWeekday,
      receiveScheduledReports,
    } = normalizePreferencePayload(req.body);

    // Validate inputs
    if (reportFrequency && !VALID_FREQUENCIES.includes(reportFrequency)) {
      return res.status(400).json({
        error: "Invalid reportFrequency. Must be: none, daily, weekly, or monthly",
      });
    }

    if (reportFormat && !VALID_FORMATS.includes(reportFormat)) {
      return res.status(400).json({
        error: "Invalid reportFormat. Must be: pdf or xlsx",
      });
    }

    if (reportScheduleTime && !isValidScheduleTime(reportScheduleTime)) {
      return res.status(400).json({
        error: "Invalid reportScheduleTime. Use 24-hour HH:MM format (e.g., 09:00)",
      });
    }

    if (reportScheduleWeekday && !VALID_WEEKDAYS.includes(reportScheduleWeekday)) {
      return res.status(400).json({
        error: "Invalid reportScheduleWeekday. Must be monday, tuesday, wednesday, thursday, friday, saturday, or sunday",
      });
    }

    if (receiveScheduledReports === true && reportFrequency === "none") {
      return res.status(400).json({
        error: "reportFrequency cannot be none when receiveScheduledReports is enabled",
      });
    }

    // Build update object
    const updateData = {};
    if (reportFrequency !== undefined) {
      updateData.reportFrequency = reportFrequency;

      if (reportFrequency !== "weekly" && reportScheduleWeekday === undefined) {
        updateData.reportScheduleWeekday = null;
      }
      if (reportFrequency === "weekly" && reportScheduleWeekday === undefined) {
        updateData.reportScheduleWeekday = DEFAULT_SCHEDULE_WEEKDAY;
      }
    }
    if (reportFormat !== undefined) {
      updateData.reportFormat = reportFormat;
    }
    if (reportScheduleTime !== undefined) {
      updateData.reportScheduleTime = reportScheduleTime;
    }
    if (reportScheduleWeekday !== undefined) {
      updateData.reportScheduleWeekday = reportScheduleWeekday;
    }
    if (receiveScheduledReports !== undefined) {
      updateData.receiveScheduledReports = receiveScheduledReports;

      if (receiveScheduledReports === false) {
        if (reportFrequency === undefined) {
          updateData.reportFrequency = "none";
        }
        if (reportScheduleWeekday === undefined) {
          updateData.reportScheduleWeekday = null;
        }
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        reportFrequency: true,
        reportFormat: true,
        reportScheduleTime: true,
        reportScheduleWeekday: true,
        receiveScheduledReports: true,
      },
    });

    res.json({
      message: "Preferences updated successfully",
      preferences: formatPreferences(user),
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

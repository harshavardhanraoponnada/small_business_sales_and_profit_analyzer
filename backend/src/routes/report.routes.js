const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const reportController = require("../controllers/report.controller");

/* ================= SUMMARY ================= */
router.get(
  "/summary",
  auth,
  role("OWNER", "ACCOUNTANT"),
  reportController.getSummary
);

/* ================= QUICK STATS ================= */
router.get("/quick-stats", auth, reportController.getQuickStats);

/* ================= LOW STOCK ================= */
router.get("/low-stock", auth, reportController.getLowStock);

/* ================= SALES TREND ================= */
router.get(
  "/sales-trend",
  auth,
  reportController.getSalesTrend
);

/* ================= PROFIT TREND ================= */
router.get(
  "/profit-trend",
  auth,
  role("OWNER", "ACCOUNTANT"),
  reportController.getProfitTrend
);

/* ================= EXPENSE DISTRIBUTION ================= */
router.get(
  "/expense-distribution",
  auth,
  role("OWNER", "ACCOUNTANT"),
  reportController.getExpenseDistribution
);

/* ================= EXPENSE ANALYTICS ================= */
router.get("/expenses", auth, reportController.getExpenseAnalytics);

/* ================= EXPORT REPORT ================= */
router.post(
  "/export",
  auth,
  role("OWNER", "ACCOUNTANT"),
  reportController.exportReport
);

/* ================= SCHEDULED REPORTS ================= */
router.post(
  "/schedule",
  auth,
  role("OWNER"),
  reportController.createScheduledReport
);

router.get(
  "/scheduler/status",
  auth,
  role("OWNER"),
  reportController.getSchedulerStatus
);

router.get(
  "/schedules",
  auth,
  role("OWNER"),
  reportController.listSchedules
);

router.get(
  "/schedules/:scheduleId",
  auth,
  role("OWNER"),
  reportController.getSchedule
);

router.put(
  "/schedules/:scheduleId",
  auth,
  role("OWNER"),
  reportController.updateSchedule
);

router.delete(
  "/schedules/:scheduleId",
  auth,
  role("OWNER"),
  reportController.deleteSchedule
);

module.exports = router;

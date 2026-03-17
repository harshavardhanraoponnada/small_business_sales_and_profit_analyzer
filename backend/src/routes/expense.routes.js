const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const upload = require("../middleware/expenseUpload.middleware");
const controller = require("../controllers/expense.controller");
const audit = require("../middleware/auditLogger");

router.get("/", auth, role("OWNER", "ACCOUNTANT"), controller.getExpenses);

router.get("/category-summary", auth, role("OWNER", "ACCOUNTANT"), controller.getCategorySummary);

router.get("/monthly-category", auth, role("OWNER", "ACCOUNTANT"), controller.getMonthlyCategorySummary);

router.post(
  "/",
  auth,
  role("OWNER", "ACCOUNTANT"),
  upload.single("file"),
  audit("EXPENSE_ADD", req => `Added expense ${req.body.category || 'Unknown'}`),
  controller.addExpense
);

module.exports = router;

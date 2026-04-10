const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const upload = require("../middleware/expenseUpload.middleware");
const controller = require("../controllers/expense.controller");
const audit = require("../middleware/auditLogger");
const {
  validate,
  expenseSchema,
  expenseUpdateSchema,
} = require("../middleware/validation.middleware");

router.get("/", auth, role("OWNER", "ACCOUNTANT"), controller.getExpenses);

router.get(
  "/categories",
  auth,
  role("OWNER", "ACCOUNTANT"),
  controller.getExpenseCategories
);

router.get(
  "/metadata",
  auth,
  role("OWNER", "ACCOUNTANT"),
  controller.getExpenseMetadata
);

router.post(
  "/categories",
  auth,
  role("OWNER", "ACCOUNTANT"),
  audit("EXPENSE_CATEGORY_ADD", req => `Added expense category ${req.body.name || 'Unknown'}`),
  controller.createExpenseCategory
);

router.put(
  "/categories/:id",
  auth,
  role("OWNER", "ACCOUNTANT"),
  audit("EXPENSE_CATEGORY_UPDATE", req => `Updated expense category ${req.params.id}`),
  controller.updateExpenseCategory
);

router.delete(
  "/categories/:id",
  auth,
  role("OWNER", "ACCOUNTANT"),
  audit("EXPENSE_CATEGORY_DELETE", req => `Deleted expense category ${req.params.id}`),
  controller.deleteExpenseCategory
);

router.post(
  "/categories/:id/restore",
  auth,
  role("OWNER", "ACCOUNTANT"),
  audit("EXPENSE_CATEGORY_RESTORE", req => `Restored expense category ${req.params.id}`),
  controller.restoreExpenseCategory
);

router.get("/category-summary", auth, role("OWNER", "ACCOUNTANT"), controller.getCategorySummary);

router.get("/monthly-category", auth, role("OWNER", "ACCOUNTANT"), controller.getMonthlyCategorySummary);

router.get("/:id", auth, role("OWNER", "ACCOUNTANT"), controller.getExpenseById);

router.post(
  "/",
  auth,
  role("OWNER", "ACCOUNTANT"),
  upload.single("file"),
  validate(expenseSchema),
  audit("EXPENSE_ADD", req => `Added expense ${req.body.category || 'Unknown'}`),
  controller.addExpense
);

router.put(
  "/:id",
  auth,
  role("OWNER", "ACCOUNTANT"),
  upload.single("file"),
  validate(expenseUpdateSchema),
  audit("EXPENSE_UPDATE", req => `Updated expense ${req.params.id}`),
  controller.updateExpense
);

router.delete(
  "/:id",
  auth,
  role("OWNER", "ACCOUNTANT"),
  audit("EXPENSE_DELETE", req => `Deleted expense ${req.params.id}`),
  controller.deleteExpense
);

module.exports = router;

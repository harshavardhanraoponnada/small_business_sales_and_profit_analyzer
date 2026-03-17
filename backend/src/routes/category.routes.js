const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const audit = require("../middleware/auditLogger");
const { validate, categorySchema } = require("../middleware/validation.middleware");
const controller = require("../controllers/category.controller");

router.get("/", auth, controller.getCategories);

router.post(
  "/",
  auth,
  role("OWNER", "ACCOUNTANT"),
  validate(categorySchema),
  audit("CATEGORY_ADD", req => `Added category ${req.body.name || 'Unknown'}`),
  controller.addCategory
);

router.put(
  "/:id",
  auth,
  role("OWNER"),
  validate(categorySchema),
  audit("CATEGORY_UPDATE", req => `Updated category ${req.params.id}`),
  controller.updateCategory
);

router.delete(
  "/:id",
  auth,
  role("OWNER"),
  audit("CATEGORY_DELETE", req => `Deleted category ${req.params.id}`),
  controller.deleteCategory
);

router.patch(
  "/:id/restore",
  auth,
  role("OWNER"),
  audit("CATEGORY_RESTORE", req => `Restored category ${req.params.id}`),
  controller.restoreCategory
);

module.exports = router;

const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const audit = require("../middleware/auditLogger");
const { validate, productSchema } = require("../middleware/validation.middleware");
const controller = require("../controllers/product.controller");

// GET all products (no audit)
router.get(
  "/",
  auth,
  role("OWNER", "ACCOUNTANT", "STAFF"),
  controller.getProducts
);

// POST add product with audit
router.post(
  "/",
  auth,
  role("OWNER", "ACCOUNTANT"),
  validate(productSchema),
  (req, res, next) => audit("PRODUCT_ADD", () => `Added ${req.body.name}`)(req, res, next),
  controller.addProduct
);

// PUT update product with audit
router.put(
  "/:id",
  auth,
  role("OWNER", "ACCOUNTANT"),
  validate(productSchema),
  (req, res, next) => audit("PRODUCT_UPDATE", () => `Updated ${req.params.id}`)(req, res, next),
  controller.updateProduct
);

// DELETE product with audit
router.delete(
  "/:id",
  auth,
  role("OWNER"),
  (req, res, next) => audit("PRODUCT_DELETE", () => `Deleted ${req.params.id}`)(req, res, next),
  controller.deleteProduct
);

// RESTORE product with audit
router.patch(
  "/:id/restore",
  auth,
  role("OWNER"),
  (req, res, next) => audit("PRODUCT_RESTORE", () => `Restored ${req.params.id}`)(req, res, next),
  controller.restoreProduct
);

module.exports = router;

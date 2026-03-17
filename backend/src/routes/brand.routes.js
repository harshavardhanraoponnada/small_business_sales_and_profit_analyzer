const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const audit = require("../middleware/auditLogger");
const { validate, brandSchema } = require("../middleware/validation.middleware");
const controller = require("../controllers/brand.controller");

router.get("/", auth, controller.getBrands);

router.post(
  "/",
  auth,
  role("OWNER", "ACCOUNTANT"),
  validate(brandSchema),
  audit("BRAND_ADD", req => `Added brand ${req.body.name || 'Unknown'}`),
  controller.addBrand
);

router.put(
  "/:id",
  auth,
  role("OWNER"),
  validate(brandSchema),
  audit("BRAND_UPDATE", req => `Updated brand ${req.params.id}`),
  controller.updateBrand
);

router.delete(
  "/:id",
  auth,
  role("OWNER"),
  audit("BRAND_DELETE", req => `Deleted brand ${req.params.id}`),
  controller.deleteBrand
);

router.patch(
  "/:id/restore",
  auth,
  role("OWNER"),
  audit("BRAND_RESTORE", req => `Restored brand ${req.params.id}`),
  controller.restoreBrand
);

module.exports = router;

const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const audit = require("../middleware/auditLogger");
const { validate, variantSchema } = require("../middleware/validation.middleware");
const controller = require("../controllers/variant.controller");

router.get("/", auth, controller.getVariants);

router.post(
  "/",
  auth,
  role("OWNER", "ACCOUNTANT"),
  validate(variantSchema),
  audit("VARIANT_ADD", req => `Added variant ${req.body.name || 'Unknown'}`),
  controller.addVariant
);

router.put(
  "/:id",
  auth,
  role("OWNER", "ACCOUNTANT"),
  validate(variantSchema),
  audit("VARIANT_UPDATE", req => `Updated variant ${req.params.id}`),
  controller.updateVariant
);

router.delete(
  "/:id",
  auth,
  role("OWNER"),
  audit("VARIANT_DELETE", req => `Deleted variant ${req.params.id}`),
  controller.deleteVariant
);

router.patch(
  "/:id/restore",
  auth,
  role("OWNER"),
  audit("VARIANT_RESTORE", req => `Restored variant ${req.params.id}`),
  controller.restoreVariant
);

module.exports = router;

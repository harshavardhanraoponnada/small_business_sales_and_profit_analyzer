const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const audit = require("../middleware/auditLogger");
const { validate, modelSchema } = require("../middleware/validation.middleware");
const controller = require("../controllers/model.controller");

router.get("/", auth, controller.getModels);

router.post(
  "/",
  auth,
  role("OWNER", "ACCOUNTANT"),
  validate(modelSchema),
  audit("MODEL_ADD", req => `Added model ${req.body.name || 'Unknown'}`),
  controller.addModel
);

router.put(
  "/:id",
  auth,
  role("OWNER"),
  validate(modelSchema),
  audit("MODEL_UPDATE", req => `Updated model ${req.params.id}`),
  controller.updateModel
);

router.delete(
  "/:id",
  auth,
  role("OWNER"),
  audit("MODEL_DELETE", req => `Deleted model ${req.params.id}`),
  controller.deleteModel
);

router.patch(
  "/:id/restore",
  auth,
  role("OWNER"),
  audit("MODEL_RESTORE", req => `Restored model ${req.params.id}`),
  controller.restoreModel
);

module.exports = router;

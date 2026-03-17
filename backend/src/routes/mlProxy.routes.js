const express = require("express");
const router = express.Router();
const controller = require("../controllers/mlProxy.controller");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

router.get("/predictions/summary", auth, role("OWNER"), controller.getSummary);
router.get("/predictions/forecast/:type", auth, role("OWNER"), controller.getForecast);
router.post("/predictions/train", auth, role("OWNER"), controller.trainModels);
router.get("/predictions/evaluate/:type", auth, role("OWNER"), controller.evaluateModel);

module.exports = router;

const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const { getLogs } = require("../controllers/audit.controller");

router.get("/", auth, role("OWNER"), getLogs);

module.exports = router;

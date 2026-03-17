const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const { downloadInvoice } = require("../invoices/invoice.controller");

const audit = require("../middleware/auditLogger");

router.get(
  "/:id",
  auth,
  role("OWNER", "ACCOUNTANT"),
  audit("INVOICE_DOWNLOAD", req => `Downloaded ${req.params.id}`),
  downloadInvoice
);

module.exports = router;

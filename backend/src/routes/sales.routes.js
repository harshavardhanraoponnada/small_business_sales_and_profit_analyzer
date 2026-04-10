const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const { addSale, getSales, updateSale, deleteSale } = require("../controllers/sales.controller");
const audit = require("../middleware/auditLogger");
const { validate, saleSchema } = require("../middleware/validation.middleware");

router.get(
  "/",
  auth,
  role("OWNER", "ACCOUNTANT", "STAFF"),
  getSales
);

router.post(
  "/",
  auth,
  role("OWNER", "ACCOUNTANT", "STAFF"),
  validate(saleSchema),
  audit("SALE_ADD", req => {
    // Support both product and variant sales in the log
    if (req.body.product_id) return `Sold product ${req.body.product_id}`;
    if (req.body.variant_id) return `Sold variant ${req.body.variant_id}`;
    return "Sale recorded";
  }),
  addSale
);

router.put(
  "/:id",
  auth,
  role("OWNER", "ACCOUNTANT"),
  audit("SALE_UPDATE", req => `Updated sale ${req.params.id}`),
  updateSale
);

router.delete(
  "/:id",
  auth,
  role("OWNER", "ACCOUNTANT"),
  audit("SALE_DELETE", req => `Deleted sale ${req.params.id}`),
  deleteSale
);

module.exports = router;

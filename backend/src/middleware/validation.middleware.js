const Joi = require("joi");

// Sale schema - for adding/creating a sale
const saleSchema = Joi.object({
  customer_name: Joi.string().trim().min(1).max(120).required(),
  product_id: Joi.alternatives().try(
    Joi.string().trim().min(1),
    Joi.number().integer().positive()
  ).optional(),
  variant_id: Joi.alternatives().try(
    Joi.string().trim().min(1),
    Joi.number().integer().positive()
  ).optional(),
  unit_price: Joi.number().precision(2).positive().optional(),
  selling_price: Joi.number().precision(2).positive().optional(),
  quantity: Joi.number().integer().positive().required(),
  bought_price: Joi.number().precision(2).positive().optional(),
  notes: Joi.string().max(500).optional().allow(""),
}).or("product_id", "variant_id").unknown(false);

// Variant schema - for adding/updating variants
const variantSchema = Joi.object({
  variant_name: Joi.string().trim().min(1).max(100).required(),
  stock: Joi.number().integer().min(0).required(),
  purchase_price: Joi.number().precision(2).positive().optional(),
  selling_price: Joi.number().precision(2).positive().optional(),
  reorder_level: Joi.number().integer().min(0).optional(),
}).unknown(true);

// Product schema - for adding/updating products
const productSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  sku: Joi.string().trim().min(1).max(64).required(),
  brand: Joi.string().trim().min(1).max(100).required(),
  category_id: Joi.string().required(),
  stock: Joi.number().integer().min(0).optional(),
  purchase_price: Joi.number().precision(2).positive().optional(),
  selling_price: Joi.number().precision(2).positive().optional(),
}).unknown(true);

// Category schema
const categorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
}).unknown(true);

// Brand schema
const brandSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  category_id: Joi.string().required(),
}).unknown(true);

// Model schema
const modelSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  brand_id: Joi.string().required(),
}).unknown(true);

const requiredExpenseFields = {
  category: Joi.string().trim().min(1).max(120).required(),
  amount: Joi.number().precision(2).positive().required(),
  description: Joi.string().trim().min(1).max(500).required(),
  date: Joi.date().iso().optional(),
  expense_date: Joi.date().iso().optional(),
  vendor_name: Joi.string().trim().min(1).max(160).required(),
  invoice_reference: Joi.string().trim().min(1).max(120).required(),
  tax_amount: Joi.number().precision(2).min(0).required(),
  payment_method: Joi.string().trim().min(1).max(50).required(),
  affects_cogs_override: Joi.boolean().allow(null, "").optional(),
};

// Expense create schema
const expenseSchema = Joi.object(requiredExpenseFields)
  .or("date", "expense_date")
  .unknown(true);

// Expense update schema (full payload updates with required accounting fields)
const expenseUpdateSchema = Joi.object(requiredExpenseFields)
  .or("date", "expense_date")
  .unknown(true);

module.exports = {
  saleSchema,
  variantSchema,
  productSchema,
  categorySchema,
  brandSchema,
  modelSchema,
  expenseSchema,
  expenseUpdateSchema,
  
  // Validation function factory
  validate: (schema) => {
    return (req, res, next) => {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const messages = error.details.map(d => d.message).join("; ");
        return res.status(400).json({
          message: "Validation failed",
          details: messages,
        });
      }

      // Replace body with validated value
      req.body = value;
      next();
    };
  },
};

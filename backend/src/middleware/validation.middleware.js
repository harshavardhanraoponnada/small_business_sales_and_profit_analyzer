const Joi = require("joi");

// Sale schema - for adding/creating a sale
const saleSchema = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  variant_id: Joi.number().integer().positive().required(),
  selling_price: Joi.number().precision(2).positive().required(),
  quantity: Joi.number().integer().positive().required(),
  bought_price: Joi.number().precision(2).positive().optional(),
  notes: Joi.string().max(500).optional().allow(""),
}).unknown(false);

// Variant schema - for adding/updating variants
const variantSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  model_id: Joi.number().integer().positive().required(),
  specification: Joi.string().max(500).optional().allow(""),
  price: Joi.number().precision(2).positive().required(),
  quantity: Joi.number().integer().min(0).required(),
  cost_price: Joi.number().precision(2).positive().optional(),
  sku: Joi.string().max(50).optional().allow(""),
}).unknown(false);

// Product schema - for adding/updating products
const productSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().max(500).optional().allow(""),
  category_id: Joi.number().integer().positive().required(),
}).unknown(false);

// Category schema
const categorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().max(500).optional().allow(""),
}).unknown(false);

// Brand schema
const brandSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().max(500).optional().allow(""),
}).unknown(false);

// Model schema
const modelSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  brand_id: Joi.number().integer().positive().required(),
  description: Joi.string().max(500).optional().allow(""),
}).unknown(false);

module.exports = {
  saleSchema,
  variantSchema,
  productSchema,
  categorySchema,
  brandSchema,
  modelSchema,
  
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

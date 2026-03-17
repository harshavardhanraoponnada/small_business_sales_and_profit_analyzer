const prisma = require("../services/prisma.service");
const { generateInvoice } = require("../services/invoice.service");

/**
 * Get all sales
 */
exports.getSales = async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      where: { is_deleted: false },
      include: {
        variant: { select: { variant_name: true } },
        product: { select: { name: true } },
        user: { select: { username: true } },
      },
      orderBy: { created_at: 'desc' },
    });
    res.json(sales);
  } catch (error) {
    console.error("Error fetching sales:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Add a sale
 * Request body should contain either:
 * - product_id + quantity
 * OR
 * - variant_id + quantity
 */
exports.addSale = async (req, res) => {
  try {
    const { product_id, variant_id, quantity, unit_price } = req.body;

    if (!quantity || Number(quantity) <= 0) {
      return res.status(400).json({ message: "Quantity must be a positive number" });
    }

    let item, itemType;

    if (variant_id) {
      // Lookup variant
      const variant = await prisma.variant.findUnique({
        where: { id: variant_id },
        include: { model: true },
      });
      
      if (!variant) return res.status(404).json({ message: "Variant not found" });

      if (variant.stock < Number(quantity)) {
        return res.status(400).json({ message: "Insufficient stock" });
      }

      // Update variant stock
      await prisma.variant.update({
        where: { id: variant_id },
        data: { stock: variant.stock - Number(quantity) },
      });

      item = variant;
      itemType = "variant";

    } else if (product_id) {
      const product = await prisma.product.findUnique({
        where: { id: product_id },
      });
      
      if (!product) return res.status(404).json({ message: "Product not found" });

      if (product.stock < Number(quantity)) {
        return res.status(400).json({ message: "Insufficient stock" });
      }

      // Update product stock
      await prisma.product.update({
        where: { id: product_id },
        data: { stock: product.stock - Number(quantity) },
      });

      item = product;
      itemType = "product";

    } else {
      return res.status(400).json({ message: "Either product_id or variant_id must be provided" });
    }

    // Calculate totals
    const sale_unit_price = unit_price ? Number(unit_price) : 0;
    const total = sale_unit_price * Number(quantity);

    // Create sale record
    const sale = await prisma.sale.create({
      data: {
        date: new Date(),
        variant_id: variant_id || null,
        product_id: product_id || null,
        quantity: Number(quantity),
        unit_price: sale_unit_price,
        total,
        created_by: req.user.id,
      },
      include: { user: { select: { username: true } } },
    });

    // Generate invoice
    const invoiceId = `INV_${Date.now()}`;
    generateInvoice({ invoiceId, item, quantity: Number(quantity), total, itemType });

    res.status(201).json({
      message: "Sale recorded",
      sale,
      invoice_id: invoiceId
    });

  } catch (error) {
    console.error("Error adding sale:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

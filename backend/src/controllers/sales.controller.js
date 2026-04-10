const prisma = require("../services/prisma.service");
const { generateInvoice } = require("../services/invoice.service");

const extractSellingPrice = (item) => {
  if (!item) return 0;

  const direct = Number(item.selling_price);
  if (Number.isFinite(direct) && direct > 0) {
    return direct;
  }

  if (typeof item.prices === "string") {
    try {
      const parsed = JSON.parse(item.prices);
      const parsedPrice = Number(parsed?.selling_price || 0);
      if (Number.isFinite(parsedPrice) && parsedPrice > 0) {
        return parsedPrice;
      }
    } catch {
      return 0;
    }
  }

  return 0;
};

/**
 * Get all sales
 */
exports.getSales = async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      where: { is_deleted: false },
      include: {
        variant: {
          select: {
            variant_name: true,
            model: {
              select: {
                name: true,
                brand: { select: { name: true } },
              },
            },
          },
        },
        product: { select: { name: true, brand: true } },
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
    const { customer_name, product_id, variant_id, quantity, unit_price } = req.body;

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

    // Prefer request price; fallback to item selling price if request is missing/invalid.
    const requestedUnitPrice = Number(unit_price);
    const fallbackUnitPrice = extractSellingPrice(item);
    const sale_unit_price = Number.isFinite(requestedUnitPrice) && requestedUnitPrice > 0
      ? requestedUnitPrice
      : fallbackUnitPrice;

    if (!Number.isFinite(sale_unit_price) || sale_unit_price <= 0) {
      return res.status(400).json({ message: "Unit price must be a positive number" });
    }

    // Calculate totals
    const total = sale_unit_price * Number(quantity);

    // Create sale record
    const sale = await prisma.sale.create({
      data: {
        date: new Date(),
        customer_name,
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
    generateInvoice({ invoiceId, item, unitPrice: sale_unit_price, quantity: Number(quantity), total, itemType });

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

/**
 * Update an existing sale
 * Supports updating quantity and unit_price.
 * When quantity changes, stock is reconciled against the original sold item.
 */
exports.updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_name, quantity, unit_price } = req.body;

    const sale = await prisma.sale.findFirst({
      where: { id, is_deleted: false },
    });

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    const nextQuantity = quantity != null ? Number(quantity) : Number(sale.quantity);
    const nextUnitPrice = unit_price != null ? Number(unit_price) : Number(sale.unit_price);
    const nextCustomerName = customer_name != null ? String(customer_name).trim() : String(sale.customer_name || "");

    if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) {
      return res.status(400).json({ message: "Quantity must be a positive number" });
    }

    if (!Number.isFinite(nextUnitPrice) || nextUnitPrice <= 0) {
      return res.status(400).json({ message: "Unit price must be a positive number" });
    }

    if (!nextCustomerName) {
      return res.status(400).json({ message: "Customer name is required" });
    }

    const quantityDelta = nextQuantity - Number(sale.quantity);

    if (quantityDelta !== 0) {
      if (sale.variant_id) {
        const variant = await prisma.variant.findUnique({ where: { id: sale.variant_id } });
        if (!variant) return res.status(404).json({ message: "Variant not found" });

        if (quantityDelta > 0 && variant.stock < quantityDelta) {
          return res.status(400).json({ message: "Insufficient stock for quantity increase" });
        }

        await prisma.variant.update({
          where: { id: sale.variant_id },
          data: { stock: variant.stock - quantityDelta },
        });
      } else if (sale.product_id) {
        const product = await prisma.product.findUnique({ where: { id: sale.product_id } });
        if (!product) return res.status(404).json({ message: "Product not found" });

        if (quantityDelta > 0 && product.stock < quantityDelta) {
          return res.status(400).json({ message: "Insufficient stock for quantity increase" });
        }

        await prisma.product.update({
          where: { id: sale.product_id },
          data: { stock: product.stock - quantityDelta },
        });
      }
    }

    const updatedSale = await prisma.sale.update({
      where: { id },
      data: {
        customer_name: nextCustomerName,
        quantity: nextQuantity,
        unit_price: nextUnitPrice,
        total: nextQuantity * nextUnitPrice,
      },
      include: {
        variant: {
          select: {
            variant_name: true,
            model: {
              select: {
                name: true,
                brand: { select: { name: true } },
              },
            },
          },
        },
        product: { select: { name: true, brand: true } },
        user: { select: { username: true } },
      },
    });

    res.json({ message: "Sale updated", sale: updatedSale });
  } catch (error) {
    console.error("Error updating sale:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

/**
 * Soft delete a sale and restore sold stock.
 */
exports.deleteSale = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await prisma.sale.findFirst({
      where: { id, is_deleted: false },
    });

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    if (sale.variant_id) {
      const variant = await prisma.variant.findUnique({ where: { id: sale.variant_id } });
      if (variant) {
        await prisma.variant.update({
          where: { id: sale.variant_id },
          data: { stock: variant.stock + Number(sale.quantity) },
        });
      }
    } else if (sale.product_id) {
      const product = await prisma.product.findUnique({ where: { id: sale.product_id } });
      if (product) {
        await prisma.product.update({
          where: { id: sale.product_id },
          data: { stock: product.stock + Number(sale.quantity) },
        });
      }
    }

    await prisma.sale.update({
      where: { id },
      data: { is_deleted: true },
    });

    res.json({ message: "Sale deleted", saleId: id });
  } catch (error) {
    console.error("Error deleting sale:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

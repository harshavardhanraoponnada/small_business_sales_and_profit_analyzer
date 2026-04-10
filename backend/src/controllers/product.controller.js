const prisma = require("../services/prisma.service");
const auditService = require("../services/audit.service");
const { transformProducts, transformProduct, packPrices } = require("../services/priceTransform.service");

const isSkuUniqueViolation = (error) => {
  if (!error || error.code !== "P2002") {
    return false;
  }

  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return target.includes("sku");
  }

  return String(target || "").includes("sku");
};

exports.getProducts = async (req, res) => {
  try {
    const { includeDeleted } = req.query;
    
    const where = includeDeleted !== "true" ? { is_deleted: false } : {};
    
    const products = await prisma.product.findMany({
      where,
      include: { category: { select: { name: true } } },
      orderBy: { created_at: 'desc' },
    });
    
    res.json(transformProducts(products));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products", error: error.message });
  }
};

exports.addProduct = async (req, res) => {
  try {
    const newProduct = await prisma.product.create({
      data: {
        name: req.body.name,
        sku: String(req.body.sku).trim(),
        brand: req.body.brand,
        category_id: req.body.category_id,
        stock: req.body.stock || 0,
        prices: packPrices({
          purchase_price: req.body.purchase_price || 0,
          selling_price: req.body.selling_price || 0,
        }),
        is_deleted: false,
      },
      include: { category: { select: { name: true } } },
    });

    // Log the action
    auditService.logAction({
      user: req.user,
      action: "CREATE_PRODUCT",
      details: `Product created: ${newProduct.name} (${newProduct.id})`
    });
    
    res.status(201).json({ message: "Product added", product: transformProduct(newProduct) });
  } catch (error) {
    if (isSkuUniqueViolation(error)) {
      return res.status(409).json({ message: "SKU already exists" });
    }

    res.status(500).json({ message: "Failed to add product", error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
    });
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const updateData = { ...req.body };

    if (updateData.sku !== undefined) {
      updateData.sku = String(updateData.sku).trim();
    }

    // Convert stock to number
    if (updateData.stock !== undefined) {
      updateData.stock = Number(updateData.stock);
    }
    // If price fields are provided, pack them into JSON
    if (req.body.purchase_price !== undefined || req.body.selling_price !== undefined) {
      updateData.prices = packPrices({
        purchase_price: req.body.purchase_price || 0,
        selling_price: req.body.selling_price || 0,
      });
      delete updateData.purchase_price;
      delete updateData.selling_price;
    }

    const updatedProduct = await prisma.product.update({
      where: { id: req.params.id },
      data: updateData,
      include: { category: { select: { name: true } } },
    });

    // Log the action
    auditService.logAction({
      user: req.user,
      action: "UPDATE_PRODUCT",
      details: `Product updated: ${updatedProduct.name} (${updatedProduct.id})`
    });
    
    res.json({ message: "Product updated", product: transformProduct(updatedProduct) });
  } catch (error) {
    if (isSkuUniqueViolation(error)) {
      return res.status(409).json({ message: "SKU already exists" });
    }

    res.status(500).json({ message: "Failed to update product", error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
    });
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Soft delete - mark as deleted
    const deletedProduct = await prisma.product.update({
      where: { id: req.params.id },
      data: { is_deleted: true },
    });
    
    // Log the action
    auditService.logAction({
      user: req.user,
      action: "DELETE_PRODUCT",
      details: `Product deleted: ${deletedProduct.name} (${deletedProduct.id})`
    });
    
    res.json({ message: "Product deleted", productId: req.params.id });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product", error: error.message });
  }
};

exports.restoreProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
    });
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Soft restore - mark as not deleted
    const restoredProduct = await prisma.product.update({
      where: { id: req.params.id },
      data: { is_deleted: false },
      include: { category: { select: { name: true } } },
    });
    
    // Log the action
    auditService.logAction({
      user: req.user,
      action: "RESTORE_PRODUCT",
      details: `Product restored: ${restoredProduct.name} (${restoredProduct.id})`
    });
    
    res.json({ message: "Product restored", product: transformProduct(restoredProduct) });
  } catch (error) {
    res.status(500).json({ message: "Failed to restore product", error: error.message });
  }
};

const prisma = require("../services/prisma.service");
const auditService = require("../services/audit.service");

exports.getProducts = async (req, res) => {
  try {
    const { includeDeleted } = req.query;
    
    const where = includeDeleted !== "true" ? { is_deleted: false } : {};
    
    const products = await prisma.product.findMany({
      where,
      include: { category: { select: { name: true } } },
      orderBy: { created_at: 'desc' },
    });
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products", error: error.message });
  }
};

exports.addProduct = async (req, res) => {
  try {
    const newProduct = await prisma.product.create({
      data: {
        name: req.body.name,
        brand: req.body.brand,
        category_id: req.body.category_id,
        stock: req.body.stock || 0,
        prices: req.body.prices || '{}',
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
    
    res.status(201).json({ message: "Product added", product: newProduct });
  } catch (error) {
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

    const updatedProduct = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body,
      include: { category: { select: { name: true } } },
    });

    // Log the action
    auditService.logAction({
      user: req.user,
      action: "UPDATE_PRODUCT",
      details: `Product updated: ${updatedProduct.name} (${updatedProduct.id})`
    });
    
    res.json({ message: "Product updated", product: updatedProduct });
  } catch (error) {
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
    
    res.json({ message: "Product deleted successfully", productId: req.params.id });
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

    const restoredProduct = await prisma.product.update({
      where: { id: req.params.id },
      data: { is_deleted: false },
    });
    
    // Log the action
    auditService.logAction({
      user: req.user,
      action: "RESTORE_PRODUCT",
      details: `Product restored: ${restoredProduct.name} (${restoredProduct.id})`
    });

    res.json({ message: "Product restored successfully", product: restoredProduct });
  } catch (error) {
    res.status(500).json({ message: "Failed to restore product", error: error.message });
  }
};

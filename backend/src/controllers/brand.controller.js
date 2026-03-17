const prisma = require("../services/prisma.service");
const auditService = require("../services/audit.service");

exports.getBrands = async (req, res) => {
  try {
    const { categoryId, includeDeleted } = req.query;
    
    const where = { 
      ...(categoryId && { category_id: categoryId }),
      ...(includeDeleted !== "true" && { is_deleted: false }),
    };
    
    const brands = await prisma.brand.findMany({
      where,
      include: { category: { select: { name: true } } },
      orderBy: { created_at: 'desc' },
    });
    
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch brands", error: error.message });
  }
};

exports.addBrand = async (req, res) => {
  try {
    const newBrand = await prisma.brand.create({
      data: {
        name: req.body.name,
        category_id: req.body.category_id,
        is_deleted: false,
      },
      include: { category: { select: { name: true } } },
    });
    
    // Log the action
    auditService.logAction({
      user: req.user,
      action: "CREATE_BRAND",
      details: `Brand created: ${newBrand.name} (${newBrand.id})`
    });
    
    res.status(201).json(newBrand);
  } catch (error) {
    res.status(500).json({ message: "Failed to add brand", error: error.message });
  }
};

exports.updateBrand = async (req, res) => {
  try {
    const brand = await prisma.brand.findUnique({
      where: { id: req.params.id },
    });

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    const updatedBrand = await prisma.brand.update({
      where: { id: req.params.id },
      data: req.body,
      include: { category: { select: { name: true } } },
    });
    
    // Log the action
    auditService.logAction({
      user: req.user,
      action: "UPDATE_BRAND",
      details: `Brand updated: ${updatedBrand.name} (${updatedBrand.id})`
    });

    res.json(updatedBrand);
  } catch (error) {
    res.status(500).json({ message: "Failed to update brand", error: error.message });
  }
};

exports.deleteBrand = async (req, res) => {
  try {
    const brand = await prisma.brand.findUnique({
      where: { id: req.params.id },
    });

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    // Soft delete - mark as deleted
    const deletedBrand = await prisma.brand.update({
      where: { id: req.params.id },
      data: { is_deleted: true },
    });
    
    // Log the action
    auditService.logAction({
      user: req.user,
      action: "DELETE_BRAND",
      details: `Brand deleted: ${deletedBrand.name} (${deletedBrand.id})`
    });

    res.json({ message: "Brand deleted successfully", brandId: req.params.id });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete brand", error: error.message });
  }
};

exports.restoreBrand = async (req, res) => {
  try {
    const brand = await prisma.brand.findUnique({
      where: { id: req.params.id },
    });

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    const restoredBrand = await prisma.brand.update({
      where: { id: req.params.id },
      data: { is_deleted: false },
    });
    
    // Log the action
    auditService.logAction({
      user: req.user,
      action: "RESTORE_BRAND",
      details: `Brand restored: ${restoredBrand.name} (${restoredBrand.id})`
    });

    res.json({ message: "Brand restored successfully", brand: restoredBrand });
  } catch (error) {
    res.status(500).json({ message: "Failed to restore brand", error: error.message });
  }
};

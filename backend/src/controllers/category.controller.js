const prisma = require("../services/prisma.service");
const auditService = require("../services/audit.service");

exports.getCategories = async (req, res) => {
  try {
    const { includeDeleted } = req.query;
    
    const where = includeDeleted === "true" ? {} : { is_deleted: false };
    
    const categories = await prisma.category.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
    
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories", error: error.message });
  }
};

exports.addCategory = async (req, res) => {
  try {
    const newCategory = await prisma.category.create({
      data: {
        name: req.body.name,
        is_deleted: false,
      },
    });
    
    // Log the action
    auditService.logAction({
      user: req.user,
      action: "CREATE_CATEGORY",
      details: `Category created: ${newCategory.name} (${newCategory.id})`
    });
    
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ message: "Failed to add category", error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const updatedCategory = await prisma.category.update({
      where: { id: req.params.id },
      data: req.body,
    });
    
    // Log the action
    auditService.logAction({
      user: req.user,
      action: "UPDATE_CATEGORY",
      details: `Category updated: ${updatedCategory.name} (${updatedCategory.id})`
    });

    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: "Failed to update category", error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Soft delete - mark as deleted
    const deletedCategory = await prisma.category.update({
      where: { id: req.params.id },
      data: { is_deleted: true },
    });
    
    // Log the action
    auditService.logAction({
      user: req.user,
      action: "DELETE_CATEGORY",
      details: `Category deleted: ${deletedCategory.name} (${deletedCategory.id})`
    });

    res.json({ message: "Category deleted successfully", categoryId: req.params.id });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete category", error: error.message });
  }
};

exports.restoreCategory = async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const restoredCategory = await prisma.category.update({
      where: { id: req.params.id },
      data: { is_deleted: false },
    });
    
    // Log the action
    auditService.logAction({
      user: req.user,
      action: "RESTORE_CATEGORY",
      details: `Category restored: ${restoredCategory.name} (${restoredCategory.id})`
    });

    res.json({ message: "Category restored successfully", category: restoredCategory });
  } catch (error) {
    res.status(500).json({ message: "Failed to restore category", error: error.message });
  }
};

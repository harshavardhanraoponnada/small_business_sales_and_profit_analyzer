const prisma = require("../services/prisma.service");
const auditService = require("../services/audit.service");

exports.getVariants = async (req, res) => {
  try {
    const { modelId, includeDeleted } = req.query;
    
    const where = { 
      ...(modelId && { model_id: modelId }),
      ...(includeDeleted !== "true" && { is_deleted: false }),
    };
    
    const variants = await prisma.variant.findMany({
      where,
      include: { model: { select: { name: true } } },
      orderBy: { created_at: 'desc' },
    });
    
    res.json(variants);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch variants", error: error.message });
  }
};

exports.addVariant = async (req, res) => {
  try {
    const newVariant = await prisma.variant.create({
      data: {
        model_id: req.body.model_id,
        variant_name: req.body.variant_name,
        stock: Number(req.body.stock) || 0,
        prices: req.body.prices || '{}',
        is_deleted: false,
      },
      include: { model: { select: { name: true } } },
    });

    // Log the action
    auditService.logAction({
      user: req.user,
      action: "CREATE_VARIANT",
      details: `Variant created: ${newVariant.variant_name} (${newVariant.id})`
    });
    
    res.status(201).json(newVariant);
  } catch (error) {
    res.status(500).json({ message: "Failed to add variant", error: error.message });
  }
};

exports.updateVariant = async (req, res) => {
  try {
    const variant = await prisma.variant.findUnique({
      where: { id: req.params.id },
    });

    if (!variant) {
      return res.status(404).json({ message: "Variant not found" });
    }

    const updatedVariant = await prisma.variant.update({
      where: { id: req.params.id },
      data: req.body,
      include: { model: { select: { name: true } } },
    });

    // Log the action
    auditService.logAction({
      user: req.user,
      action: "UPDATE_VARIANT",
      details: `Variant updated: ${updatedVariant.variant_name} (${updatedVariant.id})`
    });

    res.json(updatedVariant);
  } catch (error) {
    res.status(500).json({ message: "Failed to update variant", error: error.message });
  }
};

exports.deleteVariant = async (req, res) => {
  try {
    const variant = await prisma.variant.findUnique({
      where: { id: req.params.id },
    });

    if (!variant) {
      return res.status(404).json({ message: "Variant not found" });
    }

    // Soft delete - mark as deleted
    const deletedVariant = await prisma.variant.update({
      where: { id: req.params.id },
      data: { is_deleted: true },
    });

    // Log the action
    auditService.logAction({
      user: req.user,
      action: "DELETE_VARIANT",
      details: `Variant deleted: ${deletedVariant.variant_name} (${deletedVariant.id})`
    });

    res.json({ message: "Variant deleted successfully", variantId: req.params.id });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete variant", error: error.message });
  }
};

exports.restoreVariant = async (req, res) => {
  try {
    const variant = await prisma.variant.findUnique({
      where: { id: req.params.id },
    });

    if (!variant) {
      return res.status(404).json({ message: "Variant not found" });
    }

    const restoredVariant = await prisma.variant.update({
      where: { id: req.params.id },
      data: { is_deleted: false },
    });

    // Log the action
    auditService.logAction({
      user: req.user,
      action: "RESTORE_VARIANT",
      details: `Variant restored: ${restoredVariant.variant_name} (${restoredVariant.id})`
    });

    res.json({ message: "Variant restored successfully", variant: restoredVariant });
  } catch (error) {
    res.status(500).json({ message: "Failed to restore variant", error: error.message });
  }
};

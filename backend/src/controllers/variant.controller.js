const prisma = require("../services/prisma.service");
const auditService = require("../services/audit.service");
const { transformVariants, transformVariant, packPrices } = require("../services/priceTransform.service");

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
    
    res.json(transformVariants(variants));
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
        prices: packPrices({
          purchase_price: req.body.purchase_price || 0,
          selling_price: req.body.selling_price || 0,
          reorder_level: req.body.reorder_level || 0,
        }),
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
    
    res.status(201).json(transformVariant(newVariant));
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

    const updateData = { ...req.body };
    // Convert stock to number
    if (updateData.stock !== undefined) {
      updateData.stock = Number(updateData.stock);
    }
    // If price fields are provided, pack them into JSON
    if (req.body.purchase_price !== undefined || req.body.selling_price !== undefined || req.body.reorder_level !== undefined) {
      updateData.prices = packPrices({
        purchase_price: req.body.purchase_price || 0,
        selling_price: req.body.selling_price || 0,
        reorder_level: req.body.reorder_level || 0,
      });
      delete updateData.purchase_price;
      delete updateData.selling_price;
      delete updateData.reorder_level;
    }

    const updatedVariant = await prisma.variant.update({
      where: { id: req.params.id },
      data: updateData,
      include: { model: { select: { name: true } } },
    });

    // Log the action
    auditService.logAction({
      user: req.user,
      action: "UPDATE_VARIANT",
      details: `Variant updated: ${updatedVariant.variant_name} (${updatedVariant.id})`
    });

    res.json(transformVariant(updatedVariant));
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
      include: { model: { select: { name: true } } },
    });

    // Log the action
    auditService.logAction({
      user: req.user,
      action: "RESTORE_VARIANT",
      details: `Variant restored: ${restoredVariant.variant_name} (${restoredVariant.id})`
    });

    res.json({ message: "Variant restored successfully", variant: transformVariant(restoredVariant) });
  } catch (error) {
    res.status(500).json({ message: "Failed to restore variant", error: error.message });
  }
};

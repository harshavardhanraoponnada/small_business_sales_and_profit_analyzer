const prisma = require("../services/prisma.service");
const auditService = require("../services/audit.service");

exports.getModels = async (req, res) => {
  try {
    const { brandId, includeDeleted } = req.query;
    
    const where = { 
      ...(brandId && { brand_id: brandId }),
      ...(includeDeleted !== "true" && { is_deleted: false }),
    };
    
    const models = await prisma.model.findMany({
      where,
      include: { brand: { select: { name: true } } },
      orderBy: { created_at: 'desc' },
    });
    
    res.json(models);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch models", error: error.message });
  }
};

exports.addModel = async (req, res) => {
  try {
    const newModel = await prisma.model.create({
      data: {
        name: req.body.name,
        brand_id: req.body.brand_id,
        is_deleted: false,
      },
      include: { brand: { select: { name: true } } },
    });
    
    // Log the action
    auditService.logAction({
      user: req.user,
      action: "CREATE_MODEL",
      details: `Model created: ${newModel.name} (${newModel.id})`
    });
    
    res.status(201).json(newModel);
  } catch (error) {
    res.status(500).json({ message: "Failed to add model", error: error.message });
  }
};

exports.updateModel = async (req, res) => {
  try {
    const model = await prisma.model.findUnique({
      where: { id: req.params.id },
    });

    if (!model) {
      return res.status(404).json({ message: "Model not found" });
    }

    const updatedModel = await prisma.model.update({
      where: { id: req.params.id },
      data: req.body,
      include: { brand: { select: { name: true } } },
    });
    
    // Log the action
    auditService.logAction({
      user: req.user,
      action: "UPDATE_MODEL",
      details: `Model updated: ${updatedModel.name} (${updatedModel.id})`
    });

    res.json(updatedModel);
  } catch (error) {
    res.status(500).json({ message: "Failed to update model", error: error.message });
  }
};

exports.deleteModel = async (req, res) => {
  try {
    const model = await prisma.model.findUnique({
      where: { id: req.params.id },
    });

    if (!model) {
      return res.status(404).json({ message: "Model not found" });
    }

    // Soft delete - mark as deleted
    const deletedModel = await prisma.model.update({
      where: { id: req.params.id },
      data: { is_deleted: true },
    });
    
    // Log the action
    auditService.logAction({
      user: req.user,
      action: "DELETE_MODEL",
      details: `Model deleted: ${deletedModel.name} (${deletedModel.id})`
    });

    res.json({ message: "Model deleted successfully", modelId: req.params.id });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete model", error: error.message });
  }
};

exports.restoreModel = async (req, res) => {
  try {
    const model = await prisma.model.findUnique({
      where: { id: req.params.id },
    });

    if (!model) {
      return res.status(404).json({ message: "Model not found" });
    }

    const restoredModel = await prisma.model.update({
      where: { id: req.params.id },
      data: { is_deleted: false },
    });
    
    // Log the action
    auditService.logAction({
      user: req.user,
      action: "RESTORE_MODEL",
      details: `Model restored: ${restoredModel.name} (${restoredModel.id})`
    });

    res.json({ message: "Model restored successfully", model: restoredModel });
  } catch (error) {
    res.status(500).json({ message: "Failed to restore model", error: error.message });
  }
};

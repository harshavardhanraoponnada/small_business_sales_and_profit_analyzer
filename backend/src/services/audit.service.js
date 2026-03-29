const prisma = require("./prisma.service");

exports.logAction = async ({ user, action, details }) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        username: user.username,
        user_role: user.role,
        details,
        created_by: user.id
      }
    });
  } catch (error) {
    console.error("Failed to log audit action:", error.message);
    // Don't throw - audit logging failures shouldn't block operations
  }
};

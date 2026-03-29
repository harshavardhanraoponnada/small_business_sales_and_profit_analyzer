const prisma = require("../services/prisma.service");

exports.getLogs = async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        user: { select: { username: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    // Transform to match frontend expectations
    const formattedLogs = logs.map(log => ({
      timestamp: log.created_at.toISOString(),
      username: log.username,
      role: log.user_role,
      action: log.action,
      details: log.details
    }));

    res.json(formattedLogs);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch audit logs", error: error.message });
  }
};

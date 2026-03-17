const pino = require("pino");

// Create logger with custom configuration
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      singleLine: false,
      ignore: "pid,hostname",
    },
  },
});

// Structured logging functions with context
module.exports = {
  logger,
  
  // HTTP request logging
  logRequest: (method, path, statusCode, duration, userId = null) => {
    const level = statusCode >= 400 ? "warn" : "info";
    logger[level]({
      type: "http_request",
      method,
      path,
      statusCode,
      durationMs: duration,
      userId,
      timestamp: new Date().toISOString(),
    });
  },

  // Database/CSV operation logging
  logData: (operation, entity, successful, details = {}) => {
    const level = successful ? "info" : "warn";
    logger[level]({
      type: "data_operation",
      operation,
      entity,
      successful,
      ...details,
      timestamp: new Date().toISOString(),
    });
  },

  // Security event logging
  logSecurity: (event, severity, details = {}) => {
    const level = severity === "critical" ? "error" : severity === "high" ? "warn" : "info";
    logger[level]({
      type: "security_event",
      event,
      severity,
      ...details,
      timestamp: new Date().toISOString(),
    });
  },

  // Error logging
  logError: (error, context = {}) => {
    logger.error({
      type: "error",
      message: error.message,
      stack: error.stack,
      ...context,
      timestamp: new Date().toISOString(),
    });
  },

  // Audit logging  
  logAudit: (action, user, resource, details = {}) => {
    logger.info({
      type: "audit",
      action,
      user,
      resource,
      ...details,
      timestamp: new Date().toISOString(),
    });
  },
};

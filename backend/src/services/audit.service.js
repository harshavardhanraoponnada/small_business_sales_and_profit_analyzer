const fs = require("fs");
const path = require("path");

const LOG_FILE = path.join(__dirname, "../data/audit_logs.csv");

exports.logAction = ({ user, action, details }) => {
  const line = `\n${new Date().toISOString()},${user.username},${user.role},${action},"${details}"`;
  fs.appendFileSync(LOG_FILE, line);
};

const path = require("path");
const { readCSV } = require("../services/csv.service");

exports.getLogs = async (req, res) => {
  const logs = await readCSV(path.join(__dirname, "../data/audit_logs.csv"));
  // Filter out logs with invalid timestamps
  const validLogs = logs.filter(log => !isNaN(new Date(log.timestamp).getTime()));
  // Sort logs by timestamp in descending order (newer first)
  validLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(validLogs);
};

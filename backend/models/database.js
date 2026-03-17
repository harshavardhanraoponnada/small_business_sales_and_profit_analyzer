const db = require('../config/database');

class Database {
  static async getSalesData(userId) {
    const query = `
      SELECT 
        DATE(created_at) as date,
        SUM(amount) as value
      FROM sales
      WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    return new Promise((resolve, reject) => {
      db.query(query, [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  static async getExpensesData(userId) {
    const query = `
      SELECT 
        DATE(created_at) as date,
        SUM(amount) as value
      FROM expenses
      WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    return new Promise((resolve, reject) => {
      db.query(query, [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }
}

module.exports = Database;

const csv = require('csv-parse/sync');
const fs = require('fs');

class DataProcessor {
  static formatForProphet(data) {
    return data
      .filter(row => row.date && row.value)
      .map(row => ({
        ds: new Date(row.date),
        y: parseFloat(row.value),
        trend: this.calculateTrend(row)
      }))
      .sort((a, b) => a.ds - b.ds);
  }

  static calculateTrend(row) {
    // Linear trend calculation
    return row.dayOfMonth ? row.dayOfMonth / 30 : 0;
  }

  static parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return csv.parse(content, {
      columns: true,
      skip_empty_lines: true
    });
  }

  static groupByDate(data) {
    const grouped = {};
    data.forEach(row => {
      const date = new Date(row.date).toISOString().split('T')[0];
      grouped[date] = (grouped[date] || 0) + parseFloat(row.value);
    });
    return Object.entries(grouped).map(([date, value]) => ({ date, value }));
  }

  static getMovingAverage(data, window = 7) {
    return data.map((row, index) => {
      if (index < window) return row;
      const avg = data.slice(index - window, index)
        .reduce((sum, r) => sum + r.value, 0) / window;
      return { ...row, movingAvg: avg };
    });
  }
}

module.exports = DataProcessor;

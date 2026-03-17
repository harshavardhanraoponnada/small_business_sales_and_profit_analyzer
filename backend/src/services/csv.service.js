const fs = require("fs");
const csv = require("csv-parser");

const readCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) return reject(err);

      const lines = data.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));

      if (lines.length === 0) return resolve([]);

      const headers = lines[0].split(',').map(h => h.trim());

      const results = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = values[i] ? values[i].trim() : '';
        });
        return obj;
      });

      resolve(results);
    });
  });
};

const writeCSV = (filePath, data) => {
  return new Promise((resolve, reject) => {
    if (!data || data.length === 0) {
      return reject(new Error("No data to write"));
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => 
      headers.map(header => obj[header] || "").join(",")
    );
    
    const csv = [headers.join(","), ...rows].join("\n");
    
    fs.writeFile(filePath, csv, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

module.exports = { readCSV, writeCSV };

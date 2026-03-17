const path = require("path");
const fs = require("fs");

exports.downloadInvoice = (req, res) => {
  const { id } = req.params;
  const filePath = path.join(__dirname, `../uploads/invoices/${id}.pdf`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "Invoice not found" });
  }

  res.download(filePath);
};

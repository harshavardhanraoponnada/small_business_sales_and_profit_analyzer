const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { formatNumber } = require("../utils/numberFormat");

exports.generateInvoice = ({ invoiceId, item, itemType, quantity, total }) => {
  const doc = new PDFDocument();
  const filePath = path.join(__dirname, `../uploads/invoices/${invoiceId}.pdf`);
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(18).text("Harsha Mobile World", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`Invoice No: ${invoiceId}`);
  doc.text(`Date: ${new Date().toLocaleDateString()}`);
  doc.moveDown();

  const itemName = itemType === "variant" ? item.variant_name : (item.name || item.product_name);
  doc.text(`${itemType === "variant" ? "Variant" : "Product"}: ${itemName}`);
  doc.text(`Quantity: ${quantity}`);
  doc.text(`Unit Price: ₹${formatNumber(item.selling_price)}`);
  doc.moveDown();

  doc.fontSize(14).text(`Total Amount: ₹${formatNumber(total)}`, { align: "right" });

  doc.end();

  return filePath;
};

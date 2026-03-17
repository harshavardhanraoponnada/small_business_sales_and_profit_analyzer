const PDFDocument = require("pdfkit");
const fs = require("fs");
const { formatNumber } = require("../utils/numberFormat");

exports.generateInvoicePDF = (filePath, invoiceData) => {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 40 });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    doc.fontSize(18).text("PhoneVerse", { align: "center" });
    doc.fontSize(10).text("Small Business Sales & Profit Analyzer", { align: "center" });

    doc.moveDown();
    doc.fontSize(12).text(`Invoice No: ${invoiceData.invoiceId}`);
    doc.text(`Date: ${invoiceData.date}`);

    doc.moveDown();
    doc.fontSize(12).text("Items:");

    doc.moveDown(0.5);
    invoiceData.items.forEach((item, i) => {
      doc.text(
        `${i + 1}. ${item.name} | Qty: ${item.qty} | ₹${formatNumber(item.price)} = ₹${formatNumber(item.total)}`
      );
    });

    doc.moveDown();
    doc.fontSize(14).text(`Total: ₹${formatNumber(invoiceData.total)}`, { align: "right" });

    doc.end();

    stream.on("finish", resolve);
  });
};

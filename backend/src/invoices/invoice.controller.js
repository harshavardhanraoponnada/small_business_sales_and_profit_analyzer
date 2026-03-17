const path = require("path");
const fs = require("fs");
const { readCSV } = require("../services/csv.service");
const { generateInvoicePDF } = require("../services/pdf.service");

const salesFile = path.join(__dirname, "../data/sales.csv");
const variantsFile = path.join(__dirname, "../data/variants.csv");
const modelsFile = path.join(__dirname, "../data/models.csv");
const brandsFile = path.join(__dirname, "../data/brands.csv");
const invoiceDir = path.join(__dirname, "../uploads/invoices");

if (!fs.existsSync(invoiceDir)) {
  fs.mkdirSync(invoiceDir);
}

exports.downloadInvoice = async (req, res) => {
  const { id: saleId } = req.params;

  const sales = await readCSV(salesFile);
  const variants = await readCSV(variantsFile);
  const models = await readCSV(modelsFile);
  const brands = await readCSV(brandsFile);

  const sale = sales.find(s => s.invoice_id === saleId);
  if (!sale) {
    return res.status(404).json({ message: "Sale not found" });
  }

  const variant = variants.find(v => v.variant_id === sale.variant_id);

  const invoiceId = sale.invoice_id;
  const filePath = path.join(invoiceDir, `${invoiceId}.pdf`);

  // generate once
  if (!fs.existsSync(filePath)) {
    const qty = Number(sale.quantity);
    const price = Number(sale.unit_price);

    let itemName = "Product";
    if (variant) {
      const model = models.find(m => m.model_id === variant.model_id);
      const brand = model ? brands.find(b => b.brand_id === model.brand_id) : null;
      itemName = brand && model ? `${brand.name} ${model.name} - ${variant.variant_name}` : variant.variant_name;
    } else {
      itemName = "Unknown Product";
    }

    await generateInvoicePDF(filePath, {
      invoiceId,
      date: sale.date,
      items: [
        {
          name: itemName,
          qty,
          price,
          total: qty * price
        }
      ],
      total: qty * price
    });
  }

  res.download(filePath);
};

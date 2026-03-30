const path = require("path");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const { generateInvoicePDF } = require("../services/pdf.service");

const prisma = new PrismaClient();
const invoiceDir = path.join(__dirname, "../uploads/invoices");

if (!fs.existsSync(invoiceDir)) {
  fs.mkdirSync(invoiceDir);
}

exports.downloadInvoice = async (req, res) => {
  const { id: saleId } = req.params;

  try {
    // Fetch sale with variant and product relations
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        variant: {
          include: {
            model: {
              include: {
                brand: true
              }
            }
          }
        },
        product: true
      }
    });

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    const invoiceId = sale.id;
    const filePath = path.join(invoiceDir, `${invoiceId}.pdf`);

    // Generate invoice once
    if (!fs.existsSync(filePath)) {
      const qty = sale.quantity;
      const price = parseFloat(sale.unit_price.toString());

      let itemName = "Product";
      if (sale.variant && sale.variant.model && sale.variant.model.brand) {
        itemName = `${sale.variant.model.brand.name} ${sale.variant.model.name} - ${sale.variant.variant_name}`;
      } else if (sale.product) {
        itemName = sale.product.name;
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
  } catch (error) {
    console.error("Error downloading invoice:", error);
    res.status(500).json({ message: "Error downloading invoice", error: error.message });
  }
};

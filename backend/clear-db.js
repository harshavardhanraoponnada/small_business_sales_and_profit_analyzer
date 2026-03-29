const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearDB() {
  try {
    console.log('🗑️  Clearing database...');
    await prisma.sale.deleteMany({});
    await prisma.expense.deleteMany({});
    await prisma.variant.deleteMany({});
    await prisma.model.deleteMany({});
    await prisma.brand.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('✅ Database cleared');
  } finally {
    await prisma.$disconnect();
  }
}

clearDB();

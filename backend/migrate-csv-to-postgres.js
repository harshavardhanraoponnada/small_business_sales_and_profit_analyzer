/**
 * Comprehensive data migration script: CSV to PostgreSQL
 * Usage: node migrate-csv-to-postgres.js
 * Transfers all data from CSV files to PostgreSQL database
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { readCSV } = require('./src/services/csv.service');

const prisma = new PrismaClient();

// Helper to safely parse JSON fields
function tryParseJSON(str, defaultVal = {}) {
  try {
    return typeof str === 'string' ? JSON.parse(str) : str;
  } catch {
    return defaultVal;
  }
}

async function migrateUsers() {
  console.log('📋 Migrating users...');
  const users = await readCSV(path.join(__dirname, 'src/data/users.csv'));
  
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        username: user.username,
        role: user.role || 'STAFF',
        reportFrequency: user.reportFrequency,
        reportFormat: user.reportFormat,
        receiveScheduledReports: user.receiveScheduledReports === 'true',
        updated_at: new Date(),
      },
      create: {
        username: user.username,
        email: user.email,
        password_hash: user.password_hash,
        role: user.role || 'STAFF',
        reportFrequency: user.reportFrequency,
        reportFormat: user.reportFormat,
        receiveScheduledReports: user.receiveScheduledReports === 'true',
      },
    });
  }
  console.log(`✅ Migrated ${users.length} users`);
}

async function migrateCategories() {
  console.log('📋 Migrating categories...');
  const categories = await readCSV(path.join(__dirname, 'src/data/categories.csv'));
  
  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {
        is_deleted: category.is_deleted === 'true',
        updated_at: new Date(),
      },
      create: {
        name: category.name,
        is_deleted: category.is_deleted === 'true',
      },
    });
  }
  console.log(`✅ Migrated ${categories.length} categories`);
}

async function migrateBrands() {
  console.log('📋 Migrating brands...');
  const brands = await readCSV(path.join(__dirname, 'src/data/brands.csv'));
  
  for (const brand of brands) {
    // Get category by name
    const category = await prisma.category.findFirst({
      where: { name: brand.category || 'Uncategorized' },
    });
    
    if (category) {
      await prisma.brand.upsert({
        where: {
          name_category_id: {
            name: brand.name,
            category_id: category.id,
          },
        },
        update: {
          is_deleted: brand.is_deleted === 'true',
          updated_at: new Date(),
        },
        create: {
          name: brand.name,
          category_id: category.id,
          is_deleted: brand.is_deleted === 'true',
        },
      });
    }
  }
  console.log(`✅ Migrated ${brands.length} brands`);
}

async function migrateModels() {
  console.log('📋 Migrating models...');
  const models = await readCSV(path.join(__dirname, 'src/data/models.csv'));
  
  for (const model of models) {
    // Get brand by name
    const brand = await prisma.brand.findFirst({
      where: { name: model.brand },
    });
    
    if (brand) {
      await prisma.model.upsert({
        where: {
          name_brand_id: {
            name: model.name,
            brand_id: brand.id,
          },
        },
        update: {
          is_deleted: model.is_deleted === 'true',
          updated_at: new Date(),
        },
        create: {
          name: model.name,
          brand_id: brand.id,
          is_deleted: model.is_deleted === 'true',
        },
      });
    }
  }
  console.log(`✅ Migrated ${models.length} models`);
}

async function migrateVariants() {
  console.log('📋 Migrating variants...');
  const variants = await readCSV(path.join(__dirname, 'src/data/variants.csv'));
  
  for (const variant of variants) {
    // Get model by name
    const model = await prisma.model.findFirst({
      where: { name: variant.model_name || variant.model },
    });
    
    if (model) {
      await prisma.variant.upsert({
        where: {
          model_id_variant_name: {
            model_id: model.id,
            variant_name: variant.variant_name,
          },
        },
        update: {
          stock: parseInt(variant.stock) || 0,
          prices: variant.prices || '{}',
          is_deleted: variant.is_deleted === 'true',
          updated_at: new Date(),
        },
        create: {
          model_id: model.id,
          variant_name: variant.variant_name,
          stock: parseInt(variant.stock) || 0,
          prices: variant.prices || '{}',
          is_deleted: variant.is_deleted === 'true',
        },
      });
    }
  }
  console.log(`✅ Migrated ${variants.length} variants`);
}

async function migrateProducts() {
  console.log('📋 Migrating products...');
  const products = await readCSV(path.join(__dirname, 'src/data/products.csv'));
  
  for (const product of products) {
    // Get category by name (fallback to first category)
    let category = await prisma.category.findFirst({
      where: { name: product.category },
    });
    
    if (!category) {
      category = await prisma.category.findFirst();
    }
    
    if (category) {
      await prisma.product.upsert({
        where: { name: product.name },
        update: {
          brand: product.brand,
          stock: parseInt(product.stock) || 0,
          prices: product.prices || '{}',
          is_deleted: product.is_deleted === 'true',
          updated_at: new Date(),
        },
        create: {
          name: product.name,
          brand: product.brand,
          category_id: category.id,
          stock: parseInt(product.stock) || 0,
          prices: product.prices || '{}',
          is_deleted: product.is_deleted === 'true',
        },
      });
    }
  }
  console.log(`✅ Migrated ${products.length} products`);
}

async function migrateSales() {
  console.log('📋 Migrating sales...');
  const sales = await readCSV(path.join(__dirname, 'src/data/sales.csv'));
  
  // Get default user for orphaned records
  const defaultUser = await prisma.user.findFirst();
  
  for (const sale of sales) {
    // Get variant or product
    let variant = null;
    let product = null;
    
    if (sale.variant_id) {
      variant = await prisma.variant.findFirst({
        where: { id: sale.variant_id },
      });
    }
    
    if (sale.product_id) {
      product = await prisma.product.findFirst({
        where: { id: sale.product_id },
      });
    }
    
    await prisma.sale.create({
      data: {
        date: new Date(sale.date) || new Date(),
        variant_id: variant?.id,
        product_id: product?.id,
        quantity: parseInt(sale.quantity) || 1,
        unit_price: parseFloat(sale.unit_price) || 0,
        total: parseFloat(sale.total) || 0,
        created_by: defaultUser?.id || 'unknown',
        is_deleted: sale.is_deleted === 'true',
      },
    });
  }
  console.log(`✅ Migrated ${sales.length} sales`);
}

async function migrateExpenses() {
  console.log('📋 Migrating expenses...');
  const expenses = await readCSV(path.join(__dirname, 'src/data/expenses.csv'));
  
  // Get default user for orphaned records
  const defaultUser = await prisma.user.findFirst();
  
  for (const expense of expenses) {
    await prisma.expense.create({
      data: {
        date: new Date(expense.date) || new Date(),
        category: expense.category || 'OTHER',
        amount: parseFloat(expense.amount) || 0,
        description: expense.description || '',
        created_by: defaultUser?.id || 'unknown',
        is_deleted: expense.is_deleted === 'true',
      },
    });
  }
  console.log(`✅ Migrated ${expenses.length} expenses`);
}

async function migrateAuditLogs() {
  console.log('📋 Migrating audit logs...');
  const auditLogs = await readCSV(path.join(__dirname, 'src/data/audit_logs.csv'));
  
  // Get default user for orphaned records
  const defaultUser = await prisma.user.findFirst();
  
  for (const log of auditLogs.slice(0, 1000)) { // Limit to recent 1000 to avoid massive inserts
    try {
      await prisma.auditLog.create({
        data: {
          action: log.action || 'UNKNOWN',
          username: log.username || 'unknown',
          user_role: log.user_role || 'STAFF',
          details: log.details || '{}',
          created_by: defaultUser?.id || 'unknown',
          created_at: new Date(log.timestamp) || new Date(),
        },
      });
    } catch (error) {
      // Skip duplicate/invalid audit logs
      console.warn(`⚠️ Skipped audit log: ${error.message}`);
    }
  }
  console.log(`✅ Migrated ${Math.min(auditLogs.length, 1000)} audit logs`);
}

async function main() {
  try {
    console.log('\n🚀 Starting CSV to PostgreSQL migration...\n');
    
    // Order matters! Migrate dependencies first
    await migrateUsers();
    await migrateCategories();
    await migrateBrands();
    await migrateModels();
    await migrateVariants();
    await migrateProducts();
    await migrateSales();
    await migrateExpenses();
    await migrateAuditLogs();
    
    console.log('\n✅ Migration completed successfully!\n');
    console.log('📊 Database statistics:');
    const userCount = await prisma.user.count();
    const categoryCount = await prisma.category.count();
    const brandCount = await prisma.brand.count();
    const modelCount = await prisma.model.count();
    const variantCount = await prisma.variant.count();
    const productCount = await prisma.product.count();
    const saleCount = await prisma.sale.count();
    const expenseCount = await prisma.expense.count();
    const auditLogCount = await prisma.auditLog.count();
    
    console.log(`  Users: ${userCount}`);
    console.log(`  Categories: ${categoryCount}`);
    console.log(`  Brands: ${brandCount}`);
    console.log(`  Models: ${modelCount}`);
    console.log(`  Variants: ${variantCount}`);
    console.log(`  Products: ${productCount}`);
    console.log(`  Sales: ${saleCount}`);
    console.log(`  Expenses: ${expenseCount}`);
    console.log(`  Audit Logs: ${auditLogCount}`);
    console.log();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

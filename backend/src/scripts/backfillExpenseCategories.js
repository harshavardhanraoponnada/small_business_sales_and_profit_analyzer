const fs = require("fs");
const path = require("path");

const prisma = require("../services/prisma.service");
const expenseCategoryService = require("../services/expenseCategory.service");

const REPORT_PATH = path.join(__dirname, "../data/expense-category-backfill-report.json");

const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
};

const chunk = (rows, size = 100) => {
  const chunks = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }
  return chunks;
};

const createCategoryIndex = (categories) => {
  const index = new Map();

  for (const category of categories) {
    const nameKey = normalizeText(category.name);
    if (nameKey) {
      index.set(nameKey, category);
    }

    const categoryKey = normalizeText(category.key);
    if (categoryKey) {
      index.set(categoryKey, category);
    }
  }

  return index;
};

const getResolvedCategory = ({ categoryIndex, legacyCategory }) => {
  const original = String(legacyCategory || "").trim();
  const mappedName = expenseCategoryService.mapLegacyCategoryName(original);
  const canonical = mappedName || original;

  if (!canonical) {
    return null;
  }

  return categoryIndex.get(normalizeText(canonical)) || null;
};

const buildReportPayload = ({
  dryRun,
  totalScanned,
  alreadyLinkedCount,
  mappedCount,
  unmatchedMap,
  updatedRows,
}) => {
  const unmatchedCategories = [...unmatchedMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({ category, count }));

  return {
    executedAt: new Date().toISOString(),
    dryRun,
    totalScanned,
    alreadyLinkedCount,
    mappedCount,
    unmatchedCount: unmatchedCategories.reduce((sum, row) => sum + row.count, 0),
    unmatchedCategories,
    remainingUnlinkedCount: totalScanned - alreadyLinkedCount - mappedCount,
    updatedPreview: updatedRows.slice(0, 50),
  };
};

const writeReport = (report) => {
  const reportDirectory = path.dirname(REPORT_PATH);
  if (!fs.existsSync(reportDirectory)) {
    fs.mkdirSync(reportDirectory, { recursive: true });
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
};

const applyUpdates = async (rows) => {
  if (!rows.length) {
    return;
  }

  const groupedRows = chunk(rows, 100);

  for (const group of groupedRows) {
    await prisma.$transaction(
      group.map((row) =>
        prisma.expense.update({
          where: { id: row.id },
          data: {
            category: row.category,
            expense_category_id: row.expense_category_id,
          },
        })
      )
    );
  }
};

const backfillExpenseCategories = async ({ dryRun = false } = {}) => {
  await expenseCategoryService.ensureDefaultExpenseCategories(prisma);

  const categories = await expenseCategoryService.listExpenseCategories(prisma);
  const categoryIndex = createCategoryIndex(categories);

  const expenses = await prisma.expense.findMany({
    select: {
      id: true,
      category: true,
      expense_category_id: true,
      is_deleted: true,
    },
    orderBy: { created_at: "asc" },
  });

  const unmatchedMap = new Map();
  const updates = [];
  let alreadyLinkedCount = 0;

  for (const expense of expenses) {
    if (expense.is_deleted) {
      continue;
    }

    if (expense.expense_category_id) {
      alreadyLinkedCount += 1;
      continue;
    }

    const resolved = getResolvedCategory({
      categoryIndex,
      legacyCategory: expense.category,
    });

    if (!resolved || !resolved.id) {
      const categoryLabel = String(expense.category || "").trim() || "(blank)";
      unmatchedMap.set(categoryLabel, (unmatchedMap.get(categoryLabel) || 0) + 1);
      continue;
    }

    updates.push({
      id: expense.id,
      category: resolved.name,
      expense_category_id: resolved.id,
    });
  }

  if (!dryRun) {
    await applyUpdates(updates);
  }

  const report = buildReportPayload({
    dryRun,
    totalScanned: expenses.filter((expense) => !expense.is_deleted).length,
    alreadyLinkedCount,
    mappedCount: updates.length,
    unmatchedMap,
    updatedRows: updates,
  });

  writeReport(report);
  return report;
};

const run = async () => {
  const dryRun = process.argv.includes("--dry-run");

  try {
    const report = await backfillExpenseCategories({ dryRun });

    console.log("Expense category backfill completed.");
    console.log(JSON.stringify(report, null, 2));
    console.log(`Report written to: ${REPORT_PATH}`);
  } catch (error) {
    console.error("Expense category backfill failed:", error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

if (require.main === module) {
  run();
}

module.exports = {
  REPORT_PATH,
  backfillExpenseCategories,
};

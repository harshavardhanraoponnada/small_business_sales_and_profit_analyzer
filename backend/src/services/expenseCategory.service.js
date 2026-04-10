const DEFAULT_EXPENSE_CATEGORIES = Object.freeze([
  {
    key: "BUYING_STOCKS",
    name: "Buying stocks",
    expense_group: "COGS",
    affects_cogs_default: true,
    display_order: 10,
  },
  {
    key: "SHOP_RENT",
    name: "Shop rent",
    expense_group: "OPERATING_EXPENSE",
    affects_cogs_default: false,
    display_order: 20,
  },
  {
    key: "ELECTRICITY_BILL",
    name: "Electricity bill",
    expense_group: "OPERATING_EXPENSE",
    affects_cogs_default: false,
    display_order: 30,
  },
  {
    key: "STAFF_SALARIES",
    name: "Staff salaries",
    expense_group: "OPERATING_EXPENSE",
    affects_cogs_default: false,
    display_order: 40,
  },
  {
    key: "INTERNET_CHARGES",
    name: "Internet charges",
    expense_group: "OPERATING_EXPENSE",
    affects_cogs_default: false,
    display_order: 50,
  },
  {
    key: "REPAIR_MAINTENANCE",
    name: "Repair/maintenance",
    expense_group: "OPERATING_EXPENSE",
    affects_cogs_default: false,
    display_order: 60,
  },
  {
    key: "MARKETING_ADVERTISING",
    name: "Marketing/advertising",
    expense_group: "OPERATING_EXPENSE",
    affects_cogs_default: false,
    display_order: 70,
  },
  {
    key: "GST_COMPLIANCE_COSTS",
    name: "GST/compliance costs",
    expense_group: "OPERATING_EXPENSE",
    affects_cogs_default: false,
    display_order: 80,
  },
  {
    key: "PACKAGING_SMALL_ACCESSORIES",
    name: "Packaging/small accessories for use (not for sale)",
    expense_group: "COGS",
    affects_cogs_default: true,
    display_order: 90,
  },
  {
    key: "OTHER",
    name: "Other",
    expense_group: "OPERATING_EXPENSE",
    affects_cogs_default: false,
    display_order: 100,
  },
]);

const PAYMENT_METHODS = Object.freeze([
  "Cash",
  "UPI",
  "Card",
  "Bank transfer",
  "Cheque",
  "Credit",
  "Other",
]);

const LEGACY_CATEGORY_ALIASES = Object.freeze({
  rent: "Shop rent",
  salary: "Staff salaries",
  salaries: "Staff salaries",
  electricity: "Electricity bill",
  internet: "Internet charges",
  maintenance: "Repair/maintenance",
  marketing: "Marketing/advertising",
  supplies: "Buying stocks",
  utilities: "Electricity bill",
  refreshments: "Other",
  misc: "Other",
});

const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
};

const buildCategoryKey = (value) => {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

const cloneCategory = (category) => ({ ...category });

const getDefaultCategories = () => DEFAULT_EXPENSE_CATEGORIES.map(cloneCategory);

const getPaymentMethods = () => [...PAYMENT_METHODS];

const mapLegacyCategoryName = (value) => {
  const normalizedInput = normalizeText(value);
  if (!normalizedInput) {
    return "";
  }

  const aliasMatch = LEGACY_CATEGORY_ALIASES[normalizedInput];
  if (aliasMatch) {
    return aliasMatch;
  }

  const directMatch = DEFAULT_EXPENSE_CATEGORIES.find((category) => {
    return (
      normalizeText(category.name) === normalizedInput ||
      normalizeText(category.key) === normalizedInput
    );
  });

  return directMatch ? directMatch.name : "";
};

const getDefaultCategoryByName = (value) => {
  const canonicalName = mapLegacyCategoryName(value) || String(value || "").trim();
  return (
    DEFAULT_EXPENSE_CATEGORIES.find(
      (category) => normalizeText(category.name) === normalizeText(canonicalName)
    ) || null
  );
};

const resolveCategoryFromList = (categories, inputCategory) => {
  const normalizedInput = normalizeText(inputCategory);
  if (!normalizedInput) {
    return null;
  }

  const canonicalName = mapLegacyCategoryName(inputCategory);

  const directMatch = categories.find((category) => {
    return (
      normalizeText(category.name) === normalizedInput ||
      normalizeText(category.key) === normalizedInput
    );
  });

  if (directMatch) {
    return directMatch;
  }

  if (canonicalName) {
    return (
      categories.find(
        (category) => normalizeText(category.name) === normalizeText(canonicalName)
      ) || null
    );
  }

  return null;
};

const ensureDefaultExpenseCategories = async (prisma) => {
  if (
    !prisma ||
    !prisma.expenseCategory ||
    typeof prisma.expenseCategory.findMany !== "function" ||
    typeof prisma.expenseCategory.create !== "function"
  ) {
    return;
  }

  try {
    const existing = await prisma.expenseCategory.findMany({
      where: { is_deleted: false },
      select: { name: true },
    });

    const existingNames = new Set(existing.map((row) => normalizeText(row.name)));

    for (const category of DEFAULT_EXPENSE_CATEGORIES) {
      if (existingNames.has(normalizeText(category.name))) {
        continue;
      }

      await prisma.expenseCategory.create({
        data: {
          key: category.key,
          name: category.name,
          expense_group: category.expense_group,
          affects_cogs_default: category.affects_cogs_default,
          is_system: true,
          is_active: true,
          is_deleted: false,
          display_order: category.display_order,
        },
      });
    }
  } catch (error) {
    // Ignore bootstrapping failures and safely fallback to in-memory defaults.
  }
};

const listExpenseCategories = async (prisma) => {
  const defaultRows = getDefaultCategories().map((category) => ({
    id: null,
    ...category,
    is_system: true,
    is_active: true,
  }));

  if (
    !prisma ||
    !prisma.expenseCategory ||
    typeof prisma.expenseCategory.findMany !== "function"
  ) {
    return defaultRows;
  }

  try {
    const dbRows = await prisma.expenseCategory.findMany({
      where: {
        is_deleted: false,
        is_active: true,
      },
      orderBy: [{ display_order: "asc" }, { name: "asc" }],
      select: {
        id: true,
        key: true,
        name: true,
        expense_group: true,
        affects_cogs_default: true,
        is_system: true,
        is_active: true,
        display_order: true,
      },
    });

    if (!dbRows.length) {
      return defaultRows;
    }

    const merged = new Map(defaultRows.map((category) => [normalizeText(category.name), category]));

    for (const row of dbRows) {
      merged.set(normalizeText(row.name), row);
    }

    return [...merged.values()].sort((a, b) => {
      if (a.display_order === b.display_order) {
        return a.name.localeCompare(b.name);
      }
      return a.display_order - b.display_order;
    });
  } catch (error) {
    return defaultRows;
  }
};

const resolveExpenseCategory = async ({ prisma, inputCategory }) => {
  if (!normalizeText(inputCategory)) {
    return null;
  }

  await ensureDefaultExpenseCategories(prisma);
  const categories = await listExpenseCategories(prisma);
  return resolveCategoryFromList(categories, inputCategory);
};

const getEffectiveAffectsCogs = (expense) => {
  if (!expense || typeof expense !== "object") {
    return false;
  }

  if (typeof expense.affects_cogs_override === "boolean") {
    return expense.affects_cogs_override;
  }

  if (
    expense.expense_category &&
    typeof expense.expense_category.affects_cogs_default === "boolean"
  ) {
    return expense.expense_category.affects_cogs_default;
  }

  const fallbackCategory = getDefaultCategoryByName(
    expense.category_name || expense.category || ""
  );
  return Boolean(fallbackCategory && fallbackCategory.affects_cogs_default);
};

module.exports = {
  DEFAULT_EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  buildCategoryKey,
  getDefaultCategories,
  getDefaultCategoryByName,
  getEffectiveAffectsCogs,
  getPaymentMethods,
  listExpenseCategories,
  mapLegacyCategoryName,
  resolveExpenseCategory,
  ensureDefaultExpenseCategories,
};

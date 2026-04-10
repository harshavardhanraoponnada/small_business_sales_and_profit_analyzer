const prisma = require("../services/prisma.service");
const expenseCategoryService = require("../services/expenseCategory.service");

const EXPENSE_INCLUDE = {
  user: { select: { username: true, email: true } },
  expense_category: {
    select: {
      id: true,
      key: true,
      name: true,
      expense_group: true,
      affects_cogs_default: true,
    },
  },
};

const EXPENSE_CATEGORY_SELECT = {
  id: true,
  key: true,
  name: true,
  expense_group: true,
  affects_cogs_default: true,
  is_system: true,
  is_active: true,
  is_deleted: true,
  display_order: true,
};

const toNumber = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const parseOptionalBoolean = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no"].includes(normalized)) {
    return false;
  }

  return null;
};

const parseOptionalDate = (value) => {
  if (!value) {
    return undefined;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
};

const normalizeOptionalText = (value, maxLength = 255) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return "";
  }

  if (normalized.length > maxLength) {
    return null;
  }

  return normalized;
};

const normalizePaymentMethod = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return "";
  }

  const matched = expenseCategoryService
    .getPaymentMethods()
    .find((method) => method.toLowerCase() === normalized.toLowerCase());

  return matched || null;
};

const getIncomingCategory = (body = {}) => {
  return (
    body.category ||
    body.category_name ||
    body.expense_category_name ||
    body.expenseCategory ||
    ""
  );
};

const getIncomingDate = (body = {}) => {
  return body.date || body.expense_date || body.expenseDate;
};

exports.getExpenses = async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { is_deleted: false },
      include: EXPENSE_INCLUDE,
      orderBy: { created_at: 'desc' },
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch expenses", error: error.message });
  }
};

exports.getExpenseById = async (req, res) => {
  try {
    const expense = await prisma.expense.findFirst({
      where: {
        id: String(req.params.id),
        is_deleted: false,
      },
      include: EXPENSE_INCLUDE,
    });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    return res.json(expense);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch expense", error: error.message });
  }
};

exports.addExpense = async (req, res) => {
  const { amount, description } = req.body;
  const incomingCategory = getIncomingCategory(req.body);
  const parsedAmount = toNumber(amount);
  const normalizedDescription = normalizeOptionalText(description || "", 500);
  const vendorName = normalizeOptionalText(req.body.vendor_name || req.body.vendorName || "", 160);
  const invoiceReference = normalizeOptionalText(
    req.body.invoice_reference || req.body.invoiceReference || "",
    120
  );
  const paymentMethod = normalizePaymentMethod(req.body.payment_method || req.body.paymentMethod);
  const parsedTaxAmount =
    req.body.tax_amount === undefined || req.body.tax_amount === null || req.body.tax_amount === ""
      ? undefined
      : toNumber(req.body.tax_amount);
  const parsedDate = parseOptionalDate(getIncomingDate(req.body));
  const affectsCogsOverride = parseOptionalBoolean(
    req.body.affects_cogs_override ?? req.body.affectsCogsOverride
  );

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ message: "Invalid expense data" });
  }

  if (normalizedDescription === null || !normalizedDescription) {
    return res.status(400).json({ message: "Description is required and must be 500 characters or less" });
  }

  if (vendorName === null) {
    return res.status(400).json({ message: "Vendor/Payee must be 160 characters or less" });
  }

  if (invoiceReference === null) {
    return res.status(400).json({ message: "Invoice/Bill reference must be 120 characters or less" });
  }

  if (paymentMethod === null) {
    return res.status(400).json({ message: "Invalid payment method" });
  }

  if (parsedDate === null) {
    return res.status(400).json({ message: "Invalid expense date" });
  }

  if (!Number.isFinite(parsedTaxAmount) && parsedTaxAmount !== undefined) {
    return res.status(400).json({ message: "Invalid tax amount" });
  }

  if (parsedTaxAmount !== undefined && parsedTaxAmount < 0) {
    return res.status(400).json({ message: "Tax amount must be 0 or greater" });
  }

  if (affectsCogsOverride === null) {
    return res.status(400).json({ message: "Invalid COGS override value" });
  }

  const resolvedCategory = await expenseCategoryService.resolveExpenseCategory({
    prisma,
    inputCategory: incomingCategory,
  });

  if (!resolvedCategory) {
    return res.status(400).json({ message: "Invalid expense category" });
  }

  try {
    const createData = {
      date: parsedDate || new Date(),
      category: resolvedCategory.name,
      amount: parsedAmount,
      description: normalizedDescription,
      created_by: req.user.id,
      expense_category_id: resolvedCategory.id || null,
    };

    if (vendorName !== undefined) {
      createData.vendor_name = vendorName;
    }

    if (invoiceReference !== undefined) {
      createData.invoice_reference = invoiceReference;
    }

    if (parsedTaxAmount !== undefined) {
      createData.tax_amount = parsedTaxAmount;
    }

    if (paymentMethod !== undefined) {
      createData.payment_method = paymentMethod;
    }

    if (typeof affectsCogsOverride === "boolean") {
      createData.affects_cogs_override = affectsCogsOverride;
    }

    if (req.file && req.file.filename) {
      createData.receipt_file = req.file.filename;
    }

    const expense = await prisma.expense.create({
      data: createData,
      include: EXPENSE_INCLUDE,
    });

    return res.status(201).json({ message: "Expense added", expense });
  } catch (error) {
    return res.status(500).json({ message: "Failed to add expense", error: error.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const expenseId = String(req.params.id);
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        is_deleted: false,
      },
      include: EXPENSE_INCLUDE,
    });

    if (!existingExpense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const updateData = {};

    if (req.body.amount !== undefined) {
      const parsedAmount = toNumber(req.body.amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ message: "Invalid expense amount" });
      }
      updateData.amount = parsedAmount;
    }

    if (req.body.description !== undefined) {
      const normalizedDescription = normalizeOptionalText(req.body.description, 500);
      if (normalizedDescription === null || !normalizedDescription) {
        return res.status(400).json({ message: "Description is required and must be 500 characters or less" });
      }
      updateData.description = normalizedDescription;
    }

    const incomingCategory = getIncomingCategory(req.body);
    if (incomingCategory) {
      const resolvedCategory = await expenseCategoryService.resolveExpenseCategory({
        prisma,
        inputCategory: incomingCategory,
      });

      if (!resolvedCategory) {
        return res.status(400).json({ message: "Invalid expense category" });
      }

      updateData.category = resolvedCategory.name;
      updateData.expense_category_id = resolvedCategory.id || null;
    }

    const incomingDate = getIncomingDate(req.body);
    if (incomingDate) {
      const parsedDate = parseOptionalDate(incomingDate);
      if (parsedDate === null) {
        return res.status(400).json({ message: "Invalid expense date" });
      }
      updateData.date = parsedDate;
    }

    if (req.body.vendor_name !== undefined || req.body.vendorName !== undefined) {
      const vendorName = normalizeOptionalText(req.body.vendor_name || req.body.vendorName || "", 160);
      if (vendorName === null) {
        return res.status(400).json({ message: "Vendor/Payee must be 160 characters or less" });
      }
      updateData.vendor_name = vendorName;
    }

    if (req.body.invoice_reference !== undefined || req.body.invoiceReference !== undefined) {
      const invoiceReference = normalizeOptionalText(
        req.body.invoice_reference || req.body.invoiceReference || "",
        120
      );
      if (invoiceReference === null) {
        return res.status(400).json({ message: "Invoice/Bill reference must be 120 characters or less" });
      }
      updateData.invoice_reference = invoiceReference;
    }

    if (req.body.tax_amount !== undefined) {
      if (req.body.tax_amount === "") {
        updateData.tax_amount = null;
      } else {
        const parsedTaxAmount = toNumber(req.body.tax_amount);
        if (!Number.isFinite(parsedTaxAmount) || parsedTaxAmount < 0) {
          return res.status(400).json({ message: "Tax amount must be 0 or greater" });
        }
        updateData.tax_amount = parsedTaxAmount;
      }
    }

    if (req.body.payment_method !== undefined || req.body.paymentMethod !== undefined) {
      const paymentMethod = normalizePaymentMethod(req.body.payment_method || req.body.paymentMethod);
      if (paymentMethod === null) {
        return res.status(400).json({ message: "Invalid payment method" });
      }
      updateData.payment_method = paymentMethod || null;
    }

    if (
      req.body.affects_cogs_override !== undefined ||
      req.body.affectsCogsOverride !== undefined
    ) {
      const affectsCogsOverride = parseOptionalBoolean(
        req.body.affects_cogs_override ?? req.body.affectsCogsOverride
      );

      if (affectsCogsOverride === null) {
        return res.status(400).json({ message: "Invalid COGS override value" });
      }

      updateData.affects_cogs_override =
        affectsCogsOverride === undefined ? null : affectsCogsOverride;
    }

    if (req.file && req.file.filename) {
      updateData.receipt_file = req.file.filename;
    }

    if (!Object.keys(updateData).length) {
      return res.status(400).json({ message: "No valid expense fields provided" });
    }

    const expense = await prisma.expense.update({
      where: { id: expenseId },
      data: updateData,
      include: EXPENSE_INCLUDE,
    });

    return res.json({ message: "Expense updated", expense });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update expense", error: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expenseId = String(req.params.id);

    const updateResult = await prisma.expense.updateMany({
      where: {
        id: expenseId,
        is_deleted: false,
      },
      data: {
        is_deleted: true,
      },
    });

    if (!updateResult.count) {
      return res.status(404).json({ message: "Expense not found" });
    }

    return res.json({ message: "Expense deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete expense", error: error.message });
  }
};

exports.getExpenseCategories = async (req, res) => {
  try {
    await expenseCategoryService.ensureDefaultExpenseCategories(prisma);
    const categories = await expenseCategoryService.listExpenseCategories(prisma);
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch expense categories", error: error.message });
  }
};

exports.createExpenseCategory = async (req, res) => {
  if (!prisma.expenseCategory || typeof prisma.expenseCategory.create !== "function") {
    return res.status(503).json({
      message: "Expense category management is unavailable until migrations are applied",
    });
  }

  const categoryName = normalizeOptionalText(req.body.name, 120);
  const expenseGroupInput = normalizeOptionalText(req.body.expense_group || req.body.expenseGroup || "", 50);
  const displayOrderInput = req.body.display_order ?? req.body.displayOrder;
  const affectsCogsDefault = parseOptionalBoolean(
    req.body.affects_cogs_default ?? req.body.affectsCogsDefault
  );

  if (!categoryName) {
    return res.status(400).json({ message: "Expense category name is required" });
  }

  if (affectsCogsDefault === null) {
    return res.status(400).json({ message: "Invalid affects_cogs_default value" });
  }

  let displayOrder = 999;
  if (displayOrderInput !== undefined && displayOrderInput !== null && displayOrderInput !== "") {
    displayOrder = Number.parseInt(displayOrderInput, 10);
    if (!Number.isInteger(displayOrder) || displayOrder < 0) {
      return res.status(400).json({ message: "display_order must be a non-negative integer" });
    }
  }

  const expenseGroup = (expenseGroupInput || "OPERATING_EXPENSE")
    .toUpperCase()
    .replace(/\s+/g, "_");

  try {
    const category = await prisma.expenseCategory.create({
      data: {
        key: expenseCategoryService.buildCategoryKey(req.body.key || categoryName),
        name: categoryName,
        expense_group: expenseGroup,
        affects_cogs_default: Boolean(affectsCogsDefault),
        is_system: false,
        is_active: true,
        is_deleted: false,
        display_order: displayOrder,
      },
      select: EXPENSE_CATEGORY_SELECT,
    });

    return res.status(201).json({ message: "Expense category created", category });
  } catch (error) {
    if (String(error.message || "").toLowerCase().includes("unique")) {
      return res.status(409).json({ message: "Expense category already exists" });
    }
    return res.status(500).json({ message: "Failed to create expense category", error: error.message });
  }
};

exports.updateExpenseCategory = async (req, res) => {
  if (!prisma.expenseCategory || typeof prisma.expenseCategory.update !== "function") {
    return res.status(503).json({
      message: "Expense category management is unavailable until migrations are applied",
    });
  }

  const categoryId = String(req.params.id || "").trim();
  if (!categoryId) {
    return res.status(400).json({ message: "Expense category id is required" });
  }

  try {
    const existing = await prisma.expenseCategory.findFirst({
      where: { id: categoryId },
      select: EXPENSE_CATEGORY_SELECT,
    });

    if (!existing || existing.is_deleted) {
      return res.status(404).json({ message: "Expense category not found" });
    }

    const updateData = {};

    if (req.body.name !== undefined) {
      const categoryName = normalizeOptionalText(req.body.name, 120);
      if (!categoryName) {
        return res.status(400).json({ message: "Expense category name is required" });
      }
      updateData.name = categoryName;
    }

    if (req.body.key !== undefined) {
      const builtKey = expenseCategoryService.buildCategoryKey(req.body.key);
      if (!builtKey) {
        return res.status(400).json({ message: "Expense category key is required" });
      }
      if (existing.is_system && builtKey !== existing.key) {
        return res.status(400).json({ message: "System category keys cannot be changed" });
      }
      updateData.key = builtKey;
    }

    if (req.body.expense_group !== undefined || req.body.expenseGroup !== undefined) {
      const expenseGroupInput = normalizeOptionalText(
        req.body.expense_group || req.body.expenseGroup || "",
        50
      );
      if (!expenseGroupInput) {
        return res.status(400).json({ message: "expense_group is required" });
      }
      updateData.expense_group = expenseGroupInput.toUpperCase().replace(/\s+/g, "_");
    }

    if (req.body.affects_cogs_default !== undefined || req.body.affectsCogsDefault !== undefined) {
      const affectsCogsDefault = parseOptionalBoolean(
        req.body.affects_cogs_default ?? req.body.affectsCogsDefault
      );

      if (affectsCogsDefault === null || affectsCogsDefault === undefined) {
        return res.status(400).json({ message: "Invalid affects_cogs_default value" });
      }

      updateData.affects_cogs_default = affectsCogsDefault;
    }

    if (req.body.is_active !== undefined || req.body.isActive !== undefined) {
      const isActive = parseOptionalBoolean(req.body.is_active ?? req.body.isActive);

      if (isActive === null || isActive === undefined) {
        return res.status(400).json({ message: "Invalid is_active value" });
      }

      updateData.is_active = isActive;
    }

    if (req.body.display_order !== undefined || req.body.displayOrder !== undefined) {
      const displayOrderInput = req.body.display_order ?? req.body.displayOrder;
      const displayOrder = Number.parseInt(displayOrderInput, 10);

      if (!Number.isInteger(displayOrder) || displayOrder < 0) {
        return res.status(400).json({ message: "display_order must be a non-negative integer" });
      }

      updateData.display_order = displayOrder;
    }

    if (!Object.keys(updateData).length) {
      return res.status(400).json({ message: "No valid expense category fields provided" });
    }

    const category = await prisma.expenseCategory.update({
      where: { id: categoryId },
      data: updateData,
      select: EXPENSE_CATEGORY_SELECT,
    });

    return res.json({ message: "Expense category updated", category });
  } catch (error) {
    if (String(error.message || "").toLowerCase().includes("unique")) {
      return res.status(409).json({ message: "Expense category already exists" });
    }
    return res.status(500).json({ message: "Failed to update expense category", error: error.message });
  }
};

exports.deleteExpenseCategory = async (req, res) => {
  if (!prisma.expenseCategory || typeof prisma.expenseCategory.update !== "function") {
    return res.status(503).json({
      message: "Expense category management is unavailable until migrations are applied",
    });
  }

  const categoryId = String(req.params.id || "").trim();
  if (!categoryId) {
    return res.status(400).json({ message: "Expense category id is required" });
  }

  try {
    const existing = await prisma.expenseCategory.findFirst({
      where: { id: categoryId, is_deleted: false },
      select: EXPENSE_CATEGORY_SELECT,
    });

    if (!existing) {
      return res.status(404).json({ message: "Expense category not found" });
    }

    if (existing.is_system) {
      return res.status(400).json({ message: "System categories cannot be deleted" });
    }

    const category = await prisma.expenseCategory.update({
      where: { id: categoryId },
      data: {
        is_deleted: true,
        is_active: false,
      },
      select: EXPENSE_CATEGORY_SELECT,
    });

    return res.json({ message: "Expense category deleted", category });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete expense category", error: error.message });
  }
};

exports.restoreExpenseCategory = async (req, res) => {
  if (!prisma.expenseCategory || typeof prisma.expenseCategory.update !== "function") {
    return res.status(503).json({
      message: "Expense category management is unavailable until migrations are applied",
    });
  }

  const categoryId = String(req.params.id || "").trim();
  if (!categoryId) {
    return res.status(400).json({ message: "Expense category id is required" });
  }

  try {
    const existing = await prisma.expenseCategory.findFirst({
      where: { id: categoryId, is_deleted: true },
      select: EXPENSE_CATEGORY_SELECT,
    });

    if (!existing) {
      return res.status(404).json({ message: "Expense category not found" });
    }

    const category = await prisma.expenseCategory.update({
      where: { id: categoryId },
      data: {
        is_deleted: false,
        is_active: true,
      },
      select: EXPENSE_CATEGORY_SELECT,
    });

    return res.json({ message: "Expense category restored", category });
  } catch (error) {
    return res.status(500).json({ message: "Failed to restore expense category", error: error.message });
  }
};

exports.getExpenseMetadata = async (req, res) => {
  return res.json({
    paymentMethods: expenseCategoryService.getPaymentMethods(),
  });
};

// Category-wise expense summary
exports.getCategorySummary = async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { is_deleted: false },
      select: { category: true, amount: true },
    });
    
    // Group by category and sum amounts
    const summary = expenses.reduce((acc, expense) => {
      const category = expense.category || "Uncategorized";
      const amount = parseFloat(expense.amount);
      
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += amount;
      
      return acc;
    }, {});
    
    // Convert to array format for frontend
    const categoryData = Object.keys(summary).map(category => ({
      category,
      amount: summary[category]
    }));
    
    res.json(categoryData);
  } catch (err) {
    res.status(500).json({ message: "Failed to get category summary", error: err.message });
  }
};

// Monthly category-wise expense breakdown
exports.getMonthlyCategorySummary = async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { is_deleted: false },
      select: { date: true, category: true, amount: true },
    });
    
    // Group by month and category
    const monthlyData = expenses.reduce((acc, expense) => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const category = expense.category || "Uncategorized";
      const amount = parseFloat(expense.amount);
      
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, total: 0, categories: {} };
      }
      
      if (!acc[monthKey].categories[category]) {
        acc[monthKey].categories[category] = 0;
      }
      
      acc[monthKey].categories[category] += amount;
      acc[monthKey].total += amount;
      
      return acc;
    }, {});
    
    // Convert to array and sort by month
    const result = Object.values(monthlyData).sort((a, b) => 
      a.month.localeCompare(b.month)
    );
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to get monthly category summary", error: err.message });
  }
};

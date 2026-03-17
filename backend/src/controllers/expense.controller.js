const prisma = require("../services/prisma.service");

const ALLOWED_CATEGORIES = new Set([
  "Rent",
  "Salary",
  "Salaries",
  "Electricity",
  "Internet",
  "Supplies",
  "Refreshments",
  "Maintenance",
  "Marketing",
  "Utilities",
  "Misc"
]);

exports.getExpenses = async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { is_deleted: false },
      include: { user: { select: { username: true, email: true } } },
      orderBy: { created_at: 'desc' },
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch expenses", error: error.message });
  }
};

exports.addExpense = async (req, res) => {
  const { category, amount, description } = req.body;
  const normalizedCategory = String(category || "").trim();
  const parsedAmount = parseFloat(amount);

  if (!normalizedCategory || !ALLOWED_CATEGORIES.has(normalizedCategory)) {
    return res.status(400).json({ message: "Invalid expense category" });
  }

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ message: "Invalid expense data" });
  }

  if (description && String(description).length > 500) {
    return res.status(400).json({ message: "Description is too long" });
  }

  try {
    const expense = await prisma.expense.create({
      data: {
        date: new Date(),
        category: normalizedCategory,
        amount: parsedAmount,
        description: description || "",
        created_by: req.user.id,
      },
      include: { user: { select: { username: true } } },
    });

    res.status(201).json({ message: "Expense added", expense });
  } catch (error) {
    res.status(500).json({ message: "Failed to add expense", error: error.message });
  }
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

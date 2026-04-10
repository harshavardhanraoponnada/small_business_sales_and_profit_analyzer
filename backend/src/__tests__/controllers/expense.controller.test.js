/**
 * Unit Tests: Expense Controller
 */

const mockPrisma = {
  expense: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  expenseCategory: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockExpenseCategoryService = {
  resolveExpenseCategory: jest.fn(),
  ensureDefaultExpenseCategories: jest.fn(),
  listExpenseCategories: jest.fn(),
  buildCategoryKey: jest.fn((value) => String(value || "").toUpperCase().replace(/[^A-Z0-9]+/g, "_")),
  getPaymentMethods: jest.fn(() => ["Cash", "UPI", "Card"]),
};

jest.mock("../../services/prisma.service", () => mockPrisma);
jest.mock("../../services/expenseCategory.service", () => mockExpenseCategoryService);

const controller = require("../../controllers/expense.controller");

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe("Expense Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExpenseCategoryService.resolveExpenseCategory.mockResolvedValue({
      id: "cat-rent",
      name: "Shop rent",
    });
  });

  describe("getExpenses", () => {
    it("returns non-deleted expenses", async () => {
      mockPrisma.expense.findMany.mockResolvedValue([{ id: "e1", amount: 100 }]);
      const req = {};
      const res = createMockRes();

      await controller.getExpenses(req, res);

      expect(mockPrisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { is_deleted: false } })
      );
      expect(res.json).toHaveBeenCalledWith([{ id: "e1", amount: 100 }]);
    });
  });

  describe("addExpense", () => {
    it("returns 400 for invalid amount", async () => {
      const req = {
        body: {
          category: "Shop rent",
          amount: -10,
          description: "Invalid amount",
        },
        user: { id: "u1" },
      };
      const res = createMockRes();

      await controller.addExpense(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid expense data" });
    });

    it("returns 400 for invalid category", async () => {
      mockExpenseCategoryService.resolveExpenseCategory.mockResolvedValue(null);

      const req = {
        body: {
          category: "Invalid category",
          amount: 500,
          description: "Test",
        },
        user: { id: "u1" },
      };
      const res = createMockRes();

      await controller.addExpense(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid expense category" });
    });

    it("returns 400 for invalid payment method", async () => {
      const req = {
        body: {
          category: "Shop rent",
          amount: 500,
          description: "Rent",
          payment_method: "Crypto",
        },
        user: { id: "u1" },
      };
      const res = createMockRes();

      await controller.addExpense(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid payment method" });
    });

    it("creates expense with structured fields, category link, and receipt file", async () => {
      mockPrisma.expense.create.mockImplementation(async ({ data }) => ({
        id: "e1",
        ...data,
      }));

      const req = {
        body: {
          category: "Shop rent",
          amount: 1200,
          description: "Monthly rent",
          date: "2026-04-01",
          vendor_name: "ABC Properties",
          invoice_reference: "INV-APR-001",
          tax_amount: 180,
          payment_method: "UPI",
          affects_cogs_override: "true",
        },
        file: {
          filename: "receipt-001.pdf",
        },
        user: { id: "u1" },
      };
      const res = createMockRes();

      await controller.addExpense(req, res);

      expect(mockPrisma.expense.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            category: "Shop rent",
            amount: 1200,
            description: "Monthly rent",
            vendor_name: "ABC Properties",
            invoice_reference: "INV-APR-001",
            tax_amount: 180,
            payment_method: "UPI",
            expense_category_id: "cat-rent",
            receipt_file: "receipt-001.pdf",
            affects_cogs_override: true,
          }),
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Expense added",
          expense: expect.objectContaining({
            expense_category_id: "cat-rent",
            receipt_file: "receipt-001.pdf",
            payment_method: "UPI",
          }),
        })
      );
    });
  });

  describe("updateExpense", () => {
    it("returns 404 when expense is missing", async () => {
      mockPrisma.expense.findFirst.mockResolvedValue(null);

      const req = {
        params: { id: "missing-expense" },
        body: {
          category: "Shop rent",
          amount: 900,
          description: "Attempt update",
        },
      };
      const res = createMockRes();

      await controller.updateExpense(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Expense not found" });
    });

    it("updates structured fields, category linkage, and receipt file", async () => {
      mockPrisma.expense.findFirst.mockResolvedValue({
        id: "e1",
        is_deleted: false,
      });
      mockExpenseCategoryService.resolveExpenseCategory.mockResolvedValue({
        id: "cat-stock",
        name: "Buying stocks",
      });
      mockPrisma.expense.update.mockImplementation(async ({ data }) => ({
        id: "e1",
        ...data,
      }));

      const req = {
        params: { id: "e1" },
        body: {
          category: "Buying stocks",
          amount: 1500,
          description: "Updated stock purchase",
          date: "2026-04-02",
          vendor_name: "Supplier Inc",
          invoice_reference: "INV-APR-002",
          tax_amount: "75",
          payment_method: "Cash",
          affects_cogs_override: "false",
        },
        file: {
          filename: "receipt-002.pdf",
        },
      };
      const res = createMockRes();

      await controller.updateExpense(req, res);

      expect(mockPrisma.expense.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "e1" },
          data: expect.objectContaining({
            category: "Buying stocks",
            expense_category_id: "cat-stock",
            amount: 1500,
            description: "Updated stock purchase",
            vendor_name: "Supplier Inc",
            invoice_reference: "INV-APR-002",
            tax_amount: 75,
            payment_method: "Cash",
            affects_cogs_override: false,
            receipt_file: "receipt-002.pdf",
          }),
        })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Expense updated" })
      );
    });
  });

  describe("expense category lifecycle", () => {
    it("updates an expense category", async () => {
      mockPrisma.expenseCategory.findFirst.mockResolvedValue({
        id: "cat-1",
        key: "CUSTOM_CATEGORY",
        is_system: false,
        is_deleted: false,
      });
      mockPrisma.expenseCategory.update.mockResolvedValue({
        id: "cat-1",
        key: "CUSTOM_CATEGORY",
        name: "Custom category",
        is_system: false,
        is_active: true,
        is_deleted: false,
      });

      const req = {
        params: { id: "cat-1" },
        body: { name: "Custom category", is_active: true },
      };
      const res = createMockRes();

      await controller.updateExpenseCategory(req, res);

      expect(mockPrisma.expenseCategory.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Expense category updated" })
      );
    });

    it("blocks deleting system categories", async () => {
      mockPrisma.expenseCategory.findFirst.mockResolvedValue({
        id: "sys-1",
        is_system: true,
        is_deleted: false,
      });

      const req = { params: { id: "sys-1" } };
      const res = createMockRes();

      await controller.deleteExpenseCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "System categories cannot be deleted" });
    });

    it("restores a deleted expense category", async () => {
      mockPrisma.expenseCategory.findFirst.mockResolvedValue({
        id: "cat-2",
        is_deleted: true,
      });
      mockPrisma.expenseCategory.update.mockResolvedValue({
        id: "cat-2",
        is_deleted: false,
        is_active: true,
      });

      const req = { params: { id: "cat-2" } };
      const res = createMockRes();

      await controller.restoreExpenseCategory(req, res);

      expect(mockPrisma.expenseCategory.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Expense category restored" })
      );
    });
  });
});

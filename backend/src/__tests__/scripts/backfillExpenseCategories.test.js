const mockFs = {
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
};

const mockPrisma = {
  expense: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockExpenseCategoryService = {
  ensureDefaultExpenseCategories: jest.fn(),
  listExpenseCategories: jest.fn(),
  mapLegacyCategoryName: jest.fn(),
};

jest.mock('fs', () => mockFs);
jest.mock('../../services/prisma.service', () => mockPrisma);
jest.mock('../../services/expenseCategory.service', () => mockExpenseCategoryService);

const {
  backfillExpenseCategories,
  REPORT_PATH,
} = require('../../scripts/backfillExpenseCategories');

describe('backfillExpenseCategories script', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockFs.existsSync.mockReturnValue(true);
    mockPrisma.$transaction.mockImplementation(async (operations) => Promise.all(operations));
    mockPrisma.expense.update.mockResolvedValue({});

    mockExpenseCategoryService.ensureDefaultExpenseCategories.mockResolvedValue();
    mockExpenseCategoryService.listExpenseCategories.mockResolvedValue([
      { id: 'cat-rent', key: 'SHOP_RENT', name: 'Shop rent' },
      { id: 'cat-stock', key: 'BUYING_STOCKS', name: 'Buying stocks' },
    ]);
    mockExpenseCategoryService.mapLegacyCategoryName.mockImplementation((value) => {
      if (String(value || '').toLowerCase() === 'rent') return 'Shop rent';
      if (String(value || '').toLowerCase() === 'supplies') return 'Buying stocks';
      return '';
    });
  });

  it('produces dry-run report with mapped and unmatched counts', async () => {
    mockPrisma.expense.findMany.mockResolvedValue([
      { id: 'exp-1', category: 'rent', expense_category_id: null, is_deleted: false },
      { id: 'exp-2', category: 'unknown legacy', expense_category_id: null, is_deleted: false },
      { id: 'exp-3', category: 'Shop rent', expense_category_id: 'cat-rent', is_deleted: false },
      { id: 'exp-4', category: 'rent', expense_category_id: null, is_deleted: true },
    ]);

    const report = await backfillExpenseCategories({ dryRun: true });

    expect(report).toEqual(
      expect.objectContaining({
        dryRun: true,
        totalScanned: 3,
        alreadyLinkedCount: 1,
        mappedCount: 1,
        unmatchedCount: 1,
        remainingUnlinkedCount: 1,
      })
    );

    expect(report.unmatchedCategories).toEqual([
      { category: 'unknown legacy', count: 1 },
    ]);

    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(REPORT_PATH, expect.any(String));

    const writtenPayload = JSON.parse(mockFs.writeFileSync.mock.calls[0][1]);
    expect(writtenPayload.unmatchedCount).toBe(1);
    expect(writtenPayload.dryRun).toBe(true);
  });

  it('updates mapped rows when dryRun is false', async () => {
    mockPrisma.expense.findMany.mockResolvedValue([
      { id: 'exp-11', category: 'rent', expense_category_id: null, is_deleted: false },
      { id: 'exp-12', category: 'supplies', expense_category_id: null, is_deleted: false },
    ]);

    const report = await backfillExpenseCategories({ dryRun: false });

    expect(report.mappedCount).toBe(2);
    expect(report.unmatchedCount).toBe(0);
    expect(mockPrisma.expense.update).toHaveBeenCalledTimes(2);
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);

    const updateArgs = mockPrisma.expense.update.mock.calls.map((call) => call[0]);
    expect(updateArgs[0]).toEqual(
      expect.objectContaining({
        where: { id: 'exp-11' },
        data: expect.objectContaining({ expense_category_id: 'cat-rent' }),
      })
    );
    expect(updateArgs[1]).toEqual(
      expect.objectContaining({
        where: { id: 'exp-12' },
        data: expect.objectContaining({ expense_category_id: 'cat-stock' }),
      })
    );
  });
});

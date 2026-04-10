-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "expense_group" TEXT NOT NULL,
    "affects_cogs_default" BOOLEAN NOT NULL DEFAULT false,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Expense"
ADD COLUMN "expense_category_id" TEXT,
ADD COLUMN "vendor_name" TEXT,
ADD COLUMN "invoice_reference" TEXT,
ADD COLUMN "tax_amount" DECIMAL(10,2),
ADD COLUMN "payment_method" TEXT,
ADD COLUMN "affects_cogs_override" BOOLEAN,
ADD COLUMN "receipt_file" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_key_key" ON "ExpenseCategory"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_name_key" ON "ExpenseCategory"("name");

-- CreateIndex
CREATE INDEX "ExpenseCategory_is_deleted_is_active_idx" ON "ExpenseCategory"("is_deleted", "is_active");

-- CreateIndex
CREATE INDEX "ExpenseCategory_expense_group_idx" ON "ExpenseCategory"("expense_group");

-- CreateIndex
CREATE INDEX "ExpenseCategory_display_order_idx" ON "ExpenseCategory"("display_order");

-- CreateIndex
CREATE INDEX "Expense_expense_category_id_idx" ON "Expense"("expense_category_id");

-- CreateIndex
CREATE INDEX "Expense_payment_method_idx" ON "Expense"("payment_method");

-- AddForeignKey
ALTER TABLE "Expense"
ADD CONSTRAINT "Expense_expense_category_id_fkey"
FOREIGN KEY ("expense_category_id") REFERENCES "ExpenseCategory"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default expense categories for immediate taxonomy availability.
INSERT INTO "ExpenseCategory" ("id", "key", "name", "expense_group", "affects_cogs_default", "is_system", "is_active", "is_deleted", "display_order", "created_at", "updated_at") VALUES
('exp_cat_buying_stocks', 'BUYING_STOCKS', 'Buying stocks', 'COGS', true, true, true, false, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('exp_cat_shop_rent', 'SHOP_RENT', 'Shop rent', 'OPERATING_EXPENSE', false, true, true, false, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('exp_cat_electricity_bill', 'ELECTRICITY_BILL', 'Electricity bill', 'OPERATING_EXPENSE', false, true, true, false, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('exp_cat_staff_salaries', 'STAFF_SALARIES', 'Staff salaries', 'OPERATING_EXPENSE', false, true, true, false, 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('exp_cat_internet_charges', 'INTERNET_CHARGES', 'Internet charges', 'OPERATING_EXPENSE', false, true, true, false, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('exp_cat_repair_maintenance', 'REPAIR_MAINTENANCE', 'Repair/maintenance', 'OPERATING_EXPENSE', false, true, true, false, 60, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('exp_cat_marketing_advertising', 'MARKETING_ADVERTISING', 'Marketing/advertising', 'OPERATING_EXPENSE', false, true, true, false, 70, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('exp_cat_gst_compliance', 'GST_COMPLIANCE_COSTS', 'GST/compliance costs', 'OPERATING_EXPENSE', false, true, true, false, 80, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('exp_cat_packaging_accessories', 'PACKAGING_SMALL_ACCESSORIES', 'Packaging/small accessories for use (not for sale)', 'COGS', true, true, true, false, 90, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('exp_cat_other', 'OTHER', 'Other', 'OPERATING_EXPENSE', false, true, true, false, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

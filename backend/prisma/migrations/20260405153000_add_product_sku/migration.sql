ALTER TABLE "Product" ADD COLUMN "sku" TEXT;

UPDATE "Product"
SET "sku" = CONCAT('LEGACY-', "id")
WHERE "sku" IS NULL;

ALTER TABLE "Product" ALTER COLUMN "sku" SET NOT NULL;

CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

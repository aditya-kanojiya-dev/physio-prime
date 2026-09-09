ALTER TABLE "doctors" ALTER COLUMN "platform_fee_percent" DROP NOT NULL;
ALTER TABLE "doctors" ALTER COLUMN "platform_fee_percent" DROP DEFAULT;
UPDATE "doctors" SET "platform_fee_percent" = NULL;
ALTER TABLE "doctors" ADD COLUMN "category_id" integer REFERENCES "categories"("id") ON DELETE SET NULL;

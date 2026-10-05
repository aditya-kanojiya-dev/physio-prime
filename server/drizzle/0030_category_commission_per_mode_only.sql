-- Category commission becomes per-mode only: the admin sets a home rate and a
-- video rate per category, with no shared "both" rate.
--
-- Rows saved before this may hold only the shared platform_fee_percent, and
-- nothing in the UI can edit it any more, so leaving it in place would strand
-- money-affecting values nobody can see. Fold it into both per-mode columns
-- first (per-mode wins where already set), then drop it.
UPDATE "doctor_category_commissions"
SET "platform_fee_home_percent" = COALESCE("platform_fee_home_percent", "platform_fee_percent"),
    "platform_fee_online_percent" = COALESCE("platform_fee_online_percent", "platform_fee_percent")
WHERE "platform_fee_percent" IS NOT NULL;

ALTER TABLE "doctor_category_commissions" DROP COLUMN IF EXISTS "platform_fee_percent";

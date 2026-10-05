-- Category consultation fee becomes per-mode, matching the per-mode
-- commission: a home visit and a video consult can be priced differently.
--
-- Rows saved before this hold a single consultation_fee_paise. Nothing in the UI
-- could edit it any more once the field split, so copy it into both per-mode
-- columns first to avoid stranding a configured price.
ALTER TABLE "doctor_category_commissions"
  ADD COLUMN IF NOT EXISTS "consultation_fee_home_paise" integer;
ALTER TABLE "doctor_category_commissions"
  ADD COLUMN IF NOT EXISTS "consultation_fee_online_paise" integer;

UPDATE "doctor_category_commissions"
SET "consultation_fee_home_paise" = COALESCE("consultation_fee_home_paise", "consultation_fee_paise"),
    "consultation_fee_online_paise" = COALESCE("consultation_fee_online_paise", "consultation_fee_paise")
WHERE "consultation_fee_paise" IS NOT NULL;

ALTER TABLE "doctor_category_commissions" DROP COLUMN IF EXISTS "consultation_fee_paise";

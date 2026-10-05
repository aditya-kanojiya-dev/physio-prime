-- Per-booking category attribution + per-mode category commission.
--
-- 1. appointments.category_id records the category page the patient booked
--    through. This is the key the commission join uses, so every category a
--    doctor serves can now carry its own rate instead of just the primary one.
--    Deliberately NOT backfilled: existing rows stay NULL and keep resolving
--    through the doctor/department chain they were always paid at, so no
--    historical payout moves.
--
-- 2. Per-mode columns on doctor_category_commissions, mirroring the doctor-level
--    pattern. A NULL per-mode value falls back to that row's shared
--    platform_fee_percent, then the doctor level, then department, then 30.
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "category_id" integer;
ALTER TABLE "doctor_category_commissions" ADD COLUMN IF NOT EXISTS "platform_fee_home_percent" integer;
ALTER TABLE "doctor_category_commissions" ADD COLUMN IF NOT EXISTS "platform_fee_online_percent" integer;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_category_id_categories_fk'
  ) THEN
    ALTER TABLE "appointments"
      ADD CONSTRAINT "appointments_category_id_categories_fk"
      FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "appointments_category_id_idx" ON "appointments" ("category_id");

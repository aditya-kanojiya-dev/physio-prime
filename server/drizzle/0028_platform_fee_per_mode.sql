-- Per-mode platform commission: home visits and online consultations can carry
-- different cuts. Both nullable — a NULL falls back to doctors.platform_fee_percent,
-- then the department default, then 30. No backfill: existing doctors keep
-- today's behaviour through the shared column.
ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "platform_fee_home_percent" integer;
ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "platform_fee_online_percent" integer;

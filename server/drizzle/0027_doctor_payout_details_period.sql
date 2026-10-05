-- IF NOT EXISTS: the bookkeeping for this migration went out of sync (drizzle-kit
-- re-runs on hash mismatch), and these columns are already live. Keep it idempotent
-- so every runner - db:migrate, drizzle-kit migrate, psql - is a safe no-op.
ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "payout_details" jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE "doctor_payouts" ADD COLUMN IF NOT EXISTS "period_start" date;
ALTER TABLE "doctor_payouts" ADD COLUMN IF NOT EXISTS "period_end" date;

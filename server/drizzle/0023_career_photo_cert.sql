ALTER TABLE "doctor_applications" ADD COLUMN IF NOT EXISTS "photo_url" text;--> statement-breakpoint
ALTER TABLE "doctor_applications" ADD COLUMN IF NOT EXISTS "doctor_certificate_url" text;
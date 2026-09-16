ALTER TABLE "doctor_applications" ADD COLUMN IF NOT EXISTS "document_type" text;--> statement-breakpoint
ALTER TABLE "doctor_applications" ADD COLUMN IF NOT EXISTS "document_url" text;
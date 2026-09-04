ALTER TABLE "doctor_applications" ALTER COLUMN "user_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "doctor_applications" ADD COLUMN IF NOT EXISTS "candidate_name" text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE "doctor_applications" ADD COLUMN IF NOT EXISTS "candidate_email" text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE "doctor_applications" ADD COLUMN IF NOT EXISTS "phone" text;
--> statement-breakpoint
ALTER TABLE "doctor_applications" ADD COLUMN IF NOT EXISTS "position" text;
--> statement-breakpoint
ALTER TABLE "doctor_applications" ADD COLUMN IF NOT EXISTS "specializations" text[] DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE "doctor_applications" ADD COLUMN IF NOT EXISTS "qualification" text;
--> statement-breakpoint
ALTER TABLE "doctor_applications" ADD COLUMN IF NOT EXISTS "experience" text;
--> statement-breakpoint
ALTER TABLE "doctor_applications" ADD COLUMN IF NOT EXISTS "current_organization" text;
--> statement-breakpoint
ALTER TABLE "doctor_applications" ADD COLUMN IF NOT EXISTS "certifications" text;
--> statement-breakpoint
ALTER TABLE "doctor_applications" ADD COLUMN IF NOT EXISTS "resume_url" text;
--> statement-breakpoint
ALTER TABLE "doctor_applications" ADD COLUMN IF NOT EXISTS "cover_letter" text;
--> statement-breakpoint
ALTER TABLE "doctor_applications" ADD COLUMN IF NOT EXISTS "joining_date" text;
--> statement-breakpoint
ALTER TABLE "doctor_applications" ADD COLUMN IF NOT EXISTS "consent" boolean DEFAULT false NOT NULL;

ALTER TABLE "doctors" ADD COLUMN "phone" text;
--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "designation" text;
--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "employee_id" text;
--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "department" text;
--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "address" jsonb DEFAULT '{}' NOT NULL;
--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "featured" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "status" text DEFAULT 'approved' NOT NULL;

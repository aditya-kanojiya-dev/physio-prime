ALTER TABLE "notifications" ADD COLUMN "appointment_id" integer;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "template" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;
CREATE TABLE "prescriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"appointment_id" integer NOT NULL,
	"doctor_id" integer NOT NULL,
	"patient_id" integer NOT NULL,
	"diagnosis" text,
	"medicines" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"advice" text,
	"follow_up_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prescriptions_appointment_id_unique" UNIQUE("appointment_id")
);
--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
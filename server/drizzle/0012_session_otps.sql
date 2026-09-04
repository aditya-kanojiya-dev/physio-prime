CREATE TABLE IF NOT EXISTS "session_otps" (
	"id" serial PRIMARY KEY NOT NULL,
	"appointment_id" integer NOT NULL,
	"start_hash" text NOT NULL,
	"end_hash" text NOT NULL,
	"start_expires_at" timestamp with time zone NOT NULL,
	"end_expires_at" timestamp with time zone NOT NULL,
	"start_verified" boolean DEFAULT false NOT NULL,
	"end_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'session_otps_appointment_id_appointments_id_fk'
      AND conrelid = 'session_otps'::regclass
  ) THEN
    ALTER TABLE "session_otps" ADD CONSTRAINT "session_otps_appointment_id_appointments_id_fk"
      FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE cascade;
  END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "session_otps_appointment_id_unique" ON "session_otps" USING btree ("appointment_id");

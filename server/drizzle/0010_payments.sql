ALTER TABLE "appointments" ADD COLUMN "payment_mode" text DEFAULT 'prepay' NOT NULL;
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "payment_method" text;
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "payment_collected_by_doctor_id" integer;
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "cash_collected_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "session_started_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "session_completed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "session_duration_sec" integer;
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "razorpay_qr_id" text;
--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "platform_fee_percent" integer DEFAULT 30 NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" text NOT NULL,
	"appointment_id" integer,
	"patient_id" integer,
	"doctor_id" integer,
	"transaction_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"amount_paise" integer DEFAULT 0 NOT NULL,
	"platform_fee_paise" integer DEFAULT 0 NOT NULL,
	"doctor_earnings_paise" integer DEFAULT 0 NOT NULL,
	"gateway_fee_paise" integer DEFAULT 0 NOT NULL,
	"net_amount_paise" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"gateway" text DEFAULT 'razorpay' NOT NULL,
	"gateway_order_id" text,
	"gateway_payment_id" text,
	"gateway_transfer_id" text,
	"gateway_refund_id" text,
	"payment_method" text,
	"settled_at" timestamp with time zone,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	CONSTRAINT "payment_transactions_transaction_id_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_payment_collected_by_doctor_id_doctors_id_fk" FOREIGN KEY ("payment_collected_by_doctor_id") REFERENCES "public"."doctors"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_transactions_appointment" ON "payment_transactions" ("appointment_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_transactions_doctor" ON "payment_transactions" ("doctor_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "doctor_cash_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"doctor_id" integer NOT NULL,
	"appointment_id" integer,
	"entry_type" text NOT NULL,
	"amount_paise" integer DEFAULT 0 NOT NULL,
	"platform_fee_paise" integer DEFAULT 0 NOT NULL,
	"reference" text,
	"recorded_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "doctor_cash_ledger" ADD CONSTRAINT "doctor_cash_ledger_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "doctor_cash_ledger" ADD CONSTRAINT "doctor_cash_ledger_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "doctor_cash_ledger" ADD CONSTRAINT "doctor_cash_ledger_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_doctor_cash_ledger_doctor" ON "doctor_cash_ledger" ("doctor_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refunds" (
	"id" serial PRIMARY KEY NOT NULL,
	"refund_id" text NOT NULL,
	"appointment_id" integer,
	"payment_transaction_id" integer,
	"payment_id" text,
	"amount_paise" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reason" text,
	"gateway_refund_id" text,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refunds_refund_id_unique" UNIQUE("refund_id")
);
--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_transaction_id_payment_transactions_id_fk" FOREIGN KEY ("payment_transaction_id") REFERENCES "public"."payment_transactions"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_webhooks" (
	"id" serial PRIMARY KEY NOT NULL,
	"event" text NOT NULL,
	"event_id" text NOT NULL,
	"payment_id" text,
	"order_id" text,
	"entity" jsonb NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"processed_at" timestamp with time zone,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_webhooks_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settlements" (
	"id" serial PRIMARY KEY NOT NULL,
	"settlement_id" text NOT NULL,
	"doctor_id" integer NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"gross_amount_paise" integer DEFAULT 0 NOT NULL,
	"platform_fee_paise" integer DEFAULT 0 NOT NULL,
	"gateway_fee_paise" integer DEFAULT 0 NOT NULL,
	"net_amount_paise" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payout_id" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settlements_settlement_id_unique" UNIQUE("settlement_id")
);
--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_payout_id_doctor_payouts_id_fk" FOREIGN KEY ("payout_id") REFERENCES "public"."doctor_payouts"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_settlements_doctor" ON "settlements" ("doctor_id");

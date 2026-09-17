CREATE TABLE IF NOT EXISTS "doctor_category_commissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"doctor_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"platform_fee_percent" integer,
	"consultation_fee_paise" integer
);

ALTER TABLE "doctor_category_commissions"
	ADD CONSTRAINT "doctor_category_commissions_doctor_id_doctors_id_fk"
	FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE CASCADE;

ALTER TABLE "doctor_category_commissions"
	ADD CONSTRAINT "doctor_category_commissions_category_id_categories_id_fk"
	FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE;

ALTER TABLE "doctor_category_commissions"
	ADD CONSTRAINT "doctor_category_commissions_doctor_id_category_id_unique"
	UNIQUE ("doctor_id", "category_id");
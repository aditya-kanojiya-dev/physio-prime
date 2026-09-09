CREATE TABLE IF NOT EXISTS "service_areas" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"city" text DEFAULT 'Nagpur' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_areas_name_unique" UNIQUE("name")
);

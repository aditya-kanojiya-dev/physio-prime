CREATE TABLE IF NOT EXISTS "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"platform_fee_percent" integer DEFAULT 30 NOT NULL,
	CONSTRAINT "departments_name_unique" UNIQUE("name"),
	CONSTRAINT "departments_slug_unique" UNIQUE("slug")
);

INSERT INTO "departments" ("name", "slug", "sort_order")
SELECT v.name, v.slug, v.sort_order
FROM (VALUES
	('Orthopedic', 'orthopedic', 1),
	('Sports', 'sports', 2),
	('Neurological', 'neurological', 3),
	('Pediatric', 'pediatric', 4),
	('Cardiopulmonary', 'cardiopulmonary', 5),
	('Geriatric', 'geriatric', 6),
	('Gynecological', 'gynecological', 7),
	('General Rehabilitation', 'general-rehabilitation', 8)
) AS v(name, slug, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM "departments" d WHERE d.name = v.name);
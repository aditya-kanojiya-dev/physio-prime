-- EMP ID auto-backfill for doctors created before auto-generation existed.
UPDATE "doctors"
SET "employee_id" = 'EMP-' || lpad("id"::text, 3, '0')
WHERE "employee_id" IS NULL OR "employee_id" = '';
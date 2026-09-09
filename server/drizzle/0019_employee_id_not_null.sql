-- EMP ID is now always auto-generated at insert time (admin create & application acceptance),
-- so enforce it at the DB level. 0018 backfilled all existing rows.
ALTER TABLE "doctors" ALTER COLUMN "employee_id" SET NOT NULL;
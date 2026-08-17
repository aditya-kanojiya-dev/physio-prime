-- 0006_schedule_windows.sql
-- Idempotent: safe to re-run

DO $$ BEGIN
  ALTER TABLE doctor_schedules DROP COLUMN IF EXISTS start_time;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE doctor_schedules DROP COLUMN IF EXISTS end_time;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE doctor_schedules DROP COLUMN IF EXISTS break_start;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE doctor_schedules DROP COLUMN IF EXISTS break_end;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE doctor_schedules ADD COLUMN IF NOT EXISTS window_start time NOT NULL DEFAULT '07:00';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE doctor_schedules ADD COLUMN IF NOT EXISTS window_end time NOT NULL DEFAULT '09:00';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE doctor_schedules ADD COLUMN IF NOT EXISTS max_patients integer NOT NULL DEFAULT 3;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE doctor_schedules DROP CONSTRAINT IF EXISTS doctor_schedules_doctor_id_day_of_week_unique;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE doctor_schedules ADD CONSTRAINT doctor_schedules_doctor_day_window_unique UNIQUE (doctor_id, day_of_week, window_start);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

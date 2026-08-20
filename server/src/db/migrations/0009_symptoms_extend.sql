-- Migration 0009: Extend symptoms with detailed condition data

ALTER TABLE symptoms ADD COLUMN IF NOT EXISTS symptoms_list text;
ALTER TABLE symptoms ADD COLUMN IF NOT EXISTS treatment text;

-- Migration 0008: Extend doctors profile + review moderation

-- Doctor profile extension
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS designation text;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS employee_id text;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS address jsonb DEFAULT '{}';

-- Review moderation
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status text DEFAULT 'approved';

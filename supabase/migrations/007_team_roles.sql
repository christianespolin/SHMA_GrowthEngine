-- ================================================
-- 007_team_roles.sql
-- Expand role system: admin, partner, consultant, outreach, user
-- ================================================

-- Drop existing role check constraint if present
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add expanded role constraint
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'partner', 'consultant', 'outreach', 'user', 'principal'));

-- Ensure role column has a default
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'user';

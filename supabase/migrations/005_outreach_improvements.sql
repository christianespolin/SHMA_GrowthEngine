-- ================================================
-- 005_outreach_improvements.sql
-- Outreach traceability and reply tracking
-- ================================================

-- Add columns to outreach_messages
ALTER TABLE outreach_messages
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS contact_title text,
  ADD COLUMN IF NOT EXISTS channel text,
  ADD COLUMN IF NOT EXISTS reply_received_at timestamptz,
  ADD COLUMN IF NOT EXISTS generation_id uuid DEFAULT gen_random_uuid();

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_outreach_contact_id ON outreach_messages(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_outreach_generation ON outreach_messages(generation_id);

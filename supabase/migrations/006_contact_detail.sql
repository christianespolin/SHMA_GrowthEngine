-- ================================================
-- 006_contact_detail.sql
-- Preserve full AI context on contact records
-- ================================================

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS missing_information jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS scores_json jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS recommended_next_action text,
  ADD COLUMN IF NOT EXISTS suggested_role_to_find text,
  ADD COLUMN IF NOT EXISTS source_suggestion_id uuid REFERENCES contact_suggestions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes text;

CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(contact_status);

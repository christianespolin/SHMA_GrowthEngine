-- ================================================
-- 009_feedback_and_process.sql
-- Product feedback + company process checklist
-- ================================================

-- Product feedback
CREATE TABLE IF NOT EXISTS product_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  area text,
  feedback_type text,
  comment text NOT NULL,
  related_company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status text DEFAULT 'new' CHECK (status IN ('new', 'in_review', 'planned', 'done', 'wont_fix')),
  assigned_to uuid,
  screenshot_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage feedback"
  ON product_feedback FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Company process checklist
CREATE TABLE IF NOT EXISTS company_process_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  checklist_key text NOT NULL,
  label text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'skipped', 'blocked')),
  owner_id uuid,
  due_date date,
  completed_at timestamptz,
  completed_by uuid,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, checklist_key)
);

ALTER TABLE company_process_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage checklist"
  ON company_process_checklist FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_checklist_company ON company_process_checklist(company_id);

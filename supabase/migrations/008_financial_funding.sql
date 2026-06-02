-- ================================================
-- 008_financial_funding.sql
-- Financial & Funding Readiness module
-- ================================================

CREATE TABLE IF NOT EXISTS financial_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Core financials
  revenue numeric,
  revenue_year int,
  revenue_currency text DEFAULT 'NOK',
  ebitda numeric,
  ebitda_margin numeric,
  profit_loss numeric,
  equity numeric,
  total_assets numeric,
  equity_ratio numeric,
  debt_level numeric,
  cash_position numeric,
  growth_trend text CHECK (growth_trend IN ('Strong growth', 'Moderate growth', 'Stable', 'Declining', 'Unknown')),

  -- Credit
  credit_score text,
  credit_score_provider text,
  credit_score_date date,
  credit_rating_url text,

  -- Source tracking
  financial_data_source text,
  financial_data_source_timestamp timestamptz,
  annual_report_url text,
  company_registry_url text,
  financial_notes text,
  public_financials_available boolean,

  -- Funding fields
  end_customer_credit_profile text,
  typical_end_customer_type text,
  end_customer_insolvency_risk text,
  funding_risks text,
  funding_opportunities text,
  suggested_funding_angle text,
  financing_complexity text CHECK (financing_complexity IN ('Low', 'Medium', 'High', 'Unknown')),

  -- Scores 1-5 (AI-generated, human-overridable)
  financial_strength_score numeric CHECK (financial_strength_score BETWEEN 1 AND 5),
  creditworthiness_score numeric CHECK (creditworthiness_score BETWEEN 1 AND 5),
  funding_readiness_score numeric CHECK (funding_readiness_score BETWEEN 1 AND 5),
  end_customer_credit_quality_score numeric CHECK (end_customer_credit_quality_score BETWEEN 1 AND 5),
  asset_finance_suitability_score numeric CHECK (asset_finance_suitability_score BETWEEN 1 AND 5),
  implementation_capacity_score numeric CHECK (implementation_capacity_score BETWEEN 1 AND 5),
  funder_attractiveness_score numeric CHECK (funder_attractiveness_score BETWEEN 1 AND 5),

  -- Score metadata
  score_explanations_json jsonb DEFAULT '{}',
  score_confidence text CHECK (score_confidence IN ('High', 'Medium', 'Low')),
  score_known_facts text,
  score_hypotheses text,
  score_missing_information text,
  scores_generated_at timestamptz,
  scores_model text,
  human_override_scores jsonb DEFAULT '{}',
  human_review_status text DEFAULT 'not_reviewed' CHECK (human_review_status IN ('not_reviewed', 'reviewed', 'approved', 'needs_validation')),
  reviewed_by uuid,
  reviewed_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(company_id)
);

ALTER TABLE financial_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage financial_profiles"
  ON financial_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_financial_profiles_company ON financial_profiles(company_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_financial_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER financial_profiles_updated_at
  BEFORE UPDATE ON financial_profiles
  FOR EACH ROW EXECUTE FUNCTION update_financial_profiles_updated_at();

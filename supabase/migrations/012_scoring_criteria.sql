-- SHMA Growth Engine — Scoring Criteria & Thresholds
-- Phase 1: Configurable SHMA scoring

create table if not exists public.scoring_criteria (
  id uuid primary key default uuid_generate_v4(),
  score_group text not null,
  criterion_key text not null,
  label text not null,
  description text null,
  weight numeric not null default 1,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(score_group, criterion_key)
);

alter table public.scoring_criteria enable row level security;

create policy "Authenticated users can read scoring criteria"
  on public.scoring_criteria for select using (auth.role() = 'authenticated');

create policy "Authenticated users can update scoring criteria"
  on public.scoring_criteria for update using (auth.role() = 'authenticated');

create policy "Authenticated users can insert scoring criteria"
  on public.scoring_criteria for insert with check (auth.role() = 'authenticated');

create table if not exists public.scoring_thresholds (
  id uuid primary key default uuid_generate_v4(),
  score_name text unique not null,
  a_priority_min numeric not null default 4.2,
  b_priority_min numeric not null default 3.5,
  c_priority_min numeric not null default 2.8,
  disqualified_below numeric not null default 2.0,
  needs_validation_rules_json jsonb null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.scoring_thresholds enable row level security;

create policy "Authenticated users can read scoring thresholds"
  on public.scoring_thresholds for select using (auth.role() = 'authenticated');

create policy "Authenticated users can update scoring thresholds"
  on public.scoring_thresholds for update using (auth.role() = 'authenticated');

create policy "Authenticated users can insert scoring thresholds"
  on public.scoring_thresholds for insert with check (auth.role() = 'authenticated');

-- Seed scoring criteria
insert into public.scoring_criteria (score_group, criterion_key, label, description, weight, sort_order) values
  -- SHMA Fit Score
  ('shma_fit',       'asset_intensity',              'Asset Intensity',                    'Does the company sell or manage heavy or high-value assets?',                                     1.5, 0),
  ('shma_fit',       'customer_upfront_investment',  'Customer Upfront Investment',         'Do customers face high capital investment to acquire?',                                           1.5, 1),
  ('shma_fit',       'technical_complexity',         'Technical Complexity',                'Is the product/service technically complex to deploy or operate?',                                1.0, 2),
  ('shma_fit',       'service_support_potential',    'Service/Support Potential',           'Can the offering include ongoing service, maintenance or support?',                               1.0, 3),
  ('shma_fit',       'software_data_potential',      'Software/Data/Monitoring Potential',  'Can software, data or monitoring be layered into the offering?',                                  1.0, 4),
  ('shma_fit',       'standardization_potential',    'Standardization Potential',           'Can the offering be standardized for repeatable, scalable delivery?',                             1.0, 5),
  ('shma_fit',       'residual_value_potential',     'Residual Value/Redeployment',         'Does the asset retain value and can it be redeployed or refinanced?',                             1.0, 6),
  -- Opportunity Score
  ('opportunity',    'recurring_revenue_potential',  'Recurring Revenue Potential',         'Can the model generate predictable, recurring revenue?',                                          1.5, 0),
  ('opportunity',    'growth_trigger',               'Growth Trigger',                      'Is there a market or strategic event creating urgency?',                                          1.0, 1),
  ('opportunity',    'market_potential',             'Market Potential',                    'How large is the addressable market for this company?',                                           1.0, 2),
  ('opportunity',    'strategic_urgency',            'Strategic Urgency',                   'How urgent is the need to transform their go-to-market model?',                                   1.0, 3),
  ('opportunity',    'value_creation_potential',     'Value Creation Potential',            'How much economic value can SHMA help create for this company?',                                  1.5, 4),
  ('opportunity',    'differentiated_aas_concept',   'Differentiated AaS Concept',          'Can we create a meaningfully differentiated As-a-Service concept?',                               1.0, 5),
  -- Funding Readiness Score
  ('funding',        'financial_strength',           'Financial Strength',                  'Is the company financially stable enough to support a transformation?',                           1.0, 0),
  ('funding',        'creditworthiness',             'Creditworthiness',                    'Can the company or its customers support external financing?',                                     1.5, 1),
  ('funding',        'end_customer_credit_quality',  'End-Customer Credit Quality',         'Are end customers creditworthy enough for financed contracts?',                                    1.5, 2),
  ('funding',        'asset_finance_suitability',    'Asset Finance Suitability',           'Are the assets suitable for asset finance or leasing structures?',                                1.0, 3),
  ('funding',        'residual_value_confidence',    'Residual Value Confidence',           'Is residual value predictable enough for funders?',                                               1.0, 4),
  ('funding',        'contract_fundability',         'Contract Fundability',                'Can the contracts be structured to support third-party funding?',                                  1.0, 5),
  ('funding',        'financing_complexity',         'Financing Complexity',                'How complex is the financing structure likely to be? (Lower = better)',                            0.8, 6),
  -- Contact Coverage Score
  ('contact',        'decision_maker_identified',    'CEO/CFO/CCO/Head of Service Identified', 'Have we identified the key decision makers?',                                                  1.5, 0),
  ('contact',        'email_linkedin_available',     'Email or LinkedIn Available',         'Do we have usable contact details?',                                                              1.0, 1),
  ('contact',        'warm_intro_available',         'Warm Intro Available',                'Do we have a warm introduction path?',                                                            1.5, 2),
  ('contact',        'gdpr_validated',               'GDPR/Contact Validation',             'Has the contact been validated for GDPR/outreach compliance?',                                    1.0, 3),
  ('contact',        'outreach_readiness',           'Outreach Readiness',                  'Is everything in place to send a high-quality first outreach?',                                   1.0, 4),
  -- Closing Score
  ('closing',        'decision_maker_access',        'Decision-Maker Access',               'Do we have access to the person who can say yes?',                                                1.5, 0),
  ('closing',        'relationship_strength',        'Relationship Strength',               'How strong is our current relationship?',                                                         1.5, 1),
  ('closing',        'strategic_trigger',            'Strategic Trigger',                   'Is there a specific event creating a closing window?',                                            1.0, 2),
  ('closing',        'timing',                       'Timing',                              'Is the timing right for them to act now?',                                                        1.0, 3),
  ('closing',        'internal_owner',               'Internal Owner',                      'Does SHMA have a committed internal owner for this opportunity?',                                 1.0, 4),
  ('closing',        'contact_quality',              'Contact Quality',                     'How good is our primary contact relationship?',                                                   1.0, 5),
  ('closing',        'outreach_response',            'Outreach Response',                   'Has the company responded positively to outreach?',                                               1.5, 6),
  ('closing',        'meeting_momentum',             'Meeting Momentum',                    'Is there positive momentum from meetings or dialogue?',                                           1.5, 7)
on conflict (score_group, criterion_key) do nothing;

-- Seed scoring thresholds
insert into public.scoring_thresholds (score_name, a_priority_min, b_priority_min, c_priority_min, disqualified_below) values
  ('overall',       4.2, 3.5, 2.8, 2.0),
  ('shma_fit',      4.0, 3.2, 2.5, 1.8),
  ('opportunity',   4.0, 3.2, 2.5, 1.8),
  ('funding',       3.8, 3.0, 2.3, 1.5),
  ('contact',       4.0, 3.2, 2.5, 1.8),
  ('closing',       4.2, 3.5, 2.8, 2.0)
on conflict (score_name) do nothing;

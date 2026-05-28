-- ============================================================
-- 004_contact_discovery.sql
-- AI Contact Suggestion & Enrichment Engine
-- ============================================================

-- Extend existing contacts table with enrichment columns
alter table public.contacts add column if not exists first_name text;
alter table public.contacts add column if not exists last_name text;
alter table public.contacts add column if not exists full_name text;
alter table public.contacts add column if not exists title text;
alter table public.contacts add column if not exists role_category text check (role_category in ('Executive sponsor','Commercial / strategy','Service / operations','Product / technology','Finance / ownership','Other influencer'));
alter table public.contacts add column if not exists seniority text;
alter table public.contacts add column if not exists department text;
alter table public.contacts add column if not exists email_status text default 'Unknown' check (email_status in ('Verified','Unverified','Pattern guess','Unknown'));
alter table public.contacts add column if not exists phone_status text default 'Unknown' check (phone_status in ('Verified','Unverified','Company switchboard','Unknown'));
alter table public.contacts add column if not exists mobile text;
alter table public.contacts add column if not exists mobile_status text default 'Unknown' check (mobile_status in ('Verified','Unverified','Unknown'));
alter table public.contacts add column if not exists linkedin_status text default 'Unknown' check (linkedin_status in ('User provided','Public website','Imported','Needs validation','Unknown'));
alter table public.contacts add column if not exists source_type text default 'Manual';
alter table public.contacts add column if not exists source_url text;
alter table public.contacts add column if not exists source_note text;
alter table public.contacts add column if not exists source_timestamp timestamptz default now();
alter table public.contacts add column if not exists lawful_basis_note text;
alter table public.contacts add column if not exists gdpr_status text default 'Not reviewed' check (gdpr_status in ('Not reviewed','Legitimate interest reviewed','Consent','Do not contact','Suppression'));
alter table public.contacts add column if not exists contact_status text default 'Suggested' check (contact_status in ('Suggested','Validated','Contacted','Responded','Rejected','Do not contact'));
alter table public.contacts add column if not exists decision_power_score numeric(3,1);
alter table public.contacts add column if not exists shma_relevance_score numeric(3,1);
alter table public.contacts add column if not exists outreach_fit_score numeric(3,1);
alter table public.contacts add column if not exists relationship_potential_score numeric(3,1);
alter table public.contacts add column if not exists confidence_score numeric(3,1);
alter table public.contacts add column if not exists ai_rationale text;
alter table public.contacts add column if not exists outreach_angle text;
alter table public.contacts add column if not exists validation_tasks jsonb default '[]';

-- Extend companies table
alter table public.companies add column if not exists contact_coverage_score numeric(3,1);
alter table public.companies add column if not exists decision_maker_identified boolean default false;
alter table public.companies add column if not exists warm_intro_available boolean default false;

-- ============================================================
-- contact_discovery_runs table
-- ============================================================
create table if not exists public.contact_discovery_runs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  criteria_json jsonb not null default '{}',
  source_types text[] default '{}',
  status text default 'draft' check (status in ('draft','running','completed','failed')),
  summary text
);

alter table public.contact_discovery_runs enable row level security;
create policy "Authenticated users can manage contact discovery runs"
  on public.contact_discovery_runs for all using (auth.role() = 'authenticated');

create index if not exists idx_contact_discovery_runs_company_id on public.contact_discovery_runs(company_id);
create index if not exists idx_contact_discovery_runs_status on public.contact_discovery_runs(status);

create trigger update_contact_discovery_runs_updated_at
  before update on public.contact_discovery_runs
  for each row execute procedure public.update_updated_at();

-- ============================================================
-- contact_suggestions table
-- ============================================================
create table if not exists public.contact_suggestions (
  id uuid primary key default uuid_generate_v4(),
  discovery_run_id uuid not null references public.contact_discovery_runs(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  full_name text,
  title text,
  role_category text check (role_category in ('Executive sponsor','Commercial / strategy','Service / operations','Product / technology','Finance / ownership','Other influencer')),
  seniority text,
  department text,
  suggested_role_to_find text,
  email text,
  email_status text default 'Unknown',
  phone text,
  phone_status text default 'Unknown',
  mobile text,
  mobile_status text default 'Unknown',
  linkedin_url text,
  linkedin_status text default 'Unknown',
  source_type text default 'AI suggested role',
  source_url text,
  known_or_hypothesis text default 'Suggested role' check (known_or_hypothesis in ('Known contact','Suggested role','Hypothesis','Needs validation')),
  scores_json jsonb default '{}',
  decision_power_score numeric(3,1),
  shma_relevance_score numeric(3,1),
  outreach_fit_score numeric(3,1),
  relationship_potential_score numeric(3,1),
  confidence_score numeric(3,1),
  ai_rationale text,
  outreach_angle text,
  missing_information jsonb default '[]',
  validation_tasks jsonb default '[]',
  recommended_next_action text,
  status text default 'Suggested' check (status in ('Suggested','Accepted','Rejected','Saved for later','Converted to contact')),
  rejection_reason text,
  converted_contact_id uuid references public.contacts(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.contact_suggestions enable row level security;
create policy "Authenticated users can manage contact suggestions"
  on public.contact_suggestions for all using (auth.role() = 'authenticated');

create index if not exists idx_contact_suggestions_run_id on public.contact_suggestions(discovery_run_id);
create index if not exists idx_contact_suggestions_company_id on public.contact_suggestions(company_id);
create index if not exists idx_contact_suggestions_status on public.contact_suggestions(status);

create trigger update_contact_suggestions_updated_at
  before update on public.contact_suggestions
  for each row execute procedure public.update_updated_at();

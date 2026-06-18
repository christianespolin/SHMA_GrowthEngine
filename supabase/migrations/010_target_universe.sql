-- SHMA Growth Engine — Target Universe
-- Phase 1: Target Universe data model

-- ============================================================
-- TARGET UNIVERSES
-- ============================================================
create table if not exists public.target_universes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text null,
  scope_definition text null,

  geography text[] null,
  countries text[] null,
  regions text[] null,
  industries text[] null,
  segments text[] null,

  objective_criteria_json jsonb null,
  exclusion_criteria_json jsonb null,

  estimated_total_count integer null,
  actual_total_count integer null,

  data_source_type text not null default 'Manual'
    check (data_source_type in ('Manual', 'CSV/XLS upload', 'External data provider', 'Company registry', 'AI estimated', 'Mixed')),
  data_source_name text null,
  data_source_notes text null,

  status text not null default 'Draft'
    check (status in ('Draft', 'Active', 'Screening', 'Completed', 'Archived')),

  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.target_universes enable row level security;

create policy "Authenticated users can read target universes"
  on public.target_universes for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert target universes"
  on public.target_universes for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update target universes"
  on public.target_universes for update using (auth.role() = 'authenticated');

-- ============================================================
-- TARGET UNIVERSE COMPANIES
-- ============================================================
create table if not exists public.target_universe_companies (
  id uuid primary key default uuid_generate_v4(),
  target_universe_id uuid not null references public.target_universes(id) on delete cascade,
  company_name text not null,
  website text null,
  country text null,
  region text null,
  industry text null,
  segment text null,

  revenue text null,
  employees text null,
  ownership_type text null,

  raw_data_json jsonb null,

  universe_status text not null default 'In Target Universe'
    check (universe_status in (
      'In Target Universe', 'Screened Out', 'Long List / Screened Target',
      'AI Qualified Target', 'Validated Target', 'Qualified Target',
      'Converted to Pipeline', 'Disqualified'
    )),

  screening_reason text null,
  exclusion_reason text null,

  objective_screening_score numeric null,
  ai_qualification_score numeric null,

  human_validation_status text not null default 'Not reviewed'
    check (human_validation_status in ('Not reviewed', 'Validated', 'Rejected', 'Needs more data')),

  converted_company_id uuid null,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.target_universe_companies enable row level security;

create policy "Authenticated users can read TU companies"
  on public.target_universe_companies for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert TU companies"
  on public.target_universe_companies for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update TU companies"
  on public.target_universe_companies for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete TU companies"
  on public.target_universe_companies for delete using (auth.role() = 'authenticated');

-- ============================================================
-- TARGET UNIVERSE FUNNEL STEPS
-- ============================================================
create table if not exists public.target_universe_funnel_steps (
  id uuid primary key default uuid_generate_v4(),
  target_universe_id uuid not null references public.target_universes(id) on delete cascade,
  step_name text not null,
  step_order integer not null,

  count_before integer null,
  count_after integer null,

  criteria_applied_json jsonb null,
  exclusion_summary text null,
  ai_summary text null,
  human_notes text null,

  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.target_universe_funnel_steps enable row level security;

create policy "Authenticated users can read TU funnel steps"
  on public.target_universe_funnel_steps for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert TU funnel steps"
  on public.target_universe_funnel_steps for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update TU funnel steps"
  on public.target_universe_funnel_steps for update using (auth.role() = 'authenticated');

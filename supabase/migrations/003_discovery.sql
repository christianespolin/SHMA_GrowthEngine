-- discovery_searches table
create table if not exists public.discovery_searches (
  id uuid primary key default uuid_generate_v4(),
  search_name text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  criteria_json jsonb not null default '{}',
  status text default 'draft' check (status in ('draft', 'running', 'completed', 'failed', 'archived')),
  number_requested integer default 25,
  search_depth text default 'standard' check (search_depth in ('quick', 'standard', 'deep')),
  notes text,
  mode text default 'generate' check (mode in ('generate', 'enrich'))
);

alter table public.discovery_searches enable row level security;
create policy "Authenticated users can manage discovery searches"
  on public.discovery_searches for all using (auth.role() = 'authenticated');

-- discovery_suggestions table
create table if not exists public.discovery_suggestions (
  id uuid primary key default uuid_generate_v4(),
  discovery_search_id uuid not null references public.discovery_searches(id) on delete cascade,
  company_name text not null,
  website text,
  country text,
  region text,
  segment text,
  subsegment text,
  description text,
  what_they_sell text,
  shma_fit_reason text,
  possible_as_a_service_concept text,
  capex_barrier text,
  service_potential text,
  software_data_monitoring_potential text,
  financing_logic text,
  strategic_trigger text,
  suggested_decision_makers jsonb default '[]',
  outreach_angle text,
  scores_json jsonb default '{}',
  shma_fit_score numeric(3,1),
  opportunity_score numeric(3,1),
  confidence_score numeric(3,1),
  overall_priority text,
  confidence_level text,
  known_information jsonb default '[]',
  ai_hypotheses jsonb default '[]',
  missing_information jsonb default '[]',
  validation_tasks jsonb default '[]',
  ai_rationale text,
  recommendation text,
  status text default 'suggested' check (status in ('suggested', 'accepted', 'rejected', 'saved_for_later', 'needs_validation', 'converted_to_lead')),
  rejection_reason text,
  converted_company_id uuid references public.companies(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.discovery_suggestions enable row level security;
create policy "Authenticated users can manage discovery suggestions"
  on public.discovery_suggestions for all using (auth.role() = 'authenticated');

create index if not exists idx_discovery_suggestions_search_id on public.discovery_suggestions(discovery_search_id);
create index if not exists idx_discovery_suggestions_status on public.discovery_suggestions(status);
create index if not exists idx_discovery_searches_created_by on public.discovery_searches(created_by);

create trigger update_discovery_searches_updated_at
  before update on public.discovery_searches
  for each row execute procedure public.update_updated_at();

create trigger update_discovery_suggestions_updated_at
  before update on public.discovery_suggestions
  for each row execute procedure public.update_updated_at();

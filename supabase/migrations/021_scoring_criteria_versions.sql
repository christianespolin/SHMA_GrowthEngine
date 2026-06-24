-- Scoring criteria versioning and approval workflow
-- Ensures scoring criteria are agreed by Simon, Stian, Christian before use

create table if not exists public.scoring_criteria_versions (
  id uuid primary key default uuid_generate_v4(),
  version_name text not null,
  status text not null default 'Draft'
    check (status in ('Draft', 'Under Review', 'Approved', 'Locked', 'Superseded')),
  notes text null,
  criteria_json jsonb null,
  thresholds_json jsonb null,
  created_by uuid not null references auth.users(id),
  approved_by_simon boolean not null default false,
  approved_by_stian boolean not null default false,
  approved_by_christian boolean not null default false,
  simon_notes text null,
  stian_notes text null,
  christian_notes text null,
  locked_at timestamptz null,
  locked_by uuid null references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.scoring_criteria_versions enable row level security;
create policy "Authenticated users can manage scoring criteria versions"
  on public.scoring_criteria_versions for all using (auth.role() = 'authenticated');

-- SHMA Growth Engine — Initial Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text not null default 'viewer' check (role in ('admin', 'principal', 'outreach', 'viewer')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "All authenticated users can read profiles"
  on public.profiles for select using (auth.role() = 'authenticated');

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- PIPELINE STAGES
-- ============================================================
create table if not exists public.pipeline_stages (
  id serial primary key,
  name text not null unique,
  position integer not null,
  color text,
  description text
);

insert into public.pipeline_stages (name, position, color) values
  ('Longlist', 1, '#64748b'),
  ('AI Researched', 2, '#6366f1'),
  ('Human Review', 3, '#8b5cf6'),
  ('Qualified Target', 4, '#06b6d4'),
  ('Contact Identified', 5, '#0ea5e9'),
  ('Warm Intro / Outreach Ready', 6, '#3b82f6'),
  ('Outreach Sent', 7, '#f59e0b'),
  ('Engaged', 8, '#f97316'),
  ('Meeting Booked', 9, '#ec4899'),
  ('Discovery Completed', 10, '#a855f7'),
  ('Proposal / Agreement', 11, '#14b8a6'),
  ('Signed', 12, '#22c55e'),
  ('Onboarding', 13, '#10b981'),
  ('Nurture', 14, '#6b7280'),
  ('Disqualified', 15, '#ef4444')
on conflict (name) do nothing;

-- ============================================================
-- COMPANIES
-- ============================================================
create table if not exists public.companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  website text,
  country text,
  segment text,
  subsegment text,
  description text,
  ownership_type text,
  pe_owned text default 'unknown' check (pe_owned in ('yes', 'no', 'unknown')),
  estimated_size text,
  revenue_range text,
  employee_range text,
  geography text,
  lead_source text,
  relationship_owner text,
  internal_owner text,
  stage text not null default 'Longlist',
  priority text default 'Unknown' check (priority in ('A', 'B', 'C', 'Nurture', 'Disqualified', 'Unknown')),
  next_action text,
  next_action_type text,
  next_action_date date,
  last_activity_date timestamptz,
  notes text,
  registration_number text,
  -- Scoring
  shma_fit_score numeric(3,1),
  opportunity_score numeric(3,1),
  closing_score numeric(3,1),
  overall_priority_score numeric(3,1),
  score_breakdown jsonb,
  score_explanation text,
  score_confidence text,
  -- Disqualification
  disqualification_reason text,
  disqualification_override boolean default false,
  disqualification_override_reason text,
  -- AI
  ai_researched boolean default false,
  -- Excel import fields
  excel_s_score numeric(3,1),
  excel_t_score numeric(3,1),
  excel_sweetspot_score numeric(3,1),
  excel_qualifying_scores jsonb,
  excel_contact_name text,
  excel_contact_email text,
  excel_contact_phone text,
  excel_contact_role text,
  -- Meta
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.companies enable row level security;

create policy "Authenticated users can read companies"
  on public.companies for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert companies"
  on public.companies for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update companies"
  on public.companies for update using (auth.role() = 'authenticated');

create policy "Admin and principal can delete companies"
  on public.companies for delete using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'principal')
    )
  );

-- ============================================================
-- CONTACTS
-- ============================================================
create table if not exists public.contacts (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  role text,
  email text,
  linkedin_url text,
  phone text,
  relationship_strength text default 'unknown' check (relationship_strength in ('strong', 'medium', 'weak', 'unknown')),
  contact_type text,
  decision_maker_relevance text default 'unknown' check (decision_maker_relevance in ('high', 'medium', 'low', 'unknown')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.contacts enable row level security;

create policy "Authenticated users can manage contacts"
  on public.contacts for all using (auth.role() = 'authenticated');

-- ============================================================
-- AI RESEARCH BRIEFS
-- ============================================================
create table if not exists public.ai_research_briefs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  company_snapshot text,
  what_they_sell text,
  who_they_sell_to text,
  likely_customer_pain text,
  possible_aaas_concept text,
  why_shma_relevant text,
  potential_business_model text,
  potential_financial_model text,
  potential_operational_model text,
  strategic_trigger text,
  suggested_entry_angle text,
  risks_and_uncertainties text,
  recommended_next_action text,
  confidence_level text,
  missing_information text,
  generated_at timestamptz default now(),
  model_used text
);

alter table public.ai_research_briefs enable row level security;

create policy "Authenticated users can manage briefs"
  on public.ai_research_briefs for all using (auth.role() = 'authenticated');

-- ============================================================
-- OUTREACH MESSAGES
-- ============================================================
create table if not exists public.outreach_messages (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  message_type text not null check (message_type in ('linkedin', 'email', 'follow_up', 'warm_intro', 'meeting_invite', 're_engagement')),
  subject text,
  content text not null,
  tone text,
  status text default 'draft' check (status in ('draft', 'sent', 'archived')),
  sent_at timestamptz,
  generated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.outreach_messages enable row level security;

create policy "Authenticated users can manage outreach"
  on public.outreach_messages for all using (auth.role() = 'authenticated');

-- ============================================================
-- MEETINGS
-- ============================================================
create table if not exists public.meetings (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  meeting_date timestamptz not null,
  participants text,
  objective text,
  notes text,
  transcript text,
  ai_summary text,
  decisions text,
  action_points text,
  follow_up_email text,
  next_step text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.meetings enable row level security;

create policy "Authenticated users can manage meetings"
  on public.meetings for all using (auth.role() = 'authenticated');

-- ============================================================
-- ACTIVITY LOG
-- ============================================================
create table if not exists public.activity_log (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  activity_type text not null,
  description text not null,
  old_value text,
  new_value text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.activity_log enable row level security;

create policy "Authenticated users can read activity"
  on public.activity_log for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert activity"
  on public.activity_log for insert with check (auth.role() = 'authenticated');

-- ============================================================
-- PROMPT LIBRARY
-- ============================================================
create table if not exists public.prompt_library (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  category text not null,
  prompt_text text not null,
  description text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.prompt_library enable row level security;

create policy "Authenticated users can read prompts"
  on public.prompt_library for select using (auth.role() = 'authenticated');

create policy "Admin can manage prompts"
  on public.prompt_library for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- IMPORTS
-- ============================================================
create table if not exists public.imports (
  id uuid primary key default uuid_generate_v4(),
  filename text not null,
  row_count integer,
  imported_count integer,
  skipped_count integer,
  status text default 'pending' check (status in ('pending', 'completed', 'failed')),
  error_message text,
  imported_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table public.imports enable row level security;

create policy "Authenticated users can manage imports"
  on public.imports for all using (auth.role() = 'authenticated');

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_companies_updated_at
  before update on public.companies
  for each row execute procedure public.update_updated_at();

create trigger update_contacts_updated_at
  before update on public.contacts
  for each row execute procedure public.update_updated_at();

create trigger update_meetings_updated_at
  before update on public.meetings
  for each row execute procedure public.update_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_companies_stage on public.companies(stage);
create index if not exists idx_companies_priority on public.companies(priority);
create index if not exists idx_companies_segment on public.companies(segment);
create index if not exists idx_companies_updated_at on public.companies(updated_at desc);
create index if not exists idx_companies_next_action_date on public.companies(next_action_date);
create index if not exists idx_activity_log_company_id on public.activity_log(company_id);
create index if not exists idx_contacts_company_id on public.contacts(company_id);
create index if not exists idx_meetings_company_id on public.meetings(company_id);

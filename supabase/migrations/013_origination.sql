-- SHMA Growth Engine — Origination & Opportunity Creator
-- Phase 2: Commercial control, approval workflow

-- ============================================================
-- OPPORTUNITY ORIGINATION
-- ============================================================
create table if not exists public.opportunity_origination (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,

  opportunity_creator_type text not null
    check (opportunity_creator_type in ('User', 'Contact', 'Partner Company', 'External Person', 'External Company')),
  opportunity_creator_id uuid null,
  opportunity_creator_name text not null,

  owner_id uuid not null references public.profiles(id),

  engagement_type text not null
    check (engagement_type in ('Direct response', 'Warm intro', 'Meeting dialogue', 'Email reply', 'LinkedIn reply', 'Phone conversation', 'Existing relationship', 'Other')),
  engagement_date date not null,
  engaged_contact_id uuid null,
  engagement_summary text not null,

  warm_intro_source_type text null
    check (warm_intro_source_type in ('User', 'Contact', 'Partner Company', 'External Person', 'External Company') or warm_intro_source_type is null),
  warm_intro_source_id uuid null,
  warm_intro_source_name text null,

  origination_notes text null,

  approval_status text not null default 'Draft'
    check (approval_status in ('Draft', 'Pending Approval', 'Approved', 'Rejected', 'Change Requested', 'Locked')),

  approved_by uuid null references public.profiles(id),
  approved_at timestamptz null,

  change_reason text null,

  created_by uuid not null references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.opportunity_origination enable row level security;

create policy "Authenticated users can read origination"
  on public.opportunity_origination for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert origination"
  on public.opportunity_origination for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update origination"
  on public.opportunity_origination for update using (auth.role() = 'authenticated');

-- ============================================================
-- ORIGINATION COMMISSION ALLOCATIONS
-- ============================================================
create table if not exists public.origination_commission_allocations (
  id uuid primary key default uuid_generate_v4(),
  opportunity_origination_id uuid not null references public.opportunity_origination(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,

  contributor_type text not null
    check (contributor_type in ('User', 'Contact', 'Partner Company', 'External Person', 'External Company')),
  contributor_id uuid null,
  contributor_name text not null,

  contribution_role text not null
    check (contribution_role in ('Opportunity Creator', 'Warm Introduction', 'Relationship Owner', 'Research Contributor', 'Outreach Contributor', 'Closer', 'Other')),

  allocation_percentage numeric not null,

  allocation_basis text null,

  approval_status text not null default 'Draft'
    check (approval_status in ('Draft', 'Pending Approval', 'Approved', 'Rejected', 'Change Requested', 'Locked')),

  approved_by uuid null references public.profiles(id),
  approved_at timestamptz null,

  created_by uuid not null references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.origination_commission_allocations enable row level security;

create policy "Authenticated users can read allocations"
  on public.origination_commission_allocations for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert allocations"
  on public.origination_commission_allocations for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update allocations"
  on public.origination_commission_allocations for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete allocations"
  on public.origination_commission_allocations for delete using (auth.role() = 'authenticated');

-- ============================================================
-- ORIGINATION AUDIT LOG
-- ============================================================
create table if not exists public.origination_audit_log (
  id uuid primary key default uuid_generate_v4(),
  opportunity_origination_id uuid not null references public.opportunity_origination(id) on delete cascade,

  action text not null
    check (action in ('Created', 'Submitted', 'Approved', 'Rejected', 'Change Requested', 'Locked', 'Reopened', 'Changed')),

  actor_id uuid not null references public.profiles(id),
  previous_value_json jsonb null,
  new_value_json jsonb null,
  reason text null,

  created_at timestamptz default now()
);

alter table public.origination_audit_log enable row level security;

create policy "Authenticated users can read audit log"
  on public.origination_audit_log for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert audit log"
  on public.origination_audit_log for insert with check (auth.role() = 'authenticated');

-- Add menu_expanded to profiles
alter table public.profiles
  add column if not exists menu_expanded boolean not null default false;

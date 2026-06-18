-- SHMA Growth Engine — Dashboard Hero Settings
-- Phase 1: Configurable dashboard heroes

create table if not exists public.dashboard_hero_settings (
  id uuid primary key default uuid_generate_v4(),
  hero_key text unique not null,
  label text not null,
  description text null,
  is_visible boolean not null default true,
  is_primary boolean not null default true,
  sort_order integer not null default 0,
  threshold_warning numeric null,
  threshold_critical numeric null,
  clickthrough_url text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.dashboard_hero_settings enable row level security;

create policy "Authenticated users can read hero settings"
  on public.dashboard_hero_settings for select using (auth.role() = 'authenticated');

create policy "Authenticated users can update hero settings"
  on public.dashboard_hero_settings for update using (auth.role() = 'authenticated');

create policy "Authenticated users can insert hero settings"
  on public.dashboard_hero_settings for insert with check (auth.role() = 'authenticated');

-- Seed default heroes
insert into public.dashboard_hero_settings
  (hero_key, label, description, is_visible, is_primary, sort_order, clickthrough_url)
values
  ('target_universe',       'Target Universe',               'Total companies across active target universes',                                        true, true,  0, '/target-universe'),
  ('long_list',             'Long List / Screened Targets',  'Companies that passed objective screening criteria',                                     true, true,  1, '/target-universe'),
  ('ai_qualified',          'AI Qualified Targets',          'Companies AI has researched and scored',                                                 true, true,  2, '/target-universe'),
  ('validated_targets',     'Validated Targets',             'Companies reviewed and validated by humans',                                             true, true,  3, '/target-universe'),
  ('qualified_targets',     'Qualified Targets',             'Final prioritized targets ready for active sales work',                                  true, true,  4, '/companies'),
  ('engaged',               'Engaged',                       'Companies with real response or dialogue',                                               true, true,  5, '/pipeline'),
  ('meetings_booked',       'Meetings Booked',               'Companies with a booked meeting',                                                        true, true,  6, '/meetings'),
  ('signed_clients',        'Signed Clients',                'Signed SHMA engagements',                                                                true, true,  7, '/pipeline'),
  ('outreach_ready',        'Outreach Ready',                'Qualified targets with contact data and approved outreach',                              true, false, 8, '/companies'),
  ('missing_contact_data',  'Missing Contact Data',          'Qualified or validated targets without usable contacts',                                 true, false, 9, '/companies'),
  ('missing_financial',     'Missing Financial Review',      'AI qualified or validated targets without financial/funding readiness review',           true, false, 10, '/companies'),
  ('stale_opportunities',   'Stale Opportunities',           'Active companies with no activity in configurable number of days',                       true, false, 11, '/companies'),
  ('ai_awaiting_review',    'AI Outputs Awaiting Review',    'AI-generated items not yet reviewed by humans',                                          true, false, 12, '/companies'),
  ('origination_not_approved', 'Origination Not Approved',  'Engaged or later opportunities missing approved Opportunity Creator / origination allocation', true, false, 13, '/companies')
on conflict (hero_key) do nothing;

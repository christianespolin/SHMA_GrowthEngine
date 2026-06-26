-- ============================================================
-- Migration 025: Bulk Process Engine
-- bulk_lists, bulk_list_companies, ai_process_runs, ai_process_items
-- Extended activity_log
-- ============================================================

-- ============================================================
-- BULK LISTS
-- ============================================================
create table if not exists public.bulk_lists (
  id                        uuid primary key default uuid_generate_v4(),
  name                      text not null,
  description               text null,

  category                  text not null default 'Longlist'
    check (category in (
      'Longlist',
      'AI Researched',
      'AI Researched, Pending',
      'AI Researched, Not Interesting',
      'Ready for AI Deep Research',
      'Ready for Human Review',
      'Ready for Contact Research',
      'Converted to Customer Kanban',
      'Archived'
    )),

  source_type               text not null default 'Excel Import'
    check (source_type in (
      'Excel Import', 'CSV Import', 'Manual', 'AI Discovery',
      'Manus Export', 'Selection from Existing List', 'Other'
    )),
  source_name               text null,
  source_notes              text null,

  import_batch_id           uuid null references public.import_batches(id) on delete set null,
  parent_bulk_list_id       uuid null references public.bulk_lists(id) on delete set null,

  owner_id                  uuid null references auth.users(id) on delete set null,
  created_by                uuid not null references auth.users(id) on delete restrict,

  company_count             integer not null default 0,
  processed_count           integer not null default 0,
  error_count               integer not null default 0,
  duplicate_conflict_count  integer not null default 0,

  status                    text not null default 'Draft'
    check (status in (
      'Draft', 'Ready', 'Processing', 'Completed', 'Failed', 'Archived'
    )),

  last_ai_process_type      text null,
  last_ai_process_status    text null,
  last_ai_process_at        timestamptz null,

  selection_criteria_json   jsonb null,

  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

alter table public.bulk_lists enable row level security;
create policy "Authenticated users can read bulk_lists"
  on public.bulk_lists for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert bulk_lists"
  on public.bulk_lists for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update bulk_lists"
  on public.bulk_lists for update using (auth.role() = 'authenticated');

create index if not exists idx_bulk_lists_category on public.bulk_lists(category);
create index if not exists idx_bulk_lists_status   on public.bulk_lists(status);
create index if not exists idx_bulk_lists_created  on public.bulk_lists(created_at desc);

-- ============================================================
-- BULK LIST COMPANIES (junction)
-- ============================================================
create table if not exists public.bulk_list_companies (
  id                        uuid primary key default uuid_generate_v4(),
  bulk_list_id              uuid not null references public.bulk_lists(id) on delete cascade,
  company_id                uuid not null references public.companies(id) on delete cascade,

  list_status               text not null default 'Active'
    check (list_status in ('Active', 'Removed', 'Converted', 'Duplicate', 'Skipped')),

  shma_score                numeric null,
  deep_research_status      text null
    check (deep_research_status in ('Not started', 'Queued', 'Running', 'Completed', 'Failed')),
  contact_research_status   text null
    check (contact_research_status in ('Not started', 'Queued', 'Running', 'Completed', 'Failed')),

  human_review_status       text not null default 'Not reviewed'
    check (human_review_status in (
      'Not reviewed', 'Approved', 'Rejected',
      'Needs discussion', 'Keep for later', 'Sensitive', 'Do not contact'
    )),

  reviewer_id               uuid null references auth.users(id) on delete set null,
  review_notes              text null,
  reviewed_at               timestamptz null,

  selection_reason          text null,
  rejection_reason          text null,

  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  unique (bulk_list_id, company_id)
);

alter table public.bulk_list_companies enable row level security;
create policy "Authenticated users can read bulk_list_companies"
  on public.bulk_list_companies for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert bulk_list_companies"
  on public.bulk_list_companies for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update bulk_list_companies"
  on public.bulk_list_companies for update using (auth.role() = 'authenticated');

create index if not exists idx_blc_bulk_list_id         on public.bulk_list_companies(bulk_list_id);
create index if not exists idx_blc_company_id           on public.bulk_list_companies(company_id);
create index if not exists idx_blc_human_review_status  on public.bulk_list_companies(human_review_status);

-- ============================================================
-- AI PROCESS RUNS
-- ============================================================
create table if not exists public.ai_process_runs (
  id                uuid primary key default uuid_generate_v4(),

  process_type      text not null
    check (process_type in (
      'SHMA Scoring', 'Deep Research', 'Contact Research',
      'Outreach Drafting', 'Criteria Structuring'
    )),

  bulk_list_id      uuid null references public.bulk_lists(id) on delete set null,
  company_id        uuid null references public.companies(id) on delete set null,

  started_by        uuid not null references auth.users(id) on delete restrict,

  status            text not null default 'Queued'
    check (status in (
      'Queued', 'Running', 'Completed', 'Failed',
      'Cancelled', 'Partially completed'
    )),

  model             text null,
  prompt_version    text null,

  total_items       integer not null default 0,
  processed_items   integer not null default 0,
  failed_items      integer not null default 0,

  estimated_cost    numeric null,
  actual_cost       numeric null,
  currency          text not null default 'USD',

  started_at        timestamptz null,
  completed_at      timestamptz null,

  error_summary     text null,
  metadata_json     jsonb null,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.ai_process_runs enable row level security;
create policy "Authenticated users can read ai_process_runs"
  on public.ai_process_runs for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert ai_process_runs"
  on public.ai_process_runs for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update ai_process_runs"
  on public.ai_process_runs for update using (auth.role() = 'authenticated');

create index if not exists idx_apr_bulk_list_id  on public.ai_process_runs(bulk_list_id);
create index if not exists idx_apr_status        on public.ai_process_runs(status);
create index if not exists idx_apr_created       on public.ai_process_runs(created_at desc);

-- ============================================================
-- AI PROCESS ITEMS
-- ============================================================
create table if not exists public.ai_process_items (
  id                  uuid primary key default uuid_generate_v4(),
  ai_process_run_id   uuid not null references public.ai_process_runs(id) on delete cascade,
  company_id          uuid not null references public.companies(id) on delete cascade,

  status              text not null default 'Queued'
    check (status in ('Queued', 'Running', 'Completed', 'Failed', 'Skipped')),

  input_json          jsonb null,
  output_json         jsonb null,
  error_message       text null,

  token_input         integer null,
  token_output        integer null,
  cost                numeric null,

  started_at          timestamptz null,
  completed_at        timestamptz null,

  created_at          timestamptz not null default now()
);

alter table public.ai_process_items enable row level security;
create policy "Authenticated users can read ai_process_items"
  on public.ai_process_items for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert ai_process_items"
  on public.ai_process_items for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update ai_process_items"
  on public.ai_process_items for update using (auth.role() = 'authenticated');

create index if not exists idx_api_run_id     on public.ai_process_items(ai_process_run_id);
create index if not exists idx_api_company_id on public.ai_process_items(company_id);
create index if not exists idx_api_status     on public.ai_process_items(status);

-- ============================================================
-- EXTEND ACTIVITY LOG
-- ============================================================
alter table public.activity_log
  add column if not exists title                   text null,
  add column if not exists related_contact_id      uuid null references public.contacts(id) on delete set null,
  add column if not exists related_bulk_list_id    uuid null references public.bulk_lists(id) on delete set null,
  add column if not exists related_ai_process_run_id uuid null references public.ai_process_runs(id) on delete set null,
  add column if not exists metadata_json           jsonb null;

create index if not exists idx_activity_log_bulk_list_id on public.activity_log(related_bulk_list_id);

-- ============================================================
-- UPDATE PIPELINE STAGES on companies to support new Customer Kanban
-- Existing: Longlist | AI Researched | Human Review | Qualified Target | ...
-- New Customer Kanban starts at: Qualified Targets
-- ============================================================
-- No schema change needed for companies.stage — it's text, no enum constraint.
-- The new stages are enforced in application code via CUSTOMER_KANBAN_STAGES.

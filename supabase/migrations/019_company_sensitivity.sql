-- Company sensitivity / exclusion fields
-- Prevents accidental outreach to sensitive companies

alter table public.companies
  add column if not exists sensitivity_status text not null default 'Normal'
    check (sensitivity_status in (
      'Normal', 'Sensitive', 'Do not contact',
      'Contact only through named person', 'Excluded from SHMA outreach'
    )),
  add column if not exists sensitivity_reason text null,
  add column if not exists sensitivity_owner_id uuid null references auth.users(id),
  add column if not exists contact_only_through_contact_id uuid null,
  add column if not exists sensitivity_review_date date null,
  -- Ownership / board / shareholder data
  add column if not exists owners_json jsonb null,
  add column if not exists board_members_json jsonb null,
  add column if not exists shareholders_json jsonb null,
  add column if not exists investor_groups_json jsonb null,
  add column if not exists portfolio_notes text null,
  add column if not exists ownership_source text null,
  add column if not exists ownership_last_checked_at timestamptz null,
  -- Import tracking
  add column if not exists import_batch_id uuid null references public.import_batches(id),
  add column if not exists import_source_name text null,
  add column if not exists import_row_data_json jsonb null;

create index if not exists idx_companies_sensitivity_status on public.companies(sensitivity_status);

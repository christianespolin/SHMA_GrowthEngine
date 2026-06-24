-- Import batches and batch rows for flexible Long List import
-- Supports any Excel/CSV with column mapping, validation, duplicate detection

create table if not exists public.import_batches (
  id uuid primary key default uuid_generate_v4(),
  batch_name text not null,
  import_type text not null default 'Long List',
  source_name text null,
  source_description text null,
  uploaded_file_name text null,
  uploaded_by uuid not null references auth.users(id),
  status text not null default 'Draft'
    check (status in ('Draft', 'Mapped', 'Validated', 'Reviewing Duplicates', 'Importing', 'Completed', 'Failed')),
  column_mapping_json jsonb null,
  total_rows integer default 0,
  valid_rows integer default 0,
  duplicate_rows integer default 0,
  imported_rows integer default 0,
  skipped_rows integer default 0,
  error_rows integer default 0,
  raw_headers jsonb null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.import_batches enable row level security;
create policy "Authenticated users can manage import batches"
  on public.import_batches for all using (auth.role() = 'authenticated');

create table if not exists public.import_batch_rows (
  id uuid primary key default uuid_generate_v4(),
  import_batch_id uuid not null references public.import_batches(id) on delete cascade,
  row_number integer not null,
  raw_data_json jsonb not null,
  mapped_data_json jsonb null,
  validation_status text not null default 'Pending'
    check (validation_status in ('Pending', 'Valid', 'Invalid', 'Warning', 'Imported', 'Skipped')),
  duplicate_status text not null default 'Not checked'
    check (duplicate_status in (
      'Not checked', 'No duplicate', 'Possible duplicate',
      'Exact duplicate', 'Existing active company',
      'Existing disqualified company', 'Existing do-not-contact company'
    )),
  matched_company_id uuid null references public.companies(id),
  action text null
    check (action in ('Create new company', 'Update existing company', 'Skip', 'Merge', 'Needs review')),
  error_message text null,
  created_at timestamptz default now()
);

alter table public.import_batch_rows enable row level security;
create policy "Authenticated users can manage import batch rows"
  on public.import_batch_rows for all using (auth.role() = 'authenticated');

create index if not exists idx_import_batch_rows_batch_id on public.import_batch_rows(import_batch_id);
create index if not exists idx_import_batch_rows_duplicate_status on public.import_batch_rows(duplicate_status);

-- Partner Review Lists
-- Used to send curated batches of companies to external partners (Sean, Bas, Simon, etc.)
-- for "do you know anyone there?" warm-intro identification

create table if not exists public.partner_review_lists (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text null,
  reviewer_name text not null,
  reviewer_email text null,
  reviewer_type text not null default 'External Partner',
  assigned_by uuid not null references auth.users(id),
  status text not null default 'Draft'
    check (status in ('Draft', 'Sent', 'In Review', 'Completed', 'Archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.partner_review_lists enable row level security;
create policy "Authenticated users can manage partner review lists"
  on public.partner_review_lists for all using (auth.role() = 'authenticated');

create table if not exists public.partner_review_list_items (
  id uuid primary key default uuid_generate_v4(),
  partner_review_list_id uuid not null references public.partner_review_lists(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  partner_feedback_status text not null default 'Pending'
    check (partner_feedback_status in (
      'Pending', 'Knows company', 'Knows person',
      'Strong intro possible', 'Weak intro possible',
      'Do not approach', 'Not relevant',
      'Contact through reviewer', 'No relationship'
    )),
  relationship_strength text null,
  known_contact_name text null,
  known_contact_role text null,
  intro_possible boolean null,
  intro_owner_name text null,
  feedback_notes text null,
  reviewed_at timestamptz null,
  created_at timestamptz default now()
);

alter table public.partner_review_list_items enable row level security;
create policy "Authenticated users can manage partner review list items"
  on public.partner_review_list_items for all using (auth.role() = 'authenticated');

create index if not exists idx_partner_review_list_items_list_id on public.partner_review_list_items(partner_review_list_id);
create index if not exists idx_partner_review_list_items_company_id on public.partner_review_list_items(company_id);

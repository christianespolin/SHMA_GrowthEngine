-- MVP Readiness checklist
-- Tracks whether the system is ready for real large-scale use

create table if not exists public.mvp_readiness_items (
  id uuid primary key default uuid_generate_v4(),
  item_key text unique not null,
  label text not null,
  description text null,
  category text not null default 'General',
  status text not null default 'Not started'
    check (status in ('Not started', 'In progress', 'Blocked', 'Done', 'Not needed')),
  owner_name text null,
  owner_id uuid null references auth.users(id),
  due_date date null,
  notes text null,
  completed_at timestamptz null,
  completed_by uuid null references auth.users(id),
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.mvp_readiness_items enable row level security;
create policy "Authenticated users can manage mvp readiness items"
  on public.mvp_readiness_items for all using (auth.role() = 'authenticated');

-- Seed the checklist items
insert into public.mvp_readiness_items (item_key, label, description, category, sort_order) values
  ('scoring_criteria_agreed', 'SHMA scoring criteria agreed', 'Simon, Stian and Christian have reviewed and approved the scoring criteria', 'Scoring', 1),
  ('scoring_thresholds_agreed', 'Scoring thresholds agreed', 'Agreed thresholds for AI Qualified, Human Review, Qualified Target, Disqualified', 'Scoring', 2),
  ('long_list_import_tested', 'Long List import tested', 'Excel/CSV import with column mapping has been tested end-to-end', 'Import', 3),
  ('duplicate_detection_tested', 'Duplicate detection tested', 'Duplicate detection correctly identifies and flags existing companies before import', 'Import', 4),
  ('sensitivity_tested', 'Company sensitivity / do-not-contact tested', 'Sensitive and do-not-contact companies are blocked from outreach', 'Compliance', 5),
  ('contact_workflow_tested', 'Contact data workflow tested', 'Contact readiness statuses and contact coverage scores are working', 'Contacts', 6),
  ('partner_review_tested', 'Partner Review List tested', 'A partner review list has been created, exported, and feedback recorded', 'Partners', 7),
  ('origination_workflow_tested', 'Origination workflow tested', 'Opportunity Creator field, commission allocation and audit trail tested', 'Origination', 8),
  ('outreach_approval_tested', 'Outreach approval workflow tested', 'All outreach requires human review before marking sent', 'Outreach', 9),
  ('activity_log_confirmed', 'Activity log confirmed', 'Company activity timeline captures all key actions', 'Data', 10),
  ('dashboard_heroes_agreed', 'Dashboard heroes agreed', 'KPIs and hero figures agreed for the main dashboard', 'Dashboard', 11),
  ('roles_permissions_checked', 'Roles and permissions checked', 'Admin, Principal, Outreach Team and Viewer roles are correctly enforced', 'Security', 12),
  ('sample_20_company_test', '20-company test import completed', 'A sample list of 20 companies has been imported and processed through the full funnel', 'Testing', 13),
  ('ready_500_company_import', 'Ready for 500–2,000 company import', 'System confirmed stable and ready for larger import batches', 'Scale', 14),
  ('ready_september_outreach', 'Ready for September outreach preparation', 'All commercial workflows ready for coordinated outreach beginning September', 'Launch', 15)
on conflict (item_key) do nothing;

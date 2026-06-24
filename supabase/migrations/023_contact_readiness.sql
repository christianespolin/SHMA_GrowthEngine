-- Contact readiness and data quality fields
-- Extends contacts table with status fields for outreach qualification

alter table public.contacts
  add column if not exists email_status_v2 text not null default 'Missing'
    check (email_status_v2 in ('Missing', 'Found', 'Verified', 'Unverified', 'Pattern guess', 'Do not use')),
  add column if not exists contact_readiness text not null default 'Role only'
    check (contact_readiness in (
      'Role only', 'Person identified', 'Contact data incomplete',
      'Ready for outreach', 'Use warm intro', 'Do not contact'
    )),
  add column if not exists warm_intro_available boolean not null default false,
  add column if not exists warm_intro_through text null,
  add column if not exists is_board_member boolean not null default false,
  add column if not exists is_shareholder boolean not null default false,
  add column if not exists is_investor boolean not null default false,
  add column if not exists contact_category text null
    check (contact_category in (
      'CEO / Managing Director', 'CFO', 'CCO / Commercial Leader',
      'Head of Service', 'Head of Strategy', 'Product / Technology Leader',
      'Board Member', 'Chair', 'Shareholder', 'PE Owner', 'Investor',
      'Portfolio Owner', 'Corporate Owner', 'Advisor', 'Warm Intro Source', 'Other'
    ));

-- Contact coverage score on companies
alter table public.companies
  add column if not exists contact_coverage_score text null
    check (contact_coverage_score in ('Weak', 'Partial', 'Good', 'Strong', 'Outreach-ready'));

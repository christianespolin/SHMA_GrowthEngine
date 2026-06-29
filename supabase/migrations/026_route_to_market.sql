-- Route to market field on companies
alter table public.companies
  add column if not exists route_to_market text null
    check (route_to_market in (
      'Warm intro via partner',
      'Chetwode / Simon route',
      'Board / shareholder route',
      'Existing SHMA network',
      'Sofie / Henrik outreach',
      'Founder / CEO direct',
      'CFO / funding angle',
      'Service / aftermarket angle',
      'Nurture',
      'Unknown'
    ));

-- Engagement fields (complement the existing engaged modal)
alter table public.companies
  add column if not exists engagement_type text null,
  add column if not exists engagement_date date null,
  add column if not exists engagement_summary text null,
  add column if not exists engaged_contact_id uuid null references public.contacts(id) on delete set null;

-- Contact coverage score is already text from migration 023 — no change needed
-- Ensure contact_readiness exists on companies (already in 023, safety guard)
alter table public.companies
  add column if not exists contact_readiness text null
    check (contact_readiness in (
      'No contacts',
      'Contacts identified',
      'Decision-makers identified',
      'Warm intro possible',
      'Outreach ready',
      'Do not contact'
    ));

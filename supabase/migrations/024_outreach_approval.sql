-- Outreach approval workflow
-- Adds approval_status to separate AI generation from human approval from sending

alter table public.outreach_messages
  add column if not exists approval_status text not null default 'Needs review'
    check (approval_status in ('Needs review', 'Approved', 'Rejected', 'Needs rewrite')),
  add column if not exists outreach_style text null,
  add column if not exists approved_by uuid null references auth.users(id),
  add column if not exists approved_at timestamptz null,
  add column if not exists rejection_reason text null;

-- Existing messages that are already sent/replied can be considered pre-approved
update public.outreach_messages
  set approval_status = 'Approved'
  where status in ('sent', 'replied');

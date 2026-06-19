-- Allow 'replied' as a valid outreach message status
ALTER TABLE public.outreach_messages
  DROP CONSTRAINT IF EXISTS outreach_messages_status_check;

ALTER TABLE public.outreach_messages
  ADD CONSTRAINT outreach_messages_status_check
  CHECK (status IN ('draft', 'sent', 'replied', 'archived'));

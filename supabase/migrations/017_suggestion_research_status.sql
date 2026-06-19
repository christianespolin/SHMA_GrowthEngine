alter table public.discovery_suggestions
  add column if not exists ai_research_status text null
    check (ai_research_status in ('pending', 'running', 'completed', 'failed'));

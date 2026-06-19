-- SHMA Growth Engine — Target Universe Extended Fields (Phase 3)
-- Adds flexible builder fields to target_universes

alter table public.target_universes
  add column if not exists search_mode text null,
  add column if not exists industry_presets text[] null,
  add column if not exists include_industries_text text null,
  add column if not exists exclude_industries_text text null,
  add column if not exists reference_companies_text text null,
  add column if not exists country_presets text[] null,
  add column if not exists region_notes text null,
  add column if not exists include_countries_text text null,
  add column if not exists exclude_countries_text text null,
  add column if not exists min_revenue numeric null,
  add column if not exists max_revenue numeric null,
  add column if not exists revenue_currency text null,
  add column if not exists revenue_notes text null,
  add column if not exists min_employees integer null,
  add column if not exists max_employees integer null,
  add column if not exists ownership_filters text[] null,
  add column if not exists strategic_triggers text[] null,
  add column if not exists shma_fit_requirements_json jsonb null,
  add column if not exists funding_requirements_json jsonb null,
  add column if not exists other_exclusions_text text null,
  add column if not exists expected_universe_size text null,
  add column if not exists ai_structured_criteria_json jsonb null,
  add column if not exists ai_structured_at timestamptz null,
  add column if not exists ai_structured_by uuid null;

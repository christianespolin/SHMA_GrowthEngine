-- Backfill: create a bulk list for companies imported before bulk lists existed.
-- Only runs if there are Longlist-stage companies with no bulk_list_companies membership.

do $$
declare
  v_list_id uuid;
  v_count   integer;
begin
  -- Count orphaned Longlist companies (no bulk list membership)
  select count(*) into v_count
  from public.companies c
  where c.stage = 'Longlist'
    and not exists (
      select 1 from public.bulk_list_companies blc where blc.company_id = c.id
    );

  if v_count > 0 then
    -- Create a catch-all Longlist bulk list for these companies
    insert into public.bulk_lists (
      name, description, category, source_type, source_name,
      created_by, company_count, status
    )
    select
      'Imported Longlist (backfill)',
      v_count || ' companies imported before bulk list tracking was introduced',
      'Longlist',
      'Excel Import',
      'Legacy import',
      id,  -- first authenticated user as owner fallback
      v_count,
      'Active'
    from auth.users
    limit 1
    returning id into v_list_id;

    -- Add all orphaned Longlist companies to the list
    insert into public.bulk_list_companies (bulk_list_id, company_id, list_status)
    select v_list_id, c.id, 'Active'
    from public.companies c
    where c.stage = 'Longlist'
      and not exists (
        select 1 from public.bulk_list_companies blc where blc.company_id = c.id
      )
    on conflict (bulk_list_id, company_id) do nothing;

    raise notice 'Backfilled % companies into bulk list %', v_count, v_list_id;
  else
    raise notice 'No orphaned Longlist companies found — nothing to backfill';
  end if;
end $$;

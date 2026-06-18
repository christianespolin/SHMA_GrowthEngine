-- SHMA Growth Engine — Phase 1 & 2 Demo Data
-- Run after migrations 010–013

-- Demo Target Universe
insert into public.target_universes (
  id, name, description, scope_definition,
  geography, industries, segments,
  estimated_total_count, actual_total_count,
  data_source_type, status
) values (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Nordic Warehouse Automation & Robotics',
  'Companies in the Nordic region selling or deploying automated warehouse equipment, robotics systems, conveyor infrastructure, and related complex B2B capital equipment.',
  'All companies with >20 employees in Norway, Sweden, Denmark and Finland operating in warehousing automation, intralogistics, robotics, and industrial automation sectors.',
  ARRAY['Norway', 'Sweden', 'Denmark', 'Finland'],
  ARRAY['Warehouse Automation', 'Robotics', 'Intralogistics', 'Industrial Automation'],
  ARRAY['Capital Equipment', 'System Integrators', 'OEM Manufacturers'],
  50000,
  null,
  'AI estimated',
  'Active'
) on conflict do nothing;

-- Demo companies in target universe
insert into public.target_universe_companies (
  target_universe_id, company_name, website, country, industry, segment,
  revenue, employees, universe_status, human_validation_status, ai_qualification_score
) values
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Swisslog Nordic AS', 'swisslog.com', 'Norway', 'Warehouse Automation', 'System Integrators', '500M-1B NOK', '150-500', 'AI Qualified Target', 'Validated', 4.2),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'AutoStore Systems', 'autostoresystem.com', 'Norway', 'Robotics', 'OEM Manufacturers', '1B+ NOK', '500+', 'Qualified Target', 'Validated', 4.7),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Toyota Material Handling Nordic', 'toyota-forklifts.no', 'Norway', 'Intralogistics', 'Capital Equipment', '200-500M NOK', '100-150', 'Long List / Screened Target', 'Not reviewed', 3.1),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Kardex Group Nordic', 'kardex.com', 'Sweden', 'Warehouse Automation', 'System Integrators', '100-200M NOK', '50-100', 'Long List / Screened Target', 'Not reviewed', 3.4),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Jungheinrich Scandinavia', 'jungheinrich.se', 'Sweden', 'Intralogistics', 'Capital Equipment', '200-500M NOK', '100-200', 'AI Qualified Target', 'Needs more data', 3.8),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Cimcorp Oy', 'cimcorp.com', 'Finland', 'Robotics', 'System Integrators', '100-200M NOK', '200-350', 'Validated Target', 'Validated', 4.0),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'GreyOrange Nordic', 'greyorange.com', 'Denmark', 'Robotics', 'OEM Manufacturers', '<100M NOK', '30-50', 'AI Qualified Target', 'Not reviewed', 3.6),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Logitrans A/S', 'logitrans.com', 'Denmark', 'Intralogistics', 'Capital Equipment', '<100M NOK', '20-50', 'Screened Out', 'Rejected', 2.1),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Konstruktionssystem i Gävle AB', 'ks-gavle.se', 'Sweden', 'Industrial Automation', 'System Integrators', '<100M NOK', '20-30', 'In Target Universe', 'Not reviewed', null),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Nedcon Nordic', 'nedcon.com', 'Norway', 'Warehouse Automation', 'Capital Equipment', '50-100M NOK', '30-50', 'In Target Universe', 'Not reviewed', null)
on conflict do nothing;

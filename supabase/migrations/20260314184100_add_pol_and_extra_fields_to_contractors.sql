-- Add extra fields for POL and other sections to contractors table
alter table public.contractors add column if not exists emp_no text;
alter table public.contractors add column if not exists vehicle_no text;
alter table public.contractors add column if not exists fuel_type text;
alter table public.contractors add column if not exists month_date date;
alter table public.contractors add column if not exists pso_rate numeric;
alter table public.contractors add column if not exists pol_previous numeric;
alter table public.contractors add column if not exists pol_current numeric;
alter table public.contractors add column if not exists category text;
alter table public.contractors add column if not exists designation text;
alter table public.contractors add column if not exists department text;
alter table public.contractors add column if not exists fuel_stations text;
alter table public.contractors add column if not exists zone_wise text;
alter table public.contractors add column if not exists receiving_status text;
alter table public.contractors add column if not exists serial_no text;

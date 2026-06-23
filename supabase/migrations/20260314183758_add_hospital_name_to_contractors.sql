-- Add hospital_name column to contractors table
alter table public.contractors add column if not exists hospital_name text;

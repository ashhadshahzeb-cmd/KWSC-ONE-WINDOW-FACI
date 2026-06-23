-- Create contractors table to store billing records
create table if not exists public.contractors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  budget_year date,
  budget_head text,
  pmr_voucher text,
  contractor_name text,
  party_code text,
  city_town text,
  voucher_no text,
  cheque_no text,
  balance_amount numeric,
  water_charges numeric,
  security_deposit numeric,
  gst_other numeric,
  income_tax numeric,
  gross_amount numeric,
  net_amount numeric,
  bill_passed_on date,
  payment_date date,
  work_description text,
  vendor_type text -- 'medical', 'contractor', 'security_deposit', 'contingencies'
);

-- Enable RLS
alter table public.contractors enable row level security;

-- Policies
create policy "Allow all authenticated users to read contractors"
  on public.contractors for select
  using (auth.role() = 'authenticated');

create policy "Allow all authenticated users to insert contractors"
  on public.contractors for insert
  with check (auth.role() = 'authenticated');

create policy "Allow all authenticated users to update contractors"
  on public.contractors for update
  using (auth.role() = 'authenticated');

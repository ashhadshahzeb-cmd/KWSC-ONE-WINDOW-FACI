-- ============================================================
-- KWSC Finance - Separate Tables Migration
-- Drop old shared contractors table, create proper tables
-- ============================================================

-- ============================================================
-- 1. DROP OLD SHARED TABLE (saari data migrate nahi ho rahi thi)
-- ============================================================
DROP TABLE IF EXISTS public.contractors CASCADE;

-- ============================================================
-- 2. TABLE: medical_billings
-- Form: Medical.tsx
-- Fields: budget_year, budget_head, hospital_name, vendor_name,
--         party_code, pmr_voucher, voucher_no, cheque_no,
--         balance_amount, income_tax, gross_amount, net_amount,
--         bill_passed_on, payment_date, vendor_type
-- ============================================================
CREATE TABLE IF NOT EXISTS public.medical_billings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  budget_year     date,
  budget_head     text,
  hospital_name   text NOT NULL,
  vendor_name     text NOT NULL,
  party_code      text,
  pmr_voucher     text,
  voucher_no      text,
  cheque_no       text,
  balance_amount  numeric DEFAULT 0,
  income_tax      numeric DEFAULT 0,
  gross_amount    numeric DEFAULT 0,
  net_amount      numeric DEFAULT 0,
  bill_passed_on  date,
  payment_date    date,
  vendor_type     text DEFAULT 'medical'
);

ALTER TABLE public.medical_billings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read medical_billings"
  ON public.medical_billings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert medical_billings"
  ON public.medical_billings FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update medical_billings"
  ON public.medical_billings FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete medical_billings"
  ON public.medical_billings FOR DELETE
  USING (auth.role() = 'authenticated');


-- ============================================================
-- 3. TABLE: contractor_billings
-- Form: Contractor.tsx
-- Fields: budget_year, budget_head, pmr_voucher, contractor_name,
--         party_code, city_town, voucher_no, cheque_no, balance_amount,
--         water_charges, security_deposit, gst_other, income_tax,
--         gross_amount, net_amount, bill_passed_on, payment_date,
--         work_description, vendor_type
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contractor_billings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  budget_year       date,
  budget_head       text,
  pmr_voucher       text,
  contractor_name   text NOT NULL,
  party_code        text,
  city_town         text,
  voucher_no        text,
  cheque_no         text,
  balance_amount    numeric DEFAULT 0,
  water_charges     numeric DEFAULT 0,
  security_deposit  numeric DEFAULT 0,
  gst_other         numeric DEFAULT 0,
  income_tax        numeric DEFAULT 0,
  gross_amount      numeric DEFAULT 0,
  net_amount        numeric DEFAULT 0,
  bill_passed_on    date,
  payment_date      date,
  work_description  text,
  vendor_type       text DEFAULT 'contractor'
);

ALTER TABLE public.contractor_billings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read contractor_billings"
  ON public.contractor_billings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert contractor_billings"
  ON public.contractor_billings FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update contractor_billings"
  ON public.contractor_billings FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete contractor_billings"
  ON public.contractor_billings FOR DELETE
  USING (auth.role() = 'authenticated');


-- ============================================================
-- 4. TABLE: security_deposits
-- Form: SecurityDeposit.tsx
-- Fields: year_sd, budget_head, party_code, vendor_name, zone_wise,
--         voucher_no, voucher_date, bill_passed_on, gross_amount,
--         net_amount, receiving_status, cheque_no, balance_amount,
--         payment_date, vendor_type
-- ============================================================
CREATE TABLE IF NOT EXISTS public.security_deposits (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  year_sd           date,
  budget_head       text,
  party_code        text,
  vendor_name       text NOT NULL,
  zone_wise         text,
  voucher_no        text,
  voucher_date      date,
  bill_passed_on    date,
  gross_amount      numeric DEFAULT 0,
  net_amount        numeric DEFAULT 0,
  receiving_status  text,
  cheque_no         text,
  balance_amount    numeric DEFAULT 0,
  payment_date      date,
  vendor_type       text DEFAULT 'security_deposit'
);

ALTER TABLE public.security_deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read security_deposits"
  ON public.security_deposits FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert security_deposits"
  ON public.security_deposits FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update security_deposits"
  ON public.security_deposits FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete security_deposits"
  ON public.security_deposits FOR DELETE
  USING (auth.role() = 'authenticated');


-- ============================================================
-- 5. TABLE: pol_bills
-- Form: PolBills.tsx
-- Fields: emp_no, vehicle_no, officer_name, designation, department,
--         poi_bill_no, pol_previous, pol_current, pso_rate, month_date,
--         fuel_type, gross_amount, fuel_stations, vendor_type
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pol_bills (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  emp_no        text,
  vehicle_no    text NOT NULL,
  officer_name  text NOT NULL,
  designation   text,
  department    text,
  poi_bill_no   text,
  pol_previous  numeric DEFAULT 0,
  pol_current   numeric DEFAULT 0,
  pso_rate      numeric DEFAULT 0,
  month_date    date,
  fuel_type     text,  -- 'petrol' | 'diesel'
  gross_amount  numeric DEFAULT 0,
  fuel_stations text,
  vendor_type   text DEFAULT 'pol_bills'
);

ALTER TABLE public.pol_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read pol_bills"
  ON public.pol_bills FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert pol_bills"
  ON public.pol_bills FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update pol_bills"
  ON public.pol_bills FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete pol_bills"
  ON public.pol_bills FOR DELETE
  USING (auth.role() = 'authenticated');


-- ============================================================
-- 6. TABLE: contingencies
-- Form: Contigencies.tsx
-- Fields: serial_no, budget_year, party_code, vendor_name, voucher_no,
--         description, gross_amount, income_tax, net_amount,
--         cheque_no, balance_amount, vendor_type
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contingencies (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     timestamptz NOT NULL DEFAULT now(),
  serial_no      text,
  budget_year    text,
  party_code     text,
  vendor_name    text NOT NULL,
  voucher_no     text,
  description    text,
  gross_amount   numeric DEFAULT 0,
  income_tax     numeric DEFAULT 0,
  net_amount     numeric DEFAULT 0,
  cheque_no      text,
  balance_amount numeric DEFAULT 0,
  vendor_type    text DEFAULT 'contingencies'
);

ALTER TABLE public.contingencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read contingencies"
  ON public.contingencies FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert contingencies"
  ON public.contingencies FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update contingencies"
  ON public.contingencies FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete contingencies"
  ON public.contingencies FOR DELETE
  USING (auth.role() = 'authenticated');


-- ============================================================
-- 7. TABLE: cheque_records
-- Form: ChequeRecord.tsx
-- Fields: emp_name, emp_no, pension_no, serial_no, emp_status,
--         total_amount, remaining_amount, disbursed_on, record_status,
--         cheque_no_1..4, amount_1..4, total_disbursed
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cheque_records (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  emp_name         text NOT NULL,
  emp_no           text,
  pension_no       text,
  serial_no        text,
  emp_status       text DEFAULT 'regular',  -- 'regular' | 'retired'
  total_amount     numeric DEFAULT 0,
  remaining_amount numeric DEFAULT 0,
  disbursed_on     date,
  record_status    text DEFAULT 'active',  -- 'active' | 'close'
  cheque_no_1      text,
  amount_1         numeric DEFAULT 0,
  cheque_no_2      text,
  amount_2         numeric DEFAULT 0,
  cheque_no_3      text,
  amount_3         numeric DEFAULT 0,
  cheque_no_4      text,
  amount_4         numeric DEFAULT 0,
  total_disbursed  numeric DEFAULT 0
);

ALTER TABLE public.cheque_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read cheque_records"
  ON public.cheque_records FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert cheque_records"
  ON public.cheque_records FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update cheque_records"
  ON public.cheque_records FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete cheque_records"
  ON public.cheque_records FOR DELETE
  USING (auth.role() = 'authenticated');


-- ============================================================
-- 8. TABLE: regular_employees
-- Form: RegularEmployee.tsx + CpFund.tsx (sub-categories)
-- Fields: emp_no, serial_no, emp_name, category, bill_passed_on,
--         disbursed_on, status, cheque_no, total_amount, balance_amount,
--         cheque_amount, amount_in_words
-- ============================================================
CREATE TABLE IF NOT EXISTS public.regular_employees (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  serial_no       text,
  emp_no          text,
  emp_name        text NOT NULL,
  category        text,  -- 'cp_fund' | 'supp_salary' | 'house_building' | 'tada' | 'overtime'
  bill_passed_on  date,
  disbursed_on    date,
  status          text DEFAULT 'active',  -- 'active' | 'close'
  cheque_no       text,
  total_amount    numeric DEFAULT 0,
  balance_amount  numeric DEFAULT 0,
  cheque_amount   numeric DEFAULT 0,
  amount_in_words text
);

ALTER TABLE public.regular_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read regular_employees"
  ON public.regular_employees FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert regular_employees"
  ON public.regular_employees FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update regular_employees"
  ON public.regular_employees FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete regular_employees"
  ON public.regular_employees FOR DELETE
  USING (auth.role() = 'authenticated');


-- ============================================================
-- 9. TABLE: retired_employees
-- Form: RetiredEmployee.tsx
-- Fields: pension_no, cnic_no, emp_no, emp_name, category,
--         appointment_date, retired_date, bill_passed_on,
--         nominees, bank_details, total_amount_payable, photo_url
-- ============================================================
CREATE TABLE IF NOT EXISTS public.retired_employees (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at           timestamptz NOT NULL DEFAULT now(),
  pension_no           text,
  cnic_no              text,
  emp_no               text,
  emp_name             text NOT NULL,
  category             text,  -- 'fund' | 'lpr' | 'pension_gratuity' | 'pension_arrear' | 'financial_assistance' | 'group_insurance'
  appointment_date     date,
  retired_date         date,
  bill_passed_on       date,
  nominees             text,
  bank_details         text,
  total_amount_payable numeric DEFAULT 0,
  photo_url            text
);

ALTER TABLE public.retired_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read retired_employees"
  ON public.retired_employees FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert retired_employees"
  ON public.retired_employees FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update retired_employees"
  ON public.retired_employees FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete retired_employees"
  ON public.retired_employees FOR DELETE
  USING (auth.role() = 'authenticated');


-- ============================================================
-- DONE! All 8 separate tables created.
-- ============================================================

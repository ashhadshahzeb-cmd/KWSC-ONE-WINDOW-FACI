-- ============================================================
-- Contractor Billings Table
-- Permanent storage for service/construction contractor bills
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contractor_billings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Identifiers
    budget_year DATE,
    budget_head TEXT,
    pmr_voucher TEXT,
    contractor_name TEXT NOT NULL,
    party_code TEXT NOT NULL,
    city_town TEXT,
    voucher_no TEXT NOT NULL,
    cheque_no TEXT,
    
    -- Deductions
    water_charges NUMERIC DEFAULT 0,
    security_deposit NUMERIC DEFAULT 0,
    gst_other NUMERIC DEFAULT 0,
    income_tax NUMERIC DEFAULT 0,
    
    -- Financials
    gross_amount NUMERIC NOT NULL DEFAULT 0,
    net_amount NUMERIC NOT NULL DEFAULT 0,
    balance_amount NUMERIC DEFAULT 0,
    
    -- Dates & Details
    bill_passed_on DATE,
    payment_date DATE,
    work_description TEXT,
    vendor_type TEXT,
    
    -- Status
    status TEXT DEFAULT 'pending'
);

-- Enable RLS
ALTER TABLE public.contractor_billings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users
CREATE POLICY "Allow all for authenticated on contractor_billings" 
ON public.contractor_billings FOR ALL 
TO authenticated 
USING (true);

-- ============================================================
-- Contingency Billings Table
-- Permanent storage for miscellaneous and unforeseen expenses
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contingency_billings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Identification
    serial_no TEXT,
    budget_year TEXT,
    party_code TEXT NOT NULL,
    vendor_name TEXT NOT NULL,
    voucher_no TEXT NOT NULL,
    
    -- Details
    work_description TEXT,
    
    -- Financials
    gross_amount NUMERIC NOT NULL DEFAULT 0,
    income_tax NUMERIC DEFAULT 0,
    net_amount NUMERIC NOT NULL DEFAULT 0,
    
    -- Payment
    cheque_no TEXT,
    balance_amount NUMERIC DEFAULT 0,
    
    -- Meta
    vendor_type TEXT DEFAULT 'contingencies',
    status TEXT DEFAULT 'pending'
);

-- Enable RLS
ALTER TABLE public.contingency_billings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users
CREATE POLICY "Allow all for authenticated on contingency_billings" 
ON public.contingency_billings FOR ALL 
TO authenticated 
USING (true);

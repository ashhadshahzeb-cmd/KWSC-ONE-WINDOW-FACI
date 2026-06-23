-- ============================================================
-- Medical Billings Table
-- Permanent storage for medical expense claims
-- ============================================================

CREATE TABLE IF NOT EXISTS public.medical_billings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Identifiers
    budget_year DATE,
    budget_head TEXT,
    hospital_name TEXT NOT NULL,
    vendor_name TEXT NOT NULL,
    party_code TEXT NOT NULL,
    pmr_voucher TEXT,
    voucher_no TEXT NOT NULL,
    bill_passed_on DATE,
    
    -- Financials
    gross_amount NUMERIC NOT NULL DEFAULT 0,
    income_tax NUMERIC DEFAULT 0,
    net_amount NUMERIC NOT NULL DEFAULT 0,
    cheque_no TEXT,
    payment_date DATE,
    balance_amount NUMERIC DEFAULT 0,
    
    -- Meta
    vendor_type TEXT DEFAULT 'medical',
    status TEXT DEFAULT 'pending'
);

-- Enable RLS
ALTER TABLE public.medical_billings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users
CREATE POLICY "Allow all for authenticated on medical_billings" 
ON public.medical_billings FOR ALL 
TO authenticated 
USING (true);

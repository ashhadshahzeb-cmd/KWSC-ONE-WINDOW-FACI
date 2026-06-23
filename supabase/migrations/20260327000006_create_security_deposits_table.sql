-- ============================================================
-- Security Deposits Table
-- Permanent storage for vendor security deposits
-- ============================================================

CREATE TABLE IF NOT EXISTS public.security_deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Classification
    year_sd DATE,
    budget_head TEXT,
    party_code TEXT NOT NULL,
    vendor_name TEXT NOT NULL,
    zone_wise TEXT,
    
    -- Voucher Info
    voucher_no TEXT NOT NULL,
    voucher_date DATE,
    bill_passed_on DATE,
    
    -- Financials
    gross_amount NUMERIC NOT NULL DEFAULT 0,
    net_amount NUMERIC NOT NULL DEFAULT 0,
    receiving_status TEXT,
    cheque_no TEXT,
    balance_amount NUMERIC DEFAULT 0,
    payment_date DATE,
    
    -- Meta
    vendor_type TEXT DEFAULT 'security_deposit',
    status TEXT DEFAULT 'active'
);

-- Enable RLS
ALTER TABLE public.security_deposits ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users
CREATE POLICY "Allow all for authenticated on security_deposits" 
ON public.security_deposits FOR ALL 
TO authenticated 
USING (true);

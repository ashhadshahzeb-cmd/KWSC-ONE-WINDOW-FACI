-- ============================================================
-- POL Billings Table
-- Permanent storage for fuel, oil, and lubricant expenses
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pol_billings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Staff & Vehicle Info
    emp_no TEXT NOT NULL,
    vehicle_no TEXT NOT NULL,
    officer_name TEXT NOT NULL,
    designation TEXT,
    department TEXT,
    poi_bill_no TEXT NOT NULL,
    
    -- Consumption Details
    pol_previous NUMERIC DEFAULT 0,
    pol_current NUMERIC DEFAULT 0,
    pso_rate NUMERIC DEFAULT 0,
    month_date DATE,
    fuel_type TEXT,
    fuel_stations TEXT,
    
    -- Financials
    gross_amount NUMERIC NOT NULL DEFAULT 0,
    vendor_type TEXT DEFAULT 'pol_bills',
    
    -- Status
    status TEXT DEFAULT 'pending'
);

-- Enable RLS
ALTER TABLE public.pol_billings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users
CREATE POLICY "Allow all for authenticated on pol_billings" 
ON public.pol_billings FOR ALL 
TO authenticated 
USING (true);

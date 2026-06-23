-- Update Unified Table to match USER's UI exactly and include all migration fields
DROP TABLE IF EXISTS public.book_section_employees CASCADE;

CREATE TABLE public.book_section_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Identification
    serial_no TEXT,
    employee_no TEXT,
    pension_no TEXT,
    full_name TEXT NOT NULL,
    cnic_no TEXT,
    nominees TEXT,
    
    -- Dates & Categories
    appointment_date DATE,
    retired_date DATE,
    disbursed_date DATE,
    category TEXT NOT NULL, -- 'Employed' or 'Retired'
    sub_category_regular TEXT,
    sub_category_retired TEXT,
    status TEXT DEFAULT 'active',
    
    -- Financials
    bank_details TEXT,
    total_amount NUMERIC DEFAULT 0,
    balance_amount NUMERIC DEFAULT 0,
    cheque_amount NUMERIC DEFAULT 0,
    amount_in_words TEXT,
    
    -- Assets
    photo_url TEXT,

    -- Migration fields (from Google Sheets tabs & Disbursements)
    nature_of_bill TEXT,
    pmr_no TEXT,
    cheque_date TEXT,
    cheque_break_up TEXT,
    cheque_no TEXT,
    paid_amount NUMERIC DEFAULT 0,
    deduction NUMERIC DEFAULT 0,
    passing_date DATE,
    entry_date DATE,
    payment_date DATE,
    ref_care_of TEXT,
    fund_amount NUMERIC DEFAULT 0,
    sal_amount NUMERIC DEFAULT 0,
    pen_amount NUMERIC DEFAULT 0,
    lpr_amount NUMERIC DEFAULT 0,
    disb_amount NUMERIC DEFAULT 0,
    med_amount NUMERIC DEFAULT 0,
    gins_amount NUMERIC DEFAULT 0,
    other_amount NUMERIC DEFAULT 0,
    total_disbursement NUMERIC DEFAULT 0,
    bank_status TEXT,
    pmr_date TEXT,
    source_tab TEXT
);

-- Disable RLS to match other unrestricted tables in local development
ALTER TABLE public.book_section_employees DISABLE ROW LEVEL SECURITY;

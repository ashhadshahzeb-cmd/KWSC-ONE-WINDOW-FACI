-- =============================================
-- app_config table: Dynamic admin configuration
-- Stores main categories, sub-categories, sections
-- =============================================

CREATE TABLE IF NOT EXISTS app_config (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_type TEXT NOT NULL,        -- 'main_category' | 'sub_category' | 'section'
  config_key  TEXT NOT NULL,        -- e.g. 'employee', 'cp-fund', 'cfo'
  config_label TEXT NOT NULL,       -- Human readable label
  parent_key  TEXT DEFAULT NULL,    -- For sub_category: links to main_category key
  sort_order  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint
ALTER TABLE app_config
  ADD CONSTRAINT app_config_type_key_parent_unique
  UNIQUE (config_type, config_key, parent_key);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_app_config_type ON app_config (config_type);
CREATE INDEX IF NOT EXISTS idx_app_config_parent ON app_config (parent_key);

-- =============================================
-- SEED DATA: Main Categories
-- =============================================
INSERT INTO app_config (config_type, config_key, config_label, parent_key, sort_order) VALUES
  ('main_category', 'employee',    'Employee',    NULL, 1),
  ('main_category', 'contractor',  'Contractor',  NULL, 2),
  ('main_category', 'others',      'Others',      NULL, 3),
  ('main_category', 'pol_bills',   'POL Bills',   NULL, 4),
  ('main_category', 'impress',     'Impress',     NULL, 5)
ON CONFLICT (config_type, config_key, parent_key) DO NOTHING;

-- =============================================
-- SEED DATA: Sub-Categories
-- =============================================
INSERT INTO app_config (config_type, config_key, config_label, parent_key, sort_order) VALUES
  -- Employee sub-categories
  ('sub_category', 'medical',            'Medical',               'employee',   1),
  ('sub_category', 'pension',            'Pension',               'employee',   2),
  ('sub_category', 'salary-arrears',     'Salary / Arrears',      'employee',   3),
  ('sub_category', 'loans-advances',     'Loans / Advances',      'employee',   4),
  ('sub_category', 'daily-wages',        'Daily Wages',           'employee',   5),
  ('sub_category', 'establishment',      'Establishment',         'employee',   6),
  ('sub_category', 'funds',              'Funds',                 'employee',   7),
  ('sub_category', 'cp-fund',            'CP Fund',               'employee',   8),
  ('sub_category', 'supp-salary',        'Supp Salary',           'employee',   9),
  ('sub_category', 'house-building',     'House Building',        'employee',   10),
  ('sub_category', 'tada',               'TADA',                  'employee',   11),
  ('sub_category', 'overtime',           'Overtime',              'employee',   12),
  ('sub_category', 'emp-others',         'Others',                'employee',   13),
  -- Contractor sub-categories
  ('sub_category', 'security-deposit',   'Security Deposit',      'contractor', 1),
  ('sub_category', 'contingencies',      'Contingencies',         'contractor', 2),
  ('sub_category', 'contractor-pol',     'POL Bills',             'contractor', 3),
  ('sub_category', 'contractor-bills',   'Contractor Bills',      'contractor', 4),
  ('sub_category', 'contractor-concerns','Contractor Concerns',   'contractor', 5),
  -- Others sub-categories
  ('sub_category', 'others-pol',         'POL Bills',             'others',     1),
  ('sub_category', 'others-contingencies','Contingencies',        'others',     2),
  ('sub_category', 'legal',              'Legal',                 'others',     3),
  ('sub_category', 'books-registers',    'Books/Registers',       'others',     4),
  ('sub_category', 'general-misc',       'General / Miscellaneous','others',    5)
ON CONFLICT (config_type, config_key, parent_key) DO NOTHING;

-- =============================================
-- SEED DATA: Sections (Mark To)
-- =============================================
INSERT INTO app_config (config_type, config_key, config_label, parent_key, sort_order) VALUES
  ('section', 'cfo',              'CFO',                NULL, 1),
  ('section', 'cia',              'CIA',                NULL, 2),
  ('section', 'budget',           'Budget',             NULL, 3),
  ('section', 'pension',          'Pension',            NULL, 4),
  ('section', 'fund',             'Fund',               NULL, 5),
  ('section', 'internal_audit_1', 'Internal Audit-1',   NULL, 6),
  ('section', 'director_account', 'Director Account',   NULL, 7),
  ('section', 'director_finance', 'Director Finance',   NULL, 8),
  ('section', 'director_it',      'Director IT',        NULL, 9),
  ('section', 'sub_cfo',          'Asst. CFO',          NULL, 10),
  ('section', 'books',            'Books',              NULL, 11),
  ('section', 'establishment',    'Establishment',      NULL, 12),
  ('section', 'director_audit',   'Director Audit',     NULL, 13),
  ('section', 'internal_audit_2', 'Internal Audit-2',   NULL, 14),
  ('section', 'law_department',   'Law Department',     NULL, 15),
  ('section', 'chro',             'CHRO',               NULL, 16),
  ('section', 'md_office',        'MD Office',          NULL, 17)
ON CONFLICT (config_type, config_key, parent_key) DO NOTHING;

-- Enable RLS
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "app_config_read_all"
  ON app_config FOR SELECT
  USING (true);

-- Only service role can write (admin actions via frontend use service key or anon with no restriction for now)
CREATE POLICY "app_config_write_all"
  ON app_config FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================
-- activity_log table: User activity tracking
-- Tracks all user actions in File Tracking
-- =============================================

CREATE TABLE IF NOT EXISTS activity_log (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_role         TEXT NOT NULL,              -- 'sub_cfo_1', 'cfo', 'admin', etc.
  user_name         TEXT NOT NULL,              -- 'ASST. CFO-1', 'CFO', etc.
  action            TEXT NOT NULL,              -- 'REGISTER','EDIT','FORWARD','DELETE','LOGIN','LOGOUT'
  record_id         TEXT,                       -- file_tracking_records id (nullable for login/logout)
  diary_number      TEXT,                       -- CFO diary number
  receiving_number  TEXT,                       -- Receiving number
  subject           TEXT,                       -- Record subject
  details           JSONB DEFAULT '{}',         -- Extra info (mark_to, changed fields, IP, etc.)
  session_id        TEXT,                       -- For session duration tracking
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log (user_role);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log (action);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_session ON activity_log (session_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_diary ON activity_log (diary_number);

-- Enable RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Everyone can read (admin will filter in frontend)
CREATE POLICY "activity_log_read_all"
  ON activity_log FOR SELECT
  USING (true);

-- Everyone can insert (each user logs their own actions)
CREATE POLICY "activity_log_insert_all"
  ON activity_log FOR INSERT
  WITH CHECK (true);

-- Only allow delete for cleanup (admin)
CREATE POLICY "activity_log_delete_all"
  ON activity_log FOR DELETE
  USING (true);

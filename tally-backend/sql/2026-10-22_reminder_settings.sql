/* =========================================================
   AUTOMATIC PAYMENT REMINDERS — per account / company settings:
   when reminders are due (before / after the due date) and whether the
   server emails them automatically or the team sends them manually.
   Hours are India time (IST).
========================================================= */
CREATE TABLE IF NOT EXISTS reminder_settings (
  admin_id     INTEGER NOT NULL,
  company_guid TEXT    NOT NULL,
  mode         TEXT    NOT NULL DEFAULT 'manual',
  timing       TEXT    NOT NULL DEFAULT 'before',
  before_days  INTEGER NOT NULL DEFAULT 3,
  after_days   INTEGER NOT NULL DEFAULT 1,
  repeat_days  INTEGER NOT NULL DEFAULT 0,
  send_hour    INTEGER NOT NULL DEFAULT 10,
  updated_by   INTEGER,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (admin_id, company_guid),
  CONSTRAINT reminder_settings_mode_check   CHECK (mode IN ('manual', 'automatic')),
  CONSTRAINT reminder_settings_timing_check CHECK (timing IN ('before', 'after', 'both'))
);

CREATE INDEX IF NOT EXISTS reminder_settings_auto_idx
  ON reminder_settings (mode, send_hour);

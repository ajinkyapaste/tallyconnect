/* =========================================================
   ATTENDANCE RULES — who must check in. The admin lists the positions
   that do not check in and gives each team member a position and an
   optional per-person rule ("auto", "required", "exempt").
   Only creates new tables; attendance_sessions is not changed.
========================================================= */
CREATE TABLE IF NOT EXISTS attendance_settings (
  admin_id         BIGINT        PRIMARY KEY,
  exempt_positions TEXT[]        NOT NULL DEFAULT '{}',
  updated_by       BIGINT,
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_members (
  admin_id    BIGINT       NOT NULL,
  user_id     BIGINT       NOT NULL,
  position    VARCHAR(40),
  rule        VARCHAR(10)  NOT NULL DEFAULT 'auto'
              CHECK (rule IN ('auto', 'required', 'exempt')),
  updated_by  BIGINT,
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (admin_id, user_id)
);

CREATE INDEX IF NOT EXISTS attendance_members_position_idx
  ON attendance_members (admin_id, position);

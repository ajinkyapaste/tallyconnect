const { Pool } = require('../tally-backend/node_modules/pg');
const pool = new Pool({
  connectionString: 'postgresql://tallyconnect_dqt8_user:4QIKalDfQph4L5BLChynL5w0t6PAEZ9i@dpg-db3ho66gekts73ergsp0-a.oregon-postgres.render.com/tallyconnect_dqt8',
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log("Creating leave management tables...");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS leave_settings (
        admin_id BIGINT PRIMARY KEY,
        enabled BOOLEAN NOT NULL DEFAULT false,
        year_start_month SMALLINT NOT NULL DEFAULT 4,
        weekly_off SMALLINT[] NOT NULL DEFAULT '{0}',
        half_day BOOLEAN NOT NULL DEFAULT true,
        backdate_days INT NOT NULL DEFAULT 7,
        max_request_days INT NOT NULL DEFAULT 30,
        updated_by BIGINT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS leave_types (
        id BIGSERIAL PRIMARY KEY,
        admin_id BIGINT NOT NULL,
        name VARCHAR(100) NOT NULL,
        yearly_quota NUMERIC(5, 1),
        paid BOOLEAN NOT NULL DEFAULT true,
        carry_forward BOOLEAN NOT NULL DEFAULT false,
        max_carry NUMERIC(5, 1),
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT uq_leave_types_admin_name UNIQUE (admin_id, name)
      );
      CREATE INDEX IF NOT EXISTS idx_leave_types_admin ON leave_types(admin_id);

      CREATE TABLE IF NOT EXISTS leave_holidays (
        id BIGSERIAL PRIMARY KEY,
        admin_id BIGINT NOT NULL,
        date DATE NOT NULL,
        name VARCHAR(100) NOT NULL,
        CONSTRAINT uq_leave_holidays_admin_date UNIQUE (admin_id, date)
      );
      CREATE INDEX IF NOT EXISTS idx_leave_holidays_range ON leave_holidays(admin_id, date);

      CREATE TABLE IF NOT EXISTS leave_requests (
        id BIGSERIAL PRIMARY KEY,
        admin_id BIGINT NOT NULL,
        user_id BIGINT NOT NULL,
        leave_type_id BIGINT NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
        from_date DATE NOT NULL,
        to_date DATE NOT NULL,
        half_day VARCHAR(20),
        days NUMERIC(5, 1) NOT NULL,
        reason TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        decided_by BIGINT,
        decided_at TIMESTAMPTZ,
        decision_note TEXT,
        idempotency_key VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS uq_leave_requests_user_key ON leave_requests(user_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_leave_requests_admin_user ON leave_requests(admin_id, user_id);
      CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(admin_id, from_date, to_date);
      CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(admin_id, status);
    `);

    console.log("Leave tables created successfully!");

    const r = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'leave%'");
    console.log("Verified tables in database:", r.rows.map(x => x.table_name));
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    pool.end();
  }
}

migrate();

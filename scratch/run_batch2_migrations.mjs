import pool from '../tally-backend/db.js';

async function migrate() {
  try {
    console.log('Running batch 2 migrations...');

    // 1. Multi-company indexes (non-transactional)
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_admin_company_guid ON orders (admin_id, company_guid, order_guid)`).catch(e => console.log('uq_orders:', e.message));
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_vbm_admin_company ON voucher_bill_map (admin_id, company_guid, voucher_guid, bill_ref)`).catch(e => console.log('uq_vbm:', e.message));

    // 2. Multi-company tables/columns
    await pool.query(`ALTER TABLE selected_companies ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT TRUE`);
    await pool.query(`ALTER TABLE selected_companies ADD COLUMN IF NOT EXISTS sync_order INT`);
    await pool.query(`ALTER TABLE selected_companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS company_sync_locks (
        admin_id BIGINT NOT NULL,
        company_guid VARCHAR(100) NOT NULL,
        agent_id VARCHAR(100) NOT NULL,
        acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        PRIMARY KEY (admin_id, company_guid)
      )
    `);
    await pool.query(`ALTER TABLE agent_status ADD COLUMN IF NOT EXISTS state VARCHAR(20)`);
    await pool.query(`ALTER TABLE agent_status ADD COLUMN IF NOT EXISTS step VARCHAR(60)`);
    await pool.query(`ALTER TABLE agent_status ADD COLUMN IF NOT EXISTS percent INT`);
    await pool.query(`ALTER TABLE agent_status ADD COLUMN IF NOT EXISTS last_error TEXT`);
    await pool.query(`ALTER TABLE agent_status ADD COLUMN IF NOT EXISTS agent_id VARCHAR(100)`);
    await pool.query(`ALTER TABLE agent_status ADD COLUMN IF NOT EXISTS progress_at TIMESTAMPTZ`);

    // 3. Cashflow indexes & Phase 2 tables
    await pool.query(`CREATE INDEX IF NOT EXISTS voucher_entries_cashflow_idx ON voucher_entries (admin_id, company_guid, ledger_name, voucher_date)`).catch(e => console.log('ve_cf_idx:', e.message));
    await pool.query(`CREATE INDEX IF NOT EXISTS bills_cashflow_idx ON bills (admin_id, company_guid)`).catch(e => console.log('b_cf_idx:', e.message));

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bill_settlements (
        admin_id BIGINT NOT NULL,
        company_guid VARCHAR(100) NOT NULL,
        voucher_guid VARCHAR(120) NOT NULL,
        voucher_date DATE NOT NULL,
        voucher_type VARCHAR(100),
        voucher_no VARCHAR(200),
        ledger_name VARCHAR(300) NOT NULL,
        bill_name VARCHAR(300) NOT NULL,
        ref_type VARCHAR(30) NOT NULL,
        amount NUMERIC(20,2) NOT NULL,
        credit_days INTEGER,
        synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (admin_id, company_guid, voucher_guid, ledger_name, bill_name, ref_type)
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS bill_settlements_date_idx ON bill_settlements (admin_id, company_guid, voucher_date)`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bill_balance_signs (
        admin_id BIGINT NOT NULL,
        company_guid VARCHAR(100) NOT NULL,
        bill_type VARCHAR(20) NOT NULL,
        ledger_name VARCHAR(300) NOT NULL,
        bill_name VARCHAR(300) NOT NULL,
        raw_amount NUMERIC(20,2) NOT NULL,
        synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (admin_id, company_guid, bill_type, ledger_name, bill_name)
      )
    `);

    // 4. Official Tally reports
    for (const tbl of ['tally_trial_balance', 'tally_profit_loss', 'tally_balance_sheet', 'tally_cash_flow']) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ${tbl} (
          admin_id BIGINT NOT NULL,
          company_guid VARCHAR(100) NOT NULL,
          period_from DATE NOT NULL,
          period_to DATE NOT NULL,
          rows JSONB NOT NULL,
          report_name VARCHAR(100),
          fetch_seconds NUMERIC(10,1),
          content_hash VARCHAR(64),
          fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (admin_id, company_guid, period_from, period_to)
        )
      `);
    }

    // 5. Cashflow flags on vouchers & voucher_entries
    await pool.query(`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS has_cash_flow BOOLEAN`);
    await pool.query(`ALTER TABLE voucher_entries ADD COLUMN IF NOT EXISTS gross_dr NUMERIC(18,2)`);
    await pool.query(`ALTER TABLE voucher_entries ADD COLUMN IF NOT EXISTS gross_cr NUMERIC(18,2)`);

    console.log('Batch 2 migrations finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrate();

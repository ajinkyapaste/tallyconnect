const { Pool } = require('../tally-backend/node_modules/pg');
require('../tally-backend/node_modules/dotenv').config({ path: 'd:/Prototype/tally-backend/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const counts = await pool.query(`
      SELECT 
        (SELECT count(*) FROM companies) as companies_count,
        (SELECT count(*) FROM ledgers) as ledgers_count,
        (SELECT count(*) FROM vouchers) as vouchers_count,
        (SELECT count(*) FROM voucher_entries) as voucher_entries_count,
        (SELECT count(*) FROM bills) as bills_count,
        (SELECT count(*) FROM stock_items) as stock_items_count,
        (SELECT count(*) FROM stock_summary) as stock_summary_count,
        (SELECT count(*) FROM sync_queue) as sync_queue_count,
        (SELECT count(*) FROM mobile_sync_queue) as mobile_sync_queue_count,
        (SELECT count(*) FROM agent_status) as agent_status_count
    `);
    console.log('=== TABLE COUNTS IN DB ===');
    console.table(counts.rows);

    const companies = await pool.query('SELECT admin_id, company_guid, name FROM companies LIMIT 10');
    console.log('=== COMPANIES ===');
    console.table(companies.rows);

    const activeComp = await pool.query('SELECT admin_id, company_guid FROM active_company LIMIT 10');
    console.log('=== ACTIVE COMPANY TABLE ===');
    console.table(activeComp.rows);

    const agentStat = await pool.query('SELECT admin_id, company_guid, last_sync_at, sync_in_progress FROM agent_status LIMIT 10');
    console.log('=== AGENT STATUS TABLE ===');
    console.table(agentStat.rows);

    const sampleVouchers = await pool.query('SELECT voucher_guid, company_guid, voucher_type, voucher_date, net_amount, party_name, is_active FROM vouchers ORDER BY voucher_date DESC LIMIT 5');
    console.log('=== LATEST VOUCHERS ===');
    console.table(sampleVouchers.rows);

    const sampleLedgers = await pool.query('SELECT ledger_guid, company_guid, name, parent_group, opening_balance, closing_balance, type FROM ledgers LIMIT 5');
    console.log('=== SAMPLE LEDGERS ===');
    console.table(sampleLedgers.rows);

    const sampleBills = await pool.query('SELECT bill_name, ledger_name, bill_amount, pending_amount, due_date, bill_type, status FROM bills LIMIT 5');
    console.log('=== SAMPLE BILLS ===');
    console.table(sampleBills.rows);

    const queueItems = await pool.query('SELECT id, entity_type, operation, status, created_at FROM sync_queue ORDER BY created_at DESC LIMIT 5');
    console.log('=== SYNC QUEUE SAMPLE ===');
    console.table(queueItems.rows);

    const mobileQueue = await pool.query('SELECT id, voucher_type, status, created_at, processed_at FROM mobile_sync_queue ORDER BY created_at DESC LIMIT 5');
    console.log('=== MOBILE SYNC QUEUE SAMPLE ===');
    console.table(mobileQueue.rows);

    await pool.end();
  } catch (err) {
    console.error('DB Check error:', err.message);
  }
}

check();

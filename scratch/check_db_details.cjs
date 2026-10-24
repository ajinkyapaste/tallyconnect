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
        (SELECT count(*) FROM companies) as companies,
        (SELECT count(*) FROM ledgers) as ledgers,
        (SELECT count(*) FROM vouchers) as vouchers,
        (SELECT count(*) FROM voucher_entries) as voucher_entries,
        (SELECT count(*) FROM bills) as bills,
        (SELECT count(*) FROM stock_items) as stock_items,
        (SELECT count(*) FROM stock_summary) as stock_summary,
        (SELECT count(*) FROM sync_queue) as sync_queue,
        (SELECT count(*) FROM mobile_sync_queue) as mobile_sync_queue,
        (SELECT count(*) FROM agent_status) as agent_status
    `);
    console.log('TABLE COUNTS:');
    console.log(JSON.stringify(counts.rows[0], null, 2));

    const companies = await pool.query('SELECT admin_id, company_guid, name FROM companies');
    console.log('COMPANIES:');
    console.log(JSON.stringify(companies.rows, null, 2));

    const agentStat = await pool.query('SELECT * FROM agent_status');
    console.log('AGENT STATUS:');
    console.log(JSON.stringify(agentStat.rows, null, 2));

    const mobCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'mobile_sync_queue'
    `);
    console.log('MOBILE_SYNC_QUEUE COLUMNS:');
    console.log(mobCols.rows.map(c => c.column_name).join(', '));

    const mobileSample = await pool.query('SELECT * FROM mobile_sync_queue LIMIT 5');
    console.log('MOBILE SAMPLE:');
    console.log(JSON.stringify(mobileSample.rows, null, 2));

    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}
check();

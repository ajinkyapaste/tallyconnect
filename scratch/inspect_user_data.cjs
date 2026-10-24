const { Pool } = require('../tally-backend/node_modules/pg');
require('../tally-backend/node_modules/dotenv').config({ path: 'd:/Prototype/tally-backend/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function inspectUserData() {
  const users = await pool.query('SELECT id, admin_id, username, email, role FROM users');
  for (const u of users.rows) {
    console.log(`\n================ USER: ${u.email} (${u.role}, admin_id: ${u.admin_id}) ================`);
    
    // Companies owned or active
    const comps = await pool.query('SELECT * FROM companies WHERE admin_id = $1', [u.admin_id]);
    console.log(`Companies owned (admin_id=${u.admin_id}):`, comps.rows.map(c => `${c.name} (${c.company_guid})`));

    const activeC = await pool.query('SELECT * FROM active_company WHERE admin_id = $1', [u.admin_id]);
    console.log(`Active company:`, activeC.rows);

    const ledgers = await pool.query('SELECT count(*), company_guid FROM ledgers WHERE admin_id = $1 GROUP BY company_guid', [u.admin_id]);
    console.log(`Ledgers count:`, ledgers.rows);

    const vouchers = await pool.query('SELECT count(*), company_guid FROM vouchers WHERE admin_id = $1 GROUP BY company_guid', [u.admin_id]);
    console.log(`Vouchers count:`, vouchers.rows);

    const bills = await pool.query('SELECT count(*), company_guid FROM bills WHERE admin_id = $1 GROUP BY company_guid', [u.admin_id]);
    console.log(`Bills count:`, bills.rows);

    const agentStat = await pool.query('SELECT * FROM agent_status WHERE admin_id = $1', [u.admin_id]);
    console.log(`Agent status:`, agentStat.rows);

    const syncQ = await pool.query('SELECT count(*), entity_type, status FROM sync_queue WHERE company_guid IN (SELECT company_guid FROM companies WHERE admin_id = $1) GROUP BY entity_type, status', [u.admin_id]);
    console.log(`Sync queue for user companies:`, syncQ.rows);
  }

  // Also let's check ALL sync_queue rows regardless of company
  console.log('\n================ ALL SYNC_QUEUE ROWS ================');
  const allQ = await pool.query('SELECT id, entity_type, entity_guid, company_guid, operation, status, created_at FROM sync_queue ORDER BY id DESC');
  console.table(allQ.rows);

  await pool.end();
}

inspectUserData();

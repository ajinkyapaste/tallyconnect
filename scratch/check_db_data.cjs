const { Pool } = require('../tally-backend/node_modules/pg');
require('../tally-backend/node_modules/dotenv').config({ path: 'd:/Prototype/tally-backend/.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function check() {
  const v = await pool.query("SELECT id, voucher_guid, voucher_type, voucher_date, ledger_name, amount, is_debit FROM voucher_entries WHERE company_guid = 'DEMO-COMPANY-001'");
  console.table(v.rows);
  await pool.end();
}
check().catch(console.error);

const { Pool } = require('../tally-backend/node_modules/pg');
require('../tally-backend/node_modules/dotenv').config({ path: 'd:/Prototype/tally-backend/.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const v = await pool.query(`
    SELECT voucher_type, voucher_date, amount, is_debit, ledger_name 
    FROM voucher_entries 
    WHERE company_guid = 'DEMO-COMPANY-001'
    ORDER BY voucher_date ASC
  `);
  console.table(v.rows);

  const l = await pool.query(`
    SELECT name, parent_group, closing_balance, opening_balance 
    FROM ledgers 
    WHERE company_guid = 'DEMO-COMPANY-001'
  `);
  console.table(l.rows);

  await pool.end();
}

run();

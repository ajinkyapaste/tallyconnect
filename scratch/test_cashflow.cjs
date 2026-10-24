const { Pool } = require('../tally-backend/node_modules/pg');
require('../tally-backend/node_modules/dotenv').config({ path: 'd:/Prototype/tally-backend/.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const { createCashflowRouter } = require('../tally-backend/utils/cashflowRouter.js');

async function testCashflow() {
  // Let's check bills in DB
  const bills = await pool.query("SELECT * FROM bills");
  console.log('Total bills in DB:', bills.rows.length);
  console.log('Sample bill:', bills.rows[0]);

  // Let's check voucher_entries in DB
  const ve = await pool.query("SELECT * FROM voucher_entries LIMIT 5");
  console.log('Sample voucher_entries:', ve.rows);

  await pool.end();
}

testCashflow().catch(console.error);

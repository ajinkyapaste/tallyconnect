import dotenv from 'dotenv';
dotenv.config();
import pool from './tally-backend/db.js';

async function test() {
  try {
    const v = await pool.query(`SELECT voucher_guid, voucher_type, party_name, net_amount, voucher_date, reference_no FROM vouchers`);
    console.log('VOUCHERS count:', v.rows.length);
    console.log('VOUCHERS:', v.rows);

    const s = await pool.query(`SELECT * FROM stock_summary`);
    console.log('STOCK SUMMARY count:', s.rows.length);
    console.log('STOCK SUMMARY:', s.rows);

    const o = await pool.query(`SELECT * FROM orders`);
    console.log('ORDERS count:', o.rows.length);
    console.log('ORDERS:', o.rows);

    const li = await pool.query(`SELECT * FROM ledger_items`);
    console.log('LEDGER ITEMS count:', li.rows.length);
    console.log('LEDGER ITEMS:', li.rows);
  } catch(e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
test();

import pool from '../tally-backend/db.js';

async function main() {
  const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
  console.log('TABLES IN DB:', res.rows.map(x => x.table_name));

  // Count rows in key tables
  const tablesToCount = [
    'companies', 'ledgers', 'voucher_entries', 'bills', 'orders',
    'stock_items', 'stock_summary', 'sync_queue', 'sync_logs',
    'agent_status', 'agent_info', 'mobile_sync_queue', 'users',
    'attendance_sessions'
  ];

  for (const t of tablesToCount) {
    try {
      const c = await pool.query(`SELECT COUNT(*) FROM ${t}`);
      console.log(`- ${t}: ${c.rows[0].count} rows`);
    } catch (e) {
      console.log(`- ${t}: error (${e.message})`);
    }
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

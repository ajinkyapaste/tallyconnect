const { Pool } = require('../tally-backend/node_modules/pg');
require('../tally-backend/node_modules/dotenv').config({ path: 'd:/Prototype/tally-backend/.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function check() {
  const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND (table_name LIKE 'fin%' OR table_name LIKE 'bill%' OR table_name LIKE 'tally%')");
  console.log('Tables:', tables.rows.map(r => r.table_name));
  for (const t of tables.rows) {
    try {
      const cnt = await pool.query('SELECT count(*) FROM ' + t.table_name);
      console.log(t.table_name, 'count:', cnt.rows[0].count);
    } catch(e) {
      console.log(t.table_name, 'error:', e.message);
    }
  }

  // Also check financial access and periods
  const users = await pool.query('SELECT id, admin_id, email, role FROM users LIMIT 5');
  console.log('Users:', users.rows);

  await pool.end();
}
check().catch(console.error);

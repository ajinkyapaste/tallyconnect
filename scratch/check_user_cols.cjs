const { Pool } = require('../tally-backend/node_modules/pg');
require('../tally-backend/node_modules/dotenv').config({ path: 'd:/Prototype/tally-backend/.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const r = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
  console.log('User columns:', r.rows.map(x => x.column_name).join(', '));
  await pool.end();
}
run();

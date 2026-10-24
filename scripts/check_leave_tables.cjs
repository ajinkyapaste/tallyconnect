const { Pool } = require('../tally-backend/node_modules/pg');
const pool = new Pool({
  connectionString: 'postgresql://tallyconnect_dqt8_user:4QIKalDfQph4L5BLChynL5w0t6PAEZ9i@dpg-db3ho66gekts73ergsp0-a.oregon-postgres.render.com/tallyconnect_dqt8',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const r = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='attendance_sessions'");
    console.log('attendance_sessions cols:', r.rows);
    const u = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users'");
    console.log('users cols:', u.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
main();

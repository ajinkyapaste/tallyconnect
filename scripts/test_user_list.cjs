const pool = require('../tally-backend/db.js').default || require('../tally-backend/db.js');

async function main() {
  const res = await pool.query('SELECT id, username, email, role, admin_id, password FROM users');
  console.log('USERS IN DB:', res.rows);
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

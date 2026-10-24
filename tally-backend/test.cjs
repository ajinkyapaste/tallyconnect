const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://tallyconnect_dqt8_user:4QIKalDfQph4L5BLChynL5w0t6PAEZ9i@dpg-db3ho66gekts73ergsp0-a.oregon-postgres.render.com/tallyconnect_dqt8',
  ssl: { rejectUnauthorized: false }
});

pool.query("SELECT * FROM voucher_entries WHERE voucher_guid LIKE '%11984989%' LIMIT 5").then(res => {
  console.log(res.rows);
  pool.end();
});

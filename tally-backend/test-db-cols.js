import pool from "./db.js";

async function run() {
  try {
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
    console.log("Columns of users table:", res.rows.map(r => r.column_name));
  } catch (err) {
    console.error("DB error:", err.message);
  } finally {
    pool.end();
  }
}
run();

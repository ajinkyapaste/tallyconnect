// Read-only connectivity + inventory inspection of the Render PostgreSQL DB.
// Usage: node scripts/db-inspect.mjs
import { makePool, maskUrl, ENV_FILE } from "./_shared.mjs";
import { loadEnv } from "./_shared.mjs";

loadEnv();
const pool = makePool();

try {
  console.log("ENV file  :", ENV_FILE);
  console.log("Target    :", maskUrl(process.env.DATABASE_URL));
  const now = await pool.query("SELECT NOW()");
  console.log("CONNECTED:", now.rows[0].now);
  const ver = await pool.query("SELECT version()");
  console.log("SERVER   :", ver.rows[0].version);

  const t = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
  );
  console.log(`\nTABLES (${t.rowCount}):`);
  console.log(t.rows.map((r) => r.table_name).join(", "));

  const counts = await pool.query(`
    SELECT relname AS table, n_live_tup AS approx_rows
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY n_live_tup DESC
  `);
  console.log("\nROW COUNTS (approx):");
  for (const r of counts.rows) console.log(`  ${r.table}: ${r.approx_rows}`);
} catch (e) {
  console.error("CONNECT FAIL:", e.message);
  process.exitCode = 1;
}

await pool.end();

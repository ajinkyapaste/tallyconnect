/**
 * setup-db.mjs
 * ------------
 * Creates the ERD structure (erd/tallyconnect_erd.sql — pgAdmin export, the
 * source of truth) in the Render PostgreSQL database from DATABASE_URL.
 *
 * SAFETY RULES (enforced below):
 *  - Only runs the ERD script, statement by statement.
 *  - Refuses ANY statement containing DROP / TRUNCATE / DELETE.
 *  - Relies on the ERD's own `IF NOT EXISTS`; if an object already exists the
 *    error is classed as "already existed" and skipped.
 *  - Never alters or removes existing tables or data.
 *
 * Usage: node scripts/setup-db.mjs
 */
import { readFileSync } from "node:fs";
import { makePool, maskUrl, ERD_FILE, ENV_FILE, loadEnv } from "./_shared.mjs";

loadEnv();
const pool = makePool();

// Errors that mean "object already exists" -> safe to continue (no drops).
const BENIGN_CODES = new Set([
  "42710", // duplicate_object  (constraint/index already exists)
  "42P07", // duplicate_table
  "42701", // duplicate_column
  "42P06", // duplicate_schema
  "23505", // unique_violation  (idempotent seed)
]);

const FORBIDDEN = /\b(DROP|TRUNCATE|DELETE\s+FROM|VACUUM\s+FULL)\b/i;

function splitStatements(sql) {
  const out = [];
  let current = "";
  let inSingle = false;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "'") inSingle = !inSingle;
    if (ch === ";" && !inSingle) {
      const stmt = current.trim();
      if (stmt) out.push(stmt);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

async function main() {
  const sql = readFileSync(ERD_FILE, "utf8");
  const raw = splitStatements(sql);

  // Strip transaction wrapper + comment lines; run each DDL statement in
  // autocommit so nothing can be left dangling in an open transaction.
  const statements = raw
    .map((s) =>
      s
        .split("\n")
        .filter((line) => !/^\s*--/.test(line))
        .join("\n")
        .trim()
    )
    .filter((s) => s.length > 0)
    .filter((s) => !/^(BEGIN|END|COMMIT|ROLLBACK)$/i.test(s));

  // ---- SAFETY GATE -------------------------------------------------------
  const forbidden = statements.filter((s) => FORBIDDEN.test(s));
  if (forbidden.length) {
    console.error("❌ Refusing to run: destructive statements found in ERD script:");
    forbidden.forEach((s) => console.error("   " + s.slice(0, 120)));
    process.exit(1);
  }

  console.log(`ERD file : ${ERD_FILE}`);
  console.log(`Target   : ${maskUrl(process.env.DATABASE_URL)}\n`);

  let created = 0,
    existed = 0,
    failed = 0;
  const failures = [];

  for (const stmt of statements) {
    const head = stmt.split("\n")[0].slice(0, 90);
    try {
      await pool.query(stmt);
      created++;
      console.log(`  OK   ${head}`);
    } catch (err) {
      if (BENIGN_CODES.has(err.code)) {
        existed++;
        console.log(`  SKIP ${head}  [${err.code}: already exists]`);
      } else {
        failed++;
        failures.push({ stmt: head, code: err.code, message: err.message });
        console.log(`  FAIL ${head}\n       ${err.code}: ${err.message}`);
      }
    }
  }

  console.log(`\nDONE. applied=${created} already-existed=${existed} failed=${failed}`);
  if (failures.length) {
    console.log("\nFailures:");
    for (const f of failures) console.log(` - ${f.stmt}\n   ${f.code}: ${f.message}`);
    process.exitCode = 1;
  }

  await pool.end();
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});

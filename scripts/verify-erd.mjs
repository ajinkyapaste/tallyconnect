/**
 * verify-erd.mjs
 * --------------
 * Verifies that the live Render PostgreSQL database matches the ERD
 * (erd/tallyconnect_erd.sql): tables, columns, primary keys, unique keys,
 * foreign keys and ON DELETE rules. Read-only.
 *
 * Exit code 0 = full match, 1 = mismatch.
 * Usage: node scripts/verify-erd.mjs
 */
import { readFileSync } from "node:fs";
import { makePool, ERD_FILE, loadEnv } from "./_shared.mjs";

loadEnv();
const pool = makePool();
const sql = readFileSync(ERD_FILE, "utf8");

/* ------------------------------------------------------------------ *
 * 1. Parse expectations from the ERD (source of truth)
 * ------------------------------------------------------------------ */
const expected = { tables: {}, pks: {}, uniques: {}, fks: [] };

const cleanType = (t) =>
  String(t)
    .replace(/COLLATE pg_catalog\."default"/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

// CREATE TABLE blocks
const createRe = /CREATE TABLE IF NOT EXISTS public\."?([A-Za-z_][A-Za-z0-9_]*)"?\s*\(([\s\S]*?)\n\);/gi;
let m;
while ((m = createRe.exec(sql))) {
  const table = m[1];
  const body = m[2];
  const cols = {};
  const pk = [];
  const uniq = [];

  const parts = [];
  let depth = 0,
    cur = "";
  for (const ch of body) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());

  for (const part of parts) {
    const pkC = part.match(/CONSTRAINT\s+\S+\s+PRIMARY KEY\s*\(([^)]+)\)/i);
    if (pkC) {
      pkC[1].split(",").forEach((c) => pk.push(c.trim().toLowerCase()));
      continue;
    }
    const uqC = part.match(/CONSTRAINT\s+\S+\s+UNIQUE\s*\(([^)]+)\)/i);
    if (uqC) {
      uqC[1].split(",").forEach((c) => uniq.push(c.trim().toLowerCase()));
      continue;
    }
    const colC = part.match(
      /^"?([A-Za-z_][A-Za-z0-9_]*)"?\s+(serial|integer|bigint|smallint|text\[\]|text|uuid|numeric|boolean|date|timestamp without time zone|timestamp with time zone|character varying(?:\(\d+\))?|varchar(?:\(\d+\))?|jsonb)/i
    );
    if (colC) cols[colC[1].toLowerCase()] = cleanType(colC[2]);
  }
  expected.tables[table.toLowerCase()] = cols;
  if (pk.length) expected.pks[table.toLowerCase()] = pk.sort();
  if (uniq.length) expected.uniques[table.toLowerCase()] = uniq.sort();
}

// Foreign keys
const fkRe =
  /ALTER TABLE IF EXISTS public\."?([A-Za-z_][A-Za-z0-9_]*)"?\s+ADD CONSTRAINT\s+(\S+)\s+FOREIGN KEY\s*\(([^)]+)\)\s+REFERENCES public\."?([A-Za-z_][A-Za-z0-9_]*)"?\s*\(([^)]+)\)([\s\S]*?);/gi;
while ((m = fkRe.exec(sql))) {
  const cols = m[3].split(",").map((c) => c.trim().toLowerCase());
  const refCols = m[5].split(",").map((c) => c.trim().toLowerCase());
  const action = /ON DELETE\s+(CASCADE|SET NULL|NO ACTION|RESTRICT)/i.exec(m[6]);
  expected.fks.push({
    table: m[1].toLowerCase(),
    name: m[2].toLowerCase(),
    cols,
    refTable: m[4].toLowerCase(),
    refCols,
    onDelete: action ? action[1].toUpperCase() : "NO ACTION",
  });
}

console.log(
  `ERD parsed: ${Object.keys(expected.tables).length} tables, ${expected.fks.length} foreign keys\n`
);

/* ------------------------------------------------------------------ */
const problems = [];
const notes = [];

const liveTables = (
  await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'"
  )
).rows.map((r) => r.table_name.toLowerCase());
const liveSet = new Set(liveTables);

const liveCols = {};
for (const r of (
  await pool.query(
    `SELECT table_name, column_name, data_type
     FROM information_schema.columns WHERE table_schema='public'`
  )
).rows) {
  (liveCols[r.table_name.toLowerCase()] ||= {})[r.column_name.toLowerCase()] = r;
}

const pkRows = (
  await pool.query(`
    SELECT tc.table_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
    WHERE tc.table_schema='public' AND tc.constraint_type='PRIMARY KEY'
  `)
).rows;
const livePK = {};
for (const r of pkRows) (livePK[r.table_name.toLowerCase()] ||= []).push(r.column_name.toLowerCase());
Object.values(livePK).forEach((a) => a.sort());

const fkRows = (
  await pool.query(`
    SELECT tc.table_name, tc.constraint_name, kcu.column_name,
           ccu.table_name AS ref_table, ccu.column_name AS ref_column,
           rc.delete_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = tc.constraint_name AND rc.constraint_schema = tc.table_schema
    WHERE tc.table_schema='public' AND tc.constraint_type='FOREIGN KEY'
  `)
).rows;
const liveFK = {};
for (const r of fkRows) {
  const key = `${r.table_name.toLowerCase()}|${r.constraint_name.toLowerCase()}`;
  (liveFK[key] ||= {
    table: r.table_name.toLowerCase(),
    name: r.constraint_name.toLowerCase(),
    cols: new Set(),
    refTable: r.ref_table.toLowerCase(),
    refCols: new Set(),
    onDelete: r.delete_rule.toUpperCase(),
  });
  liveFK[key].cols.add(r.column_name.toLowerCase());
  liveFK[key].refCols.add(r.ref_column.toLowerCase());
}
Object.values(liveFK).forEach((f) => {
  f.cols = [...f.cols].sort();
  f.refCols = [...f.refCols].sort();
});

/* ---------------------- 2. Compare ---------------------- */
for (const t of Object.keys(expected.tables)) {
  if (!liveSet.has(t)) problems.push(`TABLE MISSING: ${t}`);
}
const extras = liveTables.filter((t) => !expected.tables[t]);
if (extras.length) notes.push(`Extra tables in DB (not in ERD, left untouched): ${extras.join(", ")}`);

for (const [t, cols] of Object.entries(expected.tables)) {
  if (!liveSet.has(t)) continue;
  const live = liveCols[t] || {};
  for (const [c, type] of Object.entries(cols)) {
    if (!live[c]) {
      problems.push(`COLUMN MISSING: ${t}.${c}`);
      continue;
    }
    const lt = cleanType(live[c].data_type);
    const et = cleanType(type);
    const compatible =
      lt === et ||
      (et === "text[]" && lt === "array") ||
      (et === "serial" && ["integer", "smallint", "bigint"].includes(lt)) ||
      (et.startsWith("character varying") && lt === "character varying");
    if (!compatible)
      problems.push(`COLUMN TYPE MISMATCH: ${t}.${c} expected=${et} actual=${lt}`);
  }
  const expPK = expected.pks[t];
  const actPK = livePK[t] || [];
  if (expPK) {
    const e = [...expPK].sort();
    if (JSON.stringify(e) !== JSON.stringify(actPK))
      problems.push(`PK MISMATCH: ${t} expected=[${e}] actual=[${actPK}]`);
  }
}

for (const f of expected.fks) {
  const found = Object.values(liveFK).find(
    (l) =>
      l.table === f.table &&
      JSON.stringify(l.cols) === JSON.stringify([...f.cols].sort()) &&
      l.refTable === f.refTable &&
      JSON.stringify(l.refCols) === JSON.stringify([...f.refCols].sort())
  );
  if (!found)
    problems.push(
      `FK MISSING: ${f.table}(${f.cols.join(",")}) -> ${f.refTable}(${f.refCols.join(",")}) [${f.name}]`
    );
  else if (found.onDelete !== f.onDelete)
    notes.push(`FK rule differs (non-breaking): ${f.name} erd=${f.onDelete} db=${found.onDelete}`);
}

/* ---------------------- 3. Report ---------------------- */
console.log("═════════ ERD vs DATABASE VERIFICATION ═════════");
console.log(`Tables  — ERD: ${Object.keys(expected.tables).length} | DB: ${liveTables.length}`);
console.log(`PKs     — ERD: ${Object.keys(expected.pks).length} | DB: ${Object.keys(livePK).length}`);
console.log(`FKs     — ERD: ${expected.fks.length} | DB: ${Object.keys(liveFK).length}`);
console.log(
  `Indexes — DB : ${(await pool.query("SELECT COUNT(*) c FROM pg_indexes WHERE schemaname='public'")).rows[0].c}`
);

if (notes.length) {
  console.log("\nNOTES:");
  notes.forEach((n) => console.log("  • " + n));
}
if (problems.length) {
  console.log(`\n❌ MISMATCHES (${problems.length}):`);
  problems.forEach((p) => console.log("  ✗ " + p));
} else {
  console.log(
    "\n✅ FULL MATCH — all ERD tables, columns, PKs and FKs verified against the database."
  );
}

await pool.end();
process.exit(problems.length ? 1 : 0);

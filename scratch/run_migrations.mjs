import fs from 'fs';
import path from 'path';
import pool from '../tally-backend/db.js';

const sqlFiles = [
  'd:/Prototype/Tallyconnect_flutter-main (1)/Tallyconnect_flutter-main/backend_patches/feedback/sql/2026-10-12_feedback.sql',
  'd:/Prototype/Tallyconnect_flutter-main (1)/Tallyconnect_flutter-main/backend_patches/reminders/sql/2026-10-12_reminders.sql',
  'd:/Prototype/Tallyconnect_flutter-main (1)/Tallyconnect_flutter-main/backend_patches/financial/sql/2026-10-13_financial_reports.sql',
  'd:/Prototype/Tallyconnect_flutter-main (1)/Tallyconnect_flutter-main/backend_patches/financial/sql/2026-10-14_financial_anchor.sql',
  'd:/Prototype/Tallyconnect_flutter-main (1)/Tallyconnect_flutter-main/backend_patches/assistant/sql/2026-10-14_ai_usage.sql'
];

async function runClean() {
  for (const f of sqlFiles) {
    console.log(`Executing ${path.basename(f)}...`);
    let raw = fs.readFileSync(f, 'utf8');
    // Strip comments
    let lines = raw.split('\n').map(l => {
      const idx = l.indexOf('--');
      return idx >= 0 ? l.slice(0, idx) : l;
    });
    let clean = lines.join('\n')
      .replace(/CREATE INDEX CONCURRENTLY/gi, 'CREATE INDEX');

    const client = await pool.connect();
    try {
      await client.query(clean);
      console.log(`✓ ${path.basename(f)} executed cleanly`);
    } catch (e) {
      console.error(`✗ Error on ${path.basename(f)}:`, e.message);
    } finally {
      client.release();
    }
  }

  // Check created tables
  const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  console.log('Current public tables:', res.rows.map(r => r.table_name).sort());
  process.exit(0);
}

runClean().catch(e => {
  console.error(e);
  process.exit(1);
});

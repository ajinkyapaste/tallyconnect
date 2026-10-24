const { Pool } = require('d:/Prototype/tally-backend/node_modules/pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:crm%40123@localhost:5433/Tally12' });

async function check() {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
    console.log('Tables:', res.rows.map(x => x.table_name));

    // Check if profit_loss table has rows
    const plRes = await pool.query("SELECT * FROM profit_loss LIMIT 5").catch(e => ({ rows: [] }));
    console.log('profit_loss sample:', plRes.rows);

    // Check companies
    const comp = await pool.query("SELECT guid, name FROM companies LIMIT 5").catch(e => ({ rows: [] }));
    console.log('Companies:', comp.rows);

    // Check ledgers groups/parent
    const grps = await pool.query("SELECT DISTINCT parent, parent_group FROM ledgers LIMIT 20").catch(e => ({ rows: [] }));
    console.log('Ledger parents/groups:', grps.rows);

    // Check vouchers types
    const vTypes = await pool.query("SELECT DISTINCT voucher_type, COUNT(*) FROM voucher_entries GROUP BY voucher_type").catch(e => ({ rows: [] }));
    console.log('Voucher types:', vTypes.rows);

  } catch (err) {
    console.error('DB error:', err);
  } finally {
    await pool.end();
  }
}

check();

const { Pool } = require('../tally-backend/node_modules/pg');
require('../tally-backend/node_modules/dotenv').config({ path: 'd:/Prototype/tally-backend/.env' });
const { todayIst } = require('../tally-backend/utils/cashflowRouter.js');
const { createFinancialData } = require('../tally-backend/utils/financialData.js');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const adminId = 1;
    const companyGuid = 'DEMO-COMPANY-001';
    console.log('Testing for adminId:', adminId, 'companyGuid:', companyGuid);

    const finData = createFinancialData(pool);
    const s = { adminId, company: companyGuid };
    const today = todayIst();
    console.log('Today:', today);

    const ctx = await finData.context(s);
    console.log('Context groups count:', ctx.groups.length, 'anchors count:', ctx.anchors.length);
    const dates = await finData.offeredDates(ctx);
    console.log('Offered dates:', dates);

    const basedOn = dates.filter(x => x.as_on <= today)[0]?.as_on;
    console.log('basedOn:', basedOn);
    if (basedOn) {
      const snap = await finData.snapshotAt(s, ctx, basedOn);
      console.log('Snapshot ledgers count:', snap?.ledgers?.length);
      console.log('Sample ledgers:', snap?.ledgers?.slice(0, 5));
    }

    const bills = await pool.query(
      `SELECT ledger_name, bill_name, due_date, pending_amount, bill_type
         FROM bills
        WHERE admin_id = $1 AND company_guid = $2 AND pending_amount > 0`,
      [adminId, companyGuid]
    );
    console.log('Bills count:', bills.rowCount, 'Sample:', bills.rows.slice(0, 3));

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await pool.end();
  }
}

run();

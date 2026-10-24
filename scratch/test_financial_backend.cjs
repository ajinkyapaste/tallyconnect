const { Pool } = require('../tally-backend/node_modules/pg');
require('../tally-backend/node_modules/dotenv').config({ path: 'd:/Prototype/tally-backend/.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const { createFinancialData } = require('../tally-backend/utils/financialData.js');
const { createCashflowRouter } = require('../tally-backend/utils/cashflowRouter.js');
const { profitLoss, balanceSheet, trialBalance, expenseReport } = require('../tally-backend/utils/financialCore.js');

async function test() {
  const finData = createFinancialData(pool);
  
  // Test for admin 1 (DEMO-COMPANY-001)
  const scope1 = { adminId: 1, company: 'DEMO-COMPANY-001', companyName: 'TallyConnect Demo Co', isAdmin: true };
  console.log('Testing scope 1...');
  try {
    const ctx1 = await finData.context(scope1);
    console.log('Context 1 groups:', ctx1.groups.length, 'anchors:', ctx1.anchors.length, 'masters:', ctx1.masters.length);
    const ready1 = ctx1.groups.length > 0 && ctx1.anchors.length > 0;
    console.log('Ready 1:', ready1);
    if (ready1) {
      const dates = await finData.offeredDates(ctx1);
      console.log('Offered dates:', dates);
    } else {
      const reason = await finData.missingReason(ctx1);
      console.log('Missing reason:', reason);
    }
  } catch(e) {
    console.error('Scope 1 error:', e.message);
  }

  // Test for admin 3 (2323)
  const scope3 = { adminId: 3, company: '2323', companyName: 'tallyconnect', isAdmin: true };
  console.log('\nTesting scope 3...');
  try {
    const ctx3 = await finData.context(scope3);
    console.log('Context 3 groups:', ctx3.groups.length, 'anchors:', ctx3.anchors.length, 'masters:', ctx3.masters.length);
    const ready3 = ctx3.groups.length > 0 && ctx3.anchors.length > 0;
    console.log('Ready 3:', ready3);
    if (ready3) {
      const dates = await finData.offeredDates(ctx3);
      console.log('Offered dates:', dates);
    } else {
      const reason = await finData.missingReason(ctx3);
      console.log('Missing reason:', reason);
    }
  } catch(e) {
    console.error('Scope 3 error:', e.message);
  }

  await pool.end();
}

test().catch(console.error);

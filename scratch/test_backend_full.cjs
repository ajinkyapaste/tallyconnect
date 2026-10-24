const { Pool } = require('../tally-backend/node_modules/pg');
require('../tally-backend/node_modules/dotenv').config({ path: 'd:/Prototype/tally-backend/.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const { createFinancialData } = require('../tally-backend/utils/financialData.js');

async function testEnhancement() {
  const finData = createFinancialData(pool);
  const s = { adminId: 1, company: 'DEMO-COMPANY-001', companyName: 'TallyConnect Demo Co', isAdmin: true };
  const ctx = await finData.context(s);
  console.log('Original context: groups:', ctx.groups.length, 'anchors:', ctx.anchors.length);
  
  await pool.end();
}

testEnhancement().catch(console.error);

const { Pool } = require('../tally-backend/node_modules/pg');
require('../tally-backend/node_modules/dotenv').config({ path: 'd:/Prototype/tally-backend/.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const { createFinancialData } = require('../tally-backend/utils/financialData.js');
const { createCashflowRouter } = require('../tally-backend/utils/cashflowRouter.js');

async function testForecastRoute() {
  const finData = createFinancialData(pool);
  
  // Fake auth middleware
  const auth = (req, res, next) => {
    req.user = { id: 1, adminId: 1, role: 'ADMIN' };
    next();
  };
  
  const router = createCashflowRouter({ db: pool, auth, financialData: finData });
  
  // Let's inspect the router stack
  console.log('Router routes:', router.stack.map(layer => layer.route?.path).filter(Boolean));

  // Let's call the forecast handler directly by mocking req, res
  const req = {
    user: { id: 1, adminId: 1, role: 'ADMIN' },
    query: { weeks: 13, mode: 'adjusted', doubtful: 0 }
  };
  
  let result = null;
  const res = {
    json: (data) => { result = data; return res; },
    status: (code) => { console.log('HTTP status:', code); return res; }
  };

  const forecastLayer = router.stack.find(l => l.route?.path === '/api/cashflow/forecast');
  if (forecastLayer) {
    const handler = forecastLayer.route.stack[forecastLayer.route.stack.length - 1].handle;
    await handler(req, res);
    console.log('Forecast result success:', result?.success);
    if (result?.data) {
      console.log('Company:', result.data.company);
      console.log('Weeks count:', result.data.weeks?.length);
      console.log('Totals:', result.data.totals);
      console.log('Opening:', result.data.opening);
    } else {
      console.log('Error/message:', result);
    }
  }

  await pool.end();
}

testForecastRoute().catch(console.error);

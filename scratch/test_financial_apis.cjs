const jwt = require('../tally-backend/node_modules/jsonwebtoken');
require('../tally-backend/node_modules/dotenv').config({ path: 'd:/Prototype/tally-backend/.env' });

const token = jwt.sign(
  { id: 1, admin_id: 1, role: 'admin', username: 'admin' },
  process.env.JWT_SECRET || 'secret'
);

async function testEndpoints() {
  const from = '2026-04-01';
  const to = '2026-10-23';
  const endpoints = [
    '/api/financial/periods',
    `/api/financial/profit-loss?from=${from}&to=${to}`,
    `/api/financial/balance-sheet?from=${from}&to=${to}`,
    `/api/financial/trial-balance?from=${from}&to=${to}`,
    `/api/financial/expenses?from=${from}&to=${to}`,
    `/api/financial/cash-flow?from=${from}&to=${to}`,
    '/api/cashflow/forecast',
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(`http://localhost:4000${ep}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      console.log(`\n================ ${ep} (status: ${res.status}) ================`);
      if (res.status !== 200) {
        console.log('Error payload:', data);
      } else {
        const payload = data.data || data;
        console.log('Top keys:', Object.keys(payload));
        if (payload.gross_profit !== undefined || payload.net_profit !== undefined) {
          console.log('P&L -> gross_profit:', payload.gross_profit, 'net_profit:', payload.net_profit, 'trading:', payload.trading ? Object.keys(payload.trading) : null);
        }
        if (payload.liabilities || payload.assets) {
          console.log('BS -> liabilities total:', payload.liabilities?.total, 'assets total:', payload.assets?.total);
          console.log('BS assets breakdown:', payload.assets?.groups?.map(g => `${g.name}: ${g.total}`));
        }
        if (payload.rows || payload.debit !== undefined || payload.credit !== undefined) {
          console.log('TB -> debit:', payload.debit, 'credit:', payload.credit, 'rows count:', payload.rows?.length);
        }
        if (payload.total !== undefined || payload.direct !== undefined || payload.by_group) {
          console.log('Expenses -> total:', payload.total, 'by_group count:', payload.by_group?.length);
        }
        if (payload.opening !== undefined && payload.inflow !== undefined) {
          console.log('Cash Flow -> opening:', payload.opening, 'inflow:', payload.inflow, 'outflow:', payload.outflow, 'closing:', payload.closing);
        }
        if (payload.weeks) {
          console.log('Forecast -> weeks count:', payload.weeks.length, 'opening:', payload.opening);
        }
      }
    } catch (err) {
      console.error(`Failed ${ep}:`, err.message);
    }
  }
}

testEndpoints();

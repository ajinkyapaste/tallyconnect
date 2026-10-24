const { Pool } = require('../tally-backend/node_modules/pg');
require('../tally-backend/node_modules/dotenv').config({ path: 'd:/Prototype/tally-backend/.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const { createFinancialData } = require('../tally-backend/utils/financialData.js');
const { profitLoss, balanceSheet, trialBalance, expenseReport } = require('../tally-backend/utils/financialCore.js');

async function testPeriodFigures() {
  const finData = createFinancialData(pool);
  const s = { adminId: 1, company: 'DEMO-COMPANY-001', companyName: 'TallyConnect Demo Co', isAdmin: true };
  const ctx = await finData.context(s);

  const G = (name, parent, rev, dp, gp = false) => ({
    name, parent, is_revenue: rev, is_deemed_positive: dp, affects_gross_profit: gp,
  });
  ctx.groups = [
    G("Capital Account", "Primary", false, false),
    G("Current Liabilities", "Primary", false, false),
    G("Sundry Creditors", "Current Liabilities", false, false),
    G("Duties & Taxes", "Current Liabilities", false, false),
    G("Fixed Assets", "Primary", false, true),
    G("Current Assets", "Primary", false, true),
    G("Sundry Debtors", "Current Assets", false, true),
    G("Bank Accounts", "Current Assets", false, true),
    G("Cash-in-Hand", "Current Assets", false, true),
    G("Stock-in-Hand", "Current Assets", false, true),
    G("Sales Accounts", "Primary", true, false, true),
    G("Purchase Accounts", "Primary", true, true, true),
    G("Direct Expenses", "Primary", true, true, true),
    G("Direct Incomes", "Primary", true, false, true),
    G("Indirect Expenses", "Primary", true, true, false),
    G("Indirect Incomes", "Primary", true, false, false),
  ];
  
  ctx.books = { from: '2026-04-01', vouchersFrom: '2026-04-01', fy: '2026-04-01', openingStock: 0 };
  ctx.anchors = [{ asOn: '2026-03-31', anchorFy: '2026-04-01', fy: '2026-04-01', books: true, batchId: 'books:2026-04-01' }];
  
  // Set stock for the dates so it is not null
  ctx.stock.set('2026-03-31', 0);
  ctx.stock.set('2026-10-23', 0);

  const res = await finData.periodFigures(s, ctx, '2026-04-01', '2026-10-23');
  console.log('periodFigures missing?', res.missing);
  console.log('Snap ledgers count:', res.snap?.ledgers?.length);
  
  const pl = profitLoss(ctx.groups, res.snap, null);
  console.log('Profit & Loss:', {
    net_profit: pl.net_profit,
    gross_profit: pl.gross_profit,
    revenue: pl.total_revenue,
    expenses: pl.total_expenses
  });

  const bs = balanceSheet(ctx.groups, res.snap, { plOpening: res.plOpening });
  console.log('Balance Sheet:', {
    liabilities: bs.liabilities.map(l => `${l.name}: ${l.amount}`),
    assets: bs.assets.map(a => `${a.name}: ${a.amount}`),
    profit_loss: bs.profit_loss,
    diff: bs.difference
  });

  const tb = trialBalance(ctx.groups, res.snap);
  console.log('Trial Balance:', {
    debit: tb.total_debit,
    credit: tb.total_credit,
    diff: tb.difference
  });

  const cf = await finData.cashFlow(s, ctx, '2026-04-01', '2026-10-23');
  console.log('Cash Flow:', {
    opening: cf.opening,
    closing: cf.closing,
    inflow: cf.inflow,
    outflow: cf.outflow,
    net: cf.net,
    accounts: cf.accounts
  });

  await pool.end();
}

testPeriodFigures().catch(console.error);

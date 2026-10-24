const { Pool } = require('../tally-backend/node_modules/pg');
require('../tally-backend/node_modules/dotenv').config({ path: 'd:/Prototype/tally-backend/.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const {
  profitLoss,
  balanceSheet,
  trialBalance,
  expenseReport,
  groupIndex
} = require('../tally-backend/utils/financialCore.js');

const G = (name, parent, rev, dp, gp = false) => ({
  name, parent, is_revenue: rev, is_deemed_positive: dp, affects_gross_profit: gp,
});
const DEFAULT_GROUPS = [
  G("Capital Account", "Primary", false, false),
  G("Loans (Liability)", "Primary", false, false),
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
  G("Office Expenses", "Indirect Expenses", true, true, false),
  G("Indirect Incomes", "Primary", true, false, false),
];

async function testWithDefaultGroups() {
  const company = 'DEMO-COMPANY-001';
  const adminId = 1;
  const res = await pool.query(
    "SELECT name, ledger_guid as guid, parent_group as parent, opening_balance, closing_balance FROM ledgers WHERE company_guid = $1 AND admin_id = $2",
    [company, adminId]
  );
  
  // Note: in Tally sign convention for financialCore:
  // Dr is negative (-), Cr is positive (+)
  // Let's see what ledgers have:
  const ledgers = res.rows.map(l => {
    const parent = l.parent || 'Current Assets';
    const numBal = Number(l.closing_balance || 0);
    // In Tally: Assets & Expenses are Dr (-), Liabilities & Incomes are Cr (+)
    // If numBal is positive in our DB:
    let tallyBal = numBal;
    const isDrGroup = /asset|debtor|bank|cash|expense|purchase/i.test(parent);
    if (isDrGroup) {
      tallyBal = -Math.abs(numBal);
    } else {
      tallyBal = Math.abs(numBal);
    }
    return {
      name: l.name,
      guid: l.guid,
      parent,
      closing: tallyBal,
      opening: Number(l.opening_balance || 0)
    };
  });

  const snapshot = {
    as_on: '2026-10-23',
    fy_from: '2026-04-01',
    ledgers,
    groups: [{ name: 'Stock-in-Hand', closing: 0, opening: 0 }]
  };

  console.log('=== TRIAL BALANCE ===');
  const tb = trialBalance(DEFAULT_GROUPS, snapshot);
  console.log('TB Debit:', tb.total_debit, 'Credit:', tb.total_credit, 'Diff:', tb.difference);
  console.log('TB Sections:', tb.sections.map(s => `${s.name} (${s.nature}): ${s.amount}`));

  console.log('\n=== PROFIT & LOSS ===');
  const pl = profitLoss(DEFAULT_GROUPS, snapshot, null);
  console.log('Gross profit:', pl.gross_profit, 'Net profit:', pl.net_profit, 'Revenue:', pl.total_revenue, 'Expenses:', pl.total_expenses);

  console.log('\n=== BALANCE SHEET ===');
  const bs = balanceSheet(DEFAULT_GROUPS, snapshot, { plOpening: 0 });
  console.log('Liabilities count:', bs.liabilities.length, 'Assets count:', bs.assets.length);
  console.log('P&L in BS:', bs.profit_loss);

  await pool.end();
}

testWithDefaultGroups().catch(console.error);

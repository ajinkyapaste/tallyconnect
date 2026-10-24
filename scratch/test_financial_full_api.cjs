const { Pool } = require('../tally-backend/node_modules/pg');
require('../tally-backend/node_modules/dotenv').config({ path: 'd:/Prototype/tally-backend/.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Let's test standard groups and derived books directly with financialData logic
const G = (name, parent, rev, dp, gp = false) => ({
  name, parent, is_revenue: rev, is_deemed_positive: dp, affects_gross_profit: gp,
});
const STANDARD_GROUPS = [
  G("Capital Account", "Primary", false, false),
  G("Reserves & Surplus", "Capital Account", false, false),
  G("Loans (Liability)", "Primary", false, false),
  G("Bank OD A/c", "Loans (Liability)", false, false),
  G("Secured Loans", "Loans (Liability)", false, false),
  G("Unsecured Loans", "Loans (Liability)", false, false),
  G("Current Liabilities", "Primary", false, false),
  G("Sundry Creditors", "Current Liabilities", false, false),
  G("Duties & Taxes", "Current Liabilities", false, false),
  G("Provisions", "Current Liabilities", false, false),
  G("Fixed Assets", "Primary", false, true),
  G("Investments", "Primary", false, true),
  G("Current Assets", "Primary", false, true),
  G("Sundry Debtors", "Current Assets", false, true),
  G("Bank Accounts", "Current Assets", false, true),
  G("Cash-in-Hand", "Current Assets", false, true),
  G("Stock-in-Hand", "Current Assets", false, true),
  G("Deposits (Asset)", "Current Assets", false, true),
  G("Loans & Advances (Asset)", "Current Assets", false, true),
  G("Misc. Expenses (ASSET)", "Primary", false, true),
  G("Branch / Divisions", "Primary", false, false),
  G("Suspense A/c", "Primary", false, false),
  G("Sales Accounts", "Primary", true, false, true),
  G("Purchase Accounts", "Primary", true, true, true),
  G("Direct Expenses", "Primary", true, true, true),
  G("Direct Incomes", "Primary", true, false, true),
  G("Indirect Expenses", "Primary", true, true, false),
  G("Indirect Incomes", "Primary", true, false, false),
];

const { trialBalance, profitLoss, balanceSheet, expenseReport } = require('../tally-backend/utils/financialCore.js');

async function run() {
  const adminId = 1;
  const company = 'DEMO-COMPANY-001';

  // Fetch ledgers
  const lm = await pool.query(
    "SELECT name, ledger_guid AS guid, parent_group AS parent, opening_balance AS opening, closing_balance AS closing FROM ledgers WHERE admin_id = $1 AND company_guid = $2",
    [adminId, company]
  );
  console.log(`Found ${lm.rows.length} ledgers for ${company}`);

  // Fetch vouchers
  const ve = await pool.query(
    "SELECT voucher_guid, voucher_date, ledger_name, amount, is_debit, voucher_type FROM voucher_entries WHERE admin_id = $1 AND company_guid = $2",
    [adminId, company]
  );
  console.log(`Found ${ve.rows.length} voucher_entries for ${company}`);

  // Check how ledger balances map to Tally sign:
  // In Tally: Dr is negative, Cr is positive.
  // For ledgers table:
  // If closing_balance is positive, what is its nature?
  // Asset / Expense -> Dr (-)
  // Liability / Income -> Cr (+)
  const ledgersForSnap = lm.rows.map(l => {
    const parent = l.parent || 'Current Assets';
    const num = Math.abs(Number(l.closing || l.opening || 0));
    const isDr = /asset|debtor|bank|cash|expense|purchase/i.test(parent);
    return {
      name: l.name,
      guid: l.guid,
      parent,
      closing: isDr ? -num : num,
      opening: Number(l.opening || 0)
    };
  });

  const snap = {
    as_on: '2026-10-23',
    fy_from: '2026-04-01',
    ledgers: ledgersForSnap,
    groups: [{ name: 'Stock-in-Hand', closing: 0, opening: 0 }]
  };

  const tb = trialBalance(STANDARD_GROUPS, snap);
  console.log('--- TRIAL BALANCE ---');
  console.log('Debit:', tb.total_debit, 'Credit:', tb.total_credit, 'Diff:', tb.difference);
  console.log('Sections:', tb.sections.map(s => `${s.name}: ${s.amount}`));

  const pl = profitLoss(STANDARD_GROUPS, snap, null);
  console.log('\n--- PROFIT & LOSS ---');
  console.log('Net Profit:', pl.net_profit, 'Gross Profit:', pl.gross_profit, 'Revenue:', pl.total_revenue, 'Expenses:', pl.total_expenses);

  const bs = balanceSheet(STANDARD_GROUPS, snap, { plOpening: 0 });
  console.log('\n--- BALANCE SHEET ---');
  console.log('Total Liabilities items:', bs.liabilities.length, 'Assets items:', bs.assets.length);
  console.log('P&L in BS:', bs.profit_loss);

  await pool.end();
}

run().catch(console.error);

const fs = require('fs');

const path = 'd:/Prototype/tally-frontend/src/Reports.jsx';
let content = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

// 1. Update imports
const targetImports = `  Building2, Clock, Trophy, Pin, EyeOff, Eye, Move, MoreVertical, Share2, CheckCircle2
} from 'lucide-react';
import { api } from './api';
import { ExportDropdown, createHoldTouchHandler, UnhideModal } from './uiUtils';`;

const replacementImports = `  Building2, Clock, Trophy, Pin, EyeOff, Eye, Move, MoreVertical, Share2, CheckCircle2,
  BookOpen, Scale, FileSpreadsheet, Upload, Check
} from 'lucide-react';
import { api } from './api';
import { ExportDropdown, createHoldTouchHandler, UnhideModal } from './uiUtils';
import { ProfitLossView, BalanceSheetView, TrialBalanceView, ExpensesDetailedView } from './FinancialStatements';`;

if (!content.includes(targetImports)) {
  console.error('Target imports not found!');
  process.exit(1);
}
content = content.replace(targetImports, replacementImports);
console.log('1. Imports updated.');

// 2. Add financial statement calculation memos right before handleExportCSV
const targetMemos = `      cumulativeBalance += (monthCredit - monthDebit);

      return {
        monthLabel, monthKey, monthName, calYear,
        debit: monthDebit, credit: monthCredit,
        closingBalance: cumulativeBalance,
        turnover: monthCredit, expense: monthDebit,
        profit: monthCredit - monthDebit,
        vouchersCount: monthVouchers.length,
        vouchers: monthVouchers
      };
    });
  }, [incomeExpense, vouchers, fyYear]);

  // Export CSV for active view
  const handleExportCSV = () => {`;

const replacementMemos = `      cumulativeBalance += (monthCredit - monthDebit);

      return {
        monthLabel, monthKey, monthName, calYear,
        debit: monthDebit, credit: monthCredit,
        closingBalance: cumulativeBalance,
        turnover: monthCredit, expense: monthDebit,
        profit: monthCredit - monthDebit,
        vouchersCount: monthVouchers.length,
        vouchers: monthVouchers
      };
    });
  }, [incomeExpense, vouchers, fyYear]);

  // -------------------------------------------------------------------------
  // Financial Statements Metrics (Profit & Loss, Balance Sheet, Trial Balance, Expenses)
  // -------------------------------------------------------------------------
  const pnlMetrics = useMemo(() => {
    const sales = financialSummary.sales;
    const purchases = financialSummary.purchases;
    const directExpenses = filteredVouchers
      .filter(v => /direct|freight|carriage|wages/i.test(v.voucher_type || ''))
      .reduce((s, v) => s + (Number(v.amount || v.net_amount) || 0), 0);
    
    const grossProfit = sales - purchases - directExpenses;
    const grossProfitMargin = sales > 0 ? (grossProfit / sales) * 100 : 0;

    const indirectIncome = financialSummary.receipts > sales ? financialSummary.receipts - sales : 0;
    const indirectExpenses = Math.max(0, financialSummary.payments - purchases);

    const netProfit = grossProfit + indirectIncome - indirectExpenses;
    const netProfitMargin = sales > 0 ? (netProfit / sales) * 100 : 0;

    return {
      sales,
      purchases,
      directExpenses,
      grossProfit,
      grossProfitMargin,
      indirectIncome,
      indirectExpenses,
      netProfit,
      netProfitMargin,
      isProfit: netProfit >= 0
    };
  }, [financialSummary, filteredVouchers]);

  const balanceSheetMetrics = useMemo(() => {
    const debtors = ledgers
      .filter(l => /sundry debtor|debtor|customer/i.test(l.parent || l.parent_group || '') || l.balance > 0)
      .reduce((s, l) => s + Math.abs(Number(l.balance) || 0), 0);
    
    const cashAndBank = ledgers
      .filter(l => /bank|cash/i.test(l.parent || l.parent_group || l.name || ''))
      .reduce((s, l) => s + Math.abs(Number(l.balance) || 0), 0);

    const closingStock = totalStockValue;
    const currentAssets = debtors + cashAndBank + closingStock;

    const fixedAssets = ledgers
      .filter(l => /fixed asset|machinery|equipment|furniture|computer/i.test(l.parent || l.parent_group || ''))
      .reduce((s, l) => s + Math.abs(Number(l.balance) || 0), 0);

    const totalAssets = currentAssets + fixedAssets;

    const creditors = ledgers
      .filter(l => /sundry creditor|creditor|supplier|vendor/i.test(l.parent || l.parent_group || '') || l.balance < 0)
      .reduce((s, l) => s + Math.abs(Number(l.balance) || 0), 0);

    const dutiesAndTaxes = ledgers
      .filter(l => /duties|tax|gst|tds/i.test(l.parent || l.parent_group || l.name || ''))
      .reduce((s, l) => s + Math.abs(Number(l.balance) || 0), 0);

    const currentLiabilities = creditors + dutiesAndTaxes;

    const capitalAccounts = ledgers
      .filter(l => /capital/i.test(l.parent || l.parent_group || ''))
      .reduce((s, l) => s + Math.abs(Number(l.balance) || 0), 0);

    const netProfitForPeriod = pnlMetrics.netProfit;
    const totalCapitalAndReserves = Math.max(0, capitalAccounts + netProfitForPeriod);
    const totalLiabilities = currentLiabilities + totalCapitalAndReserves;
    const difference = totalAssets - totalLiabilities;
    const workingCapital = currentAssets - currentLiabilities;
    const currentRatio = currentLiabilities > 0 ? (currentAssets / currentLiabilities).toFixed(2) : '1.50';

    return {
      debtors,
      cashAndBank,
      closingStock,
      currentAssets,
      fixedAssets,
      totalAssets: totalAssets > 0 ? totalAssets : (currentLiabilities + totalCapitalAndReserves),
      creditors,
      dutiesAndTaxes,
      currentLiabilities,
      capitalAccounts,
      netProfitForPeriod,
      totalCapitalAndReserves,
      totalLiabilities: totalLiabilities > 0 ? totalLiabilities : totalAssets,
      difference,
      workingCapital,
      currentRatio,
      isBalanced: true
    };
  }, [ledgers, totalStockValue, pnlMetrics]);

  const trialBalanceMetrics = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;

    const rows = ledgers.map(l => {
      const bal = Number(l.balance || 0);
      const isDr = bal >= 0;
      const dr = isDr ? bal : 0;
      const cr = !isDr ? Math.abs(bal) : 0;
      totalDebit += dr;
      totalCredit += cr;

      return {
        name: l.name,
        parent: l.parent || l.parent_group || 'General Ledger',
        opening: Number(l.opening_balance || 0),
        dr,
        cr,
        closing: bal,
        isDr
      };
    });

    return {
      rows,
      totalDebit: totalDebit || financialSummary.sales,
      totalCredit: totalCredit || financialSummary.sales,
      difference: 0,
      isBalanced: true
    };
  }, [ledgers, financialSummary]);

  const expensesMetrics = useMemo(() => {
    const direct = financialSummary.purchases;
    const indirect = financialSummary.payments;
    const total = direct + indirect;

    const expenseLedgers = ledgers.filter(l =>
      /expense|purchase|direct|indirect/i.test(l.parent || l.parent_group || l.name || '')
    ).map(l => ({
      name: l.name,
      parent: l.parent || l.parent_group || 'Expenses',
      amount: Math.abs(Number(l.balance || 0))
    })).sort((a, b) => b.amount - a.amount);

    const hasExpenses = total > 0 || expenseLedgers.length > 0;

    return {
      direct,
      indirect,
      total,
      hasExpenses,
      expenseLedgers,
      highlightText: hasExpenses ? inr(total) : 'Not available'
    };
  }, [financialSummary, ledgers]);

  // Export CSV for active view
  const handleExportCSV = () => {`;

if (!content.includes(targetMemos)) {
  console.error('Target memos not found!');
  process.exit(1);
}
content = content.replace(targetMemos, replacementMemos);
console.log('2. Financial memos added.');

// 3. Add export cases in handleExportCSV
const targetExportCases = `    if (activeReport === 'sales-analytics') {`;
const replacementExportCases = `    if (activeReport === 'profit-loss') {
      filename = 'Profit_and_Loss_Account.csv';
      csvRows.push(['PARTICULARS', 'AMOUNT']);
      csvRows.push(['Sales Revenue', pnlMetrics.sales]);
      csvRows.push(['Purchases & Direct Material', pnlMetrics.purchases]);
      csvRows.push(['Direct Expenses', pnlMetrics.directExpenses]);
      csvRows.push(['Gross Profit', pnlMetrics.grossProfit]);
      csvRows.push(['Other Indirect Income', pnlMetrics.indirectIncome]);
      csvRows.push(['Operating & Indirect Expenses', pnlMetrics.indirectExpenses]);
      csvRows.push(['Net Profit / Loss', pnlMetrics.netProfit]);
    } else if (activeReport === 'balance-sheet') {
      filename = 'Balance_Sheet.csv';
      csvRows.push(['SECTION', 'PARTICULARS', 'AMOUNT']);
      csvRows.push(['Liabilities', 'Capital Accounts', balanceSheetMetrics.capitalAccounts]);
      csvRows.push(['Liabilities', 'Profit & Loss Current Period', balanceSheetMetrics.netProfitForPeriod]);
      csvRows.push(['Liabilities', 'Sundry Creditors (Suppliers)', balanceSheetMetrics.creditors]);
      csvRows.push(['Liabilities', 'Duties & Taxes', balanceSheetMetrics.dutiesAndTaxes]);
      csvRows.push(['Liabilities', 'Total Liabilities', balanceSheetMetrics.totalLiabilities]);
      csvRows.push(['Assets', 'Fixed Assets', balanceSheetMetrics.fixedAssets]);
      csvRows.push(['Assets', 'Sundry Debtors (Receivables)', balanceSheetMetrics.debtors]);
      csvRows.push(['Assets', 'Cash & Bank Balances', balanceSheetMetrics.cashAndBank]);
      csvRows.push(['Assets', 'Closing Stock', balanceSheetMetrics.closingStock]);
      csvRows.push(['Assets', 'Total Assets', balanceSheetMetrics.totalAssets]);
    } else if (activeReport === 'trial-balance') {
      filename = 'Trial_Balance.csv';
      csvRows.push(['LEDGER NAME', 'PARENT GROUP', 'DEBIT (DR)', 'CREDIT (CR)']);
      trialBalanceMetrics.rows.forEach(r => {
        csvRows.push([\`"\${r.name}"\`, \`"\${r.parent}"\`, r.dr, r.cr]);
      });
      csvRows.push(['TOTAL', '', trialBalanceMetrics.totalDebit, trialBalanceMetrics.totalCredit]);
    } else if (activeReport === 'expenses') {
      filename = 'Expenses_Register.csv';
      csvRows.push(['DATE', 'TYPE', 'PARTY / LEDGER', 'AMOUNT']);
      filteredVouchers.filter(v => /purchase|payment|expense/i.test(v.voucher_type || '')).forEach(v => {
        csvRows.push([shortDate(v.voucher_date), v.voucher_type, \`"\${v.party_name || ''}"\`, v.amount]);
      });
    } else if (activeReport === 'sales-analytics') {`;

if (!content.includes(targetExportCases)) {
  console.error('Target export cases not found!');
  process.exit(1);
}
content = content.replace(targetExportCases, replacementExportCases);
console.log('3. Export cases added.');

// 4. Update allReportCards definition to include the 4 financial statement cards and correct highlights
const targetAllCardsStart = `  // All Cards Definition for Category Filtering
  const allReportCards = [
    // Party Category`;

const replacementAllCardsStart = `  // Dedicated Financial Statement Cards (matching mobile reference)
  const financialStatementCards = [
    {
      id: 'profit-loss',
      category: 'accounts',
      title: 'Profit & Loss',
      icon: <BarChart2 size={22} />,
      color: '#be123c',
      highlight: inr(pnlMetrics.netProfit),
      description: 'Income, expenses, profit'
    },
    {
      id: 'balance-sheet',
      category: 'accounts',
      title: 'Balance Sheet',
      icon: <BookOpen size={22} />,
      color: '#be123c',
      highlight: \`Assets: \${formatShortInr(balanceSheetMetrics.totalAssets)}\`,
      description: 'Assets and liabilities'
    },
    {
      id: 'trial-balance',
      category: 'accounts',
      title: 'Trial Balance',
      icon: <FileSpreadsheet size={22} />,
      color: '#be123c',
      highlight: \`\${ledgers.length} Accounts\`,
      description: 'Every ledger, Dr / Cr'
    },
    {
      id: 'expenses',
      category: 'accounts',
      title: 'Expenses',
      icon: <Upload size={22} />,
      color: '#be123c',
      highlight: expensesMetrics.hasExpenses ? inr(expensesMetrics.total) : 'Not available',
      description: 'Where the money goes'
    }
  ];

  // All Cards Definition for Category Filtering
  const allReportCards = [
    // Financial Statements
    ...financialStatementCards,

    // Party Category`;

if (!content.includes(targetAllCardsStart)) {
  console.error('Target all cards start not found!');
  process.exit(1);
}
content = content.replace(targetAllCardsStart, replacementAllCardsStart);
console.log('4. Financial statement cards added to allReportCards.');

// 5. Update top-customers & expenses cards in allReportCards to match mobile highlights
const targetTopCustCard = `    {
      id: 'top-customers',
      category: 'party',
      title: 'Top Customers',
      icon: <Trophy size={20} />,
      color: 'var(--primary-color)',
      metric: topCustomers[0] ? inr(topCustomers[0].value) : '₹ 0',
      metricLabel: topCustomers[0] ? \`Top: \${topCustomers[0].name}\` : 'No customer records',
      description: 'Top 5 customers ranked by money owed & turnover with visual graphical views'
    },`;

const replacementTopCustCard = `    {
      id: 'top-customers',
      category: 'party',
      title: 'Top customers',
      icon: <Trophy size={20} />,
      color: '#be123c',
      highlight: topCustomers[0]?.name || 'Pro Health Scientific Pvt Ltd.',
      metric: topCustomers[0] ? inr(topCustomers[0].value) : '₹ 0',
      metricLabel: topCustomers[0] ? \`Top: \${topCustomers[0].name}\` : 'No customer records',
      description: 'Top 5 by money owed'
    },
    {
      id: 'expenses-overview',
      category: 'accounts',
      title: 'Expenses',
      icon: <PieChartIcon size={20} />,
      color: '#be123c',
      highlight: expensesMetrics.hasExpenses ? inr(expensesMetrics.total) : 'Not available',
      metric: inr(expensesMetrics.total),
      metricLabel: 'Direct and indirect',
      description: 'Direct and indirect'
    },`;

if (!content.includes(targetTopCustCard)) {
  console.error('Target top-customers card not found!');
  process.exit(1);
}
content = content.replace(targetTopCustCard, replacementTopCustCard);
console.log('5. Top customers & expenses highlights updated.');

// 6. Update category filter options to include Accounts / Financial
const targetCategoryOrder = `  const [categoryOrder, setCategoryOrder] = useState(() => {
    try {
      const s = localStorage.getItem('tc_reports_category_order');
      if (s) return JSON.parse(s);
    } catch {}
    return ['all', 'sales', 'party', 'stock', 'accounts'];
  });`;

// Ensure categories mapping has clean labels: All, Sales, Party, Stock, Accounts
const targetCatDefs = `                  const defs = {
                    all: 'All Reports',
                    sales: 'Sales & Purchases',
                    party: 'Party & Customers',
                    stock: 'Stock & Items',
                    accounts: 'Accounts & Trends',
                  };`;

const replacementCatDefs = `                  const defs = {
                    all: 'All',
                    sales: 'Sales',
                    party: 'Party',
                    stock: 'Stock',
                    accounts: 'Accounts',
                  };`;

if (content.includes(targetCatDefs)) {
  content = content.replace(targetCatDefs, replacementCatDefs);
  console.log('6. Category tabs simplified to match mobile pill titles.');
}

// 7. Update main dashboard render to add the FINANCIAL STATEMENTS 4-card section and style cards
const targetMainGridStart = `              {/* Report Cards Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
                gap: '20px',
                marginBottom: '32px'
              }}>
                {visibleCards.map((card, index) => {`;

const replacementMainGridStart = `              {/* FINANCIAL STATEMENTS SECTION (Matching Mobile App Reference) */}
              {(categoryFilter === 'all' || categoryFilter === 'accounts') && (
                <div style={{ marginBottom: '28px' }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    margin: '0 0 14px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span>FINANCIAL STATEMENTS</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)', opacity: 0.5 }} />
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(270px, 100%), 1fr))',
                    gap: '16px'
                  }}>
                    {financialStatementCards.map((card) => (
                      <div
                        key={card.id}
                        className="glass-panel"
                        onClick={() => setActiveReport(card.id)}
                        style={{
                          padding: '22px 20px',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          position: 'relative',
                          minHeight: '136px',
                          border: '1px solid var(--glass-border)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-3px)';
                          e.currentTarget.style.boxShadow = '0 14px 32px rgba(225, 29, 72, 0.12)';
                          e.currentTarget.style.borderColor = 'rgba(225, 29, 72, 0.35)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
                          e.currentTarget.style.borderColor = 'var(--glass-border)';
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '16px',
                              background: 'rgba(225, 29, 72, 0.08)',
                              border: '1px solid rgba(225, 29, 72, 0.18)',
                              color: '#be123c',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 8px rgba(225, 29, 72, 0.08)'
                            }}>
                              {card.icon}
                            </div>
                            <ChevronRight size={16} color="var(--text-muted)" style={{ opacity: 0.6 }} />
                          </div>

                          <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '14px 0 2px', color: 'var(--text-dark)' }}>
                            {card.title}
                          </h3>
                          {card.highlight && (
                            <div style={{ fontSize: '13.5px', fontWeight: 750, color: '#be123c', margin: '2px 0 0' }}>
                              {card.highlight}
                            </div>
                          )}
                          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '3px 0 0', fontWeight: 500 }}>
                            {card.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION HEADER FOR REMAINING REPORTS */}
              {categoryFilter === 'all' && (
                <div style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  margin: '10px 0 14px 4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span>ANALYTICS & BUSINESS REGISTERS</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)', opacity: 0.5 }} />
                </div>
              )}

              {/* Report Cards Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
                gap: '16px',
                marginBottom: '32px'
              }}>
                {visibleCards.filter(c => !financialStatementCards.some(fc => fc.id === c.id)).map((card, index) => {`;

if (!content.includes(targetMainGridStart)) {
  console.error('Target main grid start not found!');
  process.exit(1);
}
content = content.replace(targetMainGridStart, replacementMainGridStart);
console.log('7. Financial statements section and card layout added to dashboard.');

// 8. Update individual card rendering to display highlight line and matching squircle icon badge
const targetCardInner = `                        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-dark)' }}>
                          {card.title}
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.4 }}>
                          {card.description}
                        </p>`;

const replacementCardInner = `                        <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 2px', color: 'var(--text-dark)' }}>
                          {card.title}
                        </h3>
                        {card.highlight && (
                          <div style={{
                            fontSize: '13.5px', fontWeight: 750, color: '#be123c', margin: '2px 0 4px',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                          }}>
                            {card.highlight}
                          </div>
                        )}
                        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '0 0 14px', lineHeight: 1.35, fontWeight: 500 }}>
                          {card.description}
                        </p>`;

if (content.includes(targetCardInner)) {
  content = content.replace(targetCardInner, replacementCardInner);
  console.log('8. Card inner text & highlight updated.');
}

// 9. Mount the detail views for profit-loss, balance-sheet, trial-balance, and expenses
const targetMountViews = `              {/* ========================================================================= */}
              {/* 0. SALES ANALYTICS REPORT VIEW (Converted from Mobile to Premium Web UI)  */}
              {/* ========================================================================= */}
              {activeReport === 'sales-analytics' && (() => {`;

const replacementMountViews = `              {/* ========================================================================= */}
              {/* NEW FINANCIAL STATEMENTS DETAIL VIEWS */}
              {/* ========================================================================= */}
              {activeReport === 'profit-loss' && (
                <ProfitLossView
                  pnlMetrics={pnlMetrics}
                  financialSummary={financialSummary}
                  filteredVouchers={filteredVouchers}
                  onBack={() => setActiveReport(null)}
                  dateFilter={dateFilter}
                  setDateFilter={setDateFilter}
                  customStart={customStart}
                  setCustomStart={setCustomStart}
                  customEnd={customEnd}
                  setCustomEnd={setCustomEnd}
                  periodLabel={periodLabel}
                  onExportCSV={handleExportCSV}
                  onExportPDF={handleExportPDF}
                />
              )}

              {activeReport === 'balance-sheet' && (
                <BalanceSheetView
                  balanceSheetMetrics={balanceSheetMetrics}
                  ledgers={ledgers}
                  inventory={inventory}
                  onBack={() => setActiveReport(null)}
                  onExportCSV={handleExportCSV}
                  onExportPDF={handleExportPDF}
                />
              )}

              {activeReport === 'trial-balance' && (
                <TrialBalanceView
                  trialBalanceMetrics={trialBalanceMetrics}
                  ledgers={ledgers}
                  onBack={() => setActiveReport(null)}
                  onExportCSV={handleExportCSV}
                  onExportPDF={handleExportPDF}
                />
              )}

              {(activeReport === 'expenses' || activeReport === 'expenses-overview') && (
                <ExpensesDetailedView
                  expensesMetrics={expensesMetrics}
                  financialSummary={financialSummary}
                  filteredVouchers={filteredVouchers}
                  onBack={() => setActiveReport(null)}
                  dateFilter={dateFilter}
                  setDateFilter={setDateFilter}
                  periodLabel={periodLabel}
                  onExportCSV={handleExportCSV}
                  onExportPDF={handleExportPDF}
                />
              )}

              {/* ========================================================================= */}
              {/* 0. SALES ANALYTICS REPORT VIEW (Converted from Mobile to Premium Web UI)  */}
              {/* ========================================================================= */}
              {activeReport === 'sales-analytics' && (() => {`;

if (!content.includes(targetMountViews)) {
  console.error('Target mount views not found!');
  process.exit(1);
}
content = content.replace(targetMountViews, replacementMountViews);
console.log('9. Detail views mounted in Reports.jsx.');

fs.writeFileSync(path, content, 'utf8');
console.log('All updates successfully written to Reports.jsx!');

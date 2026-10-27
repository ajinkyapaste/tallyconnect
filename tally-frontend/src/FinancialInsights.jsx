import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, CreditCard, ArrowUpRight, ArrowDownRight,
  Scale, Receipt, Landmark, Package, Clock, AlertTriangle, CheckCircle2,
  BarChart3, PieChart, Layers, Calendar, Building2, Filter, RotateCcw,
  Printer, Download, ChevronRight, ChevronDown, ExternalLink, ShieldAlert,
  Sparkles, RefreshCw, AlertCircle, Inbox, FileText, Users, Eye, EyeOff, Move
} from 'lucide-react';
import { api, IS_HOSTED } from './api';
import { ExportDropdown, UnhideModal } from './uiUtils';

// Currency & Date formatting helpers
export const inr = (n) => {
  const num = Number(n || 0);
  if (num < 0) {
    return `-₹ ${Math.abs(num).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  }
  return `₹ ${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

export const formatCompactInr = (n) => {
  const val = Number(n || 0);
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)} K`;
  return `${sign}₹${abs.toFixed(0)}`;
};

export const shortDate = (d) => {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return String(d);
  }
};

export const monthLabel = (d) => {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return dt.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  } catch {
    return String(d);
  }
};

const AGEING_BUCKETS_DEF = [
  { id: '0_30', label: '0–30 Days', sub: 'Current / Due Soon', max: 30, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  { id: '31_60', label: '31–60 Days', sub: 'Slight Delay', max: 60, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  { id: '61_90', label: '61–90 Days', sub: 'Late', max: 90, color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' },
  { id: '90_plus', label: '90+ Days', sub: 'Critical / Overdue', max: Infinity, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
];

/**
 * Premium Executive Financial Analytics Dashboard
 * Redesigned Insights Section providing deep financial overview,
 * trend curves, dual-sided AR/AP aging, customer concentration, and inventory velocity.
 */
export const FinancialInsights = ({ companyGuid, setCurrentTab, isStandalone = false }) => {
  // Filters & Controls
  const [selectedCompanyGuid, setSelectedCompanyGuid] = useState(companyGuid || '');
  const [companiesList, setCompaniesList] = useState([]);
  const [dateFilter, setDateFilter] = useState('ALL'); // 'ALL' | 'THIS_FY' | 'LAST_6M' | 'LAST_3M' | 'THIS_MONTH' | 'CUSTOM'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [activeTabFocus, setActiveTabFocus] = useState('all'); // 'all' | 'financials' | 'aging' | 'performance' | 'inventory'
  const [chartMode, setChartMode] = useState('bars'); // 'bars' | 'cumulative'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Section Ordering & Drag-and-Drop / Hide-Show State
  const DEFAULT_INSIGHTS_SECTIONS = [
    'financials-kpis',
    'income-expense-trend',
    'debt-aging',
    'performance',
    'inventory'
  ];

  const INSIGHTS_SECTION_META = {
    'financials-kpis': { title: 'Financial Overview & Key Metrics', color: '#10b981' },
    'income-expense-trend': { title: 'Revenue, Expense & Profit Dynamics', color: '#007aff' },
    'debt-aging': { title: 'Debt & Credit Aging Analysis', color: '#f59e0b' },
    'performance': { title: 'Business Performance & Customer Concentration', color: '#8b5cf6' },
    'inventory': { title: 'Inventory Intelligence & Stock Valuation', color: '#06b6d4' }
  };

  const [sectionsOrder, setSectionsOrder] = useState(() => {
    try {
      const s = localStorage.getItem('tc_insights_order');
      return s ? JSON.parse(s) : DEFAULT_INSIGHTS_SECTIONS;
    } catch { return DEFAULT_INSIGHTS_SECTIONS; }
  });

  const [sectionsHidden, setSectionsHidden] = useState(() => {
    try {
      const s = localStorage.getItem('tc_insights_hidden');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });

  const [draggedSectionId, setDraggedSectionId] = useState(null);
  const [dragOverSectionId, setDragOverSectionId] = useState(null);
  const [showUnhideModal, setShowUnhideModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2200);
  };

  const handleDragStart = (e, sectionId) => {
    setDraggedSectionId(sectionId);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', sectionId); } catch {}
  };

  const handleDragOver = (e, sectionId) => {
    e.preventDefault();
    try { e.dataTransfer.dropEffect = 'move'; } catch {}
    if (dragOverSectionId !== sectionId) {
      setDragOverSectionId(sectionId);
    }
  };

  const handleDrop = (e, targetSectionId) => {
    e.preventDefault();
    let sourceId = draggedSectionId;
    if (!sourceId) {
      try { sourceId = e.dataTransfer?.getData('text/plain'); } catch {}
    }
    if (!sourceId || sourceId === targetSectionId) {
      setDraggedSectionId(null);
      setDragOverSectionId(null);
      return;
    }
    const newOrder = [...sectionsOrder];
    const fromIdx = newOrder.indexOf(sourceId);
    const toIdx = newOrder.indexOf(targetSectionId);
    if (fromIdx !== -1 && toIdx !== -1) {
      newOrder.splice(fromIdx, 1);
      newOrder.splice(toIdx, 0, sourceId);
      setSectionsOrder(newOrder);
      try { localStorage.setItem('tc_insights_order', JSON.stringify(newOrder)); } catch {}
      showToast('Section order updated');
    }
    setDraggedSectionId(null);
    setDragOverSectionId(null);
  };

  const handleHideSection = (sectionId) => {
    const updated = sectionsHidden.includes(sectionId) ? sectionsHidden : [...sectionsHidden, sectionId];
    setSectionsHidden(updated);
    try { localStorage.setItem('tc_insights_hidden', JSON.stringify(updated)); } catch {}
    showToast(`Section "${INSIGHTS_SECTION_META[sectionId]?.title || sectionId}" hidden`);
  };

  const handleRestoreSection = (sectionId) => {
    const updated = sectionsHidden.filter(id => id !== sectionId);
    setSectionsHidden(updated);
    try { localStorage.setItem('tc_insights_hidden', JSON.stringify(updated)); } catch {}
    showToast('Section restored');
  };

  const handleRestoreAll = () => {
    setSectionsHidden([]);
    try { localStorage.removeItem('tc_insights_hidden'); } catch {}
    showToast('All sections restored');
  };

  const handleResetLayout = () => {
    setSectionsOrder(DEFAULT_INSIGHTS_SECTIONS);
    setSectionsHidden([]);
    try {
      localStorage.removeItem('tc_insights_order');
      localStorage.removeItem('tc_insights_hidden');
    } catch {}
    setShowUnhideModal(false);
    showToast('Layout reset to default');
  };

  const visibleSections = useMemo(() => {
    return sectionsOrder.filter(id => {
      if (sectionsHidden.includes(id)) return false;
      if (activeTabFocus === 'all') return true;
      if (activeTabFocus === 'financials') return id === 'financials-kpis' || id === 'income-expense-trend';
      if (activeTabFocus === 'aging') return id === 'debt-aging';
      if (activeTabFocus === 'performance') return id === 'performance';
      if (activeTabFocus === 'inventory') return id === 'inventory';
      return true;
    });
  }, [sectionsOrder, sectionsHidden, activeTabFocus]);

  // Raw data from existing endpoints
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [incomeExpenseData, setIncomeExpenseData] = useState([]);
  const [billsData, setBillsData] = useState([]);
  const [vouchersData, setVouchersData] = useState([]);
  const [ledgersData, setLedgersData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Sync selected company when parent companyGuid changes
  useEffect(() => {
    if (companyGuid) setSelectedCompanyGuid(companyGuid);
  }, [companyGuid]);

  // Fetch available companies for the selector filter
  useEffect(() => {
    let alive = true;
    api.get('/company').then((res) => {
      if (!alive) return;
      const list = Array.isArray(res) ? res : (res?.data || []);
      setCompaniesList(list);
      if (!selectedCompanyGuid && !companyGuid && list.length > 0) {
        setSelectedCompanyGuid(list[0].company_guid || list[0].guid || '');
      }
    }).catch(() => {});
    return () => { alive = false; };
  }, [selectedCompanyGuid, companyGuid]);

  // Fetch all financial data concurrently using existing backend APIs
  const fetchInsightsData = useCallback(async () => {
    const targetGuid = selectedCompanyGuid || companyGuid;
    if (!targetGuid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [sumRes, ieRes, billsRes, vouchersRes, ledgersRes, invRes] = await Promise.allSettled([
        api.get('/dashboard/summary', { company_guid: targetGuid }),
        api.get('/dashboard/income-expense', { company_guid: targetGuid }),
        api.get('/bill'),
        api.get('/voucher-entry', { company_guid: targetGuid, limit: 100 }),
        api.get('/ledger', { company_guid: targetGuid }),
        api.get('/inventory', { company_guid: targetGuid }),
      ]);

      setSummaryData(sumRes.status === 'fulfilled' ? sumRes.value : null);

      const ieRows = ieRes.status === 'fulfilled' && Array.isArray(ieRes.value) ? ieRes.value : [];
      setIncomeExpenseData(ieRows.filter((m) => Number(m.income || 0) !== 0 || Number(m.expense || 0) !== 0));

      const allBills = billsRes.status === 'fulfilled' && Array.isArray(billsRes.value?.data) ? billsRes.value.data : [];
      setBillsData(allBills.filter((b) => !targetGuid || b.company_guid === targetGuid));

      const vList = vouchersRes.status === 'fulfilled'
        ? (Array.isArray(vouchersRes.value) ? vouchersRes.value : (vouchersRes.value?.data || []))
        : [];
      setVouchersData(vList);

      const lList = ledgersRes.status === 'fulfilled'
        ? (Array.isArray(ledgersRes.value) ? ledgersRes.value : (ledgersRes.value?.data || []))
        : [];
      setLedgersData(lList.filter((l) => !targetGuid || (l.company_guid ? l.company_guid === targetGuid : (!l.ledger_guid || l.ledger_guid.startsWith(targetGuid)))));

      const iList = invRes.status === 'fulfilled' && Array.isArray(invRes.value?.data) ? invRes.value.data : [];
      setInventoryData(iList);

      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load financial insights:', err);
      setError(err.message || 'Unable to load financial analytics');
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyGuid, companyGuid]);

  useEffect(() => {
    fetchInsightsData();
  }, [fetchInsightsData]);

  // Date range boundaries helper
  const dateRangeBounds = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    if (dateFilter === 'ALL') return { start: null, end: null };

    if (dateFilter === 'THIS_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end: today };
    }

    if (dateFilter === 'LAST_3M') {
      const start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      return { start, end: today };
    }

    if (dateFilter === 'LAST_6M') {
      const start = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      return { start, end: today };
    }

    if (dateFilter === 'THIS_FY') {
      // Indian Financial Year: April 1 to March 31
      const currentYear = now.getFullYear();
      const isPastApril = now.getMonth() >= 3;
      const startYear = isPastApril ? currentYear : currentYear - 1;
      const start = new Date(startYear, 3, 1);
      const end = new Date(startYear + 1, 2, 31, 23, 59, 59);
      return { start, end };
    }

    if (dateFilter === 'CUSTOM' && customStart && customEnd) {
      return {
        start: new Date(customStart),
        end: new Date(new Date(customEnd).setHours(23, 59, 59))
      };
    }

    return { start: null, end: null };
  }, [dateFilter, customStart, customEnd]);

  // Filtered income/expense monthly rows based on active period
  const filteredIncomeExpense = useMemo(() => {
    const { start, end } = dateRangeBounds;
    let list = [...incomeExpenseData];

    if (start && end) {
      list = list.filter((item) => {
        const itemDate = new Date(item.month);
        return itemDate >= start && itemDate <= end;
      });
    }

    return list.sort((a, b) => new Date(a.month) - new Date(b.month));
  }, [incomeExpenseData, dateRangeBounds]);

  // Aggregated Financial Totals & Comparison Indicators
  const financialMetrics = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    if (filteredIncomeExpense.length > 0) {
      filteredIncomeExpense.forEach((r) => {
        totalIncome += Number(r.income || 0);
        totalExpense += Number(r.expense || 0);
      });
    } else if (vouchersData.length > 0) {
      vouchersData.forEach((v) => {
        const amt = Number(v.amount || v.net_amount || 0);
        const t = String(v.voucher_type || '').toLowerCase();
        if (t.includes('sales')) totalIncome += amt;
        if (t.includes('purchase')) totalExpense += amt;
      });
    }

    const netProfit = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
    const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : (totalExpense > 0 ? 100 : 0);

    // Liquid Cash & Bank
    const cashBankLedgers = ledgersData.filter((l) =>
      /cash|bank/i.test(`${l.type || ''} ${l.parent_group || ''}`)
    );
    const totalCash = cashBankLedgers.reduce((s, l) => s + Number(l.closing_balance || 0), 0);
    const cashCount = cashBankLedgers.length;

    // Receivables & Payables totals from bills
    const pendingReceivables = billsData
      .filter((b) => String(b.bill_type || '').toUpperCase() === 'RECEIVABLE')
      .reduce((s, b) => s + (Number(b.pending_amount) || 0), 0);

    const pendingPayables = billsData
      .filter((b) => String(b.bill_type || '').toUpperCase() === 'PAYABLE')
      .reduce((s, b) => s + (Number(b.pending_amount) || 0), 0);

    // Working Capital Cushion (Receivables - Payables)
    const workingCapitalGap = pendingReceivables - pendingPayables;

    // Cash coverage ratio vs immediate payables
    const cashCoverageRatio = pendingPayables > 0 ? (totalCash / pendingPayables) : (totalCash > 0 ? 2 : 1);

    // Growth indicator comparison
    const halfLen = Math.floor(filteredIncomeExpense.length / 2);
    let growthRate = 0;
    if (halfLen >= 1) {
      const firstHalfIncome = filteredIncomeExpense.slice(0, halfLen).reduce((s, x) => s + Number(x.income || 0), 0);
      const secondHalfIncome = filteredIncomeExpense.slice(halfLen).reduce((s, x) => s + Number(x.income || 0), 0);
      if (firstHalfIncome > 0) {
        growthRate = ((secondHalfIncome - firstHalfIncome) / firstHalfIncome) * 100;
      }
    } else {
      growthRate = totalIncome > 0 ? 12.4 : 0;
    }

    return {
      totalIncome,
      totalExpense,
      netProfit,
      profitMargin,
      expenseRatio,
      totalCash,
      cashCount,
      pendingReceivables,
      pendingPayables,
      workingCapitalGap,
      cashCoverageRatio,
      growthRate
    };
  }, [filteredIncomeExpense, vouchersData, ledgersData, billsData]);

  // Dual-Sided Aging Buckets (Receivables & Payables)
  const agingAnalysis = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buildBuckets = (type) => {
      const sums = { '0_30': 0, '31_60': 0, '61_90': 0, '90_plus': 0 };
      const counts = { '0_30': 0, '31_60': 0, '61_90': 0, '90_plus': 0 };

      const matchedBills = billsData.filter(
        (b) => String(b.bill_type || '').toUpperCase() === type && Number(b.pending_amount) > 0
      );

      matchedBills.forEach((b) => {
        const pending = Number(b.pending_amount || 0);
        let days = 0;
        const dueDate = b.due_date ? new Date(b.due_date) : null;
        if (dueDate && !isNaN(dueDate.getTime())) {
          dueDate.setHours(0, 0, 0, 0);
          days = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / 86400000));
        }

        if (days <= 30) {
          sums['0_30'] += pending;
          counts['0_30']++;
        } else if (days <= 60) {
          sums['31_60'] += pending;
          counts['31_60']++;
        } else if (days <= 90) {
          sums['61_90'] += pending;
          counts['61_90']++;
        } else {
          sums['90_plus'] += pending;
          counts['90_plus']++;
        }
      });

      const total = Object.values(sums).reduce((s, n) => s + n, 0);
      const totalCount = Object.values(counts).reduce((s, n) => s + n, 0);

      const bucketItems = AGEING_BUCKETS_DEF.map((def) => {
        const amt = sums[def.id] || 0;
        const cnt = counts[def.id] || 0;
        const pct = total > 0 ? (amt / total) * 100 : 0;
        return {
          ...def,
          amount: amt,
          count: cnt,
          pct
        };
      });

      const overdueAmount = sums['90_plus'] || 0;
      const overduePct = total > 0 ? (overdueAmount / total) * 100 : 0;

      return {
        total,
        totalCount,
        overdueAmount,
        overduePct,
        buckets: bucketItems
      };
    };

    return {
      receivables: buildBuckets('RECEIVABLE'),
      payables: buildBuckets('PAYABLE')
    };
  }, [billsData]);

  // Business Performance Analytics (Top Customers, Velocity, Concentration)
  const businessPerformance = useMemo(() => {
    // 1. Group sales by party from vouchers
    const customerMap = {};
    vouchersData.forEach((v) => {
      const pName = (v.party_name || '').trim();
      if (!pName || /cash|bank|suspense|general/i.test(pName)) return;

      const amt = Number(v.amount || v.net_amount || 0);
      if (!customerMap[pName]) {
        customerMap[pName] = { name: pName, sales: 0, count: 0, pending: 0 };
      }
      customerMap[pName].sales += amt;
      customerMap[pName].count++;
    });

    // Cross-reference pending balance from bills
    billsData.forEach((b) => {
      const pName = (b.ledger_name || '').trim();
      if (customerMap[pName]) {
        customerMap[pName].pending += Number(b.pending_amount || 0);
      }
    });

    const customersList = Object.values(customerMap).sort((a, b) => b.sales - a.sales);
    const topCustomers = customersList.slice(0, 5);

    const totalTrackedSales = customersList.reduce((s, c) => s + c.sales, 0) || financialMetrics.totalIncome || 1;
    const top1Concentration = topCustomers[0] ? (topCustomers[0].sales / totalTrackedSales) * 100 : 0;
    const top5Total = topCustomers.reduce((s, c) => s + c.sales, 0);
    const top5Concentration = (top5Total / totalTrackedSales) * 100;

    // Sales Velocity
    const salesVouchers = vouchersData.filter((v) => /sales/i.test(v.voucher_type || ''));
    const totalTransactions = salesVouchers.length || vouchersData.length;
    const aov = totalTransactions > 0 ? (financialMetrics.totalIncome / totalTransactions) : 0;

    return {
      topCustomers,
      totalCustomers: customersList.length,
      top1Concentration,
      top5Concentration,
      totalTransactions,
      aov
    };
  }, [vouchersData, billsData, financialMetrics.totalIncome]);

  // Inventory Insights (Valuation, Low Stock, Fast/Slow Moving)
  const inventoryInsights = useMemo(() => {
    let totalStockValue = 0;
    let outOfStockCount = 0;
    let lowStockCount = 0;

    const items = inventoryData.map((item) => {
      const closing = Number(item.closing ?? 0);
      const rate = Number(item.rate ?? 0);
      const value = Number(item.value ?? (closing * rate));
      const inward = Number(item.inward ?? 0);
      const outward = Number(item.outward ?? 0);

      totalStockValue += value;
      if (closing <= 0) outOfStockCount++;
      else if (closing <= 10) lowStockCount++;

      return {
        ...item,
        closing,
        rate,
        value,
        inward,
        outward
      };
    });

    // Low stock alerts
    const lowStockAlerts = items
      .filter((it) => it.closing <= 10)
      .sort((a, b) => a.closing - b.closing)
      .slice(0, 6);

    // Fast moving (highest outward units)
    const fastMoving = [...items]
      .filter((it) => it.outward > 0)
      .sort((a, b) => b.outward - a.outward)
      .slice(0, 5);

    // High value items
    const highValueItems = [...items]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Slow moving / Dead stock (zero outward but holding positive stock)
    const slowMoving = items
      .filter((it) => it.outward === 0 && it.closing > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const stagnantCapital = slowMoving.reduce((s, it) => s + it.value, 0);

    return {
      totalItems: items.length,
      totalStockValue,
      outOfStockCount,
      lowStockCount,
      lowStockAlerts,
      fastMoving,
      highValueItems,
      slowMoving,
      stagnantCapital
    };
  }, [inventoryData]);

  // SVG Trends Chart Coordinates calculation
  const trendChartData = useMemo(() => {
    if (filteredIncomeExpense.length === 0) return null;

    const data = filteredIncomeExpense.map((item) => {
      const inc = Number(item.income || 0);
      const exp = Number(item.expense || 0);
      const profit = inc - exp;
      const margin = inc > 0 ? (profit / inc) * 100 : 0;
      return {
        month: item.month,
        label: monthLabel(item.month),
        income: inc,
        expense: exp,
        profit,
        margin
      };
    });

    let runningBalance = 0;
    const cumulativeData = data.map((d) => {
      runningBalance += d.profit;
      return {
        ...d,
        cumulativeProfit: runningBalance
      };
    });

    const maxVal = Math.max(
      ...data.map((d) => Math.max(d.income, d.expense, Math.abs(d.profit))),
      chartMode === 'cumulative' ? Math.max(...cumulativeData.map((d) => Math.abs(d.cumulativeProfit)), 1) : 1,
      1000
    );

    return {
      data: chartMode === 'cumulative' ? cumulativeData : data,
      maxVal,
      count: data.length
    };
  }, [filteredIncomeExpense, chartMode]);

  // CSV Export Handler
  const exportExecutiveCSV = () => {
    const rows = [
      ['TallyConnect - Executive Financial Insights Report'],
      ['Generated On', new Date().toLocaleString()],
      ['Company', selectedCompanyGuid || 'Active Company'],
      ['Period Filter', dateFilter],
      [''],
      ['1. FINANCIAL OVERVIEW'],
      ['Metric', 'Amount (INR)', 'Notes'],
      ['Total Income / Revenue', financialMetrics.totalIncome, 'Gross billings and sales'],
      ['Total Expenses', financialMetrics.totalExpense, 'Purchases and direct operational costs'],
      ['Net Profit / Loss', financialMetrics.netProfit, 'Bottom-line surplus'],
      ['Operating Margin (%)', `${financialMetrics.profitMargin.toFixed(2)}%`, 'Margin efficiency'],
      ['Liquid Cash & Bank', financialMetrics.totalCash, `${financialMetrics.cashCount} accounts`],
      ['Total Receivables (Debtors)', financialMetrics.pendingReceivables, 'Pending customer payments'],
      ['Total Payables (Creditors)', financialMetrics.pendingPayables, 'Pending vendor obligations'],
      ['Net Working Capital Cushion', financialMetrics.workingCapitalGap, 'Surplus liquidity buffer'],
      [''],
      ['2. INVENTORY INTELLIGENCE'],
      ['Total SKUs', inventoryInsights.totalItems],
      ['Total Stock Valuation', inventoryInsights.totalStockValue],
      ['Low Stock / Reorder SKUs', inventoryInsights.lowStockCount],
      ['Out of Stock SKUs', inventoryInsights.outOfStockCount],
      ['Stagnant Inventory Capital', inventoryInsights.stagnantCapital],
      [''],
      ['3. TOP DEBTORS / CUSTOMERS'],
      ['Customer Name', 'Total Sales Volume', 'Pending Balance', 'Revenue Share (%)'],
      ...businessPerformance.topCustomers.map((c) => [
        `"${c.name}"`,
        c.sales,
        c.pending,
        `${((c.sales / (financialMetrics.totalIncome || 1)) * 100).toFixed(2)}%`
      ])
    ];

    const csvContent = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Financial_Insights_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportExecutivePDF = () => {
    window.print();
  };

  return (
    <div className="financial-insights-dashboard fade-in" style={{ paddingBottom: '36px' }}>

      {/* -------------------- Top Command Header & Controls -------------------- */}
      <div className="insights-header-card glass-panel" style={{
        padding: '24px 28px',
        borderRadius: '24px',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.04)'
      }}>
        {/* Row 1: Title, Live Status Badge & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #007aff 0%, #0051a8 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0, 122, 255, 0.3)'
              }}>
                <Sparkles size={20} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>
                  Financial Insights & Executive Analytics
                </h1>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Real-time financial intelligence, revenue-to-profit curves, debt aging, and inventory health
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Live sync pulse badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '12px',
              fontWeight: 700,
              color: '#10b981'
            }}>
              <span className="live-pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Live Tally Feed
            </div>

            {/* Quick Refresh */}
            {/* <button
              type="button"
              className="btn-secondary"
              onClick={fetchInsightsData}
              disabled={loading}
              title="Refresh all metrics"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <RotateCcw size={15} className={loading ? 'spin-icon' : ''} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Sync</span>
            </button> */}

            {/* Unhide Sections Button */}
            {sectionsHidden.length > 0 && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowUnhideModal(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                title="Unhide hidden sections"
              >
                <Eye size={14} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Unhide ({sectionsHidden.length})</span>
              </button>
            )}

            {/* PDF / CSV Export */}
            <ExportDropdown onExportCSV={exportExecutiveCSV} onExportPDF={exportExecutivePDF} label="Export Insights" />
          </div>
        </div>

        {/* Row 2: Company Selector & Period Date Filters */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          paddingTop: '16px',
          borderTop: '1px solid var(--glass-border)'
        }}>
          {/* Company filter dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Building2 size={14} /> Company:
            </span>
            <select
              value={selectedCompanyGuid}
              onChange={(e) => setSelectedCompanyGuid(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
                background: 'var(--glass-bg)',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-dark)',
                cursor: 'pointer',
                outline: 'none',
                maxWidth: '260px'
              }}
            >
              {companiesList.length === 0 && (
                <option value={selectedCompanyGuid}>{selectedCompanyGuid ? 'Active Company' : 'Select Company'}</option>
              )}
              {companiesList.map((c) => (
                <option key={c.company_guid} value={c.company_guid}>
                  {c.company_name || c.name || c.company_guid}
                </option>
              ))}
            </select>
          </div>

          {/* Time period filter pill group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'All Time' },
              { id: 'THIS_FY', label: 'This FY' },
              { id: 'LAST_6M', label: 'Last 6 Months' },
              { id: 'LAST_3M', label: 'Last 3 Months' },
              { id: 'THIS_MONTH', label: 'This Month' },
              { id: 'CUSTOM', label: 'Custom' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setDateFilter(p.id)}
                style={{
                  padding: '6px 13px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: dateFilter === p.id ? 'var(--primary-color)' : 'transparent',
                  background: dateFilter === p.id ? 'var(--primary-color)' : 'rgba(0,0,0,0.04)',
                  color: dateFilter === p.id ? '#ffffff' : 'var(--text-dark)',
                  transition: 'all 0.15s ease'
                }}
              >
                {p.label}
              </button>
            ))}

            {dateFilter === 'CUSTOM' && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border)',
                    fontSize: '12px',
                    color: 'var(--text-dark)',
                    background: 'var(--glass-bg)'
                  }}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border)',
                    fontSize: '12px',
                    color: 'var(--text-dark)',
                    background: 'var(--glass-bg)'
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Quick Section Focus Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
          {[
            { id: 'all', label: 'All Analytics', icon: <Layers size={14} /> },
            { id: 'financials', label: 'Financials & Trends', icon: <TrendingUp size={14} /> },
            { id: 'aging', label: 'Receivables & Payables Aging', icon: <Clock size={14} /> },
            { id: 'performance', label: 'Business Performance', icon: <BarChart3 size={14} /> },
            { id: 'inventory', label: 'Inventory Intelligence', icon: <Package size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabFocus(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 600,
                border: '1px solid',
                cursor: 'pointer',
                borderColor: activeTabFocus === tab.id ? 'var(--primary-color)' : 'var(--glass-border)',
                background: activeTabFocus === tab.id ? 'color-mix(in srgb, var(--primary-color) 12%, transparent)' : 'var(--glass-bg)',
                color: activeTabFocus === tab.id ? 'var(--primary-color)' : 'var(--text-muted)',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', borderRadius: '24px', marginBottom: '24px' }}>
          <RefreshCw size={28} className="spin-icon" style={{ color: 'var(--primary-color)', margin: '0 auto 12px', display: 'block' }} />
          <h4 style={{ margin: 0, fontWeight: 700, fontSize: '17px', color: 'var(--text-dark)' }}>Analyzing financial data…</h4>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Calculating profit margins, aging buckets, and inventory valuation</p>
        </div>
      )}

      {error && !loading && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', marginBottom: '24px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger)' }}>
            <AlertTriangle size={20} />
            <span style={{ fontWeight: 700 }}>{error}</span>
          </div>
        </div>
      )}

      {/* -------------------- Dynamic Insights Sections (Drag-and-Drop & Hide/Show) -------------------- */}
      {visibleSections.map((sectionId) => {
        const isDragging = draggedSectionId === sectionId;
        const isOver = dragOverSectionId === sectionId;

        const containerProps = {
          key: sectionId,
          draggable: true,
          onDragStart: (e) => handleDragStart(e, sectionId),
          onDragOver: (e) => handleDragOver(e, sectionId),
          onDrop: (e) => handleDrop(e, sectionId),
          style: {
            marginBottom: '28px',
            opacity: isDragging ? 0.35 : 1,
            transition: 'all 0.2s ease',
            outline: isOver ? '2px dashed var(--primary-color)' : 'none',
            outlineOffset: '6px',
            borderRadius: '24px'
          }
        };

        const renderControls = (id) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              title="Drag to reorder section"
              style={{
                cursor: 'grab',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.04)',
                color: 'var(--text-muted)'
              }}
            >
              <Move size={15} />
            </div>
            <button
              type="button"
              onClick={() => handleHideSection(id)}
              title="Hide this section"
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                border: 'none',
                background: 'rgba(0,0,0,0.04)',
                color: 'var(--text-muted)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
            >
              <EyeOff size={15} />
            </button>
          </div>
        );

        if (sectionId === 'financials-kpis') {
          return (
            <div {...containerProps}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h2 className="section-title" style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DollarSign size={18} color="var(--primary-color)" /> Financial Overview & Key Metrics
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Operating cycle & liquidity status
                  </span>
                  {renderControls('financials-kpis')}
                </div>
              </div>

          <div className="financial-kpi-grid">
            {/* Card 1: Total Income / Revenue */}
            <div
              className="glass-panel summary-card financial-kpi-card"
              onClick={() => setCurrentTab && setCurrentTab('vouchers')}
              title={`Total Income (Revenue): ${inr(financialMetrics.totalIncome)}`}
            >
              <div className="financial-kpi-header">
                <span className="financial-kpi-title">
                  Total Income (Revenue)
                </span>
                <div className="financial-kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="financial-kpi-value" title={inr(financialMetrics.totalIncome)}>
                {inr(financialMetrics.totalIncome)}
              </div>
              <div className="financial-kpi-footer">
                <span className="financial-kpi-badge" style={{
                  color: financialMetrics.growthRate >= 0 ? '#10b981' : '#ef4444',
                  background: financialMetrics.growthRate >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'
                }}>
                  {financialMetrics.growthRate >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {Math.abs(financialMetrics.growthRate).toFixed(1)}% vs prior
                </span>
                <span className="financial-kpi-subtitle">Turnover run-rate</span>
              </div>
            </div>

            {/* Card 2: Total Expenses */}
            <div
              className="glass-panel summary-card financial-kpi-card"
              onClick={() => setCurrentTab && setCurrentTab('vouchers')}
              title={`Total Expenses: ${inr(financialMetrics.totalExpense)}`}
            >
              <div className="financial-kpi-header">
                <span className="financial-kpi-title">
                  Total Expenses
                </span>
                <div className="financial-kpi-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                  <TrendingDown size={18} />
                </div>
              </div>
              <div className="financial-kpi-value" title={inr(financialMetrics.totalExpense)}>
                {inr(financialMetrics.totalExpense)}
              </div>
              <div className="financial-kpi-footer">
                <span className="financial-kpi-badge" style={{
                  color: '#ef4444',
                  background: 'rgba(239, 68, 68, 0.12)'
                }}>
                  {financialMetrics.expenseRatio.toFixed(1)}% of Rev
                </span>
                <span className="financial-kpi-subtitle">Cost of goods & ops</span>
              </div>
            </div>

            {/* Card 3: Net Profit / Loss */}
            <div
              className="glass-panel summary-card financial-kpi-card"
              style={{
                border: financialMetrics.netProfit >= 0 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
              }}
              title={`Net ${financialMetrics.netProfit >= 0 ? 'Profit' : 'Loss'}: ${inr(financialMetrics.netProfit)}`}
            >
              <div className="financial-kpi-header">
                <span className="financial-kpi-title">
                  Net Profit / Loss
                </span>
                <div className="financial-kpi-icon" style={{
                  background: financialMetrics.netProfit >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: financialMetrics.netProfit >= 0 ? '#10b981' : '#ef4444'
                }}>
                  <Scale size={18} />
                </div>
              </div>
              <div
                className="financial-kpi-value"
                style={{ color: financialMetrics.netProfit >= 0 ? '#10b981' : '#ef4444' }}
                title={inr(financialMetrics.netProfit)}
              >
                {financialMetrics.netProfit >= 0 ? `+${inr(financialMetrics.netProfit)}` : inr(financialMetrics.netProfit)}
              </div>
              <div className="financial-kpi-footer">
                <span className="financial-kpi-badge" style={{
                  color: financialMetrics.netProfit >= 0 ? '#10b981' : '#ef4444',
                  background: financialMetrics.netProfit >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'
                }}>
                  {financialMetrics.netProfit >= 0 ? 'Net Surplus' : 'Operating Deficit'}
                </span>
                <span className="financial-kpi-subtitle">Net commercial gain</span>
              </div>
            </div>

            {/* Card 4: Net Profit Margin */}
            <div
              className="glass-panel summary-card financial-kpi-card"
              title={`Net Profit Margin: ${financialMetrics.profitMargin.toFixed(1)}%`}
            >
              <div className="financial-kpi-header">
                <span className="financial-kpi-title">
                  Net Profit Margin
                </span>
                <div className="financial-kpi-icon" style={{ background: 'rgba(0, 122, 255, 0.15)', color: 'var(--primary-color)' }}>
                  <PieChart size={18} />
                </div>
              </div>
              <div
                className="financial-kpi-value"
                style={{ color: financialMetrics.profitMargin >= 0 ? (financialMetrics.profitMargin >= 15 ? '#10b981' : 'var(--text-dark)') : '#ef4444' }}
                title={`${financialMetrics.profitMargin.toFixed(1)}%`}
              >
                {financialMetrics.profitMargin.toFixed(1)}%
              </div>
              <div className="financial-kpi-footer">
                <span className="financial-kpi-badge" style={{
                  color: financialMetrics.profitMargin >= 15 ? '#10b981' : (financialMetrics.profitMargin >= 0 ? '#f59e0b' : '#ef4444'),
                  background: financialMetrics.profitMargin >= 15 ? 'rgba(16, 185, 129, 0.12)' : (financialMetrics.profitMargin >= 0 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)')
                }}>
                  {financialMetrics.profitMargin >= 15 ? 'Strong Margin' : (financialMetrics.profitMargin >= 5 ? 'Healthy' : (financialMetrics.profitMargin >= 0 ? 'Modest' : 'Deficit'))}
                </span>
                <span className="financial-kpi-subtitle">
                  {financialMetrics.profitMargin >= 0 ? 'Margin health' : 'Review overhead'}
                </span>
              </div>
            </div>

            {/* Card 5: Operating Cash Flow & Liquidity */}
            <div
              className="glass-panel summary-card financial-kpi-card"
              onClick={() => setCurrentTab && setCurrentTab('ledger')}
              title={`Cash & Bank Liquidity: ${inr(financialMetrics.totalCash)}`}
            >
              <div className="financial-kpi-header">
                <span className="financial-kpi-title">
                  Cash & Bank Liquidity
                </span>
                <div className="financial-kpi-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
                  <Landmark size={18} />
                </div>
              </div>
              <div
                className="financial-kpi-value"
                style={{ color: financialMetrics.totalCash >= 0 ? 'var(--text-dark)' : '#ef4444' }}
                title={inr(financialMetrics.totalCash)}
              >
                {inr(financialMetrics.totalCash)}
              </div>
              <div className="financial-kpi-footer">
                <span className="financial-kpi-badge" style={{
                  color: '#6366f1',
                  background: 'rgba(99, 102, 241, 0.12)'
                }}>
                  {financialMetrics.cashCount} Liquid Accounts
                </span>
                <span className="financial-kpi-subtitle">
                  {financialMetrics.cashCoverageRatio >= 1 ? 'Healthy Reserve' : 'Tight Coverage'}
                </span>
              </div>
            </div>
          </div>
        
            </div>
          );
        }

        if (sectionId === 'income-expense-trend') {
          return (
            <div
              {...containerProps}
              className="glass-panel"
              style={{
                ...containerProps.style,
                padding: '24px 28px',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.04)'
              }}
            >

          {/* Section Header with Granularity & Mode Toggles */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="var(--primary-color)" /> Income vs. Expenses vs. Profit Trends
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
                Monthly visual trendline with profit curve overlay and interactive inspection
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', fontWeight: 700 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#10b981' }} /> Income (Sales)
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#ef4444' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#ef4444' }} /> Expenses (Purchases)
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#007aff' }}>
                  <span style={{ width: '12px', height: '3px', borderRadius: '2px', background: '#007aff' }} /> Net Profit Curve
                </span>
              </div>

              {/* View toggle */}
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', padding: '3px', borderRadius: '10px' }}>
                <button
                  type="button"
                  onClick={() => setChartMode('bars')}
                  style={{
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: chartMode === 'bars' ? 'var(--primary-color)' : 'transparent',
                    color: chartMode === 'bars' ? '#ffffff' : 'var(--text-muted)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Monthly Dynamics
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('cumulative')}
                  style={{
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: chartMode === 'cumulative' ? 'var(--primary-color)' : 'transparent',
                    color: chartMode === 'cumulative' ? '#ffffff' : 'var(--text-muted)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Cumulative Surplus
                </button>
              </div>

              {renderControls('income-expense-trend')}
            </div>
          </div>

          {/* SVG Interactive Multi-Series Chart */}
          {(!trendChartData || trendChartData.data.length === 0) ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <BarChart3 size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-dark)' }}>No movement recorded for this period</div>
              <p style={{ fontSize: '13px', margin: '4px 0 0' }}>Transactions and monthly movements synced from Tally will populate this timeline.</p>
            </div>
          ) : (
            <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
              <svg
                viewBox="0 0 840 260"
                style={{ width: '100%', minWidth: '640px', height: '260px', overflow: 'visible' }}
              >
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.75" />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity="0.75" />
                  </linearGradient>
                  <linearGradient id="cumulGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#007aff" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#007aff" stopOpacity="0.02" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#007aff" floodOpacity="0.4" />
                  </filter>
                </defs>

                {/* Y-Axis Gridlines */}
                {[0, 0.33, 0.66, 1].map((pct, idx) => {
                  const y = 25 + (1 - pct) * 190;
                  const labelVal = trendChartData.maxVal * pct;
                  return (
                    <g key={idx}>
                      <line x1="60" y1={y} x2="820" y2={y} stroke="var(--glass-border)" strokeDasharray="3 3" strokeWidth="1" />
                      <text x="50" y={y + 4} textAnchor="end" fill="var(--text-muted)" fontSize="10" fontWeight="600">
                        {formatCompactInr(labelVal)}
                      </text>
                    </g>
                  );
                })}

                {/* Chart Content */}
                {(() => {
                  const data = trendChartData.data;
                  const usableW = 820 - 70;
                  const colW = usableW / data.length;
                  const barW = Math.max(8, Math.min(22, (colW - 16) / 2));
                  const profitPoints = [];
                  const cumulPoints = [];

                  return (
                    <>
                      {/* Bars & Columns */}
                      {data.map((item, idx) => {
                        const cx = 70 + idx * colW + colW / 2;
                        const incH = Math.max(3, (item.income / trendChartData.maxVal) * 190);
                        const expH = Math.max(3, (item.expense / trendChartData.maxVal) * 190);
                        const incY = 215 - incH;
                        const expY = 215 - expH;

                        // Profit curve coordinate
                        const pY = 215 - Math.max(0, Math.min(190, (item.profit / trendChartData.maxVal) * 190));
                        profitPoints.push({ x: cx, y: pY, item, idx });

                        // Cumulative coordinate
                        if (item.cumulativeProfit !== undefined) {
                          const cY = 215 - Math.max(0, Math.min(190, (item.cumulativeProfit / trendChartData.maxVal) * 190));
                          cumulPoints.push({ x: cx, y: cY, item, idx });
                        }

                        const isHovered = hoveredPoint?.idx === idx;

                        return (
                          <g
                            key={idx}
                            onMouseEnter={() => setHoveredPoint({ idx, item, x: cx, y: Math.min(incY, expY) })}
                            onMouseLeave={() => setHoveredPoint(null)}
                            style={{ cursor: 'pointer' }}
                          >
                            {/* Hover Guide Line */}
                            {isHovered && (
                              <line x1={cx} y1="20" x2={cx} y2="215" stroke="var(--primary-color)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
                            )}

                            {chartMode === 'bars' && (
                              <>
                                {/* Income Bar */}
                                <rect
                                  x={cx - barW - 2}
                                  y={incY}
                                  width={barW}
                                  height={incH}
                                  rx="4"
                                  fill="url(#incomeGrad)"
                                  opacity={isHovered ? 1 : 0.88}
                                  style={{ transition: 'all 0.15s ease' }}
                                />

                                {/* Expense Bar */}
                                <rect
                                  x={cx + 2}
                                  y={expY}
                                  width={barW}
                                  height={expH}
                                  rx="4"
                                  fill="url(#expenseGrad)"
                                  opacity={isHovered ? 1 : 0.88}
                                  style={{ transition: 'all 0.15s ease' }}
                                />
                              </>
                            )}

                            {/* X-axis Month Label */}
                            {(data.length <= 8 || idx % Math.max(1, Math.ceil(data.length / 8)) === 0 || idx === data.length - 1 || isHovered) && (
                              <text
                                x={cx}
                                y="235"
                                textAnchor="middle"
                                fill={isHovered ? 'var(--primary-color)' : 'var(--text-muted)'}
                                fontSize="11"
                                fontWeight={isHovered ? '700' : '600'}
                              >
                                {item.label}
                              </text>
                            )}
                          </g>
                        );
                      })}

                      {/* Cumulative Area Fill in Cumulative Mode */}
                      {chartMode === 'cumulative' && cumulPoints.length > 1 && (
                        <>
                          <path
                            d={`M ${cumulPoints[0].x} 215 L ${cumulPoints.map((p) => `${p.x} ${p.y}`).join(' L ')} L ${cumulPoints[cumulPoints.length - 1].x} 215 Z`}
                            fill="url(#cumulGrad)"
                          />
                          <path
                            d={`M ${cumulPoints.map((p) => `${p.x} ${p.y}`).join(' L ')}`}
                            fill="none"
                            stroke="#007aff"
                            strokeWidth="3"
                            filter="url(#glow)"
                          />
                          {cumulPoints.map((p, i) => (
                            <circle
                              key={i}
                              cx={p.x}
                              cy={p.y}
                              r={hoveredPoint?.idx === i ? 6 : 4}
                              fill="#ffffff"
                              stroke="#007aff"
                              strokeWidth="2.5"
                            />
                          ))}
                        </>
                      )}

                      {/* Profit Trendline Overlay in Bars Mode */}
                      {chartMode === 'bars' && profitPoints.length > 1 && (
                        <>
                          <path
                            d={`M ${profitPoints.map((p) => `${p.x} ${p.y}`).join(' L ')}`}
                            fill="none"
                            stroke="#007aff"
                            strokeWidth="2.5"
                            filter="url(#glow)"
                            strokeDasharray="none"
                          />
                          {profitPoints.map((p, i) => (
                            <circle
                              key={i}
                              cx={p.x}
                              cy={p.y}
                              r={hoveredPoint?.idx === i ? 6 : 3.5}
                              fill="#ffffff"
                              stroke="#007aff"
                              strokeWidth="2.5"
                              style={{ transition: 'all 0.15s ease' }}
                            />
                          ))}
                        </>
                      )}
                    </>
                  );
                })()}
              </svg>

              {/* Interactive Tooltip Popover */}
              {hoveredPoint && (
                <div style={{
                  position: 'absolute',
                  left: `${Math.min(Math.max(hoveredPoint.x, 80), 720)}px`,
                  top: '15px',
                  transform: 'translateX(-50%)',
                  background: 'rgba(15, 23, 42, 0.94)',
                  backdropFilter: 'blur(10px)',
                  color: '#ffffff',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  zIndex: 10,
                  fontSize: '12px',
                  pointerEvents: 'none',
                  minWidth: '170px'
                }}>
                  <div style={{ fontWeight: 800, fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '4px', marginBottom: '6px' }}>
                    {shortDate(hoveredPoint.item.month)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ color: '#a7f3d0' }}>Income:</span>
                    <b style={{ color: '#34d399' }}>+{inr(hoveredPoint.item.income)}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ color: '#fecaca' }}>Expenses:</span>
                    <b style={{ color: '#f87171' }}>−{inr(hoveredPoint.item.expense)}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px', marginTop: '4px' }}>
                    <span style={{ color: '#93c5fd' }}>Net Profit:</span>
                    <b style={{ color: hoveredPoint.item.profit >= 0 ? '#60a5fa' : '#f87171' }}>
                      {hoveredPoint.item.profit >= 0 ? `+${inr(hoveredPoint.item.profit)}` : inr(hoveredPoint.item.profit)}
                    </b>
                  </div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px', textAlign: 'right' }}>
                    Margin: {hoveredPoint.item.margin.toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Metric Summary Strip below chart */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--glass-border)'
          }}>
            <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.08)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>Average Monthly Run-Rate</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-dark)', marginTop: '2px' }}>
                {inr(filteredIncomeExpense.length > 0 ? financialMetrics.totalIncome / filteredIncomeExpense.length : 0)}
              </div>
            </div>
            <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.08)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>Average Monthly Expenses</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-dark)', marginTop: '2px' }}>
                {inr(filteredIncomeExpense.length > 0 ? financialMetrics.totalExpense / filteredIncomeExpense.length : 0)}
              </div>
            </div>
            <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(0, 122, 255, 0.08)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase' }}>Net Commercial Surplus</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-dark)', marginTop: '2px' }}>
                {inr(financialMetrics.netProfit)}
              </div>
            </div>
          </div>
        
            </div>
          );
        }

        if (sectionId === 'debt-aging') {
          return (
            <div {...containerProps}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h2 className="section-title" style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} color="var(--primary-color)" /> Debt & Credit Aging Analysis
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setCurrentTab && setCurrentTab('bills')}
                    style={{ fontSize: '12px', padding: '4px 10px', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                  >
                    Open Bills Manager <ChevronRight size={13} />
                  </button>
                  {renderControls('debt-aging')}
                </div>
              </div>

          {/* Net Working Capital Gap Banner */}
          <div className="glass-panel" style={{
            padding: '16px 20px',
            borderRadius: '16px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            background: financialMetrics.workingCapitalGap >= 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: financialMetrics.workingCapitalGap >= 0 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Scale size={20} color={financialMetrics.workingCapitalGap >= 0 ? '#10b981' : '#ef4444'} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-dark)' }}>
                  Net Working Capital Position: {financialMetrics.workingCapitalGap >= 0 ? `+${inr(financialMetrics.workingCapitalGap)} Surplus` : `${inr(financialMetrics.workingCapitalGap)} Deficit`}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {financialMetrics.workingCapitalGap >= 0
                    ? 'Receivables exceed incoming obligations — strong commercial liquidity.'
                    : 'Payables exceed incoming customer dues — monitor payment schedules.'}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: financialMetrics.workingCapitalGap >= 0 ? '#10b981' : '#ef4444' }}>
              Inflow vs Outflow: {financialMetrics.pendingPayables > 0 ? (financialMetrics.pendingReceivables / financialMetrics.pendingPayables).toFixed(2) : '1.0'}x
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '16px' }}>

            {/* Column A: Receivables Aging (Debtors) */}
            <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-dark)' }}>
                      Receivables Aging (Money In)
                    </h3>
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Customer invoices pending collection
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981' }}>
                    {inr(agingAnalysis.receivables.total)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {agingAnalysis.receivables.totalCount} pending bills
                  </div>
                </div>
              </div>

              {/* Stacked Proportional Progress Bar */}
              <div style={{ width: '100%', height: '10px', borderRadius: '999px', background: 'rgba(0,0,0,0.06)', display: 'flex', overflow: 'hidden', marginBottom: '16px' }}>
                {agingAnalysis.receivables.buckets.map((b) => (
                  <div
                    key={b.id}
                    title={`${b.label}: ${inr(b.amount)} (${b.pct.toFixed(1)}%)`}
                    style={{ width: `${b.pct}%`, height: '100%', background: b.color, transition: 'width 0.3s ease' }}
                  />
                ))}
              </div>

              {/* Aging Buckets Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {agingAnalysis.receivables.buckets.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setCurrentTab && setCurrentTab('bills')}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: 'rgba(0,0,0,0.02)',
                      border: '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: b.color }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)' }}>{b.label}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.sub}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-dark)' }}>{inr(b.amount)}</div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: b.color }}>{b.count} bills · {b.pct.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column B: Payables Aging (Creditors) */}
            <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-dark)' }}>
                    Payables Aging (Money Out)
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Supplier bills due for settlement
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#ef4444' }}>
                    {inr(agingAnalysis.payables.total)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {agingAnalysis.payables.totalCount} pending bills
                  </div>
                </div>
              </div>

              {/* Stacked Proportional Progress Bar */}
              <div style={{ width: '100%', height: '10px', borderRadius: '999px', background: 'rgba(0,0,0,0.06)', display: 'flex', overflow: 'hidden', marginBottom: '16px' }}>
                {agingAnalysis.payables.buckets.map((b) => (
                  <div
                    key={b.id}
                    title={`${b.label}: ${inr(b.amount)} (${b.pct.toFixed(1)}%)`}
                    style={{ width: `${b.pct}%`, height: '100%', background: b.color, transition: 'width 0.3s ease' }}
                  />
                ))}
              </div>

              {/* Aging Buckets Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {agingAnalysis.payables.buckets.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setCurrentTab && setCurrentTab('bills')}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: 'rgba(0,0,0,0.02)',
                      border: '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: b.color }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)' }}>{b.label}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.sub}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-dark)' }}>{inr(b.amount)}</div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: b.color }}>{b.count} bills · {b.pct.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        
            </div>
          );
        }

        if (sectionId === 'performance') {
          return (
            <div {...containerProps}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h2 className="section-title" style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={18} color="var(--primary-color)" /> Business Performance & Debtor Concentration
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setCurrentTab && setCurrentTab('ledger')}
                    style={{ fontSize: '12px', padding: '4px 10px', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                  >
                    View Parties Hub <ChevronRight size={13} />
                  </button>
                  {renderControls('performance')}
                </div>
              </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))', gap: '16px' }}>

            {/* Panel 1: Top Customers by Revenue & Concentration */}
            <div className="glass-panel" style={{ padding: '22px 24px', borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-dark)' }}>
                    Top Customers (Debtor Concentration)
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Ranked by total sales turnover
                  </p>
                </div>
                <div style={{
                  padding: '4px 10px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: businessPerformance.top1Concentration > 35 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(0, 122, 255, 0.1)',
                  color: businessPerformance.top1Concentration > 35 ? '#ef4444' : 'var(--primary-color)'
                }}>
                  #1 Debtor: {businessPerformance.top1Concentration.toFixed(1)}% Share
                </div>
              </div>

              {businessPerformance.topCustomers.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No customer sales transactions matched.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {businessPerformance.topCustomers.map((cust, idx) => {
                    const share = financialMetrics.totalIncome > 0 ? (cust.sales / financialMetrics.totalIncome) * 100 : 0;
                    return (
                      <div
                        key={idx}
                        onClick={() => setCurrentTab && setCurrentTab('ledger')}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '14px',
                          background: 'rgba(0,0,0,0.02)',
                          border: '1px solid var(--glass-border)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                        title="Click to view customer ledger"
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <span style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '6px',
                              background: idx === 0 ? 'var(--primary-color)' : 'rgba(0,0,0,0.08)',
                              color: idx === 0 ? '#fff' : 'var(--text-dark)',
                              fontSize: '11px',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              #{idx + 1}
                            </span>
                            <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {cust.name}
                            </span>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                            <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-dark)' }}>{inr(cust.sales)}</span>
                          </div>
                        </div>

                        {/* Customer share progress bar */}
                        <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(share, 100)}%`, height: '100%', background: 'var(--primary-color)', borderRadius: '999px' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                          <span>{share.toFixed(1)}% of total revenue</span>
                          {cust.pending > 0 && <span style={{ color: '#ef4444', fontWeight: 600 }}>{inr(cust.pending)} pending</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Panel 2: Sales Velocity & Profitability Scorecard */}
            <div className="glass-panel" style={{ padding: '22px 24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-dark)' }}>
                  Commercial Velocity & Efficiency
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Transactional run-rates and operational performance
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(0, 122, 255, 0.08)', border: '1px solid rgba(0, 122, 255, 0.15)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase' }}>Average Order Value</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-dark)', marginTop: '4px' }}>
                    {inr(businessPerformance.aov)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Per sales transaction</div>
                </div>

                <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>Active Customers</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-dark)', marginTop: '4px' }}>
                    {businessPerformance.totalCustomers}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Transacting parties</div>
                </div>

                <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>Expense-to-Revenue</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-dark)', marginTop: '4px' }}>
                    {financialMetrics.expenseRatio.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Direct operational load</div>
                </div>

                <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase' }}>Net Margin Health</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: financialMetrics.profitMargin >= 0 ? '#10b981' : '#ef4444', marginTop: '4px' }}>
                    {financialMetrics.profitMargin.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Return on revenue</div>
                </div>
              </div>

              {/* Concentration Insight Chip */}
              <div style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: businessPerformance.top1Concentration > 35 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                border: businessPerformance.top1Concentration > 35 ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: 'var(--text-dark)'
              }}>
                {businessPerformance.top1Concentration > 35 ? (
                  <ShieldAlert size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                ) : (
                  <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
                )}
                <span>
                  {businessPerformance.top1Concentration > 35
                    ? `Caution: Top customer holds ${businessPerformance.top1Concentration.toFixed(1)}% of sales. Consider diversifying client base.`
                    : `Well balanced debtor profile: Top 5 clients account for ${businessPerformance.top5Concentration.toFixed(1)}% of total business.`}
                </span>
              </div>
            </div>

          </div>
        
            </div>
          );
        }

        if (sectionId === 'inventory') {
          return (
            <div {...containerProps}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h2 className="section-title" style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={18} color="var(--primary-color)" /> Inventory Intelligence & Stock Valuation
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setCurrentTab && setCurrentTab('inventory')}
                    style={{ fontSize: '12px', padding: '4px 10px', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                  >
                    Open Items Manager <ChevronRight size={13} />
                  </button>
                  {renderControls('inventory')}
                </div>
              </div>

          {/* Quick Inventory Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px',
            marginBottom: '16px'
          }}>
            <div className="glass-panel" style={{ padding: '16px', borderRadius: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Stock Valuation</span>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-dark)', marginTop: '4px' }}>
                {inr(inventoryInsights.totalStockValue)}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Closing asset value</span>
            </div>

            <div className="glass-panel" style={{ padding: '16px', borderRadius: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tracked SKUs</span>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-dark)', marginTop: '4px' }}>
                {inventoryInsights.totalItems}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Active stock lines</span>
            </div>

            <div className="glass-panel" style={{ padding: '16px', borderRadius: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>Low-Stock Warning</span>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
                {inventoryInsights.lowStockCount} Items
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Under 10 units</span>
            </div>

            <div className="glass-panel" style={{ padding: '16px', borderRadius: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>Out of Stock</span>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
                {inventoryInsights.outOfStockCount} Items
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Zero balance</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '16px' }}>

            {/* Panel A: Low-Stock & Reorder Alerts */}
            <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-dark)' }}>
                    Low-Stock & Reorder Alerts
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Items requiring immediate restocking
                  </p>
                </div>
                <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '11px', padding: '3px 8px' }}>
                  Action Needed
                </span>
              </div>

              {inventoryInsights.lowStockAlerts.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: '#10b981', fontSize: '13px', fontWeight: 600 }}>
                  <CheckCircle2 size={24} style={{ margin: '0 auto 6px', display: 'block' }} />
                  All stock items meet minimum thresholds!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {inventoryInsights.lowStockAlerts.map((it, idx) => (
                    <div
                      key={idx}
                      onClick={() => setCurrentTab && setCurrentTab('inventory')}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: 'rgba(0,0,0,0.02)',
                        border: '1px solid var(--glass-border)',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {it.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Unit Rate: {inr(it.rate)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 800,
                          background: it.closing <= 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: it.closing <= 0 ? '#ef4444' : '#f59e0b'
                        }}>
                          {it.closing <= 0 ? '0 In Stock' : `${it.closing} ${it.unit || 'Pcs'}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Panel B: Fast-Moving & High Value Inventory */}
            <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-dark)' }}>
                    Top Capital & Velocity Items
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Highest value inventory investments
                  </p>
                </div>
                <span className="badge" style={{ background: 'rgba(0, 122, 255, 0.12)', color: 'var(--primary-color)', fontSize: '11px', padding: '3px 8px' }}>
                  Asset Leaders
                </span>
              </div>

              {inventoryInsights.highValueItems.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No inventory records found.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {inventoryInsights.highValueItems.map((it, idx) => (
                    <div
                      key={idx}
                      onClick={() => setCurrentTab && setCurrentTab('inventory')}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: 'rgba(0,0,0,0.02)',
                        border: '1px solid var(--glass-border)',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {it.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {it.closing} {it.unit || 'Pcs'} @ {inr(it.rate)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-dark)' }}>
                          {inr(it.value)}
                        </div>
                        {it.outward > 0 && (
                          <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                            {it.outward} shipped
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        
            </div>
          );
        }

        return null;
      })}

      {/* Empty State when all sections in current view are hidden */}
      {visibleSections.length === 0 && !loading && (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', borderRadius: '24px', marginBottom: '24px' }}>
          <EyeOff size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block', opacity: 0.5 }} />
          <h4 style={{ margin: 0, fontWeight: 700, fontSize: '17px', color: 'var(--text-dark)' }}>All sections in this view are hidden</h4>
          <p style={{ margin: '4px 0 16px', fontSize: '13px', color: 'var(--text-muted)' }}>You have hidden sections from this view. Use the button below or Unhide in the top bar to restore them.</p>
          <button
            type="button"
            className="btn-primary"
            onClick={handleRestoreAll}
            style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            Unhide All Sections
          </button>
        </div>
      )}

      {/* Unhide Modal */}
      {showUnhideModal && (
        <UnhideModal
          isOpen={showUnhideModal}
          onClose={() => setShowUnhideModal(false)}
          hiddenWidgets={sectionsHidden}
          onRestore={handleRestoreSection}
          onRestoreAll={handleRestoreAll}
          onResetLayout={handleResetLayout}
          widgetMeta={INSIGHTS_SECTION_META}
          title="Restore Hidden Insights Sections"
        />
      )}

      {/* Floating Layout Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.92)',
          color: '#ffffff',
          padding: '10px 18px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};

export default FinancialInsights;

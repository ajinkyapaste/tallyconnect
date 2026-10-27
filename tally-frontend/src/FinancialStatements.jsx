import React, { useState, useMemo } from 'react';
import {
  BarChart2, BookOpen, FileSpreadsheet, Upload,
  ArrowLeft, Search, Download, TrendingUp, TrendingDown,
  DollarSign, CheckCircle2, ChevronRight, Filter,
  Building2, Users, Package, Wallet, CreditCard,
  FileText, Calendar, ArrowUpRight, ArrowDownRight, Layers, X,
  Pin, Sparkles
} from 'lucide-react';
import { ExportDropdown, ScheduleButton, createHoldTouchHandler } from './uiUtils';
import StandardDateFilter from './StandardDateFilter';
import { useCardGridPreferences, CardContextMenu, HiddenCardsChip } from './CardGridPreferences';
import BitrixFilterBar from './BitrixFilterBar';

const inr = (n) => `₹ ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const formatShortInr = (val) => {
  if (val === 0) return '₹0';
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)}L`;
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}k`;
  return `${sign}₹${abs.toFixed(0)}`;
};
const shortDate = (s) => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

/* =========================================================================
   1. PROFIT & LOSS VIEW
   ========================================================================= */
export function ProfitLossView({
  pnlMetrics,
  financialSummary,
  filteredVouchers,
  onBack,
  dateFilter,
  setDateFilter,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  periodLabel,
  onExportCSV,
  onExportPDF,
  loading
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('statement'); // 'statement' | 'monthly' | 'vouchers'

  const {
    sales = 0,
    purchases = 0,
    directExpenses = 0,
    grossProfit = 0,
    grossProfitMargin = 0,
    indirectIncome = 0,
    indirectExpenses = 0,
    netProfit = 0,
    netProfitMargin = 0,
    isProfit = true
  } = pnlMetrics || {};

  // Monthly breakdown derived from vouchers
  const monthlyBreakdown = useMemo(() => {
    const map = {};
    (filteredVouchers || []).forEach(v => {
      if (!v.voucher_date) return;
      const d = new Date(v.voucher_date);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      if (!map[key]) {
        map[key] = { key, label, revenue: 0, cost: 0, expenses: 0, sortKey: d.getTime() };
      }
      const amt = Number(v.amount || v.net_amount) || 0;
      const type = String(v.voucher_type || '').toLowerCase();
      if (/sale/i.test(type)) {
        map[key].revenue += amt;
      } else if (/purchase/i.test(type)) {
        map[key].cost += amt;
      } else if (/payment/i.test(type)) {
        map[key].expenses += amt;
      }
    });

    const list = Object.values(map).sort((a, b) => a.sortKey - b.sortKey);
    return list.map(m => ({
      ...m,
      net: m.revenue - (m.cost + m.expenses),
      margin: m.revenue > 0 ? (((m.revenue - (m.cost + m.expenses)) / m.revenue) * 100).toFixed(1) : '0.0'
    }));
  }, [filteredVouchers]);

  // Filtered vouchers list for the drilldown
  const relevantVouchers = useMemo(() => {
    return (filteredVouchers || []).filter(v => {
      const type = String(v.voucher_type || '').toLowerCase();
      const isRelevant = /sale|purchase|receipt|payment/i.test(type);
      if (!isRelevant) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(v.party_name || '').toLowerCase().includes(q) ||
        String(v.voucher_type || '').toLowerCase().includes(q) ||
        String(v.reference_no || '').toLowerCase().includes(q)
      );
    });
  }, [filteredVouchers, searchQuery]);

  const pnlCards = useMemo(() => [
    {
      id: 'pnl-sales',
      key: 'sales',
      label: 'Sales Revenue',
      value: inr(sales),
      note: `${financialSummary?.salesCount || 0} sales invoice(s)`,
      icon: TrendingUp,
      color: '#10b981',
      tint: '16, 185, 129'
    },
    {
      id: 'pnl-purchases',
      key: 'purchases',
      label: 'Cost of Sales (Purchases)',
      value: inr(purchases),
      note: `${financialSummary?.purchasesCount || 0} purchase bill(s)`,
      icon: TrendingDown,
      color: '#ef4444',
      tint: '239, 68, 68'
    },
    {
      id: 'pnl-gross-profit',
      key: 'gross-profit',
      label: 'Gross Profit',
      value: inr(grossProfit),
      note: `Margin: ${grossProfitMargin.toFixed(1)}% of sales`,
      icon: BarChart2,
      color: grossProfit >= 0 ? '#0ea5e9' : '#ef4444',
      tint: '14, 165, 233'
    },
    {
      id: 'pnl-operating-expenses',
      key: 'operating-expenses',
      label: 'Operating Expenses',
      value: inr(indirectExpenses + directExpenses),
      note: 'Operational payments & overheads',
      icon: Upload,
      color: '#f59e0b',
      tint: '245, 158, 11'
    },
    {
      id: 'pnl-net-profit',
      key: 'net-profit',
      label: 'Net Profit / (Loss)',
      value: inr(netProfit),
      note: `Net Margin: ${netProfitMargin.toFixed(1)}%`,
      icon: isProfit ? TrendingUp : TrendingDown,
      color: isProfit ? '#10b981' : '#ef4444',
      tint: isProfit ? '16, 185, 129' : '239, 68, 68',
      highlight: true
    }
  ], [sales, purchases, grossProfit, grossProfitMargin, indirectExpenses, directExpenses, netProfit, netProfitMargin, isProfit, financialSummary]);

  const {
    visibleCards: visiblePnlCards,
    hiddenCards: hiddenPnlCards,
    pinned: pinnedPnlCards,
    cardSizes: pnlCardSizes,
    setCardSize: setPnlCardSize,
    menu: pnlMenu,
    setMenu: setPnlMenu,
    togglePin: togglePnlPin,
    moveUp: moveUpPnlCard,
    moveDown: moveDownPnlCard,
    hide: hidePnlCard,
    unhide: unhidePnlCard,
    unhideAll: unhideAllPnlCards,
    reset: resetPnlCards,
    handleDragStart: onPnlDragStart,
    handleDragOver: onPnlDragOver,
    handleDrop: onPnlDrop,
    handleDragEnd: onPnlDragEnd,
    openMenu: openPnlMenu,
    isPinned: isPnlPinned,
  } = useCardGridPreferences('tc_pnl_kpi', pnlCards);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {loading && (
        <div style={{ height: '3px', width: '100%', background: 'rgba(79, 70, 229, 0.1)', overflow: 'hidden', borderRadius: '2px' }}>
          <div style={{ height: '100%', width: '40%', background: 'var(--primary-color)', borderRadius: '2px', animation: 'indeterminate 1.5s infinite ease-in-out' }} />
        </div>
      )}
      {/* View Header */}
      <div className="glass-panel" style={{
        padding: '20px 24px', borderRadius: '20px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            className="icon-btn"
            onClick={onBack}
            style={{
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              borderRadius: '12px', padding: '8px', cursor: 'pointer'
            }}
            title="Back to Reports"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(225, 29, 72, 0.1)', color: '#be123c',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <BarChart2 size={20} />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>
                Profit & Loss Account
              </h2>
              <span style={{
                fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                padding: '3px 9px', borderRadius: '8px',
                background: isProfit ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                color: isProfit ? '#10b981' : '#ef4444'
              }}>
                {isProfit ? 'Net Surplus' : 'Net Deficit'}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
              Trading & Profit & Loss Statement · {periodLabel}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <StandardDateFilter
            value={dateFilter}
            onChange={setDateFilter}
            customStart={customStart}
            onCustomStartChange={setCustomStart}
            customEnd={customEnd}
            onCustomEndChange={setCustomEnd}
          />

          <ExportDropdown onExportCSV={onExportCSV} onExportPDF={onExportPDF} />
          <ScheduleButton onClick={() => window.__tc_show_toast ? window.__tc_show_toast('Schedule email configured for Profit & Loss') : alert('Schedule email configured for Profit & Loss')} />
        </div>
      </div>

      {/* Draggable & Resizable Summary Cards */}
      <HiddenCardsChip hiddenCards={hiddenPnlCards} onUnhide={unhidePnlCard} />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
        gap: '14px'
      }}>
        {visiblePnlCards.map((c) => {
          const Icon = c.icon || BarChart2;
          const pinnedCard = isPnlPinned(c.id);
          const size = pnlCardSizes[c.id] || 'normal';
          const isWide = size === 'wide';
          const isCompact = size === 'compact';

          return (
            <div
              key={c.id}
              className={`glass-panel draggable-card ${pinnedCard ? 'is-pinned' : ''} ${isWide ? 'is-wide' : ''} ${isCompact ? 'is-compact' : ''}`}
              role="button"
              tabIndex={0}
              draggable={true}
              onDragStart={(e) => onPnlDragStart(e, c.id)}
              onDragOver={(e) => onPnlDragOver(e, c.id)}
              onDrop={(e) => onPnlDrop(e, c.id)}
              onDragEnd={onPnlDragEnd}
              onContextMenu={(e) => openPnlMenu(e, c)}
              {...createHoldTouchHandler((pos) => openPnlMenu({ clientX: pos.x, clientY: pos.y, preventDefault: () => {} }, c))}
              title={`${c.label} • Drag to reorder • Right-click or hold for options`}
              style={{
                padding: isCompact ? '12px 14px' : '18px 20px',
                borderRadius: '16px',
                cursor: 'pointer',
                textAlign: 'left',
                position: 'relative',
                gridColumn: isWide ? 'span 2' : undefined,
                border: pinnedCard ? `2px solid rgb(${c.tint})` : (c.highlight ? (isProfit ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)') : undefined),
                background: pinnedCard ? `rgba(${c.tint}, 0.08)` : (c.highlight ? (isProfit ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.02) 100%), var(--glass-bg)' : 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(185, 28, 28, 0.02) 100%), var(--glass-bg)') : undefined),
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {pinnedCard && (
                <span className="card-pin-badge" title="Pinned to top">
                  <Pin size={11} />
                </span>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isCompact ? '4px' : '8px' }}>
                <span style={{ fontSize: isCompact ? '11px' : '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.4px' }}>
                  {c.label}
                </span>
                <div style={{
                  width: isCompact ? 24 : 28,
                  height: isCompact ? 24 : 28,
                  borderRadius: 8,
                  background: `rgba(${c.tint}, 0.12)`,
                  color: c.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={isCompact ? 13 : 15} />
                </div>
              </div>
              <div style={{ fontSize: isCompact ? '18px' : '22px', fontWeight: 800, color: c.color }}>
                {c.value}
              </div>
              {c.note && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>
                  {c.note}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <CardContextMenu
        menu={pnlMenu}
        onClose={() => setPnlMenu(null)}
        pinned={pinnedPnlCards}
        onTogglePin={togglePnlPin}
        onMoveUp={moveUpPnlCard}
        onMoveDown={moveDownPnlCard}
        onHide={hidePnlCard}
        onReset={resetPnlCards}
        onUnhideAll={unhideAllPnlCards}
        hiddenCount={hiddenPnlCards.length}
        cardSizes={pnlCardSizes}
        onSetSize={setPnlCardSize}
        onShare={(c) => {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(`${c.label}: ${c.value} (Profit & Loss)`);
          }
        }}
      />

      {/* Tabs Switcher: Statement | Monthly Trend | Transaction Entries */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
        {[
          { id: 'statement', label: 'Financial Statement' },
          { id: 'monthly', label: 'Monthly Breakdown' },
          { id: 'vouchers', label: `Relevant Vouchers (${relevantVouchers.length})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '8px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: 700,
              cursor: 'pointer', border: 'none',
              background: activeTab === t.id ? 'var(--primary-color)' : 'var(--glass-bg)',
              color: activeTab === t.id ? '#fff' : 'var(--text-muted)',
              boxShadow: activeTab === t.id ? '0 4px 12px rgba(79, 70, 229, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Structured Financial Statement (Tally Trading & P&L Format) */}
      {activeTab === 'statement' && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--glass-hover)', borderBottom: '2px solid var(--glass-border)', textTransform: 'uppercase', fontSize: '11.5px' }}>
                  <th style={{ padding: '14px 18px' }}>Particulars</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Schedule / Type</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Debit (₹)</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Credit (₹)</th>
                </tr>
              </thead>
              <tbody>
                {/* 1. TRADING ACCOUNT SECTION */}
                <tr style={{ background: 'color-mix(in srgb, var(--primary-color) 6%, transparent)', fontWeight: 800 }}>
                  <td colSpan="4" style={{ padding: '12px 18px', color: 'var(--primary-color)', letterSpacing: '0.5px' }}>
                    I. TRADING ACCOUNT (GROSS SURPLUS DETERMINATION)
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '12px 18px', fontWeight: 600 }}>Sales Turnover (Revenue from Operations)</td>
                  <td style={{ padding: '12px 18px', textAlign: 'right', color: 'var(--text-muted)' }}>Direct Income</td>
                  <td style={{ padding: '12px 18px', textAlign: 'right' }}>—</td>
                  <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>{inr(sales)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '12px 18px', fontWeight: 600 }}>Less: Purchases & Material Costs</td>
                  <td style={{ padding: '12px 18px', textAlign: 'right', color: 'var(--text-muted)' }}>Direct Outflow</td>
                  <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>{inr(purchases)}</td>
                  <td style={{ padding: '12px 18px', textAlign: 'right' }}>—</td>
                </tr>
                {directExpenses > 0 && (
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '12px 18px', fontWeight: 600 }}>Direct Manufacturing & Carriage Charges</td>
                    <td style={{ padding: '12px 18px', textAlign: 'right', color: 'var(--text-muted)' }}>Direct Expenses</td>
                    <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>{inr(directExpenses)}</td>
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>—</td>
                  </tr>
                )}
                <tr style={{ background: 'var(--glass-hover)', fontWeight: 800, borderBottom: '2px solid var(--glass-border)' }}>
                  <td style={{ padding: '14px 18px' }}>GROSS PROFIT c/d</td>
                  <td style={{ padding: '14px 18px', textAlign: 'right', color: 'var(--text-muted)' }}>Gross Trading Surplus</td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>—</td>
                  <td style={{ padding: '14px 18px', textAlign: 'right', fontSize: '15px', color: grossProfit >= 0 ? '#10b981' : '#ef4444' }}>
                    {inr(grossProfit)}
                  </td>
                </tr>

                {/* 2. PROFIT & LOSS ACCOUNT SECTION */}
                <tr style={{ background: 'color-mix(in srgb, var(--primary-color) 6%, transparent)', fontWeight: 800 }}>
                  <td colSpan="4" style={{ padding: '12px 18px', color: 'var(--primary-color)', letterSpacing: '0.5px' }}>
                    II. PROFIT & LOSS ACCOUNT (NET EARNINGS)
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '12px 18px', fontWeight: 600 }}>Gross Profit b/d</td>
                  <td style={{ padding: '12px 18px', textAlign: 'right', color: 'var(--text-muted)' }}>Trading Margin</td>
                  <td style={{ padding: '12px 18px', textAlign: 'right' }}>—</td>
                  <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 700 }}>{inr(grossProfit)}</td>
                </tr>
                {indirectIncome > 0 && (
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '12px 18px', fontWeight: 600 }}>Other Indirect Income / Receipts</td>
                    <td style={{ padding: '12px 18px', textAlign: 'right', color: 'var(--text-muted)' }}>Non-Operating</td>
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>—</td>
                    <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>{inr(indirectIncome)}</td>
                  </tr>
                )}
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '12px 18px', fontWeight: 600 }}>Administrative, Utility & Operating Payments</td>
                  <td style={{ padding: '12px 18px', textAlign: 'right', color: 'var(--text-muted)' }}>Indirect Expenses</td>
                  <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>{inr(indirectExpenses)}</td>
                  <td style={{ padding: '12px 18px', textAlign: 'right' }}>—</td>
                </tr>
                <tr style={{
                  background: isProfit ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  fontWeight: 900, fontSize: '15px', borderTop: '2px solid var(--glass-border)'
                }}>
                  <td style={{ padding: '16px 18px', color: isProfit ? '#059669' : '#dc2626' }}>
                    NET {isProfit ? 'PROFIT' : 'LOSS'} FOR THE PERIOD
                  </td>
                  <td style={{ padding: '16px 18px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Transferred to Balance Sheet
                  </td>
                  <td style={{ padding: '16px 18px', textAlign: 'right' }}>—</td>
                  <td style={{ padding: '16px 18px', textAlign: 'right', color: isProfit ? '#10b981' : '#ef4444' }}>
                    {inr(netProfit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Monthly Breakdown Table & Visual Trajectory */}
      {activeTab === 'monthly' && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px', color: 'var(--text-dark)' }}>
            Monthly P&L Progression
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--glass-hover)', borderBottom: '2px solid var(--glass-border)', textTransform: 'uppercase', fontSize: '11.5px' }}>
                  <th style={{ padding: '12px 16px' }}>Month</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Sales Revenue</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Purchases / Costs</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Operating Expenses</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Net Profit / (Loss)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Net Margin</th>
                </tr>
              </thead>
              <tbody>
                {monthlyBreakdown.map((m, idx) => (
                  <tr key={m.key || idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700 }}>{m.label}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>{inr(m.revenue)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#ef4444' }}>{inr(m.cost)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#f59e0b' }}>{inr(m.expenses)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: m.net >= 0 ? '#10b981' : '#ef4444' }}>
                      {inr(m.net)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>{m.margin}%</td>
                  </tr>
                ))}
                {monthlyBreakdown.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No monthly records for the selected period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Itemized Contributing Vouchers */}
      {activeTab === 'vouchers' && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
              Contributing Vouchers
            </h3>
            <div style={{ width: '280px', maxWidth: '100%' }}>
              <BitrixFilterBar
                storageKey="tc_fs_vouchers_filter"
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                placeholder="Search party or voucher..."
              />
            </div>
          </div>
          <div className="table-responsive-container" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--glass-bg)', zIndex: 1 }}>
                <tr style={{ borderBottom: '2px solid var(--glass-border)', textTransform: 'uppercase', fontSize: '11px', background: 'var(--glass-hover)' }}>
                  <th style={{ padding: '12px 16px' }}>Date</th>
                  <th style={{ padding: '12px 16px' }}>Voucher Type</th>
                  <th style={{ padding: '12px 16px' }}>Party / Ledger</th>
                  <th style={{ padding: '12px 16px' }}>Reference</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {relevantVouchers.map((v, i) => {
                  const amt = Number(v.amount || v.net_amount) || 0;
                  const type = String(v.voucher_type || '');
                  const isCredit = /sale|receipt/i.test(type);
                  return (
                    <tr key={v.id || v.voucher_guid || i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '10px 16px', fontWeight: 600 }}>{shortDate(v.voucher_date)}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                          background: isCredit ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: isCredit ? '#10b981' : '#ef4444'
                        }}>
                          {type}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--text-dark)' }}>{v.party_name || 'Direct'}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>{v.reference_no || v.voucher_number || '—'}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 800, color: isCredit ? '#10b981' : '#ef4444' }}>
                        {inr(amt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   2. BALANCE SHEET VIEW
   ========================================================================= */
export function BalanceSheetView({
  balanceSheetMetrics,
  ledgers,
  inventory,
  onBack,
  onExportCSV,
  onExportPDF,
  dateFilter,
  setDateFilter,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  periodLabel,
  loading
}) {
  const [drillGroup, setDrillGroup] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    debtors = 0,
    cashAndBank = 0,
    closingStock = 0,
    currentAssets = 0,
    fixedAssets = 0,
    totalAssets = 0,
    creditors = 0,
    dutiesAndTaxes = 0,
    currentLiabilities = 0,
    capitalAccounts = 0,
    netProfitForPeriod = 0,
    totalCapitalAndReserves = 0,
    totalLiabilities = 0,
    difference = 0,
    workingCapital = 0,
    currentRatio = '1.0',
    isBalanced = true
  } = balanceSheetMetrics || {};

  // Underlying ledger accounts filterable by group
  const filteredLedgers = useMemo(() => {
    if (!drillGroup) return [];
    return (ledgers || []).filter(l => {
      const parent = String(l.parent || l.parent_group || '').toLowerCase();
      const name = String(l.name || '').toLowerCase();
      const bal = Number(l.closing_balance ?? l.balance ?? 0);
      if (drillGroup === 'debtors') return /debtor/i.test(parent) || bal > 0;
      if (drillGroup === 'creditors') return /creditor/i.test(parent) || bal < 0;
      if (drillGroup === 'bank') return /bank|cash/i.test(parent) || /bank|cash/i.test(name);
      if (drillGroup === 'duties') return /duties|tax|gst/i.test(parent) || /tax|gst/i.test(name);
      if (drillGroup === 'capital') return /capital/i.test(parent);
      if (drillGroup === 'fixed') return /fixed/i.test(parent);
      return true;
    }).filter(l => !searchTerm || String(l.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
  }, [ledgers, drillGroup, searchTerm]);

  const bsCards = useMemo(() => [
    {
      id: 'bs-assets',
      key: 'assets',
      label: 'Total Assets',
      value: inr(totalAssets),
      note: 'Current & Fixed Holdings',
      icon: Layers,
      color: '#0ea5e9',
      tint: '14, 165, 233'
    },
    {
      id: 'bs-liabilities',
      key: 'liabilities',
      label: 'Liabilities & Equity',
      value: inr(totalLiabilities),
      note: 'Creditors, Taxes & Capital',
      icon: BookOpen,
      color: '#e11d48',
      tint: '225, 29, 72'
    },
    {
      id: 'bs-working-capital',
      key: 'working-capital',
      label: 'Working Capital',
      value: inr(workingCapital),
      note: 'Current Assets minus Current Liab.',
      icon: Wallet,
      color: workingCapital >= 0 ? '#10b981' : '#ef4444',
      tint: workingCapital >= 0 ? '16, 185, 129' : '239, 68, 68'
    },
    {
      id: 'bs-current-ratio',
      key: 'current-ratio',
      label: 'Current Ratio',
      value: `${currentRatio}x`,
      note: 'Standard liquidity benchmark > 1.3x',
      icon: TrendingUp,
      color: 'var(--text-dark)',
      tint: '245, 158, 11'
    }
  ], [totalAssets, totalLiabilities, workingCapital, currentRatio]);

  const {
    visibleCards: visibleBsCards,
    hiddenCards: hiddenBsCards,
    pinned: pinnedBsCards,
    cardSizes: bsCardSizes,
    setCardSize: setBsCardSize,
    menu: bsMenu,
    setMenu: setBsMenu,
    togglePin: toggleBsPin,
    moveUp: moveUpBsCard,
    moveDown: moveDownBsCard,
    hide: hideBsCard,
    unhide: unhideBsCard,
    unhideAll: unhideAllBsCards,
    reset: resetBsCards,
    handleDragStart: onBsDragStart,
    handleDragOver: onBsDragOver,
    handleDrop: onBsDrop,
    handleDragEnd: onBsDragEnd,
    openMenu: openBsMenu,
    isPinned: isBsPinned,
  } = useCardGridPreferences('tc_balance_sheet_kpi', bsCards);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {loading && (
        <div style={{ height: '3px', width: '100%', background: 'rgba(79, 70, 229, 0.1)', overflow: 'hidden', borderRadius: '2px' }}>
          <div style={{ height: '100%', width: '40%', background: 'var(--primary-color)', borderRadius: '2px', animation: 'indeterminate 1.5s infinite ease-in-out' }} />
        </div>
      )}
      {/* View Header */}
      <div className="glass-panel" style={{
        padding: '20px 24px', borderRadius: '20px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            className="icon-btn"
            onClick={onBack}
            style={{
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              borderRadius: '12px', padding: '8px', cursor: 'pointer'
            }}
            title="Back to Reports"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(225, 29, 72, 0.1)', color: '#be123c',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <BookOpen size={20} />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>
                Balance Sheet
              </h2>
              <span style={{
                fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                padding: '3px 9px', borderRadius: '8px',
                background: isBalanced ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                color: isBalanced ? '#10b981' : '#f59e0b'
              }}>
                {isBalanced ? '✓ Balanced' : `Diff: ${inr(Math.abs(difference))}`}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
              Statement of Financial Position as on {customEnd ? shortDate(customEnd) : shortDate(new Date())} {periodLabel ? `· ${periodLabel}` : ''}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {setDateFilter && (
            <StandardDateFilter
              value={dateFilter}
              onChange={setDateFilter}
              customStart={customStart}
              onCustomStartChange={setCustomStart}
              customEnd={customEnd}
              onCustomEndChange={setCustomEnd}
            />
          )}
          <ExportDropdown onExportCSV={onExportCSV} onExportPDF={onExportPDF} />
          <ScheduleButton onClick={() => window.__tc_show_toast ? window.__tc_show_toast('Schedule email configured for Balance Sheet') : alert('Schedule email configured for Balance Sheet')} />
        </div>
      </div>

      {/* Draggable & Resizable Summary Cards */}
      <HiddenCardsChip hiddenCards={hiddenBsCards} onUnhide={unhideBsCard} />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
        gap: '14px'
      }}>
        {visibleBsCards.map((c) => {
          const Icon = c.icon || Layers;
          const pinnedCard = isBsPinned(c.id);
          const size = bsCardSizes[c.id] || 'normal';
          const isWide = size === 'wide';
          const isCompact = size === 'compact';

          return (
            <div
              key={c.id}
              className={`glass-panel draggable-card ${pinnedCard ? 'is-pinned' : ''} ${isWide ? 'is-wide' : ''} ${isCompact ? 'is-compact' : ''}`}
              role="button"
              tabIndex={0}
              draggable={true}
              onDragStart={(e) => onBsDragStart(e, c.id)}
              onDragOver={(e) => onBsDragOver(e, c.id)}
              onDrop={(e) => onBsDrop(e, c.id)}
              onDragEnd={onBsDragEnd}
              onContextMenu={(e) => openBsMenu(e, c)}
              {...createHoldTouchHandler((pos) => openBsMenu({ clientX: pos.x, clientY: pos.y, preventDefault: () => {} }, c))}
              title={`${c.label} • Drag to reorder • Right-click or hold for options`}
              style={{
                padding: isCompact ? '12px 14px' : '18px 20px',
                borderRadius: '16px',
                cursor: 'pointer',
                textAlign: 'left',
                position: 'relative',
                gridColumn: isWide ? 'span 2' : undefined,
                border: pinnedCard ? `2px solid rgb(${c.tint})` : undefined,
                background: pinnedCard ? `rgba(${c.tint}, 0.08)` : undefined,
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {pinnedCard && (
                <span className="card-pin-badge" title="Pinned to top">
                  <Pin size={11} />
                </span>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isCompact ? '4px' : '8px' }}>
                <span style={{ fontSize: isCompact ? '11px' : '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.4px' }}>
                  {c.label}
                </span>
                <div style={{
                  width: isCompact ? 24 : 28,
                  height: isCompact ? 24 : 28,
                  borderRadius: 8,
                  background: `rgba(${c.tint}, 0.12)`,
                  color: c.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={isCompact ? 13 : 15} />
                </div>
              </div>
              <div style={{ fontSize: isCompact ? '18px' : '22px', fontWeight: 800, color: c.color }}>
                {c.value}
              </div>
              {c.note && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>
                  {c.note}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <CardContextMenu
        menu={bsMenu}
        onClose={() => setBsMenu(null)}
        pinned={pinnedBsCards}
        onTogglePin={toggleBsPin}
        onMoveUp={moveUpBsCard}
        onMoveDown={moveDownBsCard}
        onHide={hideBsCard}
        onReset={resetBsCards}
        onUnhideAll={unhideAllBsCards}
        hiddenCount={hiddenBsCards.length}
        cardSizes={bsCardSizes}
        onSetSize={setBsCardSize}
        onShare={(c) => {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(`${c.label}: ${c.value} (Balance Sheet)`);
          }
        }}
      />

      {/* Dual Column Standard T-Format Balance Sheet */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(450px, 100%), 1fr))',
        gap: '20px'
      }}>
        {/* LEFT COLUMN: LIABILITIES & CAPITAL */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '2px solid var(--glass-border)', paddingBottom: '12px', marginBottom: '16px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#e11d48' }}>
                Liabilities & Capital
              </h3>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Amount (₹)</span>
            </div>

            {/* Section 1: Capital & Reserves */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px' }}>
                Capital Account & Reserves
              </div>
              <div
                onClick={() => setDrillGroup('capital')}
                style={{
                  display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px',
                  cursor: 'pointer', transition: 'background 0.15s ease'
                }}
                className="hover-row"
              >
                <span style={{ color: 'var(--text-dark)', fontWeight: 600 }}>Capital Accounts</span>
                <span style={{ fontWeight: 700 }}>{inr(capitalAccounts)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-dark)', fontWeight: 600 }}>Profit & Loss (Current Surplus)</span>
                <span style={{ fontWeight: 700, color: netProfitForPeriod >= 0 ? '#10b981' : '#ef4444' }}>
                  {inr(netProfitForPeriod)}
                </span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', padding: '8px 12px',
                borderTop: '1px dashed var(--glass-border)', marginTop: '4px', fontWeight: 700, fontSize: '13.5px'
              }}>
                <span>Total Capital & Reserves</span>
                <span>{inr(totalCapitalAndReserves)}</span>
              </div>
            </div>

            {/* Section 2: Current Liabilities */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px' }}>
                Current Liabilities
              </div>
              <div
                onClick={() => setDrillGroup('creditors')}
                style={{
                  display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px',
                  cursor: 'pointer', transition: 'background 0.15s ease'
                }}
                className="hover-row"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--text-dark)', fontWeight: 600 }}>Sundry Creditors (Suppliers)</span>
                  <ChevronRight size={13} color="var(--text-muted)" />
                </div>
                <span style={{ fontWeight: 700, color: '#ef4444' }}>{inr(creditors)}</span>
              </div>
              <div
                onClick={() => setDrillGroup('duties')}
                style={{
                  display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px',
                  cursor: 'pointer', transition: 'background 0.15s ease'
                }}
                className="hover-row"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--text-dark)', fontWeight: 600 }}>Duties & Taxes (GST, TDS)</span>
                  <ChevronRight size={13} color="var(--text-muted)" />
                </div>
                <span style={{ fontWeight: 700 }}>{inr(dutiesAndTaxes)}</span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', padding: '8px 12px',
                borderTop: '1px dashed var(--glass-border)', marginTop: '4px', fontWeight: 700, fontSize: '13.5px'
              }}>
                <span>Total Current Liabilities</span>
                <span style={{ color: '#ef4444' }}>{inr(currentLiabilities)}</span>
              </div>
            </div>
          </div>

          {/* Left Footer Total */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 16px', borderRadius: '12px', background: 'var(--glass-hover)',
            borderTop: '2px solid var(--glass-border)', fontWeight: 900, fontSize: '16px'
          }}>
            <span>TOTAL LIABILITIES</span>
            <span style={{ color: '#e11d48' }}>{inr(totalLiabilities)}</span>
          </div>
        </div>

        {/* RIGHT COLUMN: ASSETS */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '2px solid var(--glass-border)', paddingBottom: '12px', marginBottom: '16px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0ea5e9' }}>
                Assets
              </h3>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Amount (₹)</span>
            </div>

            {/* Section 1: Fixed Assets */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px' }}>
                Fixed Assets
              </div>
              <div
                onClick={() => setDrillGroup('fixed')}
                style={{
                  display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px',
                  cursor: 'pointer', transition: 'background 0.15s ease'
                }}
                className="hover-row"
              >
                <span style={{ color: 'var(--text-dark)', fontWeight: 600 }}>Plant, Equipment & Furniture</span>
                <span style={{ fontWeight: 700 }}>{inr(fixedAssets)}</span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', padding: '8px 12px',
                borderTop: '1px dashed var(--glass-border)', marginTop: '4px', fontWeight: 700, fontSize: '13.5px'
              }}>
                <span>Total Fixed Assets</span>
                <span>{inr(fixedAssets)}</span>
              </div>
            </div>

            {/* Section 2: Current Assets */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px' }}>
                Current Assets
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-dark)', fontWeight: 600 }}>Closing Stock (Inventory Valuation)</span>
                <span style={{ fontWeight: 700, color: '#10b981' }}>{inr(closingStock)}</span>
              </div>
              <div
                onClick={() => setDrillGroup('debtors')}
                style={{
                  display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px',
                  cursor: 'pointer', transition: 'background 0.15s ease'
                }}
                className="hover-row"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--text-dark)', fontWeight: 600 }}>Sundry Debtors (Receivables)</span>
                  <ChevronRight size={13} color="var(--text-muted)" />
                </div>
                <span style={{ fontWeight: 700, color: '#0ea5e9' }}>{inr(debtors)}</span>
              </div>
              <div
                onClick={() => setDrillGroup('bank')}
                style={{
                  display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px',
                  cursor: 'pointer', transition: 'background 0.15s ease'
                }}
                className="hover-row"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--text-dark)', fontWeight: 600 }}>Cash & Bank Balances</span>
                  <ChevronRight size={13} color="var(--text-muted)" />
                </div>
                <span style={{ fontWeight: 700 }}>{inr(cashAndBank)}</span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', padding: '8px 12px',
                borderTop: '1px dashed var(--glass-border)', marginTop: '4px', fontWeight: 700, fontSize: '13.5px'
              }}>
                <span>Total Current Assets</span>
                <span style={{ color: '#0ea5e9' }}>{inr(currentAssets)}</span>
              </div>
            </div>
          </div>

          {/* Right Footer Total */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 16px', borderRadius: '12px', background: 'var(--glass-hover)',
            borderTop: '2px solid var(--glass-border)', fontWeight: 900, fontSize: '16px'
          }}>
            <span>TOTAL ASSETS</span>
            <span style={{ color: '#0ea5e9' }}>{inr(totalAssets)}</span>
          </div>
        </div>
      </div>

      {/* Drilldown Drawer / Ledger Modal if user clicks a line item */}
      {drillGroup && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, textTransform: 'capitalize' }}>
                {drillGroup} Ledger Accounts Breakdown
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                {filteredLedgers.length} ledger(s) in this schedule
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '12px', width: '220px' }}>
                <Search size={14} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Filter ledgers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12px', width: '100%', color: 'var(--text-dark)' }}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--text-muted)' }}
                    title="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <button
                className="btn-secondary"
                onClick={() => setDrillGroup(null)}
                style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
          <div className="table-responsive-container" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--glass-bg)', zIndex: 1 }}>
                <tr style={{ borderBottom: '2px solid var(--glass-border)', textTransform: 'uppercase', fontSize: '11px', background: 'var(--glass-hover)' }}>
                  <th style={{ padding: '10px 14px' }}>Ledger Name</th>
                  <th style={{ padding: '10px 14px' }}>Parent Classification</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Closing Balance</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedgers.map((l, idx) => (
                  <tr key={l.id || l.guid || idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700 }}>{l.name}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{l.parent || l.parent_group || 'General'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800 }}>
                      {inr(Math.abs(Number(l.closing_balance ?? l.balance ?? 0)))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   3. TRIAL BALANCE VIEW
   ========================================================================= */
export function TrialBalanceView({
  trialBalanceMetrics,
  ledgers,
  onBack,
  onExportCSV,
  onExportPDF,
  onSelectLedger,
  dateFilter,
  setDateFilter,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  periodLabel,
  loading
}) {
  const [searchLedger, setSearchLedger] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');

  const {
    rows = [],
    totalDebit = 0,
    totalCredit = 0,
    difference = 0,
    isBalanced = true
  } = trialBalanceMetrics || {};

  // Groups list
  const groupOptions = useMemo(() => {
    const set = new Set();
    (ledgers || []).forEach(l => {
      const g = l.parent || l.parent_group;
      if (g) set.add(g.trim());
    });
    return Array.from(set).sort();
  }, [ledgers]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      if (selectedGroup !== 'all' && String(r.parent).toLowerCase() !== selectedGroup.toLowerCase()) {
        return false;
      }
      if (!searchLedger) return true;
      const q = searchLedger.toLowerCase();
      return (
        String(r.name).toLowerCase().includes(q) ||
        String(r.parent).toLowerCase().includes(q)
      );
    });
  }, [rows, selectedGroup, searchLedger]);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {loading && (
        <div style={{ height: '3px', width: '100%', background: 'rgba(79, 70, 229, 0.1)', overflow: 'hidden', borderRadius: '2px' }}>
          <div style={{ height: '100%', width: '40%', background: 'var(--primary-color)', borderRadius: '2px', animation: 'indeterminate 1.5s infinite ease-in-out' }} />
        </div>
      )}
      {/* View Header */}
      <div className="glass-panel" style={{
        padding: '20px 24px', borderRadius: '20px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            className="icon-btn"
            onClick={onBack}
            style={{
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              borderRadius: '12px', padding: '8px', cursor: 'pointer'
            }}
            title="Back to Reports"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(225, 29, 72, 0.1)', color: '#be123c',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FileSpreadsheet size={20} />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>
                Trial Balance
              </h2>
              <span style={{
                fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                padding: '3px 9px', borderRadius: '8px',
                background: isBalanced ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                color: isBalanced ? '#10b981' : '#f59e0b'
              }}>
                {isBalanced ? '✓ Dr & Cr In Balance' : `Diff: ${inr(Math.abs(difference))}`}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
              Every Ledger Dr / Cr · {rows.length} total active accounts {periodLabel ? `· ${periodLabel}` : ''}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {setDateFilter && (
            <StandardDateFilter
              value={dateFilter}
              onChange={setDateFilter}
              customStart={customStart}
              onCustomStartChange={setCustomStart}
              customEnd={customEnd}
              onCustomEndChange={setCustomEnd}
            />
          )}
          <ExportDropdown onExportCSV={onExportCSV} onExportPDF={onExportPDF} />
        </div>
      </div>

      {/* KPI Ribbon */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
        gap: '14px'
      }}>
        <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '16px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Total Debit (Dr)
          </span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
            {inr(totalDebit)}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '16px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Total Credit (Cr)
          </span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
            {inr(totalCredit)}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '16px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Net Ledger Difference
          </span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: isBalanced ? '#10b981' : '#f59e0b', marginTop: '4px' }}>
            {inr(Math.abs(difference))}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '16px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Total Ledgers Ranked
          </span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-dark)', marginTop: '4px' }}>
            {rows.length} Accounts
          </div>
        </div>
      </div>

      {/* Search & Group Filter Bar */}
      <div className="glass-panel" style={{
        padding: '16px 20px', borderRadius: '16px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
          <div style={{ width: '100%', maxWidth: '340px' }}>
            <BitrixFilterBar
              storageKey="tc_fs_tb_filter"
              searchQuery={searchLedger}
              onSearchChange={setSearchLedger}
              placeholder="Search ledger by name or group..."
            />
          </div>

          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            style={{
              padding: '8px 14px', borderRadius: '12px', border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)', fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)', outline: 'none'
            }}
          >
            <option value="all">All Groups ({groupOptions.length})</option>
            {groupOptions.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
          Showing {filteredRows.length} of {rows.length} ledgers
        </span>
      </div>

      {/* Trial Balance Table */}
      <div className="glass-panel" style={{ padding: '0', borderRadius: '20px', overflow: 'hidden' }}>
        <div className="table-responsive-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--glass-bg)', zIndex: 2 }}>
              <tr style={{ background: 'var(--glass-hover)', borderBottom: '2px solid var(--glass-border)', textTransform: 'uppercase', fontSize: '11.5px' }}>
                <th style={{ padding: '14px 18px' }}>Particulars (Ledger Name)</th>
                <th style={{ padding: '14px 18px' }}>Parent Group</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Debit Balance (₹ Dr)</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Credit Balance (₹ Cr)</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, idx) => (
                <tr
                  key={r.name || idx}
                  onClick={() => onSelectLedger && onSelectLedger(r.name)}
                  style={{
                    borderBottom: '1px solid var(--glass-border)',
                    transition: 'background 0.15s ease',
                    cursor: onSelectLedger ? 'pointer' : 'default'
                  }}
                  className="hover-row"
                  title={onSelectLedger ? `Click to view ${r.name} vouchers (Tally drill-down)` : undefined}
                >
                  <td style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-dark)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span>{r.name}</span>
                      {onSelectLedger && (
                        <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600, opacity: 0.8, display: 'flex', alignItems: 'center', gap: '2px' }}>
                          Vouchers <ChevronRight size={13} />
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px 18px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
                      background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)'
                    }}>
                      {r.parent}
                    </span>
                  </td>
                  <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 800, color: r.dr > 0 ? '#10b981' : 'var(--text-muted)' }}>
                    {r.dr > 0 ? inr(r.dr) : '—'}
                  </td>
                  <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 800, color: r.cr > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                    {r.cr > 0 ? inr(r.cr) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot style={{ position: 'sticky', bottom: 0, background: 'var(--glass-bg)', zIndex: 2, borderTop: '2px solid var(--glass-border)' }}>
              <tr style={{ fontWeight: 900, fontSize: '14px', background: 'var(--glass-hover)' }}>
                <td style={{ padding: '16px 18px' }}>GRAND TOTAL</td>
                <td style={{ padding: '16px 18px', color: 'var(--text-muted)', fontSize: '12px' }}>
                  {filteredRows.length} Accounts
                </td>
                <td style={{ padding: '16px 18px', textAlign: 'right', color: '#10b981' }}>
                  {inr(filteredRows.reduce((s, r) => s + r.dr, 0))}
                </td>
                <td style={{ padding: '16px 18px', textAlign: 'right', color: '#ef4444' }}>
                  {inr(filteredRows.reduce((s, r) => s + r.cr, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   4. EXPENSES DETAILED REGISTER VIEW
   ========================================================================= */
export function ExpensesDetailedView({
  expensesMetrics,
  financialSummary,
  filteredVouchers,
  onBack,
  dateFilter,
  setDateFilter,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  periodLabel,
  onExportCSV,
  onExportPDF,
  purchases = false,
  onTogglePurchases,
  loading
}) {
  const [searchExp, setSearchExp] = useState('');

  const { direct = 0, indirect = 0, total = 0, expenseLedgers = [] } = expensesMetrics || {};

  const expenseVouchers = useMemo(() => {
    return (filteredVouchers || []).filter(v => {
      const type = String(v.voucher_type || '').toLowerCase();
      return /purchase|payment|expense/i.test(type);
    }).filter(v => {
      if (!searchExp) return true;
      const q = searchExp.toLowerCase();
      return (
        String(v.party_name || '').toLowerCase().includes(q) ||
        String(v.voucher_type || '').toLowerCase().includes(q)
      );
    });
  }, [filteredVouchers, searchExp]);

  const expensesCards = useMemo(() => [
    {
      id: 'exp-total',
      key: 'total',
      label: 'Total Outflow',
      value: inr(total),
      note: 'Direct purchases + payments',
      icon: Upload,
      color: '#ef4444',
      tint: '239, 68, 68'
    },
    {
      id: 'exp-direct',
      key: 'direct',
      label: 'Direct Purchases & Material',
      value: inr(direct),
      note: `${financialSummary?.purchasesCount || 0} purchase voucher(s)`,
      icon: Package,
      color: 'var(--text-dark)',
      tint: '59, 130, 246'
    },
    {
      id: 'exp-indirect',
      key: 'indirect',
      label: 'Indirect Operational Payments',
      value: inr(indirect),
      note: `${financialSummary?.paymentsCount || 0} payment voucher(s)`,
      icon: CreditCard,
      color: 'var(--text-dark)',
      tint: '245, 158, 11'
    },
    {
      id: 'exp-ledgers',
      key: 'ledgers',
      label: 'Expense Head Accounts',
      value: `${expenseLedgers.length} Ledgers`,
      note: 'Classified overheads',
      icon: FileSpreadsheet,
      color: 'var(--text-dark)',
      tint: '16, 185, 129'
    }
  ], [total, direct, indirect, expenseLedgers, financialSummary]);

  const {
    visibleCards: visibleExpCards,
    hiddenCards: hiddenExpCards,
    pinned: pinnedExpCards,
    cardSizes: expCardSizes,
    setCardSize: setExpCardSize,
    menu: expMenu,
    setMenu: setExpMenu,
    togglePin: toggleExpPin,
    moveUp: moveUpExpCard,
    moveDown: moveDownExpCard,
    hide: hideExpCard,
    unhide: unhideExpCard,
    unhideAll: unhideAllExpCards,
    reset: resetExpCards,
    handleDragStart: onExpDragStart,
    handleDragOver: onExpDragOver,
    handleDrop: onExpDrop,
    handleDragEnd: onExpDragEnd,
    openMenu: openExpMenu,
    isPinned: isExpPinned,
  } = useCardGridPreferences('tc_expenses_kpi', expensesCards);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {loading && (
        <div style={{ height: '3px', width: '100%', background: 'rgba(79, 70, 229, 0.1)', overflow: 'hidden', borderRadius: '2px' }}>
          <div style={{ height: '100%', width: '40%', background: 'var(--primary-color)', borderRadius: '2px', animation: 'indeterminate 1.5s infinite ease-in-out' }} />
        </div>
      )}
      {/* View Header */}
      <div className="glass-panel" style={{
        padding: '20px 24px', borderRadius: '20px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            className="icon-btn"
            onClick={onBack}
            style={{
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              borderRadius: '12px', padding: '8px', cursor: 'pointer'
            }}
            title="Back to Reports"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(225, 29, 72, 0.1)', color: '#be123c',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Upload size={20} />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>
                Expenses Analysis
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
              Where the money goes · Direct and indirect operational costs {periodLabel ? `· ${periodLabel}` : ''}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {setDateFilter && (
            <StandardDateFilter
              value={dateFilter}
              onChange={setDateFilter}
              customStart={customStart}
              onCustomStartChange={setCustomStart}
              customEnd={customEnd}
              onCustomEndChange={setCustomEnd}
            />
          )}
          {onTogglePurchases && (
            <button
              type="button"
              onClick={onTogglePurchases}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '12px', fontSize: '12.5px', fontWeight: 700,
                cursor: 'pointer', border: '1px solid var(--glass-border)',
                background: purchases ? 'var(--primary-color)' : 'var(--glass-bg)',
                color: purchases ? '#fff' : 'var(--text-dark)',
                transition: 'all 0.15s ease'
              }}
            >
              {purchases ? '✓ Purchases Included' : '+ Include Purchases'}
            </button>
          )}
          <ExportDropdown onExportCSV={onExportCSV} onExportPDF={onExportPDF} />
          <ScheduleButton onClick={() => window.__tc_show_toast ? window.__tc_show_toast('Schedule email configured for Expenses Analysis') : alert('Schedule email configured for Expenses Analysis')} />
        </div>
      </div>

      {/* Draggable & Resizable Summary Cards */}
      <HiddenCardsChip hiddenCards={hiddenExpCards} onUnhide={unhideExpCard} />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
        gap: '14px'
      }}>
        {visibleExpCards.map((c) => {
          const Icon = c.icon || Upload;
          const pinnedCard = isExpPinned(c.id);
          const size = expCardSizes[c.id] || 'normal';
          const isWide = size === 'wide';
          const isCompact = size === 'compact';

          return (
            <div
              key={c.id}
              className={`glass-panel draggable-card ${pinnedCard ? 'is-pinned' : ''} ${isWide ? 'is-wide' : ''} ${isCompact ? 'is-compact' : ''}`}
              role="button"
              tabIndex={0}
              draggable={true}
              onDragStart={(e) => onExpDragStart(e, c.id)}
              onDragOver={(e) => onExpDragOver(e, c.id)}
              onDrop={(e) => onExpDrop(e, c.id)}
              onDragEnd={onExpDragEnd}
              onContextMenu={(e) => openExpMenu(e, c)}
              {...createHoldTouchHandler((pos) => openExpMenu({ clientX: pos.x, clientY: pos.y, preventDefault: () => {} }, c))}
              title={`${c.label} • Drag to reorder • Right-click or hold for options`}
              style={{
                padding: isCompact ? '12px 14px' : '16px 20px',
                borderRadius: '16px',
                cursor: 'pointer',
                textAlign: 'left',
                position: 'relative',
                gridColumn: isWide ? 'span 2' : undefined,
                border: pinnedCard ? `2px solid rgb(${c.tint})` : undefined,
                background: pinnedCard ? `rgba(${c.tint}, 0.08)` : undefined,
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {pinnedCard && (
                <span className="card-pin-badge" title="Pinned to top">
                  <Pin size={11} />
                </span>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isCompact ? '4px' : '6px' }}>
                <span style={{ fontSize: isCompact ? '11px' : '11.5px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  {c.label}
                </span>
                <div style={{
                  width: isCompact ? 24 : 28,
                  height: isCompact ? 24 : 28,
                  borderRadius: 8,
                  background: `rgba(${c.tint}, 0.12)`,
                  color: c.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={isCompact ? 13 : 15} />
                </div>
              </div>
              <div style={{ fontSize: isCompact ? '18px' : '22px', fontWeight: 800, color: c.color, marginTop: '2px' }}>
                {c.value}
              </div>
              {c.note && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>
                  {c.note}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <CardContextMenu
        menu={expMenu}
        onClose={() => setExpMenu(null)}
        pinned={pinnedExpCards}
        onTogglePin={toggleExpPin}
        onMoveUp={moveUpExpCard}
        onMoveDown={moveDownExpCard}
        onHide={hideExpCard}
        onReset={resetExpCards}
        onUnhideAll={unhideAllExpCards}
        hiddenCount={hiddenExpCards.length}
        cardSizes={expCardSizes}
        onSetSize={setExpCardSize}
        onShare={(c) => {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(`${c.label}: ${c.value} (Expenses Analysis)`);
          }
        }}
      />

      {/* Expense Vouchers Register */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
            Operational Expense Transactions ({expenseVouchers.length})
          </h3>
          <div style={{ width: '280px', maxWidth: '100%' }}>
            <BitrixFilterBar
              storageKey="tc_fs_expenses_filter"
              searchQuery={searchExp}
              onSearchChange={setSearchExp}
              placeholder="Search expenses..."
            />
          </div>
        </div>

        <div className="table-responsive-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--glass-bg)', zIndex: 1 }}>
              <tr style={{ borderBottom: '2px solid var(--glass-border)', textTransform: 'uppercase', fontSize: '11px', background: 'var(--glass-hover)' }}>
                <th style={{ padding: '12px 16px' }}>Date</th>
                <th style={{ padding: '12px 16px' }}>Voucher Type</th>
                <th style={{ padding: '12px 16px' }}>Party / Ledger</th>
                <th style={{ padding: '12px 16px' }}>Reference</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenseVouchers.map((v, i) => {
                const amt = Number(v.amount || v.net_amount) || 0;
                return (
                  <tr key={v.id || v.voucher_guid || i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 600 }}>{shortDate(v.voucher_date)}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                        background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444'
                      }}>
                        {v.voucher_type}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--text-dark)' }}>{v.party_name || 'Vendor'}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>{v.reference_no || v.voucher_number || '—'}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 800, color: '#ef4444' }}>
                      {inr(amt)}
                    </td>
                  </tr>
                );
              })}
              {expenseVouchers.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No expense or payment vouchers recorded for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   5. CASH FLOW STATEMENT VIEW (Matching Mobile App Reference financial_screens.dart)
   ========================================================================= */
export function CashFlowView({
  cashFlowMetrics,
  ledgers = [],
  filteredVouchers = [],
  onBack,
  dateFilter,
  setDateFilter,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  periodLabel,
  onExportCSV,
  onExportPDF,
  loading
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'monthly' | 'accounts'

  const computed = useMemo(() => {
    if (cashFlowMetrics && (cashFlowMetrics.closing !== undefined || cashFlowMetrics.inflow !== undefined)) {
      return cashFlowMetrics;
    }
    const cashLedgers = (ledgers || []).filter(l => {
      const g = String(l.parent || l.group || '').toLowerCase();
      const n = String(l.name || '').toLowerCase();
      return g.includes('cash') || g.includes('bank') || n.includes('cash') || n.includes('bank');
    });

    let opening = 0;
    let closing = 0;
    const accounts = [];
    cashLedgers.forEach(l => {
      const op = Number(l.opening_balance || 0);
      const cl = Number(l.closing_balance ?? l.balance ?? l.opening_balance ?? 0);
      opening += op;
      closing += cl;
      accounts.push({
        name: l.name || 'Unnamed Account',
        opening: op,
        closing: cl,
        group: l.parent || l.group || 'Bank/Cash'
      });
    });

    let inflow = 0;
    let outflow = 0;
    const monthMap = {};
    const inGroups = {};
    const outGroups = {};

    (filteredVouchers || []).forEach(v => {
      const type = String(v.voucher_type || '').toLowerCase();
      const amt = Number(v.amount || v.net_amount) || 0;
      if (amt === 0) return;

      const isReceipt = type.includes('receipt');
      const isPayment = type.includes('payment');
      const isSale = type.includes('sale') && !type.includes('order');
      const isPurchase = type.includes('purchase') && !type.includes('order');

      const isMoneyIn = isReceipt || (isSale && (v.cash_ledger || type.includes('cash') || type.includes('bank')));
      const isMoneyOut = isPayment || (isPurchase && (v.cash_ledger || type.includes('cash') || type.includes('bank')));

      if (isMoneyIn) {
        inflow += amt;
        const grp = v.party_name || v.ledger_name || 'Receipts';
        inGroups[grp] = (inGroups[grp] || 0) + amt;
      } else if (isMoneyOut) {
        outflow += amt;
        const grp = v.party_name || v.ledger_name || 'Payments';
        outGroups[grp] = (outGroups[grp] || 0) + amt;
      }

      if (v.voucher_date && (isMoneyIn || isMoneyOut)) {
        const d = new Date(v.voucher_date);
        if (!isNaN(d.getTime())) {
          const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const mLabel = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
          if (!monthMap[mKey]) monthMap[mKey] = { label: mLabel, inflow: 0, outflow: 0, sortKey: d.getTime() };
          if (isMoneyIn) monthMap[mKey].inflow += amt;
          if (isMoneyOut) monthMap[mKey].outflow += amt;
        }
      }
    });

    const net = inflow - outflow;
    const not_in_flow = closing - (opening + net);
    const months = Object.values(monthMap).sort((a, b) => a.sortKey - b.sortKey);
    const inflow_groups = Object.entries(inGroups).map(([group, amount]) => ({ group, amount })).sort((a, b) => b.amount - a.amount);
    const outflow_groups = Object.entries(outGroups).map(([group, amount]) => ({ group, amount })).sort((a, b) => b.amount - a.amount);

    return {
      closing,
      opening,
      inflow,
      outflow,
      net,
      not_in_flow,
      months,
      accounts,
      inflow_groups,
      outflow_groups,
      cash_ledgers_count: cashLedgers.length
    };
  }, [cashFlowMetrics, ledgers, filteredVouchers]);

  const {
    closing = 0,
    opening = 0,
    inflow = 0,
    outflow = 0,
    net = 0,
    not_in_flow = 0,
    months = [],
    accounts = [],
    inflow_groups = [],
    outflow_groups = [],
    cash_ledgers_count = 0
  } = computed;

  const filteredAccounts = useMemo(() => {
    if (!searchQuery.trim()) return accounts;
    const q = searchQuery.toLowerCase();
    return accounts.filter(a =>
      (a.name || '').toLowerCase().includes(q) ||
      (a.group || '').toLowerCase().includes(q)
    );
  }, [accounts, searchQuery]);

  const statementCards = useMemo(() => [
    {
      id: 'cfs-closing-balance',
      key: 'closing',
      label: 'Closing Balance',
      value: inr(closing),
      note: 'Combined Cash & Bank liquidity',
      icon: Wallet,
      color: '#2563eb',
      tint: '37, 99, 235',
    },
    {
      id: 'cfs-opening-balance',
      key: 'opening',
      label: 'Opening Balance',
      value: inr(opening),
      note: 'At start of selected period',
      icon: Building2,
      color: '#64748b',
      tint: '100, 116, 139',
    },
    {
      id: 'cfs-money-in',
      key: 'inflow',
      label: 'Money In',
      value: `+${inr(inflow)}`,
      note: 'Receipts & inflows received',
      icon: ArrowDownRight,
      color: '#10b981',
      tint: '16, 185, 129',
    },
    {
      id: 'cfs-money-out',
      key: 'outflow',
      label: 'Money Out',
      value: `-${inr(outflow)}`,
      note: 'Payments & expenses disbursed',
      icon: ArrowUpRight,
      color: '#ef4444',
      tint: '239, 68, 68',
    },
    {
      id: 'cfs-net-flow',
      key: 'net',
      label: 'Nett Flow',
      value: `${net >= 0 ? '+' : ''}${inr(net)}`,
      note: net >= 0 ? 'Net Cash Inflow for period' : 'Net Cash Outflow for period',
      icon: TrendingUp,
      color: net >= 0 ? '#10b981' : '#ef4444',
      tint: net >= 0 ? '16, 185, 129' : '239, 68, 68',
    }
  ], [closing, opening, inflow, outflow, net]);

  const {
    visibleCards: visibleStatementCards,
    hiddenCards: hiddenStatementCards,
    pinned: pinnedStatementCards,
    cardSizes: statementCardSizes,
    setCardSize: setStatementCardSize,
    menu: statementMenu,
    setMenu: setStatementMenu,
    togglePin: toggleStatementPin,
    moveUp: moveUpStatementCard,
    moveDown: moveDownStatementCard,
    hide: hideStatementCard,
    unhide: unhideStatementCard,
    unhideAll: unhideAllStatementCards,
    reset: resetStatementCards,
    handleDragStart: onStatementDragStart,
    handleDragOver: onStatementDragOver,
    handleDrop: onStatementDrop,
    handleDragEnd: onStatementDragEnd,
    openMenu: openStatementMenu,
    isPinned: isStatementPinned,
  } = useCardGridPreferences('tc_cashflow_statement_kpi', statementCards);

  return (
    <div className="financial-statement-view" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {loading && (
        <div style={{ height: '3px', width: '100%', background: 'rgba(79, 70, 229, 0.1)', overflow: 'hidden', borderRadius: '2px' }}>
          <div style={{ height: '100%', width: '40%', background: 'var(--primary-color)', borderRadius: '2px', animation: 'indeterminate 1.5s infinite ease-in-out' }} />
        </div>
      )}
      {/* Top Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onBack && (
            <button
              onClick={onBack}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px' }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text-dark)' }}>
              Cash Flow Statement
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Liquidity, cash movements, and bank balance flow for {periodLabel || 'All Time'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {setDateFilter && (
            <StandardDateFilter
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              customStart={customStart}
              setCustomStart={setCustomStart}
              customEnd={customEnd}
              setCustomEnd={setCustomEnd}
            />
          )}
          <ExportDropdown
            onExportCSV={() => onExportCSV && onExportCSV('cash-flow')}
            onExportPDF={() => onExportPDF && onExportPDF('cash-flow')}
          />
          <ScheduleButton onClick={() => window.__tc_show_toast ? window.__tc_show_toast('Schedule email configured for Cash Flow Statement') : alert('Schedule email configured for Cash Flow Statement')} />
        </div>
      </div>

      {/* Draggable & Resizable Summary Cards */}
      <HiddenCardsChip hiddenCards={hiddenStatementCards} onUnhide={unhideStatementCard} />

      <div className="ledger-stats">
        {visibleStatementCards.map((c) => {
          const Icon = c.icon || Wallet;
          const pinnedCard = isStatementPinned(c.id);
          const size = statementCardSizes[c.id] || 'normal';
          const isWide = size === 'wide';
          const isCompact = size === 'compact';

          return (
            <div
              key={c.id}
              className={`ledger-stat glass-panel draggable-card ${pinnedCard ? 'is-pinned' : ''} ${isWide ? 'is-wide' : ''} ${isCompact ? 'is-compact' : ''}`}
              role="button"
              tabIndex={0}
              draggable={true}
              onDragStart={(e) => onStatementDragStart(e, c.id)}
              onDragOver={(e) => onStatementDragOver(e, c.id)}
              onDrop={(e) => onStatementDrop(e, c.id)}
              onDragEnd={onStatementDragEnd}
              onContextMenu={(e) => openStatementMenu(e, c)}
              {...createHoldTouchHandler((pos) => openStatementMenu({ clientX: pos.x, clientY: pos.y, preventDefault: () => {} }, c))}
              title={`${c.label} • Drag to reorder • Right-click or hold for options`}
              style={{
                cursor: 'pointer',
                textAlign: 'left',
                position: 'relative',
                border: pinnedCard ? `2px solid rgb(${c.tint})` : undefined,
                background: pinnedCard ? `rgba(${c.tint}, 0.08)` : undefined,
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {pinnedCard && (
                <span className="card-pin-badge" title="Pinned to top">
                  <Pin size={11} />
                </span>
              )}
              <div
                className="ledger-stat-icon"
                style={{
                  background: `rgba(${c.tint}, 0.14)`,
                  color: c.color,
                }}
              >
                <Icon size={20} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="ledger-stat-label">{c.label}</div>
                <div className="ledger-stat-value" style={{ color: c.color }}>
                  {c.value}
                </div>
                {c.note && <div className="ledger-stat-sub">{c.note}</div>}
              </div>
            </div>
          );
        })}
      </div>

      <CardContextMenu
        menu={statementMenu}
        onClose={() => setStatementMenu(null)}
        pinned={pinnedStatementCards}
        onTogglePin={toggleStatementPin}
        onMoveUp={moveUpStatementCard}
        onMoveDown={moveDownStatementCard}
        onHide={hideStatementCard}
        onReset={resetStatementCards}
        onUnhideAll={unhideAllStatementCards}
        hiddenCount={hiddenStatementCards.length}
        cardSizes={statementCardSizes}
        onSetSize={setStatementCardSize}
        onShare={(c) => {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(`${c.label}: ${c.value} (Cash Flow Statement)`);
          }
        }}
      />

      {/* Net Flow & InfoBox */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{
          padding: '14px 18px', borderRadius: '10px',
          background: net >= 0 ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)',
          border: `1px solid ${net >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {net >= 0 ? <TrendingUp size={20} color="#10b981" /> : <TrendingDown size={20} color="#ef4444" />}
            <div>
              <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-dark)' }}>
                Nett Flow: {net >= 0 ? '+' : ''}{inr(net)}
              </span>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                ({net >= 0 ? 'Net Cash Inflow' : 'Net Cash Outflow'} for this period)
              </span>
            </div>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
            {cash_ledgers_count} Cash & Bank Accounts Synced
          </div>
        </div>

        {Math.abs(not_in_flow) >= 0.01 && (
          <div style={{
            padding: '12px 16px', borderRadius: '8px',
            background: 'rgba(59, 130, 246, 0.06)',
            border: '1px solid rgba(59, 130, 246, 0.18)',
            fontSize: '12.5px', color: 'var(--text-dark)', lineHeight: '1.5'
          }}>
            ℹ️ <strong>Tally Reconciled Adjustment:</strong> {not_in_flow < 0 ? '−' : ''}{inr(Math.abs(not_in_flow))} of cash / bank movement is not in Cash Flow, matching Tally: vouchers entered before a ledger was categorized under Cash-in-Hand. <em>Opening + Nett flow + Adjustment = Closing</em>.
          </div>
        )}
      </div>

      {/* Tabs Row */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
        {[
          { id: 'overview', label: 'Month-wise Flow' },
          { id: 'accounts', label: `Accounts (${accounts.length})` },
          { id: 'groups', label: 'Group Breakdown' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: activeTab === t.id ? '#2563eb' : 'var(--glass-bg)',
              color: activeTab === t.id ? '#fff' : 'var(--text-dark)',
              fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s ease'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Month-wise Table (Matching Mobile App Reference) */}
      {activeTab === 'overview' && (
        <div className="statement-card" style={{
          background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
          borderRadius: '12px', overflow: 'hidden'
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-dark)' }}>
              Month-wise Liquidity Flow
            </h3>
          </div>
          <div className="table-responsive-container" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--glass-border)', textTransform: 'uppercase', fontSize: '11px', background: 'var(--glass-hover)' }}>
                  <th style={{ padding: '12px 18px' }}>Month</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Money In</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Money Out</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Net Flow</th>
                </tr>
              </thead>
              <tbody>
                {months.map((m, idx) => {
                  const mNet = (m.inflow || 0) - (m.outflow || 0);
                  return (
                    <tr key={m.label || idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-dark)' }}>
                        {m.label}
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>
                        {m.inflow ? `+${inr(m.inflow)}` : '—'}
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>
                        {m.outflow ? `-${inr(m.outflow)}` : '—'}
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 800, color: mNet >= 0 ? '#10b981' : '#ef4444' }}>
                        {mNet >= 0 ? `+${inr(mNet)}` : inr(mNet)}
                      </td>
                    </tr>
                  );
                })}
                {months.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No month-wise cash flow transactions found for this period
                    </td>
                  </tr>
                )}
              </tbody>
              {months.length > 0 && (
                <tfoot>
                  <tr style={{ background: 'var(--glass-hover)', fontWeight: 800, borderTop: '2px solid var(--glass-border)' }}>
                    <td style={{ padding: '12px 18px' }}>Total</td>
                    <td style={{ padding: '12px 18px', textAlign: 'right', color: '#10b981' }}>+{inr(inflow)}</td>
                    <td style={{ padding: '12px 18px', textAlign: 'right', color: '#ef4444' }}>-{inr(outflow)}</td>
                    <td style={{ padding: '12px 18px', textAlign: 'right', color: net >= 0 ? '#10b981' : '#ef4444' }}>
                      {net >= 0 ? `+${inr(net)}` : inr(net)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Accounts Breakdown (Matching Mobile App Reference) */}
      {activeTab === 'accounts' && (
        <div className="statement-card" style={{
          background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
          borderRadius: '12px', overflow: 'hidden'
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-dark)' }}>
              Cash and Bank Accounts ({accounts.length})
            </h3>
            <div style={{ width: '260px', maxWidth: '100%' }}>
              <BitrixFilterBar
                storageKey="tc_fs_cashbank_filter"
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                placeholder="Search accounts..."
              />
            </div>
          </div>
          <div className="table-responsive-container" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--glass-border)', textTransform: 'uppercase', fontSize: '11px', background: 'var(--glass-hover)' }}>
                  <th style={{ padding: '12px 18px' }}>Account</th>
                  <th style={{ padding: '12px 18px' }}>Category</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Opening</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Closing</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((a, idx) => (
                  <tr key={a.name || idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-dark)' }}>
                      {a.name}
                    </td>
                    <td style={{ padding: '12px 18px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      {a.group}
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 600 }}>
                      {inr(a.opening)}
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 800, color: a.closing >= 0 ? '#10b981' : '#ef4444' }}>
                      {inr(a.closing)}
                    </td>
                  </tr>
                ))}
                {filteredAccounts.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No cash or bank accounts found
                    </td>
                  </tr>
                )}
              </tbody>
              {accounts.length > 0 && (
                <tfoot>
                  <tr style={{ background: 'var(--glass-hover)', fontWeight: 800, borderTop: '2px solid var(--glass-border)' }}>
                    <td style={{ padding: '12px 18px' }}>Total Accounts</td>
                    <td style={{ padding: '12px 18px' }}>—</td>
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>{inr(opening)}</td>
                    <td style={{ padding: '12px 18px', textAlign: 'right', color: closing >= 0 ? '#10b981' : '#ef4444' }}>
                      {inr(closing)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Group Breakdown (Matching Mobile App Reference) */}
      {activeTab === 'groups' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* Money in by group */}
          <div className="statement-card" style={{
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            borderRadius: '12px', overflow: 'hidden'
          }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(16, 185, 129, 0.05)' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#10b981' }}>
                Money In, by Group
              </h4>
            </div>
            <div style={{ padding: '12px 16px' }}>
              {inflow_groups.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No group inflows recorded
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {inflow_groups.slice(0, 10).map((g, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{g.name || g.group}</span>
                      <span style={{ fontWeight: 700, color: '#10b981' }}>+{inr(g.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Money out by group */}
          <div className="statement-card" style={{
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            borderRadius: '12px', overflow: 'hidden'
          }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(239, 68, 68, 0.05)' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>
                Money Out, by Group
              </h4>
            </div>
            <div style={{ padding: '12px 16px' }}>
              {outflow_groups.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No group outflows recorded
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {outflow_groups.slice(0, 10).map((g, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{g.name || g.group}</span>
                      <span style={{ fontWeight: 700, color: '#ef4444' }}>-{inr(g.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


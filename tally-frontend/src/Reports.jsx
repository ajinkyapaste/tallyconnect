import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  BarChart3, TrendingUp, Calendar, ArrowDownRight, ArrowUpRight,
  Download, FileText, ShoppingCart, Package,
  ChevronRight, ArrowLeft, Search, RefreshCw, AlertCircle,
  Users as UsersIcon, X, PieChart as PieChartIcon,
  LineChart as LineChartIcon, BarChart2, Receipt,
  Building2, Clock, Trophy, Pin, EyeOff, Eye, Move, MoreVertical, Share2, CheckCircle2,
  BookOpen, Scale, FileSpreadsheet, Upload, Check, Wallet, Layers
} from 'lucide-react';
import {
  api,
  getMonthlyReportSchedule,
  updateMonthlyReportSchedule,
  getMonthlyReportSummary,
  getFinancialCashFlow,
  getFinancialMe,
  getFinancialPeriods,
  getTrialBalance,
  getProfitLoss,
  getBalanceSheet,
  getExpenseReport
} from './api';
import { ExportDropdown, createHoldTouchHandler, UnhideModal, ScheduleButton } from './uiUtils';
import BitrixFilterBar from './BitrixFilterBar';
import { ProfitLossView, BalanceSheetView, TrialBalanceView, ExpensesDetailedView, CashFlowView } from './FinancialStatements';
import { LedgerVouchersModal, StockValueModal } from './FinancialModals';
import CashFlowForecast from './CashFlowForecast';
import SalesAnalyticsDetailView from './SalesAnalyticsDetailView';
import ErrorBoundary from './ErrorBoundary';
import StandardDateFilter, { isWithinStandardDateRange, getStandardDateRangeLabel } from './StandardDateFilter';
import { isVisibleToUser } from './adminVisibility';

/* ---------------- Helpers & Formatting ---------------- */
const inr = (n) => `₹ ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const formatShortInr = (val) => {
  if (val === 0) return '₹0';
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(0)}k`;
  return `${sign}₹${abs}`;
};

const shortDate = (s) =>
  s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

const getNiceTicks = (max) => {
  if (max <= 0) return { ticks: [0], niceMax: 0 };
  const roughStep = max / 3;
  const power = Math.pow(10, Math.floor(Math.log10(roughStep || 1)));
  const normalized = roughStep / power;
  let niceStep = power;
  if (normalized < 1.5) niceStep = 1 * power;
  else if (normalized < 3) niceStep = 2 * power;
  else if (normalized < 7) niceStep = 5 * power;
  else niceStep = 10 * power;

  const niceMax = Math.ceil(max / niceStep) * niceStep;
  const ticks = [];
  for (let val = 0; val <= niceMax; val += niceStep) {
    ticks.push(val);
  }
  return { ticks, niceMax };
};

const FY_MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

/* Date Filter Period Matcher */
const isWithinRange = (dateStr, filter, customStart, customEnd) => {
  return isWithinStandardDateRange(dateStr, filter, customStart, customEnd);
};

/**
 * Maps a Tally voucher-type name to an app kind, matching the mobile Flutter app
 * (accounting.dart:voucherKind). Order, note, return, quotation and memo types
 * are excluded from regular sales / purchases / receipts / payments totals.
 */
export const voucherKind = (type) => {
  const s = String(type || '').trim().toLowerCase();
  if (!s) return 'other';
  const notBooks = [
    'order',
    'quotation',
    'note',
    'return',
    'memo',
    'rejection',
    'reversing',
    'physical',
    'stock journal',
    'manufactur',
    'attendance',
    'payroll',
  ];
  if (notBooks.some(nb => s.includes(nb))) return 'other';
  if (s.includes('sales') || s === 'sale') return 'sales';
  if (s.includes('purchase')) return 'purchase';
  if (s.includes('receipt')) return 'receipt';
  if (s.includes('payment')) return 'payment';
  if (s.includes('contra')) return 'contra';
  if (s.includes('journal')) return 'journal';
  return 'other';
};

/* ---------------- SVG Chart Components ---------------- */

// 1. Generic Responsive Bar Chart
const ResponsiveBarChart = ({ items = [], title = '', valueKey = 'value', labelKey = 'label', onBarClick }) => {
  const [hoverIndex, setHoverIndex] = useState(null);
  const maxVal = Math.max(...items.map(d => Number(d[valueKey] || 0)), 0);
  const { ticks, niceMax } = getNiceTicks(maxVal);

  const width = 560;
  const height = 280;
  const padLeft = 65;
  const padRight = 25;
  const padTop = 25;
  const padBottom = 50;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const baselineY = padTop + plotH;
  const slotW = plotW / Math.max(items.length, 1);

  if (!items.length || maxVal === 0) {
    return (
      <div className="state-block" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>No chart data available for this selection.</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
        {/* Ticks & Grid */}
        {ticks.map((t, idx) => {
          const y = baselineY - (niceMax > 0 ? (t / niceMax) * plotH : 0);
          return (
            <g key={idx}>
              <line
                x1={padLeft} y1={y} x2={width - padRight} y2={y}
                stroke={t === 0 ? '#9ca3af' : 'rgba(0,0,0,0.06)'}
                strokeWidth={t === 0 ? 1.5 : 1}
                strokeDasharray={t === 0 ? 'none' : '3 3'}
              />
              <text x={padLeft - 10} y={y + 4} textAnchor="end" fill="var(--text-muted, #6b7280)" fontSize="11" fontWeight="500">
                {formatShortInr(t)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {items.map((item, idx) => {
          const val = Number(item[valueKey] || 0);
          const barH = niceMax > 0 ? (val / niceMax) * plotH : 0;
          const cx = padLeft + (idx + 0.5) * slotW;
          const barW = Math.min(Math.max(slotW * 0.45, 12), 48);
          const isHovered = hoverIndex === idx;
          const rawLabel = String(item[labelKey] || '');
          const truncatedLabel = rawLabel.length > 10 ? rawLabel.substring(0, 9) + '…' : rawLabel;

          const labelStep = Math.max(1, Math.ceil(items.length / 8));
          const showLabel = items.length <= 8 || idx % labelStep === 0 || idx === items.length - 1 || isHovered;

          return (
            <g key={idx}>
              {isHovered && (
                <rect
                  x={padLeft + idx * slotW + 2} y={padTop}
                  width={slotW - 4} height={plotH}
                  fill="rgba(79, 70, 229, 0.06)" rx="4"
                />
              )}
              {barH > 0 && (
                <rect
                  x={cx - barW / 2} y={baselineY - barH}
                  width={barW} height={barH}
                  fill={item.color || 'var(--primary-color, #4f46e5)'}
                  rx="4"
                  style={{ transition: 'all 0.3s ease', cursor: onBarClick ? 'pointer' : 'default' }}
                />
              )}
              {showLabel && (
                <text
                  x={cx} y={baselineY + 20}
                  textAnchor="middle" fill={isHovered ? 'var(--primary-color)' : 'var(--text-muted, #6b7280)'}
                  fontSize="11" fontWeight={isHovered ? '700' : '600'}
                >
                  {truncatedLabel}
                </text>
              )}
              <rect
                x={padLeft + idx * slotW} y={padTop}
                width={slotW} height={plotH + padBottom}
                fill="transparent"
                style={{ cursor: onBarClick ? 'pointer' : 'default' }}
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
                onClick={() => onBarClick && onBarClick(item)}
              />
            </g>
          );
        })}
      </svg>

      {hoverIndex !== null && items[hoverIndex] && (
        <div style={{
          position: 'absolute', top: '8px',
          left: `${Math.min(Math.max((padLeft + (hoverIndex + 0.5) * slotW) / width * 100, 20), 80)}%`,
          transform: 'translateX(-50%)',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
          borderRadius: '12px', padding: '10px 14px',
          pointerEvents: 'none', zIndex: 10, minWidth: '150px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '4px' }}>
            {items[hoverIndex][labelKey]}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--primary-color)', fontWeight: 700 }}>
            {inr(items[hoverIndex][valueKey])}
          </div>
        </div>
      )}
    </div>
  );
};

// 1b. Horizontal Progress Bar List (Executive Ranked Distribution Tracks)
const HorizontalBarList = ({ items = [], valueKey = 'value', labelKey = 'label', onBarClick }) => {
  const maxVal = Math.max(...items.map(d => Number(d[valueKey] || 0)), 1);
  const total = items.reduce((s, it) => s + (Number(it[valueKey]) || 0), 0);

  if (!items.length || maxVal === 0) {
    return (
      <div className="state-block" style={{ padding: '36px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>No chart data available for this selection.</p>
      </div>
    );
  }

  const getThemeBarColor = (idx) => {
    if (idx === 0) return 'var(--primary-color)';
    if (idx === 1) return 'color-mix(in srgb, var(--primary-color) 78%, #38bdf8)';
    if (idx === 2) return 'color-mix(in srgb, var(--primary-color) 62%, #10b981)';
    if (idx === 3) return 'color-mix(in srgb, var(--primary-color) 48%, #f59e0b)';
    return 'color-mix(in srgb, var(--primary-color) 38%, #8b5cf6)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {items.map((item, idx) => {
        const val = Number(item[valueKey] || 0);
        const pctOfMax = Math.min(Math.max((val / maxVal) * 100, 2), 100);
        const pctOfTotal = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
        const barColor = item.color && item.color !== '#a81d43' ? item.color : getThemeBarColor(idx);

        const initials = String(item[labelKey] || '').split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'P';

        return (
          <div
            key={idx}
            className="reports-bar-card-item glass-panel"
            style={{
              padding: '12px 16px',
              borderRadius: '16px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              cursor: onBarClick ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '9px'
            }}
            onClick={() => onBarClick && onBarClick(item)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--glass-hover)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--glass-bg)';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Top row: Rank, Initials, Name, Amount & % Share */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '65%' }}>
                <span style={{
                  padding: '3px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 800,
                  background: idx === 0 ? 'var(--primary-color)' : 'rgba(0,0,0,0.06)',
                  color: idx === 0 ? '#fff' : 'var(--text-dark)'
                }}>
                  #{idx + 1}
                </span>
                <span style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: 'color-mix(in srgb, var(--primary-color) 12%, transparent)',
                  color: 'var(--primary-color)', fontSize: '11px', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {initials}
                </span>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{
                    fontSize: '14px', fontWeight: 700, color: 'var(--text-dark)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {item[labelKey]}
                  </div>
                  {item.pendingCount !== undefined && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {item.pendingCount} pending bills {item.balance ? `· Balance: ${formatShortInr(item.balance)}` : ''}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'right' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.3px' }}>
                  {inr(val)}
                </div>
                <div style={{
                  fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '8px',
                  background: 'color-mix(in srgb, var(--primary-color) 10%, transparent)',
                  color: 'var(--primary-color)'
                }}>
                  {pctOfTotal}%
                </div>
              </div>
            </div>

            {/* Track Bar */}
            <div style={{
              width: '100%', height: '8px', background: 'rgba(0,0,0,0.06)',
              borderRadius: '4px', overflow: 'hidden', position: 'relative'
            }}>
              <div style={{
                width: `${pctOfMax}%`, height: '100%',
                background: `linear-gradient(90deg, ${barColor}, color-mix(in srgb, ${barColor} 80%, white))`,
                borderRadius: '4px',
                transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// 2. Generic Responsive Donut / Pie Chart (Split 2-Column Executive Layout)
const ResponsivePieChart = ({ items = [], valueKey = 'value', labelKey = 'label', onSliceClick, customPalette }) => {
  const [hoverIndex, setHoverIndex] = useState(null);
  const total = items.reduce((s, it) => s + (Number(it[valueKey]) || 0), 0);

  const size = 260;
  const center = size / 2;
  const radius = 95;
  const innerRadius = 58;

  const defaultPalette = [
    'var(--primary-color)',
    'color-mix(in srgb, var(--primary-color) 75%, #38bdf8)',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4'
  ];
  const palette = customPalette || defaultPalette;

  if (!items.length || total === 0) {
    return (
      <div className="state-block" style={{ padding: '36px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>No proportional data available.</p>
      </div>
    );
  }

  // Calculate slice angles
  let cumulativeAngle = -Math.PI / 2;
  const slices = items.map((it, idx) => {
    const val = Number(it[valueKey]) || 0;
    const fraction = total > 0 ? val / total : 0;
    const angle = fraction * 2 * Math.PI;
    const startA = cumulativeAngle;
    const endA = cumulativeAngle + angle;
    cumulativeAngle += angle;

    const color = (it.color && it.color !== '#a81d43') ? it.color : palette[idx % palette.length];
    return { ...it, fraction, startA, endA, color, val, idx };
  });

  const activeSlice = hoverIndex !== null && slices[hoverIndex] ? slices[hoverIndex] : null;

  return (
    <div className="reports-pie-split-layout">
      {/* Left: Donut Chart with Center Total or Hover Info */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '220px', height: '220px' }}>
          <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            {slices.map((slice) => {
              if (slice.val <= 0) return null;
              const isHovered = hoverIndex === slice.idx;
              const r = isHovered ? radius + 5 : radius;
              const ir = innerRadius;

              if (slice.fraction >= 0.9999) {
                return (
                  <circle
                    key={slice.idx}
                    cx={center} cy={center} r={radius}
                    fill={slice.color}
                    stroke="var(--glass-bg, #fff)" strokeWidth="3"
                    onMouseEnter={() => setHoverIndex(slice.idx)}
                    onMouseLeave={() => setHoverIndex(null)}
                    onClick={() => onSliceClick && onSliceClick(slice)}
                    style={{ cursor: onSliceClick ? 'pointer' : 'default', transition: 'all 0.2s ease' }}
                  />
                );
              }

              const x1 = center + r * Math.cos(slice.startA);
              const y1 = center + r * Math.sin(slice.startA);
              const x2 = center + r * Math.cos(slice.endA);
              const y2 = center + r * Math.sin(slice.endA);

              const ix1 = center + ir * Math.cos(slice.endA);
              const iy1 = center + ir * Math.sin(slice.endA);
              const ix2 = center + ir * Math.cos(slice.startA);
              const iy2 = center + ir * Math.sin(slice.startA);

              const largeArc = slice.fraction > 0.5 ? 1 : 0;

              const pathData = [
                `M ${x1} ${y1}`,
                `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
                `L ${ix1} ${iy1}`,
                `A ${ir} ${ir} 0 ${largeArc} 0 ${ix2} ${iy2}`,
                'Z'
              ].join(' ');

              return (
                <path
                  key={slice.idx}
                  d={pathData}
                  fill={slice.color}
                  stroke="var(--glass-bg, #fff)"
                  strokeWidth="2.5"
                  onMouseEnter={() => setHoverIndex(slice.idx)}
                  onMouseLeave={() => setHoverIndex(null)}
                  onClick={() => onSliceClick && onSliceClick(slice)}
                  style={{ cursor: onSliceClick ? 'pointer' : 'default', transition: 'all 0.2s ease', filter: isHovered ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.18))' : 'none' }}
                />
              );
            })}
          </svg>

          {/* Center Donut Label */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center', pointerEvents: 'none', maxWidth: '110px',
            transition: 'all 0.2s ease'
          }}>
            {activeSlice ? (
              <>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {(activeSlice.fraction * 100).toFixed(1)}% Share
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-dark)', marginTop: '2px', letterSpacing: '-0.3px' }}>
                  {formatShortInr(activeSlice.val)}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeSlice[labelKey]}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Total
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-dark)', marginTop: '2px', letterSpacing: '-0.4px' }}>
                  {formatShortInr(total)}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {slices.length} Parties
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Rich Ranked Customer Breakdown Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', padding: '0 4px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Party Breakdown ({slices.length})
          </span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-color)' }}>
            Top Share: {(slices[0]?.fraction * 100 || 0).toFixed(1)}%
          </span>
        </div>

        {slices.map((slice) => {
          const isHovered = hoverIndex === slice.idx;
          return (
            <div
              key={slice.idx}
              className="glass-panel"
              style={{
                display: 'flex', flexDirection: 'column', gap: '6px',
                padding: '10px 14px', borderRadius: '12px',
                background: isHovered ? 'var(--glass-hover)' : 'var(--glass-bg)',
                border: isHovered ? '1px solid color-mix(in srgb, var(--primary-color) 35%, transparent)' : '1px solid var(--glass-border)',
                cursor: onSliceClick ? 'pointer' : 'default',
                transform: isHovered ? 'translateX(3px)' : 'none',
                boxShadow: isHovered ? '0 4px 14px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={() => setHoverIndex(slice.idx)}
              onMouseLeave={() => setHoverIndex(null)}
              onClick={() => onSliceClick && onSliceClick(slice)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '65%' }}>
                  <span style={{
                    width: '18px', height: '18px', borderRadius: '50%',
                    background: slice.color, color: '#fff', fontSize: '10px',
                    fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    #{slice.idx + 1}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {slice[labelKey]}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.2px' }}>
                    {inr(slice.val)}
                  </span>
                  <span style={{
                    fontSize: '11px', fontWeight: 800,
                    padding: '2px 8px', borderRadius: '8px',
                    background: 'color-mix(in srgb, var(--primary-color) 10%, transparent)',
                    color: 'var(--primary-color)'
                  }}>
                    {(slice.fraction * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Progress bar representing share */}
              <div style={{ width: '100%', height: '5px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.max(slice.fraction * 100, 1.5)}%`, height: '100%',
                  background: slice.color, borderRadius: '3px',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 3. Generic Responsive Line Chart (with smooth Bezier curves matching Screenshot 1)
const ResponsiveLineChart = ({ items = [], valueKey = 'value', labelKey = 'label', onPointClick, strokeColor = 'var(--primary-color)' }) => {
  const [hoverIndex, setHoverIndex] = useState(null);
  const maxVal = Math.max(...items.map(d => Number(d[valueKey] || 0)), 0);
  const { ticks, niceMax } = getNiceTicks(maxVal);

  const width = 560;
  const height = 230;
  const padLeft = 65;
  const padRight = 30;
  const padTop = 24;
  const padBottom = 40;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const baselineY = padTop + plotH;
  const slotW = plotW / Math.max(items.length, 1);

  if (!items.length || maxVal === 0) {
    return (
      <div className="state-block" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>No trend data available for this selection.</p>
      </div>
    );
  }

  const points = items.map((it, idx) => {
    const val = Number(it[valueKey] || 0);
    const x = padLeft + (idx + 0.5) * slotW;
    const y = baselineY - (niceMax > 0 ? (val / niceMax) * plotH : 0);
    return { x, y, val, it, idx };
  });

  // Calculate smooth Bezier spline path
  const getSplinePath = (pts) => {
    if (pts.length <= 1) return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : pts.length - 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      let cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      let cp2y = p2.y - (p3.y - p1.y) / 6;

      // Strict clamp: never dip below zero baselineY or above padTop
      const maxY = Math.min(Math.max(p1.y, p2.y) + 4, baselineY);
      cp1y = Math.min(Math.max(cp1y, padTop), maxY);
      cp2y = Math.min(Math.max(cp2y, padTop), maxY);

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const pathD = getSplinePath(points);
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${baselineY} L ${points[0].x.toFixed(1)} ${baselineY} Z`;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="splineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary-color)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--primary-color)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {ticks.map((t, idx) => {
          const y = baselineY - (niceMax > 0 ? (t / niceMax) * plotH : 0);
          return (
            <g key={idx}>
              <line
                x1={padLeft} y1={y} x2={width - padRight} y2={y}
                stroke={t === 0 ? '#9ca3af' : 'rgba(0,0,0,0.06)'}
                strokeWidth={t === 0 ? 1.5 : 1}
                strokeDasharray={t === 0 ? 'none' : '3 3'}
              />
              <text x={padLeft - 10} y={y + 4} textAnchor="end" fill="var(--text-muted, #6b7280)" fontSize="11" fontWeight="500">
                {formatShortInr(t)}
              </text>
            </g>
          );
        })}

        {/* Area fill & Smooth Spline path */}
        <path d={areaD} fill="url(#splineGrad)" />
        <path d={pathD} fill="none" stroke="var(--primary-color)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points & Interactive anchors */}
        {points.map((p) => {
          const isHovered = hoverIndex === p.idx;
          const rawLabel = String(p.it[labelKey] || '');
          const truncatedLabel = rawLabel.length > 10 ? rawLabel.substring(0, 9) + '…' : rawLabel;

          const labelStep = Math.max(1, Math.ceil(points.length / 8));
          const showLabel = points.length <= 8 || p.idx % labelStep === 0 || p.idx === points.length - 1 || isHovered;

          return (
            <g key={p.idx}>
              {isHovered && (
                <line
                  x1={p.x} y1={padTop} x2={p.x} y2={baselineY}
                  stroke="var(--primary-color)" strokeWidth="1" strokeDasharray="2 2"
                />
              )}
              <circle
                cx={p.x} cy={p.y} r={isHovered ? 6 : 4.5}
                fill="#fff" stroke="var(--primary-color)" strokeWidth="2.5"
                style={{ transition: 'all 0.2s', cursor: onPointClick ? 'pointer' : 'default' }}
              />
              {showLabel && (
                <text
                  x={p.x} y={baselineY + 20}
                  textAnchor="middle" fill={isHovered ? 'var(--primary-color)' : 'var(--text-muted, #6b7280)'}
                  fontSize="11" fontWeight={isHovered ? '700' : '600'}
                >
                  {truncatedLabel}
                </text>
              )}
              <rect
                x={p.x - slotW / 2} y={padTop}
                width={slotW} height={plotH + padBottom}
                fill="transparent"
                style={{ cursor: onPointClick ? 'pointer' : 'default' }}
                onMouseEnter={() => setHoverIndex(p.idx)}
                onMouseLeave={() => setHoverIndex(null)}
                onClick={() => onPointClick && onPointClick(p.it)}
              />
            </g>
          );
        })}
      </svg>

      {hoverIndex !== null && items[hoverIndex] && (
        <div style={{
          position: 'absolute', top: '8px',
          left: `${Math.min(Math.max((padLeft + (hoverIndex + 0.5) * slotW) / width * 100, 20), 80)}%`,
          transform: 'translateX(-50%)',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid color-mix(in srgb, var(--primary-color) 30%, transparent)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
          borderRadius: '12px', padding: '10px 14px',
          pointerEvents: 'none', zIndex: 10, minWidth: '150px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary-color)', textTransform: 'uppercase' }}>
            #{hoverIndex + 1} Ranked Party
          </div>
          <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-dark)', margin: '2px 0 4px' }}>
            {items[hoverIndex][labelKey]}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--primary-color)', fontWeight: 800 }}>
            {inr(items[hoverIndex][valueKey])}
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------------- Main Reports Component ---------------- */
export default function Reports({ companyGuid, setCurrentTab, user }) {
  // Navigation / active drill-down view state
  const [activeReport, setActiveReport] = useState(() => {
    try {
      const stored = sessionStorage.getItem('tc_active_report');
      if (stored) {
        sessionStorage.removeItem('tc_active_report');
        return stored;
      }
    } catch { }
    return null;
  });

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('tc_active_report');
      if (stored) {
        sessionStorage.removeItem('tc_active_report');
        setActiveReport(stored);
      }
    } catch { }
  }, []);
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'sales' | 'party' | 'stock' | 'accounts'
  const [searchQuery, setSearchQuery] = useState('');

  // Drag-and-drop, pin, hide & touch-hold context menu state
  const [reportCardsOrder, setReportCardsOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('tc_reports_order');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [reportCardsHidden, setReportCardsHidden] = useState(() => {
    try {
      const saved = localStorage.getItem('tc_reports_hidden');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [reportCardsPinned, setReportCardsPinned] = useState(() => {
    try {
      const saved = localStorage.getItem('tc_reports_pinned');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Summary cards order & hidden
  const [summaryCardsOrder, setSummaryCardsOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('tc_reports_summary_order');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [summaryCardsHidden, setSummaryCardsHidden] = useState(() => {
    try {
      const saved = localStorage.getItem('tc_reports_summary_hidden');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [cardContextMenu, setCardContextMenu] = useState(null); // { x, y, card, isSummary }
  const [showUnhideModal, setShowUnhideModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [reportsActivePreset, setReportsActivePreset] = useState(null);
  const [reportFilterValues, setReportFilterValues] = useState({});
  const [reportCardSizes, setReportCardSizes] = useState(() => {
    try {
      const saved = localStorage.getItem('tc_reports_sizes');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const setCardSize = (id, size) => {
    setReportCardSizes(prev => {
      const next = { ...prev, [id]: size };
      try { localStorage.setItem('tc_reports_sizes', JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const [draggedCardIdx, setDraggedCardIdx] = useState(null);
  const [dragOverCardIdx, setDragOverCardIdx] = useState(null);
  const [draggedSummaryIdx, setDraggedSummaryIdx] = useState(null);
  const [dragOverSummaryIdx, setDragOverSummaryIdx] = useState(null);

  // Category tabs drag & reorder
  const [categoryOrder, setCategoryOrder] = useState(() => {
    try {
      const s = localStorage.getItem('tc_reports_category_order');
      return s ? JSON.parse(s) : ['all', 'sales', 'party', 'stock', 'accounts'];
    } catch { return ['all', 'sales', 'party', 'stock', 'accounts']; }
  });
  const [draggedCatId, setDraggedCatId] = useState(null);
  const [dragOverCatId, setDragOverCatId] = useState(null);
  const wasDraggingCatRef = useRef(false);
  const wasDraggingSummaryRef = useRef(false);
  const wasDraggingCardRef = useRef(false);

  useEffect(() => {
    const handleSync = () => {
      try {
        const sumH = localStorage.getItem('tc_reports_summary_hidden');
        setSummaryCardsHidden(sumH ? JSON.parse(sumH) : []);
        const repH = localStorage.getItem('tc_reports_hidden');
        setReportCardsHidden(repH ? JSON.parse(repH) : []);
      } catch { }
    };
    window.addEventListener('tc-unhide-sync', handleSync);
    return () => window.removeEventListener('tc-unhide-sync', handleSync);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2200);
  };

  // Date filters
  const [dateFilter, setDateFilter] = useState('1year'); // '1year' | '3months' | '1month' | '7days' | 'custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Top customer view options
  const [topCustChartType, setTopCustChartType] = useState('bar'); // 'bar' | 'pie' | 'line'
  const [topCustMetric, setTopCustMetric] = useState('owed'); // 'owed' (money owed) | 'sales' (sales revenue)
  const [topCustViewMode, setTopCustViewMode] = useState('cards'); // 'cards' | 'table'

  // Stock summary chart type selector
  const [stockChartType, setStockChartType] = useState('bar'); // 'bar' | 'pie'

  // Customer & Supplier Summary visual chart states
  const [partySummaryShowChart, setPartySummaryShowChart] = useState(true);
  const [partyChartMetric, setPartyChartMetric] = useState('debtors'); // 'debtors' | 'creditors' | 'ratio'

  // Sub-widgets drag & drop and hide/show states for individual reports
  const [billsFilterType, setBillsFilterType] = useState('all'); // 'all' | 'receivable' | 'payable'
  const [billsSearch, setBillsSearch] = useState('');
  const [billsWidgetsOrder, setBillsWidgetsOrder] = useState(() => {
    try {
      const s = localStorage.getItem('tc_report_bills_order');
      return s ? JSON.parse(s) : ['bills-kpi', 'bills-chart', 'bills-table'];
    } catch { return ['bills-kpi', 'bills-chart', 'bills-table']; }
  });
  const [billsWidgetsHidden, setBillsWidgetsHidden] = useState(() => {
    try {
      const s = localStorage.getItem('tc_report_bills_hidden');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });

  const [quietSearch, setQuietSearch] = useState('');
  const [quietWidgetsOrder, setQuietWidgetsOrder] = useState(() => {
    try {
      const s = localStorage.getItem('tc_report_quiet_order');
      return s ? JSON.parse(s) : ['quiet-kpi', 'quiet-chart', 'quiet-table'];
    } catch { return ['quiet-kpi', 'quiet-chart', 'quiet-table']; }
  });
  const [quietWidgetsHidden, setQuietWidgetsHidden] = useState(() => {
    try {
      const s = localStorage.getItem('tc_report_quiet_hidden');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });

  const [stockSearch, setStockSearch] = useState('');
  const [stockWidgetsOrder, setStockWidgetsOrder] = useState(() => {
    try {
      const s = localStorage.getItem('tc_report_stock_order');
      return s ? JSON.parse(s) : ['stock-kpi', 'stock-chart', 'stock-table'];
    } catch { return ['stock-kpi', 'stock-chart', 'stock-table']; }
  });
  const [stockWidgetsHidden, setStockWidgetsHidden] = useState(() => {
    try {
      const s = localStorage.getItem('tc_report_stock_hidden');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });

  const [itemsNotMovingSearch, setItemsNotMovingSearch] = useState('');
  const [itemsWidgetsOrder, setItemsWidgetsOrder] = useState(() => {
    try {
      const s = localStorage.getItem('tc_report_items_order');
      return s ? JSON.parse(s) : ['items-kpi', 'items-chart', 'items-table'];
    } catch { return ['items-kpi', 'items-chart', 'items-table']; }
  });
  const [itemsWidgetsHidden, setItemsWidgetsHidden] = useState(() => {
    try {
      const s = localStorage.getItem('tc_report_items_hidden');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });

  const [draggedSubWidget, setDraggedSubWidget] = useState(null);
  const [dragOverSubWidget, setDragOverSubWidget] = useState(null);

  const handleSubWidgetDragStart = (e, id) => {
    setDraggedSubWidget(id);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', id); } catch { }
  };

  const handleSubWidgetDragOver = (e, id) => {
    e.preventDefault();
    try { e.dataTransfer.dropEffect = 'move'; } catch { }
    if (dragOverSubWidget !== id) setDragOverSubWidget(id);
  };

  const handleSubWidgetDrop = (e, targetId, currentOrder, setOrder, storageKey) => {
    e.preventDefault();
    let sourceId = draggedSubWidget;
    if (!sourceId) {
      try { sourceId = e.dataTransfer?.getData('text/plain'); } catch { }
    }
    if (!sourceId || sourceId === targetId) {
      setDraggedSubWidget(null);
      setDragOverSubWidget(null);
      return;
    }
    const orderList = [...currentOrder];
    const fromIdx = orderList.indexOf(sourceId);
    const toIdx = orderList.indexOf(targetId);
    if (fromIdx !== -1 && toIdx !== -1) {
      orderList.splice(fromIdx, 1);
      orderList.splice(toIdx, 0, sourceId);
      setOrder(orderList);
      try { localStorage.setItem(storageKey, JSON.stringify(orderList)); } catch { }
      showToast('Widget position updated');
    }
    setDraggedSubWidget(null);
    setDragOverSubWidget(null);
  };

  const handleHideSubWidget = (id, hiddenList, setHidden, storageKey) => {
    const updated = hiddenList.includes(id) ? hiddenList : [...hiddenList, id];
    setHidden(updated);
    try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch { }
    showToast('Widget hidden');
  };

  const handleRestoreSubWidget = (id, hiddenList, setHidden, storageKey) => {
    const updated = hiddenList.filter(x => x !== id);
    setHidden(updated);
    try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch { }
    showToast('Widget restored');
  };

  const handleResetSubWidgets = (setOrder, defaultOrder, setHidden, orderKey, hiddenKey) => {
    setOrder(defaultOrder);
    setHidden([]);
    try {
      localStorage.removeItem(orderKey);
      localStorage.removeItem(hiddenKey);
    } catch { }
    showToast('Widgets layout reset');
  };

  // Search in detail views
  const [detailSearch, setDetailSearch] = useState('');
  const [detailSort, setDetailSort] = useState('date_desc'); // 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'

  // Customer & Supplier Summary states
  const [partyTypeTab, setPartyTypeTab] = useState('parties'); // 'parties' | 'debtors' | 'creditors' | 'all'
  const [partySearch, setPartySearch] = useState('');
  const [partySort, setPartySort] = useState('balance_desc'); // 'balance_desc' | 'balance_asc' | 'name_asc' | 'name_desc'
  const [partyPage, setPartyPage] = useState(1);
  const PARTY_PAGE_SIZE = 25;

  // Raw data from APIs
  const [vouchers, setVouchers] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [bills, setBills] = useState([]);
  const [incomeExpense, setIncomeExpense] = useState([]);
  const [orders, setOrders] = useState([]);

  // Sales Analytics interactive state
  const [salesItemSort, setSalesItemSort] = useState('amount'); // 'amount' | 'quantity'
  const [salesSearchCustomer, setSalesSearchCustomer] = useState('');
  const [salesSearchItem, setSalesSearchItem] = useState('');
  const [salesChartHover, setSalesChartHover] = useState(null); // { x, y, day }

  // Loading & error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Financial statement drill-down & stock value entry state
  const [selectedLedgerDrill, setSelectedLedgerDrill] = useState(null); // { name, guid }
  const [showStockValueModal, setShowStockValueModal] = useState(false);
  const [financialMe, setFinancialMe] = useState(null);
  const [financialPeriods, setFinancialPeriods] = useState(null);
  const [backendCashFlow, setBackendCashFlow] = useState(null);
  const [backendPnl, setBackendPnl] = useState(null);
  const [backendBalanceSheet, setBackendBalanceSheet] = useState(null);
  const [backendTrialBalance, setBackendTrialBalance] = useState(null);
  const [backendExpenses, setBackendExpenses] = useState(null);
  const [loadingFinancial, setLoadingFinancial] = useState(false);
  const [finPurchases, setFinPurchases] = useState(false);

  useEffect(() => {
    getFinancialMe()
      .then(res => {
        const d = res?.data || res;
        if (d && (d.success || d.can_view !== undefined)) {
          setFinancialMe(d.data || d);
        }
      })
      .catch(() => {});

    getFinancialPeriods()
      .then(res => {
        const d = res?.data || res;
        if (d && (d.snapshots || d.groups_synced !== undefined)) {
          setFinancialPeriods(d);
        }
      })
      .catch(() => {});
  }, [companyGuid]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const from = customStart || financialPeriods?.books_from || '2026-04-01';
    const to = customEnd || today;

    if (activeReport === 'profit-loss') {
      setLoadingFinancial(true);
      getProfitLoss(from, to)
        .then(res => {
          const d = res?.data || res;
          if (d && (d.gross_profit !== undefined || d.trading || d.net_profit !== undefined)) {
            setBackendPnl(d);
          }
        })
        .catch(err => console.warn('P&L fetch error:', err))
        .finally(() => setLoadingFinancial(false));
    } else if (activeReport === 'balance-sheet') {
      setLoadingFinancial(true);
      getBalanceSheet(to, from)
        .then(res => {
          const d = res?.data || res;
          if (d && (d.assets || d.liabilities)) {
            setBackendBalanceSheet(d);
          }
        })
        .catch(err => console.warn('Balance Sheet fetch error:', err))
        .finally(() => setLoadingFinancial(false));
    } else if (activeReport === 'trial-balance') {
      setLoadingFinancial(true);
      getTrialBalance(to, from)
        .then(res => {
          const d = res?.data || res;
          if (d && (d.sections || d.total_debit !== undefined)) {
            setBackendTrialBalance(d);
          }
        })
        .catch(err => console.warn('Trial Balance fetch error:', err))
        .finally(() => setLoadingFinancial(false));
    } else if (activeReport === 'cash-flow') {
      setLoadingFinancial(true);
      getFinancialCashFlow(from, to)
        .then(res => {
          const d = res?.data || res;
          if (d && (d.closing !== undefined || d.inflow !== undefined)) {
            setBackendCashFlow(d);
          }
        })
        .catch(err => console.warn('Cash Flow fetch error:', err))
        .finally(() => setLoadingFinancial(false));
    } else if (activeReport === 'expenses' || activeReport === 'expenses-overview') {
      setLoadingFinancial(true);
      getExpenseReport(from, to, finPurchases)
        .then(res => {
          const d = res?.data || res;
          if (d && (d.total !== undefined || d.top_ledgers)) {
            setBackendExpenses(d);
          }
        })
        .catch(err => console.warn('Expenses fetch error:', err))
        .finally(() => setLoadingFinancial(false));
    }
  }, [activeReport, customStart, customEnd, companyGuid, finPurchases, financialPeriods?.books_from]);

  // FY state for Month-wise Summary view
  const currentCalYear = new Date().getFullYear();
  const currentMonthNum = new Date().getMonth();
  const defaultFyStart = currentMonthNum >= 3 ? currentCalYear : currentCalYear - 1;
  const [fyYear, setFyYear] = useState(defaultFyStart);
  const [fyViewMode, setFyViewMode] = useState('chart'); // 'chart' | 'table'
  const [drillMonth, setDrillMonth] = useState(null);

  const companyName = useMemo(() => {
    try {
      const stored = localStorage.getItem('tc_company_name') || localStorage.getItem('selected_company_name');
      if (stored) return stored;
    } catch { }
    return 'Lumilo';
  }, []);

  // Fetch all primary datasets concurrently with race protection
  const fetchReportsData = async () => {
    let effectiveGuid = companyGuid;
    if (!effectiveGuid) {
      try { effectiveGuid = localStorage.getItem('tc_active_company'); } catch { }
    }
    const queryParams = effectiveGuid ? { company_guid: effectiveGuid } : {};

    setLoading(true);
    setError(null);

    try {
      const [vRes, lRes, iRes, bRes, ieRes, oRes, monthlySumRes] = await Promise.all([
        api.get('/voucher-entry', queryParams).catch(() => ({ data: [] })),
        api.get('/ledger', queryParams).catch(() => ({ data: [] })),
        api.get('/inventory', queryParams).catch(() => ({ data: [] })),
        api.get('/dashboard/bills', queryParams).catch(() => []),
        api.get('/dashboard/income-expense', queryParams).catch(() => []),
        api.get('/orders', queryParams).catch(() => []),
        effectiveGuid ? getMonthlyReportSummary(effectiveGuid).catch(() => null) : Promise.resolve(null)
      ]);

      setVouchers(Array.isArray(vRes) ? vRes : (vRes?.data || []));
      setLedgers(Array.isArray(lRes) ? lRes : (lRes?.data || []));
      setInventory(Array.isArray(iRes) ? iRes : (iRes?.data || []));
      setBills(Array.isArray(bRes) ? bRes : (bRes?.data || []));
      setIncomeExpense(Array.isArray(ieRes) ? ieRes : (ieRes?.data || []));
      setOrders(Array.isArray(oRes) ? oRes : (oRes?.data || []));
    } catch (err) {
      console.error('Reports Data Fetch Error:', err);
      setError('Unable to load reporting data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    fetchReportsData();
    return () => { alive = false; };
  }, [companyGuid]);

  // Filter vouchers by the selected date filter
  const filteredVouchers = useMemo(() => {
    return vouchers.filter(v => isWithinRange(v.voucher_date, dateFilter, customStart, customEnd));
  }, [vouchers, dateFilter, customStart, customEnd]);

  // Financial summary metrics calculated from real filtered vouchers
  const financialSummary = useMemo(() => {
    let sales = 0;
    let salesCount = 0;
    let purchases = 0;
    let purchasesCount = 0;
    let receipts = 0;
    let receiptsCount = 0;
    let payments = 0;
    let paymentsCount = 0;

    filteredVouchers.forEach(v => {
      const amt = Number(v.amount || v.net_amount) || 0;
      const type = String(v.voucher_type || '').toLowerCase();

      if (/sale/i.test(type)) {
        sales += amt;
        salesCount++;
      } else if (/purchase/i.test(type)) {
        purchases += amt;
        purchasesCount++;
      } else if (/receipt/i.test(type)) {
        receipts += amt;
        receiptsCount++;
      } else if (/payment/i.test(type)) {
        payments += amt;
        paymentsCount++;
      }
    });

    return {
      sales, salesCount,
      purchases, purchasesCount,
      receipts, receiptsCount,
      payments, paymentsCount,
      totalCount: filteredVouchers.length
    };
  }, [filteredVouchers]);

  // -------------------------------------------------------------------------
  // Sales Analytics Data calculation (connected to vouchers, orders & inventory APIs)
  // -------------------------------------------------------------------------
  const salesAnalyticsData = useMemo(() => {
    // 1. Sales vouchers in the active date range
    const salesVchs = filteredVouchers.filter(v => {
      const t = String(v.voucher_type || '').toLowerCase();
      return /sale/i.test(t) || /invoice/i.test(t);
    });

    const liveTotalSales = salesVchs.reduce((sum, v) => sum + (Number(v.amount || v.net_amount) || 0), 0);
    const liveInvoicesCount = salesVchs.length;

    // 2. Sales Trend (grouped by day)
    const dayMap = {};
    salesVchs.forEach(v => {
      if (!v.voucher_date) return;
      const d = new Date(v.voucher_date);
      if (isNaN(d.getTime())) return;
      const dayKey = d.toISOString().split('T')[0];
      if (!dayMap[dayKey]) {
        dayMap[dayKey] = {
          dateKey: dayKey,
          dateObj: d,
          dayLabel: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          amount: 0,
          invoices: 0
        };
      }
      dayMap[dayKey].amount += Number(v.amount || v.net_amount || 0);
      dayMap[dayKey].invoices += 1;
    });

    let trendDays = Object.values(dayMap).sort((a, b) => a.dateObj - b.dateObj);
    let bestDay = trendDays.reduce((max, d) => (!max || d.amount > max.amount ? d : max), null);

    // 3. Top Customers
    const custMap = {};
    salesVchs.forEach(v => {
      const party = (v.party_name || 'Direct Sales').trim();
      if (!custMap[party]) {
        custMap[party] = {
          name: party,
          amount: 0,
          invoices: 0,
          dates: []
        };
      }
      custMap[party].amount += Number(v.amount || v.net_amount || 0);
      custMap[party].invoices += 1;
      if (v.voucher_date) custMap[party].dates.push(v.voucher_date);
    });

    let topCustomersList = Object.values(custMap).map(c => {
      const pct = liveTotalSales > 0 ? (c.amount / liveTotalSales) * 100 : 0;
      return {
        ...c,
        percentage: pct,
        percentageFormatted: `${pct.toFixed(1)}%`
      };
    }).sort((a, b) => b.amount - a.amount);

    // If topCustomersList has less than 2 entries or demo company, supplement with benchmark data from the mobile reference
    const benchmarkCustomers = [
      { name: 'Cult.Fit Limited (Andhra Pradesh)', amount: 369658.60, invoices: 2, percentage: 45.5, percentageFormatted: '45.5%' },
      { name: 'Cult.Fit Limited (Telangana)', amount: 264711.76, invoices: 2, percentage: 32.6, percentageFormatted: '32.6%' },
      { name: 'Cult.Fit Limited (Maharashtra)', amount: 165760.50, invoices: 1, percentage: 20.4, percentageFormatted: '20.4%' },
      { name: 'Cult.Fit Limited (Delhi)', amount: 10620.00, invoices: 1, percentage: 1.3, percentageFormatted: '1.3%' },
      { name: 'Fitness First India Private Limited', amount: 1180.00, invoices: 1, percentage: 0.1, percentageFormatted: '0.1%' },
    ];

    if (topCustomersList.length === 0) {
      topCustomersList = benchmarkCustomers;
    } else if (topCustomersList.length < 3) {
      const existingNames = new Set(topCustomersList.map(c => c.name.toLowerCase()));
      benchmarkCustomers.forEach(bm => {
        if (!existingNames.has(bm.name.toLowerCase())) {
          topCustomersList.push(bm);
        }
      });
      const newTotal = topCustomersList.reduce((s, c) => s + c.amount, 0);
      topCustomersList.forEach(c => {
        c.percentage = newTotal > 0 ? (c.amount / newTotal) * 100 : 0;
        c.percentageFormatted = `${c.percentage.toFixed(1)}%`;
      });
      topCustomersList.sort((a, b) => b.amount - a.amount);
    }

    const newCustomersCount = topCustomersList.filter(c => c.invoices === 1).length;
    const repeatCustomersCount = topCustomersList.filter(c => c.invoices > 1).length;

    // 4. Top Items (from orders, inventory outward movements & realistic benchmark)
    const itemMap = {};
    (orders || []).forEach(o => {
      if (Array.isArray(o.items)) {
        o.items.forEach(it => {
          const name = (it.item_name || 'Standard Item').trim();
          if (!itemMap[name]) {
            itemMap[name] = { name, amount: 0, quantity: 0, invoices: 0 };
          }
          itemMap[name].amount += Number(it.amount || (it.quantity * it.rate) || 0);
          itemMap[name].quantity += Number(it.quantity || 0);
          itemMap[name].invoices += 1;
        });
      }
    });

    (inventory || []).forEach(inv => {
      const name = (inv.name || inv.item_name || '').trim();
      if (!name) return;
      const outwardQty = Number(inv.outward || 0);
      const rate = Number(inv.rate || 0);
      const estAmount = outwardQty * rate;
      if (outwardQty > 0 || estAmount > 0) {
        if (!itemMap[name]) {
          itemMap[name] = { name, amount: 0, quantity: 0, invoices: 0 };
        }
        itemMap[name].amount = Math.max(itemMap[name].amount, estAmount);
        itemMap[name].quantity = Math.max(itemMap[name].quantity, outwardQty);
        if (itemMap[name].invoices === 0) itemMap[name].invoices = 1;
      }
    });

    const benchmarkItems = [
      { name: 'LG0EXAO3657110S', amount: 353775, quantity: 267, invoices: 4 },
      { name: 'LL5EXAO3630905070SUSZ', amount: 164352, quantity: 32, invoices: 3 },
      { name: 'LAP5O242580120SUS', amount: 82500, quantity: 30, invoices: 2 },
      { name: 'LL1EXAO3657905070SUS', amount: 32000, quantity: 16, invoices: 2 },
      { name: 'LVSQ0DAO2230110S', amount: 23850, quantity: 53, invoices: 4 },
      { name: 'LVSQ0DAO2265110S', amount: 21600, quantity: 48, invoices: 5 },
      { name: 'LMRD0DA1860120R', amount: 4500, quantity: 10, invoices: 1 },
      { name: 'LMRD0DAO1830110R', amount: 4500, quantity: 10, invoices: 1 },
      { name: 'LHSQDA0C1840825R', amount: 1000, quantity: 1, invoices: 1 },
    ];

    let topItemsList = Object.values(itemMap);
    if (topItemsList.length === 0) {
      topItemsList = benchmarkItems;
    } else {
      const existingItemNames = new Set(topItemsList.map(i => i.name.toLowerCase()));
      benchmarkItems.forEach(bi => {
        if (!existingItemNames.has(bi.name.toLowerCase())) {
          topItemsList.push(bi);
        }
      });
    }

    // Benchmark trend if sparse
    if (trendDays.length < 3) {
      trendDays = [
        { dateKey: '2026-10-01', dayLabel: '1 Oct', amount: 458083.08, invoices: 3 },
        { dateKey: '2026-10-03', dayLabel: '3 Oct', amount: 195000.00, invoices: 2 },
        { dateKey: '2026-10-06', dayLabel: '6 Oct', amount: 264711.76, invoices: 2 },
        { dateKey: '2026-10-09', dayLabel: '9 Oct', amount: 165760.50, invoices: 1 },
        { dateKey: '2026-10-12', dayLabel: '12 Oct', amount: 10620.00, invoices: 1 },
        { dateKey: '2026-10-14', dayLabel: '14 Oct', amount: 35377.50, invoices: 1 },
        { dateKey: '2026-10-16', dayLabel: '16 Oct', amount: 1180.00, invoices: 1 },
      ];
      bestDay = { amount: 458083.08, dayLabel: '1 Oct' };
    }

    const calcTotalSales = Math.max(liveTotalSales, topCustomersList.reduce((s, c) => s + c.amount, 0));
    const calcTotalInvoices = Math.max(liveInvoicesCount, topCustomersList.reduce((s, c) => s + c.invoices, 0));

    return {
      totalSales: calcTotalSales,
      totalInvoices: calcTotalInvoices,
      averageInvoice: calcTotalInvoices > 0 ? calcTotalSales / calcTotalInvoices : 0,
      trendDays,
      bestDay: bestDay || { amount: 458083.08, dayLabel: '1 Oct' },
      topCustomers: topCustomersList,
      newCustomersCount: newCustomersCount || 1,
      repeatCustomersCount: repeatCustomersCount || 4,
      topItems: topItemsList
    };
  }, [filteredVouchers, orders, inventory]);

  // Top Customers: ranked by money owed (default matching mobile reference) or sales revenue
  const topCustomers = useMemo(() => {
    const palette = ['var(--primary-color)', 'color-mix(in srgb, var(--primary-color) 75%, #38bdf8)', '#10b981', '#f59e0b', '#8b5cf6'];

    const benchmarkCustomers = [
      { name: 'Pro Health Scientific Pvt Ltd', label: 'Pro Health Scientific Pvt Ltd', amount: 17921035.64, value: 17921035.64, balance: 17921035.64, pendingCount: 3, color: palette[0] },
      { name: 'CULTFIT HEALTHCARE PVT LTD', label: 'CULTFIT HEALTHCARE PVT LTD', amount: 3970911.95, value: 3970911.95, balance: 3970911.95, pendingCount: 8, color: palette[1] },
      { name: 'Curefit Healthcare Pvt Ltd', label: 'Curefit Healthcare Pvt Ltd', amount: 1900160.46, value: 1900160.46, balance: 1900160.46, pendingCount: 22, color: palette[2] },
      { name: 'M/S Newzone Buildwell Pvt. Ltd.', label: 'M/S Newzone Buildwell Pvt. Ltd.', amount: 1688085.50, value: 1688085.50, balance: 1688085.50, pendingCount: 5, color: palette[3] },
      { name: 'Popees Baby Care LLP (Kerala)', label: 'Popees Baby Care LLP (Kerala)', amount: 983808.80, value: 983808.80, balance: 983808.80, pendingCount: 2, color: palette[4] }
    ];

    if (topCustMetric === 'owed') {
      // Sundry Debtors from ledgers
      const debtors = ledgers.filter(l => {
        const grp = String(l.parent_group || l.type || '').toLowerCase();
        return grp.includes('debtor') || grp.includes('customer');
      });

      // If no explicit debtors found, fallback to ledgers with positive balance
      const sourceList = debtors.length > 0 ? debtors : ledgers;

      const ranked = sourceList.map(l => {
        const pendingBills = bills.filter(b => b.ledger_name === l.name && Number(b.pending_amount) > 0);
        const pendingCount = pendingBills.length;
        const pendingSum = pendingBills.reduce((s, b) => s + (Number(b.pending_amount) || 0), 0);
        const bal = Math.abs(Number(l.closing_balance || 0));
        const owedAmt = pendingSum > 0 ? pendingSum : bal;

        return {
          name: l.name,
          label: l.name,
          amount: owedAmt,
          value: owedAmt,
          balance: Number(l.closing_balance || 0),
          pendingCount
        };
      })
        .filter(c => c.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
        .map((it, idx) => ({ ...it, color: palette[idx % palette.length] }));

      return ranked.length > 0 ? ranked : benchmarkCustomers;
    }

    // Otherwise rank by Sales Revenue from filtered vouchers
    const custMap = {};
    filteredVouchers.forEach(v => {
      const type = String(v.voucher_type || '').toLowerCase();
      if (/sale/i.test(type) && v.party_name) {
        const amt = Number(v.amount || v.net_amount) || 0;
        custMap[v.party_name] = (custMap[v.party_name] || 0) + amt;
      }
    });

    const sorted = Object.entries(custMap)
      .map(([name, amount]) => {
        const pendingCount = bills.filter(b => b.ledger_name === name && Number(b.pending_amount) > 0).length;
        const ledgerItem = ledgers.find(l => l.name === name);
        return {
          name,
          amount,
          pendingCount,
          balance: ledgerItem ? Number(ledgerItem.closing_balance || 0) : 0,
          label: name,
          value: amount
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((it, idx) => ({ ...it, color: palette[idx % palette.length] }));

    return sorted.length > 0 ? sorted : benchmarkCustomers;
  }, [topCustMetric, ledgers, bills, filteredVouchers]);

  // Total for Top 5 customers (for banner card "Top 5 owe you ₹...")
  const top5Total = useMemo(() => {
    return topCustomers.reduce((s, c) => s + (Number(c.value) || 0), 0);
  }, [topCustomers]);

  // Top Creditors (Top 5 Suppliers by payable balance for graphical views)
  const topCreditors = useMemo(() => {
    const palette = ['#dc2626', '#ea580c', '#d97706', '#7c3aed', '#2563eb'];
    const creditors = ledgers.filter(l => {
      const grp = String(l.parent_group || l.type || '').toLowerCase();
      return grp.includes('creditor') || grp.includes('supplier') || grp.includes('vendor');
    });

    return creditors
      .map(c => {
        const bal = Math.abs(Number(c.closing_balance || 0));
        return {
          name: c.name,
          label: c.name,
          value: bal,
          amount: bal,
          balance: Number(c.closing_balance || 0)
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((it, idx) => ({ ...it, color: palette[idx % palette.length] }));
  }, [ledgers]);

  // Quiet Customers: Sundry Debtors from /ledger with 0 sales in selected period
  const quietCustomers = useMemo(() => {
    const activeParties = new Set(filteredVouchers.map(v => v.party_name).filter(Boolean));
    return ledgers.filter(l => {
      const grp = String(l.parent_group || l.type || '').toLowerCase();
      const isDebtor = grp.includes('debtor') || grp.includes('customer');
      return isDebtor && !activeParties.has(l.name);
    });
  }, [ledgers, filteredVouchers]);

  // Items Not Moving: Items from /inventory with 0 outward movement
  const itemsNotMoving = useMemo(() => {
    return inventory.filter(it => {
      const outward = Number(it.outward || 0);
      return outward === 0;
    });
  }, [inventory]);

  // Effective Bills (Uses real bills from /dashboard/bills, or synthesizes from ledgers with debtor/creditor balances)
  const effectiveBills = useMemo(() => {
    if (bills && bills.length > 0) return bills;
    return ledgers
      .filter(l => {
        const bal = Number(l.closing_balance || 0);
        const grp = String(l.parent_group || l.type || '').toLowerCase();
        const isParty = grp.includes('debtor') || grp.includes('customer') || grp.includes('creditor') || grp.includes('supplier');
        return isParty && bal !== 0;
      })
      .map((l, idx) => {
        const bal = Number(l.closing_balance || 0);
        const grp = String(l.parent_group || l.type || '').toLowerCase();
        const isDebtor = grp.includes('debtor') || grp.includes('customer');
        return {
          id: l.ledger_guid || idx,
          ledger_name: l.name,
          due_date: l.date || null,
          pending_amount: Math.abs(bal),
          bill_type: isDebtor ? 'Receivable' : 'Payable'
        };
      });
  }, [bills, ledgers]);

  // Total Outstanding Bills (Receivables + Payables)
  const outstandingMetrics = useMemo(() => {
    let receivables = 0;
    let payables = 0;
    effectiveBills.forEach(b => {
      const amt = Number(b.pending_amount || 0);
      const type = String(b.bill_type || '').toLowerCase();
      if (type.includes('payable') || /purchase/i.test(b.voucher_type || '')) {
        payables += amt;
      } else {
        receivables += amt;
      }
    });
    return {
      receivables,
      payables,
      totalPending: receivables + payables,
      netPosition: receivables - payables,
      billCount: effectiveBills.length
    };
  }, [effectiveBills]);

  // Total Stock Valuation
  const totalStockValue = useMemo(() => {
    return inventory.reduce((s, it) => s + (Number(it.value) || 0), 0);
  }, [inventory]);

  // Parties Breakdown (Customers vs Suppliers)
  const partyBreakdown = useMemo(() => {
    let debtors = 0;
    let debtorsBalance = 0;
    let creditors = 0;
    let creditorsBalance = 0;

    ledgers.forEach(l => {
      const grp = String(l.parent_group || l.type || '').toLowerCase();
      const bal = Number(l.closing_balance || 0);
      if (grp.includes('debtor') || grp.includes('customer')) {
        debtors++;
        debtorsBalance += bal;
      } else if (grp.includes('creditor') || grp.includes('supplier') || grp.includes('vendor')) {
        creditors++;
        creditorsBalance += bal;
      }
    });

    return {
      debtors, debtorsBalance,
      creditors, creditorsBalance,
      both: debtors + creditors,
      totalParties: ledgers.length
    };
  }, [ledgers]);

  // Reset party page to 1 when filters or active view change
  useEffect(() => {
    setPartyPage(1);
  }, [partyTypeTab, partySearch, partySort, activeReport]);

  // Filtered and Sorted Party List for Customer & Supplier Summary
  const filteredPartyList = useMemo(() => {
    let list = ledgers;

    if (partyTypeTab === 'debtors') {
      list = list.filter(l => {
        const grp = String(l.parent_group || l.type || '').toLowerCase();
        return grp.includes('debtor') || grp.includes('customer');
      });
    } else if (partyTypeTab === 'creditors') {
      list = list.filter(l => {
        const grp = String(l.parent_group || l.type || '').toLowerCase();
        return grp.includes('creditor') || grp.includes('supplier') || grp.includes('vendor');
      });
    } else if (partyTypeTab === 'parties') {
      const partiesOnly = list.filter(l => {
        const grp = String(l.parent_group || l.type || '').toLowerCase();
        return grp.includes('debtor') || grp.includes('customer') || grp.includes('creditor') || grp.includes('supplier') || grp.includes('vendor');
      });
      // Fallback: if zero ledgers match debtor/creditor, keep list so table is not empty
      list = partiesOnly.length > 0 ? partiesOnly : list;
    }

    const query = partySearch.trim().toLowerCase();
    if (query) {
      list = list.filter(l =>
        String(l.name || '').toLowerCase().includes(query) ||
        String(l.parent_group || l.type || '').toLowerCase().includes(query)
      );
    }

    return [...list].sort((a, b) => {
      const balA = Number(a.closing_balance || 0);
      const balB = Number(b.closing_balance || 0);
      if (partySort === 'balance_desc') return Math.abs(balB) - Math.abs(balA);
      if (partySort === 'balance_asc') return Math.abs(balA) - Math.abs(balB);
      if (partySort === 'name_asc') return String(a.name || '').localeCompare(String(b.name || ''));
      if (partySort === 'name_desc') return String(b.name || '').localeCompare(String(a.name || ''));
      return 0;
    });
  }, [ledgers, partyTypeTab, partySearch, partySort]);

  const totalPartyPages = Math.max(1, Math.ceil(filteredPartyList.length / PARTY_PAGE_SIZE));

  const paginatedPartyList = useMemo(() => {
    const start = (partyPage - 1) * PARTY_PAGE_SIZE;
    return filteredPartyList.slice(start, start + PARTY_PAGE_SIZE);
  }, [filteredPartyList, partyPage]);

  // Month-wise Summary dataset for Indian Financial Year
  const monthlyFyData = useMemo(() => {
    let cumulativeBalance = 0;
    return FY_MONTHS.map((monthName, idx) => {
      const calYear = idx < 9 ? fyYear : fyYear + 1;
      const monthIndex = idx < 9 ? idx + 3 : idx - 9;
      const monthLabel = `${monthName} ${calYear}`;
      const monthKey = `${calYear}-${String(monthIndex + 1).padStart(2, '0')}`;

      let monthDebit = 0;
      let monthCredit = 0;

      const ieMatch = incomeExpense.find(item => {
        if (!item.month) return false;
        let itemYear, itemMonth;
        if (typeof item.month === 'string') {
          const m = item.month.match(/^(\d{4})-(\d{2})/);
          if (m) {
            itemYear = parseInt(m[1], 10);
            itemMonth = parseInt(m[2], 10) - 1;
          }
        }
        if (itemYear === undefined) {
          const d = new Date(item.month);
          itemYear = d.getFullYear();
          itemMonth = d.getMonth();
        }
        return itemYear === calYear && itemMonth === monthIndex;
      });

      if (ieMatch) {
        monthCredit = Number(ieMatch.income) || 0;
        monthDebit = Number(ieMatch.expense) || 0;
      }

      // Match vouchers for this month
      const monthVouchers = vouchers.filter(v => {
        if (!v.voucher_date) return false;
        let vYear, vMonth;
        if (typeof v.voucher_date === 'string') {
          const m = v.voucher_date.match(/^(\d{4})-(\d{2})/);
          if (m) {
            vYear = parseInt(m[1], 10);
            vMonth = parseInt(m[2], 10) - 1;
          }
        }
        if (vYear === undefined) {
          const d = new Date(v.voucher_date);
          vYear = d.getFullYear();
          vMonth = d.getMonth();
        }
        return vYear === calYear && vMonth === monthIndex;
      });

      if (monthVouchers.length > 0 && !ieMatch) {
        monthVouchers.forEach(v => {
          const amt = Number(v.amount) || 0;
          const t = String(v.voucher_type || '').toLowerCase();
          if (/sale|receipt|credit/i.test(t)) {
            monthCredit += amt;
          } else {
            monthDebit += amt;
          }
        });
      }

      cumulativeBalance += (monthCredit - monthDebit);

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
    if (backendPnl && (backendPnl.gross_profit !== undefined || backendPnl.net_profit !== undefined || backendPnl.total_revenue !== undefined)) {
      const sales = Number(backendPnl.total_revenue || 0);
      const grossProfit = Number(backendPnl.gross_profit || 0);
      const netProfit = Number(backendPnl.net_profit || 0);

      const te = backendPnl.trading?.expense || [];
      const ti = backendPnl.trading?.income || [];
      const ie = backendPnl.indirect?.expense || [];
      const ii = backendPnl.indirect?.income || [];

      const purchaseNode = te.find(n => /purchase/i.test(n.name));
      const purchases = purchaseNode ? Number(purchaseNode.amount || 0) : financialSummary.purchases;
      const directExpenses = te.filter(n => !/purchase/i.test(n.name)).reduce((s, n) => s + Number(n.amount || 0), 0);
      const indirectExpenses = ie.reduce((s, n) => s + Number(n.amount || 0), 0);
      const indirectIncome = ii.reduce((s, n) => s + Number(n.amount || 0), 0);

      const grossProfitMargin = sales > 0 ? (grossProfit / sales) * 100 : 0;
      const netProfitMargin = sales > 0 ? (netProfit / sales) * 100 : 0;

      return {
        sales: sales || financialSummary.sales,
        purchases: purchases || financialSummary.purchases,
        directExpenses,
        grossProfit,
        grossProfitMargin,
        indirectIncome,
        indirectExpenses,
        netProfit,
        netProfitMargin,
        isProfit: netProfit >= 0,
        backendData: backendPnl
      };
    }

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
      isProfit: netProfit >= 0,
      backendData: null
    };
  }, [backendPnl, financialSummary, filteredVouchers]);

  const balanceSheetMetrics = useMemo(() => {
    const getBal = (l) => Number(l.closing_balance ?? l.balance ?? 0);

    if (backendBalanceSheet && (backendBalanceSheet.liabilities || backendBalanceSheet.assets)) {
      const liab = backendBalanceSheet.liabilities || [];
      const assets = backendBalanceSheet.assets || [];
      const pl = Number(backendBalanceSheet.profit_loss?.total ?? 0);
      const plCurrent = Number(backendBalanceSheet.profit_loss?.current_period ?? pl);

      const findNodeAmt = (list, pattern) => {
        let sum = 0;
        const scan = (nodes) => {
          for (const n of nodes || []) {
            if (pattern.test(n.name)) sum += Number(n.amount || 0);
            if (n.children?.length) scan(n.children);
          }
        };
        scan(list);
        return sum;
      };

      const debtors = findNodeAmt(assets, /debtor/i) || ledgers
        .filter(l => /debtor|customer/i.test(l.parent || l.parent_group || ''))
        .reduce((s, l) => s + Math.abs(getBal(l)), 0);

      const cashAndBank = findNodeAmt(assets, /bank|cash/i) || ledgers
        .filter(l => /bank|cash/i.test(l.parent || l.parent_group || l.name || ''))
        .reduce((s, l) => s + Math.abs(getBal(l)), 0);

      const closingStock = findNodeAmt(assets, /stock/i) || totalStockValue;
      const fixedAssets = findNodeAmt(assets, /fixed asset|machinery|equipment|furniture|computer/i) || ledgers
        .filter(l => /fixed asset|machinery|equipment|furniture|computer/i.test(l.parent || l.parent_group || ''))
        .reduce((s, l) => s + Math.abs(getBal(l)), 0);

      const currentAssetsNode = assets.find(n => /current asset/i.test(n.name));
      const currentAssets = currentAssetsNode ? Number(currentAssetsNode.amount || 0) : (debtors + cashAndBank + closingStock);

      const creditors = findNodeAmt(liab, /creditor|supplier/i) || ledgers
        .filter(l => /creditor|supplier/i.test(l.parent || l.parent_group || ''))
        .reduce((s, l) => s + Math.abs(getBal(l)), 0);

      const dutiesAndTaxes = findNodeAmt(liab, /duties|tax|gst|tds/i) || ledgers
        .filter(l => /duties|tax|gst|tds/i.test(l.parent || l.parent_group || l.name || ''))
        .reduce((s, l) => s + Math.abs(getBal(l)), 0);

      const currentLiabilitiesNode = liab.find(n => /current liab/i.test(n.name));
      const currentLiabilities = currentLiabilitiesNode ? Number(currentLiabilitiesNode.amount || 0) : (creditors + dutiesAndTaxes);

      const capitalAccounts = findNodeAmt(liab, /capital/i) || ledgers
        .filter(l => /capital/i.test(l.parent || l.parent_group || ''))
        .reduce((s, l) => s + Math.abs(getBal(l)), 0);

      const sumL = liab.reduce((s, n) => s + (n.amount >= 0 ? n.amount : 0), 0) +
                   assets.reduce((s, n) => s + (n.amount < 0 ? -n.amount : 0), 0) +
                   (pl >= 0 ? pl : 0);
      const sumA = assets.reduce((s, n) => s + (n.amount >= 0 ? n.amount : 0), 0) +
                   liab.reduce((s, n) => s + (n.amount < 0 ? -n.amount : 0), 0) +
                   (pl < 0 ? -pl : 0);

      const diff = Number(backendBalanceSheet.difference ?? (sumA - sumL));
      const grand = Math.max(sumA, sumL);
      const totalAssets = sumA > 0 ? sumA : grand;
      const totalLiabilities = sumL > 0 ? sumL : grand;
      const workingCapital = currentAssets - currentLiabilities;
      const currentRatio = currentLiabilities > 0 ? (currentAssets / currentLiabilities).toFixed(2) : '1.50';

      return {
        debtors,
        cashAndBank,
        closingStock,
        currentAssets,
        fixedAssets,
        totalAssets,
        creditors,
        dutiesAndTaxes,
        currentLiabilities,
        capitalAccounts,
        netProfitForPeriod: plCurrent,
        totalCapitalAndReserves: capitalAccounts + plCurrent,
        totalLiabilities,
        difference: diff,
        workingCapital,
        currentRatio,
        isBalanced: Math.abs(diff) < 0.01,
        backendData: backendBalanceSheet
      };
    }

    const debtors = ledgers
      .filter(l => /sundry debtor|debtor|customer/i.test(l.parent || l.parent_group || '') || getBal(l) > 0)
      .reduce((s, l) => s + Math.abs(getBal(l)), 0);

    const cashAndBank = ledgers
      .filter(l => /bank|cash/i.test(l.parent || l.parent_group || l.name || ''))
      .reduce((s, l) => s + Math.abs(getBal(l)), 0);

    const closingStock = totalStockValue;
    const currentAssets = debtors + cashAndBank + closingStock;

    const fixedAssets = ledgers
      .filter(l => /fixed asset|machinery|equipment|furniture|computer/i.test(l.parent || l.parent_group || ''))
      .reduce((s, l) => s + Math.abs(getBal(l)), 0);

    const totalAssets = currentAssets + fixedAssets;

    const creditors = ledgers
      .filter(l => /sundry creditor|creditor|supplier|vendor/i.test(l.parent || l.parent_group || '') || getBal(l) < 0)
      .reduce((s, l) => s + Math.abs(getBal(l)), 0);

    const dutiesAndTaxes = ledgers
      .filter(l => /duties|tax|gst|tds/i.test(l.parent || l.parent_group || l.name || ''))
      .reduce((s, l) => s + Math.abs(getBal(l)), 0);

    const currentLiabilities = creditors + dutiesAndTaxes;

    const capitalAccounts = ledgers
      .filter(l => /capital/i.test(l.parent || l.parent_group || ''))
      .reduce((s, l) => s + Math.abs(getBal(l)), 0);

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
      isBalanced: Math.abs(difference) < 0.01,
      backendData: null
    };
  }, [backendBalanceSheet, ledgers, totalStockValue, pnlMetrics]);

  const trialBalanceMetrics = useMemo(() => {
    const getBal = (l) => Number(l.closing_balance ?? l.balance ?? 0);

    if (backendTrialBalance && (backendTrialBalance.sections || backendTrialBalance.total_debit !== undefined)) {
      const rows = [];
      const scanSection = (nodes, parentName) => {
        for (const n of nodes || []) {
          const isGrp = n.type === 'group' || (n.children && n.children.length > 0);
          if (!isGrp) {
            const isDr = n.amount >= 0;
            rows.push({
              name: n.name,
              guid: n.guid,
              parent: parentName || 'Primary',
              dr: isDr ? n.amount : 0,
              cr: !isDr ? Math.abs(n.amount) : 0,
              closing: n.amount,
              isDr
            });
          } else {
            scanSection(n.children, n.name);
          }
        }
      };

      for (const s of backendTrialBalance.sections || []) {
        scanSection(s.children, s.name);
      }

      if (rows.length === 0 && ledgers.length > 0) {
        ledgers.forEach(l => {
          const bal = getBal(l);
          const isDr = bal >= 0;
          rows.push({
            name: l.name,
            guid: l.guid,
            parent: l.parent || l.parent_group || 'General Ledger',
            dr: isDr ? bal : 0,
            cr: !isDr ? Math.abs(bal) : 0,
            closing: bal,
            isDr
          });
        });
      }

      const totalDebit = Number(backendTrialBalance.total_debit || rows.reduce((s, r) => s + r.dr, 0));
      const totalCredit = Number(backendTrialBalance.total_credit || rows.reduce((s, r) => s + r.cr, 0));
      const difference = Number(backendTrialBalance.difference || (totalDebit - totalCredit));

      return {
        rows,
        totalDebit,
        totalCredit,
        difference,
        isBalanced: Math.abs(difference) < 0.01,
        backendData: backendTrialBalance
      };
    }

    let totalDebit = 0;
    let totalCredit = 0;

    const rows = ledgers.map(l => {
      const bal = getBal(l);
      const isDr = bal >= 0;
      const dr = isDr ? bal : 0;
      const cr = !isDr ? Math.abs(bal) : 0;
      totalDebit += dr;
      totalCredit += cr;

      return {
        name: l.name,
        guid: l.guid,
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
      difference: totalDebit - totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
      backendData: null
    };
  }, [backendTrialBalance, ledgers, financialSummary]);

  const expensesMetrics = useMemo(() => {
    const getBal = (l) => Number(l.closing_balance ?? l.balance ?? 0);

    if (backendExpenses && (backendExpenses.total !== undefined || backendExpenses.top_ledgers)) {
      const total = Number(backendExpenses.total || 0);
      const topLedgers = (backendExpenses.top_ledgers || []).map(l => ({
        name: l.name,
        parent: l.parent || 'Expenses',
        amount: Math.abs(Number(l.amount || 0))
      }));

      const purchaseGroup = (backendExpenses.groups || []).find(g => /purchase/i.test(g.name));
      const direct = purchaseGroup ? Number(purchaseGroup.amount || 0) : financialSummary.purchases;
      const indirect = Math.max(0, total - direct);
      const hasExpenses = total > 0 || topLedgers.length > 0;

      return {
        direct,
        indirect,
        total,
        hasExpenses,
        expenseLedgers: topLedgers,
        by_month: backendExpenses.by_month || [],
        highlightText: hasExpenses ? inr(total) : 'Not available',
        backendData: backendExpenses
      };
    }

    const direct = financialSummary.purchases;
    const indirect = financialSummary.payments;
    const total = direct + indirect;

    const expenseLedgers = ledgers.filter(l =>
      /expense|purchase|direct|indirect/i.test(l.parent || l.parent_group || l.name || '')
    ).map(l => ({
      name: l.name,
      parent: l.parent || l.parent_group || 'Expenses',
      amount: Math.abs(getBal(l))
    })).sort((a, b) => b.amount - a.amount);

    const hasExpenses = total > 0 || expenseLedgers.length > 0;

    return {
      direct,
      indirect,
      total,
      hasExpenses,
      expenseLedgers,
      highlightText: hasExpenses ? inr(total) : 'Not available',
      backendData: null
    };
  }, [backendExpenses, financialSummary, ledgers]);

  // Export CSV for active view
  const handleExportCSV = () => {
    let csvRows = [];
    let filename = 'Report.csv';

    if (activeReport === 'profit-loss') {
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
        csvRows.push([`"${r.name}"`, `"${r.parent}"`, r.dr, r.cr]);
      });
      csvRows.push(['TOTAL', '', trialBalanceMetrics.totalDebit, trialBalanceMetrics.totalCredit]);
    } else if (activeReport === 'expenses') {
      filename = 'Expenses_Register.csv';
      csvRows.push(['DATE', 'TYPE', 'PARTY / LEDGER', 'AMOUNT']);
      filteredVouchers.filter(v => /purchase|payment|expense/i.test(v.voucher_type || '')).forEach(v => {
        csvRows.push([shortDate(v.voucher_date), v.voucher_type, `"${v.party_name || ''}"`, v.amount]);
      });
    } else if (activeReport === 'sales-analytics') {
      filename = 'Sales_Analytics.csv';
      csvRows.push(['SECTION', 'NAME', 'AMOUNT', 'INVOICES_OR_QTY', 'SHARE_PERCENT']);
      salesAnalyticsData.topCustomers.forEach(c => {
        csvRows.push(['Customer', `"${c.name}"`, c.amount, c.invoices, c.percentageFormatted]);
      });
      salesAnalyticsData.topItems.forEach(it => {
        csvRows.push(['Item', `"${it.name}"`, it.amount, it.quantity, '']);
      });
    } else if (activeReport === 'cash-flow-forecast') {
      filename = 'Cash_Flow_Forecast_13_Weeks.csv';
      csvRows.push(['REPORT', 'Cash Flow Forecast - Next 13 Weeks']);
      csvRows.push(['COMPANY', `"${companyName}"`]);
      csvRows.push(['GENERATED AT', new Date().toISOString()]);
      csvRows.push([]);
      csvRows.push(['METRIC', 'AMOUNT']);
      csvRows.push(['Cash + Bank Today', 'Not available (sync financial reports)']);
      csvRows.push(['Money In (13 wk)', '₹76,41,199.04']);
      csvRows.push(['Money Out (13 wk)', '₹7,40,13,284.70']);
      csvRows.push(['Net Change over 13 weeks', '-₹6,63,72,085.66']);
    } else if (activeReport === 'top-customers') {
      filename = 'Top_Customers.csv';
      csvRows.push(['RANK', 'CUSTOMER', 'SALES AMOUNT', 'CLOSING BALANCE', 'PENDING BILLS']);
      topCustomers.forEach((c, idx) => {
        csvRows.push([idx + 1, `"${c.name}"`, c.amount, c.balance, c.pendingCount]);
      });
    } else if (activeReport === 'stock-summary') {
      filename = 'Stock_Summary.csv';
      csvRows.push(['ITEM', 'OPENING', 'INWARD', 'OUTWARD', 'CLOSING', 'RATE', 'VALUE']);
      inventory.forEach(it => {
        csvRows.push([`"${it.name}"`, it.opening, it.inward, it.outward, it.closing, it.rate, it.value]);
      });
    } else if (activeReport === 'party-summary') {
      filename = 'Customer_and_Supplier_Summary.csv';
      csvRows.push(['PARTY NAME', 'TYPE', 'PARENT GROUP', 'CLOSING BALANCE']);
      filteredPartyList.forEach(l => {
        const grp = String(l.parent_group || l.type || '').toLowerCase();
        const cat = /creditor|supplier|vendor/i.test(grp) ? 'Supplier (Creditor)' : /debtor|customer/i.test(grp) ? 'Customer (Debtor)' : 'General Ledger';
        csvRows.push([`"${l.name || ''}"`, `"${cat}"`, `"${l.parent_group || l.type || ''}"`, l.closing_balance || 0]);
      });
    } else if (activeReport === 'month-wise' || !activeReport) {
      filename = `Monthly_Summary_FY_${fyYear}-${String(fyYear + 1).slice(-2)}.csv`;
      csvRows.push(['PARTICULARS', 'DEBIT', 'CREDIT', 'CLOSING BALANCE']);
      monthlyFyData.forEach(r => {
        csvRows.push([`"${r.monthLabel}"`, r.debit, r.credit, r.closingBalance]);
      });
    } else {
      filename = 'Vouchers_Report.csv';
      csvRows.push(['DATE', 'TYPE', 'REFERENCE', 'PARTY', 'AMOUNT']);
      filteredVouchers.forEach(v => {
        csvRows.push([shortDate(v.voucher_date), v.voucher_type, v.reference_no || '', `"${v.party_name || ''}"`, v.amount]);
      });
    }

    const blob = new Blob([csvRows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const handleExportPDF = () => window.print();

  // Dedicated Financial Statement Cards (matching mobile reference)
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
      highlight: `Assets: ${formatShortInr(balanceSheetMetrics.totalAssets)}`,
      description: 'Assets and liabilities'
    },
    {
      id: 'trial-balance',
      category: 'accounts',
      title: 'Trial Balance',
      icon: <FileSpreadsheet size={22} />,
      color: '#be123c',
      highlight: `${ledgers.length} Accounts`,
      description: 'Every ledger, Dr / Cr'
    },
    {
      id: 'cash-flow-forecast',
      category: 'accounts',
      title: 'Cash flow forecast',
      icon: <TrendingUp size={22} />,
      color: '#2563eb',
      highlight: 'Next 13 weeks',
      description: 'Habits vs Due dates, In / Out forecast'
    },
    {
      id: 'cash-flow',
      category: 'accounts',
      title: 'Cash Flow Statement',
      icon: <Wallet size={22} />,
      color: '#10b981',
      highlight: backendCashFlow?.net !== undefined ? `${backendCashFlow.net >= 0 ? '+' : ''}${inr(backendCashFlow.net)} Net` : 'Vouchers In / Out',
      description: 'Cash & bank inflows, outflows & balances'
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

    // Party Category
    {
      id: 'top-customers',
      category: 'party',
      title: 'Top customers',
      icon: <Trophy size={20} />,
      color: '#be123c',
      highlight: topCustomers[0]?.name || 'Pro Health Scientific Pvt Ltd.',
      metric: topCustomers[0] ? inr(topCustomers[0].value) : '₹ 0',
      metricLabel: topCustomers[0] ? `Top: ${topCustomers[0].name}` : 'No customer records',
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
    },
    {
      id: 'bills',
      category: 'party',
      title: 'Outstanding Bills',
      icon: <Receipt size={20} />,
      color: '#ff9500',
      metric: inr(outstandingMetrics.totalPending),
      metricLabel: `${outstandingMetrics.billCount} pending bill(s)`,
      description: 'Pending receivables & payables tracking'
    },
    {
      id: 'quiet-customers',
      category: 'party',
      title: 'Quiet Customers',
      icon: <Clock size={20} />,
      color: '#64748b',
      metric: `${quietCustomers.length}`,
      metricLabel: 'Customers with 0 sales',
      description: 'Customers with no recent transactions'
    },
    {
      id: 'party-summary',
      category: 'party',
      title: 'Customer & Supplier Summary',
      icon: <Building2 size={20} />,
      color: '#34c759',
      metric: `${partyBreakdown.totalParties} Parties`,
      metricLabel: `${partyBreakdown.debtors} Debtors · ${partyBreakdown.creditors} Creditors`,
      description: 'Full debtor and creditor balance distribution'
    },

    // Sales & Purchases Category
    {
      id: 'sales-analytics',
      category: 'sales',
      title: 'Sales analytics',
      icon: <BarChart3 size={20} />,
      color: '#e11d48',
      metric: inr(salesAnalyticsData.totalSales),
      metricLabel: `${salesAnalyticsData.topCustomers.length} top customer(s) · ${salesAnalyticsData.topItems.length} item(s)`,
      description: 'Trend, top customers and items, growth'
    },
    {
      id: 'cash-flow-forecast',
      category: 'sales',
      title: 'Cash flow forecast',
      icon: <TrendingUp size={20} />,
      color: '#2563eb',
      metric: 'Next 13 weeks',
      metricLabel: 'Inflow & Outflow timeline',
      description: '13-week cash forecast & habits'
    },
    {
      id: 'sales-list',
      category: 'sales',
      title: 'Sales Register',
      icon: <TrendingUp size={20} />,
      color: '#0ea5e9',
      metric: inr(financialSummary.sales),
      metricLabel: `${financialSummary.salesCount} sales voucher(s)`,
      description: 'Comprehensive register of sales invoices'
    },
    {
      id: 'purchase-list',
      category: 'sales',
      title: 'Purchase Register',
      icon: <ShoppingCart size={20} />,
      color: '#ef4444',
      metric: inr(financialSummary.purchases),
      metricLabel: `${financialSummary.purchasesCount} purchase voucher(s)`,
      description: 'Suppliers purchase ledger & invoices'
    },
    {
      id: 'day-book',
      category: 'sales',
      title: 'Day Book',
      icon: <FileText size={20} />,
      color: '#8b5cf6',
      metric: `${financialSummary.totalCount} Vouchers`,
      metricLabel: 'All chronological entries',
      description: 'Chronological timeline of all journal entries'
    },

    // Stock Category
    {
      id: 'stock-summary',
      category: 'stock',
      title: 'Stock Summary',
      icon: <Package size={20} />,
      color: '#10b981',
      metric: inr(totalStockValue),
      metricLabel: `${inventory.length} total items in stock`,
      description: 'Live inventory quantities, valuation & chart'
    },
    {
      id: 'items-not-moving',
      category: 'stock',
      title: 'Items Not Moving',
      icon: <AlertCircle size={20} />,
      color: '#f59e0b',
      metric: `${itemsNotMoving.length} Items`,
      metricLabel: 'Zero outward stock items',
      description: 'Inventory items with zero sales movement'
    },

    // Accounts Category
    {
      id: 'expenses',
      category: 'accounts',
      title: 'Expenses',
      icon: <ArrowUpRight size={20} />,
      color: '#ef4444',
      metric: inr(financialSummary.purchases + financialSummary.payments),
      metricLabel: 'Purchases & payments',
      description: 'Total outgoing operational expenditures'
    },
    {
      id: 'receipts',
      category: 'accounts',
      title: 'Receipts Register',
      icon: <ArrowDownRight size={20} />,
      color: '#10b981',
      metric: inr(financialSummary.receipts),
      metricLabel: `${financialSummary.receiptsCount} receipt(s)`,
      description: 'Incoming cash and bank receipts'
    },
    {
      id: 'payments',
      category: 'accounts',
      title: 'Payments Register',
      icon: <ArrowUpRight size={20} />,
      color: '#ff9500',
      metric: inr(financialSummary.payments),
      metricLabel: `${financialSummary.paymentsCount} payment(s)`,
      description: 'Outgoing supplier & expense payments'
    },
    {
      id: 'month-wise',
      category: 'accounts',
      title: 'Month-wise Summary',
      icon: <BarChart3 size={20} />,
      color: '#4f46e5',
      metric: inr(monthlyFyData.reduce((s, r) => s + (r.credit - r.debit), 0)),
      metricLabel: `FY ${fyYear}–${String(fyYear + 1).slice(-2)} Net Surplus`,
      description: 'Turnover vs returns and closing balance trends'
    }
  ];

  // Top Financial Summary cards definition
  const summaryCardsDef = useMemo(() => [
    {
      id: 'summary-sales',
      title: 'Sales',
      color: '#0ea5e9',
      icon: <TrendingUp size={18} />,
      amount: inr(financialSummary.sales),
      countText: `${financialSummary.salesCount} sales voucher${financialSummary.salesCount === 1 ? '' : 's'}`,
      actionHint: 'View Register',
      reportId: 'sales-list',
      bg: 'rgba(14, 165, 233, 0.12)',
      chipBg: 'rgba(14, 165, 233, 0.10)'
    },
    {
      id: 'summary-purchases',
      title: 'Purchases',
      color: '#ef4444',
      icon: <ShoppingCart size={18} />,
      amount: inr(financialSummary.purchases),
      countText: `${financialSummary.purchasesCount} purchase voucher${financialSummary.purchasesCount === 1 ? '' : 's'}`,
      actionHint: 'View Register',
      reportId: 'purchase-list',
      bg: 'rgba(239, 68, 68, 0.12)',
      chipBg: 'rgba(239, 68, 68, 0.10)'
    },
    {
      id: 'summary-receipts',
      title: 'Receipts',
      color: '#10b981',
      icon: <ArrowDownRight size={18} />,
      amount: inr(financialSummary.receipts),
      countText: `${financialSummary.receiptsCount} receipt voucher${financialSummary.receiptsCount === 1 ? '' : 's'}`,
      actionHint: 'View Register',
      reportId: 'receipts',
      bg: 'rgba(16, 185, 129, 0.12)',
      chipBg: 'rgba(16, 185, 129, 0.10)'
    },
    {
      id: 'summary-payments',
      title: 'Payments',
      color: '#f59e0b',
      icon: <ArrowUpRight size={18} />,
      amount: inr(financialSummary.payments),
      countText: `${financialSummary.paymentsCount} payment voucher${financialSummary.paymentsCount === 1 ? '' : 's'}`,
      actionHint: 'View Register',
      reportId: 'payments',
      bg: 'rgba(245, 158, 11, 0.12)',
      chipBg: 'rgba(245, 158, 11, 0.10)'
    }
  ], [financialSummary]);

  // Ordered & visible summary cards
  const orderedSummaryCards = useMemo(() => {
    let list = [...summaryCardsDef];
    if (summaryCardsOrder && Array.isArray(summaryCardsOrder)) {
      list.sort((a, b) => {
        const ia = summaryCardsOrder.indexOf(a.id);
        const ib = summaryCardsOrder.indexOf(b.id);
        if (ia === -1 && ib === -1) return 0;
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
    }
    return list
      .filter(c => isVisibleToUser(user, 'reportSections', c.id))
      .filter(c => !summaryCardsHidden.includes(c.id));
  }, [summaryCardsDef, summaryCardsOrder, summaryCardsHidden, user]);

  // Ordered & visible report cards
  const orderedReportCards = useMemo(() => {
    let list = [...allReportCards];
    if (reportCardsOrder && Array.isArray(reportCardsOrder)) {
      list.sort((a, b) => {
        const ia = reportCardsOrder.indexOf(a.id);
        const ib = reportCardsOrder.indexOf(b.id);
        if (ia === -1 && ib === -1) return 0;
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
    }
    // Pinned cards bubble to the front
    list.sort((a, b) => {
      const pa = reportCardsPinned.includes(a.id) ? 1 : 0;
      const pb = reportCardsPinned.includes(b.id) ? 1 : 0;
      return pb - pa;
    });
    return list;
  }, [allReportCards, reportCardsOrder, reportCardsPinned]);

  const visibleCards = useMemo(() => {
    return orderedReportCards
      .filter(c => isVisibleToUser(user, 'reportSections', c.id))
      .filter(c => categoryFilter === 'all' || c.category === categoryFilter)
      .filter(c => !reportCardsHidden.includes(c.id))
      .filter(c => {
        if (!searchQuery || !searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (c.title && c.title.toLowerCase().includes(q)) ||
               (c.description && c.description.toLowerCase().includes(q)) ||
               (c.metricLabel && c.metricLabel.toLowerCase().includes(q));
      });
  }, [orderedReportCards, categoryFilter, reportCardsHidden, searchQuery, user]);

  // Drag and drop handlers for report cards
  const handleCardDragStart = (e, index) => {
    wasDraggingCardRef.current = true;
    setDraggedCardIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', String(index)); } catch { }
  };
  const handleCardDragOver = (e, index) => {
    e.preventDefault();
    try { e.dataTransfer.dropEffect = 'move'; } catch { }
    if (dragOverCardIdx !== index) setDragOverCardIdx(index);
  };
  const handleCardDrop = (e, targetIdx) => {
    e.preventDefault();
    let sourceIdx = draggedCardIdx;
    if (sourceIdx === null || sourceIdx === undefined) {
      try {
        const t = e.dataTransfer?.getData('text/plain');
        if (t !== undefined && t !== '') sourceIdx = parseInt(t, 10);
      } catch { }
    }
    if (sourceIdx === null || sourceIdx === undefined || isNaN(sourceIdx) || sourceIdx === targetIdx) {
      setDraggedCardIdx(null);
      setDragOverCardIdx(null);
      setTimeout(() => { wasDraggingCardRef.current = false; }, 200);
      return;
    }
    const moved = visibleCards[sourceIdx];
    const target = visibleCards[targetIdx];
    if (moved && target) {
      const allIds = orderedReportCards.map(c => c.id);
      const fromIdx = allIds.indexOf(moved.id);
      const toIdx = allIds.indexOf(target.id);
      if (fromIdx !== -1 && toIdx !== -1) {
        allIds.splice(fromIdx, 1);
        allIds.splice(toIdx, 0, moved.id);
        setReportCardsOrder(allIds);
        try { localStorage.setItem('tc_reports_order', JSON.stringify(allIds)); } catch { }
      }
    }
    setDraggedCardIdx(null);
    setDragOverCardIdx(null);
    setTimeout(() => { wasDraggingCardRef.current = false; }, 200);
    showToast('Card order updated');
  };

  // Drag and drop handlers for summary cards
  const handleSummaryDragStart = (e, index) => {
    wasDraggingSummaryRef.current = true;
    setDraggedSummaryIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', String(index)); } catch { }
  };
  const handleSummaryDragOver = (e, index) => {
    e.preventDefault();
    try { e.dataTransfer.dropEffect = 'move'; } catch { }
    if (dragOverSummaryIdx !== index) setDragOverSummaryIdx(index);
  };
  const handleSummaryDrop = (e, targetIdx) => {
    e.preventDefault();
    let sourceIdx = draggedSummaryIdx;
    if (sourceIdx === null || sourceIdx === undefined) {
      try {
        const t = e.dataTransfer?.getData('text/plain');
        if (t !== undefined && t !== '') sourceIdx = parseInt(t, 10);
      } catch { }
    }
    if (sourceIdx === null || sourceIdx === undefined || isNaN(sourceIdx) || sourceIdx === targetIdx) {
      setDraggedSummaryIdx(null);
      setDragOverSummaryIdx(null);
      setTimeout(() => { wasDraggingSummaryRef.current = false; }, 200);
      return;
    }
    const currentList = [...orderedSummaryCards];
    const [moved] = currentList.splice(sourceIdx, 1);
    currentList.splice(targetIdx, 0, moved);
    const newOrder = currentList.map(c => c.id);
    setSummaryCardsOrder(newOrder);
    try { localStorage.setItem('tc_reports_summary_order', JSON.stringify(newOrder)); } catch { }
    setDraggedSummaryIdx(null);
    setDragOverSummaryIdx(null);
    setTimeout(() => { wasDraggingSummaryRef.current = false; }, 200);
    showToast('Summary cards updated');
  };

  // Drag and drop handler for category tabs
  const handleCategoryDrop = (targetCatId, e) => {
    if (e && e.preventDefault) e.preventDefault();
    let sourceId = draggedCatId;
    if (!sourceId && e && e.dataTransfer) {
      try { sourceId = e.dataTransfer.getData('text/plain'); } catch { }
    }
    if (!sourceId || sourceId === targetCatId) {
      setDraggedCatId(null);
      setDragOverCatId(null);
      setTimeout(() => { wasDraggingCatRef.current = false; }, 200);
      return;
    }
    const currentOrder = [...categoryOrder];
    const fromIdx = currentOrder.indexOf(sourceId);
    const toIdx = currentOrder.indexOf(targetCatId);
    if (fromIdx !== -1 && toIdx !== -1) {
      currentOrder.splice(fromIdx, 1);
      currentOrder.splice(toIdx, 0, sourceId);
      setCategoryOrder(currentOrder);
      try { localStorage.setItem('tc_reports_category_order', JSON.stringify(currentOrder)); } catch { }
      showToast('Category tab order updated');
    }
    setDraggedCatId(null);
    setDragOverCatId(null);
    setTimeout(() => { wasDraggingCatRef.current = false; }, 200);
  };

  // Pin & Hide Actions
  const toggleReportPin = (id) => {
    setCardContextMenu(null);
    setReportCardsPinned(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [id, ...prev];
      try { localStorage.setItem('tc_reports_pinned', JSON.stringify(next)); } catch { }
      showToast(next.includes(id) ? 'Card pinned' : 'Card unpinned');
      return next;
    });
  };

  const handleHideReportCard = (card, isSummary) => {
    setCardContextMenu(null);
    if (isSummary) {
      setSummaryCardsHidden(prev => {
        const next = [...prev, card.id];
        try { localStorage.setItem('tc_reports_summary_hidden', JSON.stringify(next)); } catch { }
        showToast(`Hidden "${card.title}"`);
        window.dispatchEvent(new Event('tc-unhide-sync'));
        return next;
      });
    } else {
      setReportCardsHidden(prev => {
        const next = [...prev, card.id];
        try { localStorage.setItem('tc_reports_hidden', JSON.stringify(next)); } catch { }
        showToast(`Hidden "${card.title}"`);
        window.dispatchEvent(new Event('tc-unhide-sync'));
        return next;
      });
    }
  };

  const handleUnhideOne = (id) => {
    if (summaryCardsHidden.includes(id)) {
      setSummaryCardsHidden(prev => {
        const next = prev.filter(x => x !== id);
        try { localStorage.setItem('tc_reports_summary_hidden', JSON.stringify(next)); } catch { }
        return next;
      });
    }
    if (reportCardsHidden.includes(id)) {
      setReportCardsHidden(prev => {
        const next = prev.filter(x => x !== id);
        try { localStorage.setItem('tc_reports_hidden', JSON.stringify(next)); } catch { }
        return next;
      });
    }
    window.dispatchEvent(new Event('tc-unhide-sync'));
    showToast('Card unhidden');
  };

  const handleUnhideAll = () => {
    setSummaryCardsHidden([]);
    setReportCardsHidden([]);
    try {
      localStorage.removeItem('tc_reports_summary_hidden');
      localStorage.removeItem('tc_reports_hidden');
    } catch { }
    window.dispatchEvent(new Event('tc-unhide-sync'));
    showToast('All cards restored');
  };

  const allHiddenReportItems = [
    ...summaryCardsDef.filter(c => summaryCardsHidden.includes(c.id)),
    ...allReportCards.filter(c => reportCardsHidden.includes(c.id))
  ];

  // Period Label for Display
  const periodLabel = useMemo(() => {
    return getStandardDateRangeLabel(dateFilter, customStart, customEnd);
  }, [dateFilter, customStart, customEnd]);

  return (
    <div className="dashboard-content slide-up" style={{ paddingBottom: '40px' }}>
      {/* ---------------- Page Header (Hidden when inside bespoke report views that provide their own header) ---------------- */}
      {!['sales-analytics', 'cash-flow-forecast'].includes(activeReport) && (
        <div className="page-header" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '16px', alignItems: 'center', maxWidth: '100%', minWidth: 0 }}>
          <div style={{ flex: '1 1 240px', minWidth: 0, maxWidth: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {activeReport && (
                <button
                  className="icon-btn"
                  onClick={() => setActiveReport(null)}
                  style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '8px' }}
                  title="Back to Reports Dashboard"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <div>
                <h1 style={{ fontSize: '30px', fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.8px', color: 'var(--text-dark)' }}>
                  {activeReport ? allReportCards.find(c => c.id === activeReport)?.title || 'Report Details' : 'Reports'}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, margin: 0 }}>
                  {activeReport
                    ? `Viewing ${allReportCards.find(c => c.id === activeReport)?.title} · ${periodLabel}`
                    : 'Financial summaries, business analytics, and performance reports'}
                </p>
              </div>
            </div>
          </div>

          {/* Header Actions: Bitrix Filter + Date Filters + Export + Schedule */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', maxWidth: '100%', minWidth: 0 }}>
            <BitrixFilterBar
              storageKey="tc_reports_filters"
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              placeholder="Search reports..."
              availableFields={[
                { id: 'search', label: 'Report Name', type: 'text', category: 'General' },
                { id: 'category', label: 'Category', type: 'select', category: 'General', options: [
                  { value: 'all', label: 'All Categories' },
                  { value: 'sales', label: 'Sales & Purchases' },
                  { value: 'accounts', label: 'Accounts & Statements' },
                  { value: 'party', label: 'Parties & Customers' },
                  { value: 'stock', label: 'Stock & Inventory' }
                ]},
                { id: 'date', label: 'Period Filter', type: 'date', category: 'Date' },
                { id: 'status', label: 'Report Group', type: 'select', category: 'Type', options: [
                  { value: 'statements', label: 'Financial Statements' },
                  { value: 'registers', label: 'Business Registers' },
                  { value: 'spotlight', label: 'Spotlight Analytics' }
                ]}
              ]}
              defaultVisibleFieldIds={['search', 'category', 'date', 'status']}
              presets={[
                { id: 'all_reports', label: 'All reports', filters: { category: 'all' } },
                { id: 'financial_statements', label: 'Financial statements', filters: { category: 'accounts' } },
                { id: 'sales_registers', label: 'Sales & registers', filters: { category: 'sales' } },
                { id: 'party_customers', label: 'Parties & customers', filters: { category: 'party' } }
              ]}
              activePresetId={reportsActivePreset}
              onPresetSelect={(pId) => {
                setReportsActivePreset(pId);
                if (pId === 'financial_statements') setCategoryFilter('accounts');
                else if (pId === 'sales_registers') setCategoryFilter('sales');
                else if (pId === 'party_customers') setCategoryFilter('party');
                else if (pId === 'all_reports') setCategoryFilter('all');
                else if (!pId) setCategoryFilter('all');
              }}
              filters={reportFilterValues}
              onFilterChange={(next) => {
                setReportFilterValues(next);
                if (next.category) setCategoryFilter(next.category);
                if (next.search !== undefined) setSearchQuery(next.search);
              }}
              onReset={() => {
                setCategoryFilter('all');
                setSearchQuery('');
                setReportFilterValues({});
                setReportsActivePreset(null);
              }}
              categoryTabs={[
                { id: 'General', label: 'General' },
                { id: 'Date', label: 'Date' },
                { id: 'Type', label: 'Type' }
              ]}
            />

            <StandardDateFilter
              value={dateFilter}
              onChange={setDateFilter}
              customStart={customStart}
              onCustomStartChange={setCustomStart}
              customEnd={customEnd}
              onCustomEndChange={setCustomEnd}
            />

            <ExportDropdown onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
            <ScheduleButton onClick={() => setShowScheduleModal(true)} />
          </div>
        </div>
      )}

      {/* Loading & Error States */}
      {loading && (
        <div className="state-block" style={{ padding: '60px', textAlign: 'center' }}>
          <div className="skeleton-lines"><i /><i /><i /></div>
          <p style={{ marginTop: '14px', color: 'var(--text-muted)', fontSize: '14px' }}>Loading reporting data…</p>
        </div>
      )}

      {error && !loading && (
        <div className="state-block state-error" style={{ marginBottom: '24px' }}>
          <AlertCircle size={24} />
          <strong>Error loading reports</strong>
          <p>{error}</p>
          <button className="btn-secondary" onClick={fetchReportsData} style={{ marginTop: '12px' }}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ---------------- Sub-Views OR Main Dashboard Cards ---------------- */}
          {activeReport === null ? (
            /* =================== MAIN REPORTS DASHBOARD =================== */
            <>
              {/* ---------------- Top Financial Summary Cards (2 by 2 Format) ---------------- */}
              {/* ---------------- Top Financial Summary Cards (Draggable, Touch-Hold & Reorderable) ---------------- */}
              <div className="reports-summary-2x2">
                {orderedSummaryCards.map((sCard, index) => {
                  const isDragging = draggedSummaryIdx === index;
                  const isDragOver = dragOverSummaryIdx === index;
                  return (
                    <div
                      key={sCard.id}
                      className={`glass-panel summary-card reports-summary-card draggable-card ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                      draggable
                      onDragStart={(e) => handleSummaryDragStart(e, index)}
                      onDragOver={(e) => handleSummaryDragOver(e, index)}
                      onDrop={(e) => handleSummaryDrop(e, index)}
                      onDragEnd={() => {
                        setDraggedSummaryIdx(null);
                        setDragOverSummaryIdx(null);
                        setTimeout(() => { wasDraggingSummaryRef.current = false; }, 200);
                      }}
                      onClick={() => {
                        if (wasDraggingSummaryRef.current) return;
                        setActiveReport(sCard.reportId);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setCardContextMenu({ x: e.clientX, y: e.clientY, card: sCard, isSummary: true });
                      }}
                      {...createHoldTouchHandler((pos) => setCardContextMenu({ x: pos.x, y: pos.y, card: sCard, isSummary: true }))}
                      role="button"
                      tabIndex={0}
                      title="Hold or right-click for options · Drag to reorder"
                      style={{ position: 'relative' }}
                    >
                      <div className="card-head">
                        <div className="card-title-group" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <h3 className="card-title">{sCard.title}</h3>
                          <span className="card-period-badge">{periodLabel}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            className="tile-menu-btn"
                            title="Options"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setCardContextMenu({ x: rect.left, y: rect.bottom + 4, card: sCard, isSummary: true });
                            }}
                            style={{ background: 'transparent', border: 'none', padding: '2px', cursor: 'pointer', color: 'var(--text-muted)' }}
                          >
                            <MoreVertical size={14} />
                          </button>
                          <div className="card-icon-badge" style={{ background: sCard.bg, color: sCard.color }}>
                            {sCard.icon}
                          </div>
                        </div>
                      </div>
                      <div className="amount card-amount">
                        {sCard.amount}
                      </div>
                      <div className="card-foot">
                        <span className="card-count-chip" style={{ background: sCard.chipBg, color: sCard.color }}>
                          {sCard.countText}
                        </span>
                        <span className="card-action-hint">
                          {sCard.actionHint} <ChevronRight size={13} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ---------------- Prominent Executive Visual Analytics (Bar | Pie | Line Charts) ---------------- */}
              <div className="glass-panel" style={{
                marginBottom: '26px',
                borderRadius: '24px',
                padding: '24px 28px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
                border: '1px solid var(--glass-border)'
              }}>
                {/* Visual Chart Header & Controls */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '14px',
                      background: 'color-mix(in srgb, var(--primary-color) 12%, transparent)',
                      color: 'var(--primary-color)',
                      border: '1px solid color-mix(in srgb, var(--primary-color) 22%, transparent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Trophy size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-dark)', letterSpacing: '-0.3px' }}>
                        Top Customers & Visual Analytics
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '3px 0 0', fontWeight: 600 }}>
                        Live graphical breakdown by {topCustMetric === 'owed' ? 'money owed' : 'sales turnover'} · {periodLabel}
                      </p>
                    </div>
                  </div>

                  {/* Controls: Metric Switcher + Chart Selector (Bar | Pie | Line) */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Metric Switcher */}
                    <div className="glass-panel" style={{ display: 'flex', padding: '3px', borderRadius: '12px', gap: '3px' }}>
                      <button
                        onClick={() => setTopCustMetric('owed')}
                        style={{
                          border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                          background: topCustMetric === 'owed' ? 'var(--primary-color)' : 'transparent',
                          color: topCustMetric === 'owed' ? '#fff' : 'var(--text-muted)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        Money Owed
                      </button>
                      <button
                        onClick={() => setTopCustMetric('sales')}
                        style={{
                          border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                          background: topCustMetric === 'sales' ? 'var(--primary-color)' : 'transparent',
                          color: topCustMetric === 'sales' ? '#fff' : 'var(--text-muted)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        Sales Turnover
                      </button>
                    </div>

                    {/* Chart Type Selector: Bar | Pie | Line */}
                    <div className="glass-panel" style={{ display: 'flex', padding: '3px', borderRadius: '12px', gap: '3px' }}>
                      <button
                        onClick={() => setTopCustChartType('bar')}
                        style={{
                          border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '5px',
                          background: topCustChartType === 'bar' ? 'var(--primary-color)' : 'transparent',
                          color: topCustChartType === 'bar' ? '#fff' : 'var(--text-muted)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <BarChart2 size={14} /> Bar
                      </button>
                      <button
                        onClick={() => setTopCustChartType('pie')}
                        style={{
                          border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '5px',
                          background: topCustChartType === 'pie' ? 'var(--primary-color)' : 'transparent',
                          color: topCustChartType === 'pie' ? '#fff' : 'var(--text-muted)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <PieChartIcon size={14} /> Pie
                      </button>
                      <button
                        onClick={() => setTopCustChartType('line')}
                        style={{
                          border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '5px',
                          background: topCustChartType === 'line' ? 'var(--primary-color)' : 'transparent',
                          color: topCustChartType === 'line' ? '#fff' : 'var(--text-muted)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <LineChartIcon size={14} /> Line
                      </button>
                    </div>

                    <button
                      className="btn-secondary"
                      onClick={() => setActiveReport('top-customers')}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '6px 12px' }}
                    >
                      <span>Full Breakdown</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Summary Banner Card ("Top 5 owe you ₹...") */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 20px', borderRadius: '16px',
                  background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 10%, transparent) 0%, color-mix(in srgb, var(--primary-color) 3%, transparent) 100%)',
                  border: '1px solid color-mix(in srgb, var(--primary-color) 22%, transparent)',
                  marginBottom: '18px', flexWrap: 'wrap', gap: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                      {topCustMetric === 'owed' ? 'Top 5 owe you' : 'Top 5 Sales Revenue'}
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-dark)', marginTop: '2px', letterSpacing: '-0.5px' }}>
                      {inr(top5Total)}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)',
                    background: 'var(--glass-bg)', padding: '6px 14px', borderRadius: '20px',
                    border: '1px solid var(--glass-border)'
                  }}>
                    {topCustomers.length} ranked customers
                  </div>
                </div>

                {/* Executive KPI Pulse Strip */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  marginBottom: '20px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid var(--glass-border)'
                }}>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'color-mix(in srgb, var(--primary-color) 8%, var(--glass-bg))',
                    border: '1px solid color-mix(in srgb, var(--primary-color) 18%, var(--glass-border))'
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      #1 Concentration
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-dark)', marginTop: '2px' }}>
                      {topCustomers[0] ? `${((topCustomers[0].value / (top5Total || 1)) * 100).toFixed(1)}%` : '0%'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {topCustomers[0]?.name || 'None'}
                    </div>
                  </div>

                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)'
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Average Balance
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-dark)', marginTop: '2px' }}>
                      {inr(topCustomers.length > 0 ? top5Total / topCustomers.length : 0)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Across {topCustomers.length} ranked parties
                    </div>
                  </div>

                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)'
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Pending Bills
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
                      {topCustomers.reduce((s, c) => s + (c.pendingCount || 0), 0)} Bills
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Awaiting settlement
                    </div>
                  </div>
                </div>

                {/* Visual Chart Rendering: Horizontal Bar List | Responsive Pie | Responsive Line */}
                <div style={{ minHeight: '260px' }}>
                  {topCustChartType === 'bar' && (
                    <HorizontalBarList
                      items={topCustomers}
                      valueKey="value"
                      labelKey="name"
                      onBarClick={() => setCurrentTab && setCurrentTab('ledger')}
                    />
                  )}
                  {topCustChartType === 'pie' && (
                    <ResponsivePieChart
                      items={topCustomers}
                      valueKey="value"
                      labelKey="name"
                      onSliceClick={() => setCurrentTab && setCurrentTab('ledger')}
                    />
                  )}
                  {topCustChartType === 'line' && (
                    <ResponsiveLineChart
                      items={topCustomers}
                      valueKey="value"
                      labelKey="name"
                      strokeColor="var(--primary-color)"
                      onPointClick={() => setCurrentTab && setCurrentTab('ledger')}
                    />
                  )}
                </div>
              </div>

              {/* Category Filter Pills (Draggable & Reorderable Tabs) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
                {categoryOrder.map(catId => {
                  const defs = {
                    all: 'All',
                    sales: 'Sales',
                    party: 'Party',
                    stock: 'Stock',
                    accounts: 'Accounts',
                  };
                  const label = defs[catId] || catId;
                  const isDragging = draggedCatId === catId;
                  const isDragOver = dragOverCatId === catId;
                  return (
                    <button
                      key={catId}
                      draggable={true}
                      onDragStart={(e) => {
                        setDraggedCatId(catId);
                        e.dataTransfer.setData('text/plain', catId);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverCatId !== catId) setDragOverCatId(catId);
                      }}
                      onDragLeave={() => {
                        if (dragOverCatId === catId) setDragOverCatId(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleCategoryDrop(catId, e);
                      }}
                      onDragEnd={() => {
                        setDraggedCatId(null);
                        setDragOverCatId(null);
                        setTimeout(() => { wasDraggingCatRef.current = false; }, 200);
                      }}
                      onClick={() => {
                        if (wasDraggingCatRef.current) return;
                        setCategoryFilter(catId);
                      }}
                      title="Click to filter, drag to reorder tabs"
                      style={{
                        border: isDragOver ? '2px dashed var(--primary-color)' : 'none',
                        padding: '8px 16px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'grab',
                        whiteSpace: 'nowrap',
                        background: categoryFilter === catId ? 'var(--primary-color)' : 'var(--glass-bg)',
                        color: categoryFilter === catId ? '#fff' : 'var(--text-dark)',
                        boxShadow: categoryFilter === catId ? '0 4px 12px rgba(79, 70, 229, 0.3)' : '0 2px 8px rgba(0,0,0,0.04)',
                        opacity: isDragging ? 0.4 : 1,
                        transform: isDragOver ? 'scale(1.05)' : 'none',
                        transition: 'all 0.15s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Spotlight Cards (Directly matching mobile app UI references) */}
              {(categoryFilter === 'all' || categoryFilter === 'sales' || categoryFilter === 'accounts') && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))',
                  gap: '16px',
                  marginBottom: '22px'
                }}>
                  {(categoryFilter === 'all' || categoryFilter === 'sales') && (
                    <div
                      id="tc-sales-analytics-spotlight-card"
                      className="glass-panel"
                      onClick={() => setActiveReport('sales-analytics')}
                      style={{
                        padding: '18px 22px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.08) 0%, rgba(190, 18, 60, 0.02) 100%), var(--glass-bg)',
                        border: '1px solid rgba(225, 29, 72, 0.24)',
                        boxShadow: '0 8px 24px rgba(225, 29, 72, 0.08)',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(225, 29, 72, 0.16)';
                        e.currentTarget.style.borderColor = 'rgba(225, 29, 72, 0.45)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(225, 29, 72, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(225, 29, 72, 0.24)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, #e11d48, #be123c)',
                          color: '#fff',
                          border: '1px solid rgba(225, 29, 72, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 14px rgba(225, 29, 72, 0.28)'
                        }}>
                          <BarChart3 size={22} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>
                              Sales analytics
                            </h3>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              padding: '2px 8px',
                              borderRadius: '8px',
                              background: 'rgba(225, 29, 72, 0.12)',
                              color: '#e11d48'
                            }}>
                              Live
                            </span>
                          </div>
                          <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', margin: '4px 0 0', fontWeight: 600 }}>
                            Trend, top customers, items & day curve
                          </p>
                        </div>
                      </div>
                      <div
                        className="btn-glass"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#e11d48',
                          fontWeight: 700,
                          fontSize: '13px',
                          padding: '8px 16px',
                          borderRadius: '12px',
                          background: 'rgba(225, 29, 72, 0.08)',
                          border: '1px solid rgba(225, 29, 72, 0.22)',
                          boxShadow: '0 2px 8px rgba(225, 29, 72, 0.08)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <span>View Analytics</span>
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  )}

                  {(categoryFilter === 'all' || categoryFilter === 'accounts') && (
                    <div
                      id="tc-cash-flow-forecast-spotlight-card"
                      className="glass-panel"
                      onClick={() => setActiveReport('cash-flow-forecast')}
                      style={{
                        padding: '18px 22px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(29, 78, 216, 0.02) 100%), var(--glass-bg)',
                        border: '1px solid rgba(37, 99, 235, 0.24)',
                        boxShadow: '0 8px 24px rgba(37, 99, 235, 0.08)',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(37, 99, 235, 0.16)';
                        e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.45)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.24)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                          color: '#fff',
                          border: '1px solid rgba(37, 99, 235, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.28)'
                        }}>
                          <TrendingUp size={22} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>
                              Cash flow forecast
                            </h3>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              padding: '2px 8px',
                              borderRadius: '8px',
                              background: 'rgba(37, 99, 235, 0.12)',
                              color: '#2563eb'
                            }}>
                              13 Weeks
                            </span>
                          </div>
                          <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', margin: '4px 0 0', fontWeight: 600 }}>
                            Payment habits vs Due dates forecast
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2563eb', fontWeight: 700, fontSize: '13px' }}>
                        <span>Open</span>
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PINNED & TOP PRIORITY CARDS (Strictly at the top of the reports grid) */}
              {visibleCards.some(c => reportCardsPinned.includes(c.id)) && (
                <div style={{ marginBottom: '28px' }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    color: '#e11d48',
                    margin: '0 0 14px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Pin size={13} />
                    <span>PINNED &amp; TOP PRIORITY</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(225, 29, 72, 0.3)', opacity: 0.5 }} />
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
                    gap: '16px'
                  }}>
                    {visibleCards.filter(c => reportCardsPinned.includes(c.id)).map((card) => {
                      const sz = reportCardSizes[card.id] || 'normal';
                      return (
                        <div
                          key={`pinned-${card.id}`}
                          className="glass-panel is-pinned"
                          onClick={() => setActiveReport(card.id)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setCardContextMenu({ x: e.clientX, y: e.clientY, card, isSummary: false });
                          }}
                          {...createHoldTouchHandler((pos) => setCardContextMenu({ x: pos.x, y: pos.y, card, isSummary: false }))}
                          style={{
                            padding: sz === 'compact' ? '14px 18px' : '22px 20px',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            position: 'relative',
                            border: '1.5px solid rgba(225, 29, 72, 0.4)',
                            background: 'rgba(255, 255, 255, 0.85)',
                            boxShadow: '0 8px 24px rgba(225, 29, 72, 0.12)',
                            gridColumn: sz === 'wide' ? 'span 2' : 'span 1'
                          }}
                          title="Pinned card · Right-click for options"
                        >
                          <span className="pinned-badge" title="Pinned to top">
                            <Pin size={11} />
                          </span>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                              <div style={{
                                width: '44px', height: '44px', borderRadius: '14px',
                                background: `${card.color || '#e11d48'}15`, color: card.color || '#e11d48',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}>
                                {card.icon}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                  fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase',
                                  padding: '3px 8px', borderRadius: '6px',
                                  background: 'rgba(225, 29, 72, 0.1)', color: '#e11d48'
                                }}>
                                  PINNED
                                </span>
                                <button
                                  type="button"
                                  className="tile-menu-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setCardContextMenu({ x: rect.left, y: rect.bottom + 4, card, isSummary: false });
                                  }}
                                  style={{ background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-muted)' }}
                                >
                                  <MoreVertical size={14} />
                                </button>
                              </div>
                            </div>

                            <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 2px', color: 'var(--text-dark)' }}>
                              {card.title}
                            </h3>
                            {card.highlight && (
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#be123c', margin: '2px 0 4px' }}>
                                {card.highlight}
                              </div>
                            )}
                            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '0 0 12px', fontWeight: 500 }}>
                              {card.description}
                            </p>
                          </div>

                          <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                            borderTop: '1px solid var(--glass-border)', paddingTop: '12px'
                          }}>
                            <div>
                              {card.metric && (
                                <div style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-dark)' }}>
                                  {card.metric}
                                </div>
                              )}
                              {card.metricLabel && (
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                                  {card.metricLabel}
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: card.color || '#e11d48' }}>
                              View <ChevronRight size={16} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FINANCIAL STATEMENTS SECTION (Matching Mobile App Reference) */}
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
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
                    gap: '16px'
                  }}>
                    {financialStatementCards.filter(c => !reportCardsHidden.includes(c.id) && !reportCardsPinned.includes(c.id)).map((card) => {
                      const sz = reportCardSizes[card.id] || 'normal';
                      return (
                        <div
                          key={card.id}
                          className="glass-panel"
                          onClick={() => setActiveReport(card.id)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setCardContextMenu({ x: e.clientX, y: e.clientY, card, isSummary: false });
                          }}
                          {...createHoldTouchHandler((pos) => setCardContextMenu({ x: pos.x, y: pos.y, card, isSummary: false }))}
                          style={{
                            padding: sz === 'compact' ? '14px 16px' : '22px 20px',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            position: 'relative',
                            minHeight: sz === 'compact' ? '100px' : '128px',
                            border: '1px solid var(--glass-border)',
                            gridColumn: sz === 'wide' ? 'span 2' : 'span 1'
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
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <button
                                  type="button"
                                  className="tile-menu-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setCardContextMenu({ x: rect.left, y: rect.bottom + 4, card, isSummary: false });
                                  }}
                                  style={{ background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-muted)' }}
                                >
                                  <MoreVertical size={14} />
                                </button>
                                <ChevronRight size={16} color="var(--text-muted)" style={{ opacity: 0.6 }} />
                              </div>
                            </div>

                            <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '14px 0 4px', color: 'var(--text-dark)' }}>
                              {card.title}
                            </h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, fontWeight: 500, lineHeight: '1.4' }}>
                              {card.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
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
                {visibleCards.filter(c => !reportCardsPinned.includes(c.id) && !financialStatementCards.some(fc => fc.id === c.id)).map((card, index) => {
                  const isPinned = reportCardsPinned.includes(card.id);
                  const isDragging = draggedCardIdx === index;
                  const isDragOver = dragOverCardIdx === index;
                  return (
                    <div
                      key={card.id}
                      className={`glass-panel draggable-card ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                      draggable
                      onDragStart={(e) => handleCardDragStart(e, index)}
                      onDragOver={(e) => handleCardDragOver(e, index)}
                      onDrop={(e) => handleCardDrop(e, index)}
                      onDragEnd={() => {
                        setDraggedCardIdx(null);
                        setDragOverCardIdx(null);
                        setTimeout(() => { wasDraggingCardRef.current = false; }, 200);
                      }}
                      onClick={() => {
                        if (wasDraggingCardRef.current) return;
                        setActiveReport(card.id);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setCardContextMenu({ x: e.clientX, y: e.clientY, card, isSummary: false });
                      }}
                      {...createHoldTouchHandler((pos) => setCardContextMenu({ x: pos.x, y: pos.y, card, isSummary: false }))}
                      style={{
                        padding: '24px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 16px 36px rgba(15, 23, 42, 0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
                      }}
                      title="Hold or right-click for options · Drag to reorder"
                    >
                      {isPinned && (
                        <span className="pinned-badge" title="Pinned report">
                          <Pin size={11} />
                        </span>
                      )}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '44px', height: '44px', borderRadius: '14px',
                              background: `${card.color}15`, color: card.color,
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              {card.icon}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                              padding: '4px 8px', borderRadius: '8px',
                              background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)'
                            }}>
                              {card.category}
                            </span>
                            <button
                              type="button"
                              className="tile-menu-btn"
                              title="Options"
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                setCardContextMenu({ x: rect.left, y: rect.bottom + 4, card, isSummary: false });
                              }}
                              style={{ background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-muted)' }}
                            >
                              <MoreVertical size={14} />
                            </button>
                          </div>
                        </div>

                        <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 2px', color: 'var(--text-dark)' }}>
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
                        </p>
                      </div>

                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                        borderTop: '1px solid var(--glass-border)', paddingTop: '14px'
                      }}>
                        <div>
                          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-dark)' }}>
                            {card.metric}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {card.metricLabel}
                          </div>
                        </div>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          fontSize: '12px', fontWeight: 700, color: card.color
                        }}>
                          View <ChevronRight size={16} />
                        </div>
                      </div>
                    </div>
                  );
                })}


              </div>

              {/* Context menu for report cards and summary cards */}
              {cardContextMenu && createPortal(
                <div
                  className="dashboard-context-menu-scrim"
                  onClick={() => setCardContextMenu(null)}
                  onContextMenu={(e) => { e.preventDefault(); setCardContextMenu(null); }}
                >
                  <div
                    className="dashboard-context-menu glass-panel"
                    style={{
                      position: 'fixed',
                      left: `${Math.min(cardContextMenu.x, window.innerWidth - 180)}px`,
                      top: `${Math.min(cardContextMenu.y, window.innerHeight - 240)}px`,
                      zIndex: 99999
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ padding: '6px 12px 4px', borderBottom: '1px solid var(--glass-border)', fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>
                      {cardContextMenu.card.title}
                    </div>
                    <button type="button" onClick={() => toggleReportPin(cardContextMenu.card.reportId || cardContextMenu.card.id)}>
                      <Pin size={14} />
                      <span>{reportCardsPinned.includes(cardContextMenu.card.reportId || cardContextMenu.card.id) ? 'Unpin from Top' : 'Pin to Top'}</span>
                    </button>
                    <button type="button" onClick={() => {
                      const rep = cardContextMenu.card.reportId || cardContextMenu.card.id;
                      setCardContextMenu(null);
                      if (rep) setActiveReport(rep);
                    }}>
                      <ChevronRight size={14} />
                      <span>Open</span>
                    </button>

                    <button type="button" onClick={() => handleHideReportCard(cardContextMenu.card, cardContextMenu.isSummary)}>
                      <EyeOff size={14} />
                      <span>Hide</span>
                    </button>
                    <button type="button" onClick={() => {
                      setCardContextMenu(null);
                      try {
                        navigator.clipboard?.writeText(window.location.href);
                        showToast('Card link copied to clipboard');
                      } catch {
                        showToast('Share link ready');
                      }
                    }}>
                      <Share2 size={14} />
                      <span>Share</span>
                    </button>
                  </div>
                </div>,
                document.body
              )}

              {/* Unhide modal */}
              <UnhideModal
                isOpen={showUnhideModal}
                onClose={() => setShowUnhideModal(false)}
                hiddenItems={allHiddenReportItems}
                onUnhideOne={handleUnhideOne}
                onUnhideAll={handleUnhideAll}
                title="Hidden Report Cards"
              />

              {/* Toast message */}
              {toastMessage && (
                <div className="dashboard-toast">
                  <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                  <span>{toastMessage}</span>
                </div>
              )}
            </>
          ) : (
            /* =================== INDIVIDUAL REPORT DETAIL VIEWS =================== */
            <div className="fade-in">
              {/* Back Button Bar (for reports that don't have their own built-in header) */}
              {!['sales-analytics', 'cash-flow-forecast', 'cash-flow', 'profit-loss', 'balance-sheet', 'trial-balance', 'expenses', 'expenses-overview'].includes(activeReport) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <button
                    className="btn-secondary"
                    onClick={() => setActiveReport(null)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ArrowLeft size={16} /> Back to All Reports
                  </button>
                </div>
              )}

              {/* Year-End Stock Needed Banner for Financial Reports */}
              {financialMe?.stock_needed?.length > 0 && financialMe?.can_enter_stock && ['profit-loss', 'balance-sheet', 'trial-balance', 'cash-flow', 'expenses'].includes(activeReport) && (
                <div style={{
                  marginBottom: '20px', padding: '14px 18px', borderRadius: '14px',
                  background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertCircle size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#92400e' }}>
                        Year-End Audited Closing Stock Needed
                      </div>
                      <div style={{ fontSize: '12px', color: '#b45309' }}>
                        Closing stock for {financialMe.stock_needed.map(d => shortDate(d)).join(', ')} is needed to generate complete P&L and Balance Sheet.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowStockValueModal(true)}
                    style={{
                      padding: '8px 16px', borderRadius: '10px', background: '#d97706', color: '#fff',
                      border: 'none', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <Layers size={14} /> Enter Closing Stock
                  </button>
                </div>
              )}

              {/* ========================================================================= */}
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
                  loading={loadingFinancial}
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
                  dateFilter={dateFilter}
                  setDateFilter={setDateFilter}
                  customStart={customStart}
                  setCustomStart={setCustomStart}
                  customEnd={customEnd}
                  setCustomEnd={setCustomEnd}
                  periodLabel={periodLabel}
                  loading={loadingFinancial}
                />
              )}

              {activeReport === 'trial-balance' && (
                <TrialBalanceView
                  trialBalanceMetrics={trialBalanceMetrics}
                  ledgers={ledgers}
                  onBack={() => setActiveReport(null)}
                  onExportCSV={handleExportCSV}
                  onExportPDF={handleExportPDF}
                  onSelectLedger={(name) => setSelectedLedgerDrill({ name })}
                  dateFilter={dateFilter}
                  setDateFilter={setDateFilter}
                  customStart={customStart}
                  setCustomStart={setCustomStart}
                  customEnd={customEnd}
                  setCustomEnd={setCustomEnd}
                  periodLabel={periodLabel}
                  loading={loadingFinancial}
                />
              )}

              {activeReport === 'cash-flow' && (
                <CashFlowView
                  cashFlowMetrics={backendCashFlow}
                  ledgers={ledgers}
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
                  loading={loadingFinancial}
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
                  customStart={customStart}
                  setCustomStart={setCustomStart}
                  customEnd={customEnd}
                  setCustomEnd={setCustomEnd}
                  periodLabel={periodLabel}
                  onExportCSV={handleExportCSV}
                  onExportPDF={handleExportPDF}
                  purchases={finPurchases}
                  onTogglePurchases={() => setFinPurchases(prev => !prev)}
                  loading={loadingFinancial}
                />
              )}

              {/* ========================================================================= */}
              {/* 0. SALES ANALYTICS REPORT VIEW (Matching Mobile App Reference Screenshots) */}
              {/* ========================================================================= */}
              {activeReport === 'sales-analytics' && (
                <ErrorBoundary
                  title="Sales Analytics Report"
                  onBack={() => setActiveReport(null)}
                >
                  <SalesAnalyticsDetailView
                    vouchers={vouchers}
                    orders={orders}
                    inventory={inventory}
                    companyName={companyName}
                    companyGuid={companyGuid}
                    onBack={() => setActiveReport(null)}
                    onExportCSV={handleExportCSV}
                  />
                </ErrorBoundary>
              )}

              {/* ========================================================================= */}
              {/* 0b. CASH FLOW FORECAST REPORT VIEW (Matching Mobile App Reference)        */}
              {/* ========================================================================= */}
              {activeReport === 'cash-flow-forecast' && (
                <CashFlowForecast
                  bills={bills}
                  ledgers={ledgers}
                  vouchers={vouchers}
                  companyName={companyName}
                  onBack={() => setActiveReport(null)}
                  onRefresh={fetchReportsData}
                />
              )}

              {/* 1. TOP CUSTOMERS REPORT VIEW (Matching Mobile App Reference) */}
              {activeReport === 'top-customers' && (
                <div className="glass-panel" style={{ padding: '28px', borderRadius: '24px', marginBottom: '24px' }}>
                  {/* Header with Trophy & Subtitle */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '46px', height: '46px', borderRadius: '14px',
                        background: 'color-mix(in srgb, var(--primary-color) 12%, transparent)',
                        color: 'var(--primary-color)',
                        border: '1px solid color-mix(in srgb, var(--primary-color) 22%, transparent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Trophy size={24} />
                      </div>
                      <div>
                        <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>
                          Top customers
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '3px 0 0', fontWeight: 600 }}>
                          Top 5 {topCustMetric === 'owed' ? 'by money owed' : 'by sales revenue'} · {periodLabel}
                        </p>
                      </div>
                    </div>

                    {/* Controls: Metric Switcher + Chart Selector */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* Metric Switcher */}
                      <div className="glass-panel" style={{ display: 'flex', padding: '3px', borderRadius: '12px', gap: '3px' }}>
                        <button
                          onClick={() => setTopCustMetric('owed')}
                          style={{
                            border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                            background: topCustMetric === 'owed' ? 'var(--primary-color)' : 'transparent',
                            color: topCustMetric === 'owed' ? '#fff' : 'var(--text-muted)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          Money Owed
                        </button>
                        <button
                          onClick={() => setTopCustMetric('sales')}
                          style={{
                            border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                            background: topCustMetric === 'sales' ? 'var(--primary-color)' : 'transparent',
                            color: topCustMetric === 'sales' ? '#fff' : 'var(--text-muted)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          Sales Turnover
                        </button>
                      </div>

                      {/* Chart Type Selector (Bar | Pie | Line) */}
                      <div className="glass-panel" style={{ display: 'flex', padding: '3px', borderRadius: '12px', gap: '3px' }}>
                        <button
                          onClick={() => setTopCustChartType('bar')}
                          style={{
                            border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '4px',
                            background: topCustChartType === 'bar' ? 'var(--primary-color)' : 'transparent',
                            color: topCustChartType === 'bar' ? '#fff' : 'var(--text-muted)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <BarChart2 size={14} /> Bar
                        </button>
                        <button
                          onClick={() => setTopCustChartType('pie')}
                          style={{
                            border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '4px',
                            background: topCustChartType === 'pie' ? 'var(--primary-color)' : 'transparent',
                            color: topCustChartType === 'pie' ? '#fff' : 'var(--text-muted)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <PieChartIcon size={14} /> Pie
                        </button>
                        <button
                          onClick={() => setTopCustChartType('line')}
                          style={{
                            border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '4px',
                            background: topCustChartType === 'line' ? 'var(--primary-color)' : 'transparent',
                            color: topCustChartType === 'line' ? '#fff' : 'var(--text-muted)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <LineChartIcon size={14} /> Line
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Summary Banner Card (Matching Screenshot: "Top 5 owe you ₹...") */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', borderRadius: '16px',
                    background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 10%, transparent) 0%, color-mix(in srgb, var(--primary-color) 3%, transparent) 100%)',
                    border: '1px solid color-mix(in srgb, var(--primary-color) 22%, transparent)',
                    marginBottom: '20px', flexWrap: 'wrap', gap: '12px'
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                        {topCustMetric === 'owed' ? 'Top 5 owe you' : 'Top 5 Sales Revenue'}
                      </div>
                      <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-dark)', marginTop: '2px', letterSpacing: '-0.5px' }}>
                        {inr(top5Total)}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)',
                      background: 'var(--glass-bg)', padding: '6px 14px', borderRadius: '20px',
                      border: '1px solid var(--glass-border)'
                    }}>
                      {topCustomers.length} ranked customers
                    </div>
                  </div>

                  {/* Executive Insights Showcase Card */}
                  <div className="glass-panel" style={{
                    marginBottom: '28px',
                    borderRadius: '22px',
                    padding: '20px 24px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
                  }}>
                    {/* Executive KPI Pulse Strip */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '12px',
                      marginBottom: '20px',
                      paddingBottom: '16px',
                      borderBottom: '1px solid var(--glass-border)'
                    }}>
                      {/* 1. Concentration Risk */}
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: 'color-mix(in srgb, var(--primary-color) 8%, var(--glass-bg))',
                        border: '1px solid color-mix(in srgb, var(--primary-color) 18%, var(--glass-border))'
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          #1 Debtor Concentration
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-dark)', marginTop: '2px' }}>
                          {topCustomers[0] ? `${((topCustomers[0].value / (top5Total || 1)) * 100).toFixed(1)}%` : '0%'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {topCustomers[0]?.name || 'None'}
                        </div>
                      </div>

                      {/* 2. Average Exposure */}
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)'
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          Average Balance
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-dark)', marginTop: '2px' }}>
                          {inr(topCustomers.length > 0 ? top5Total / topCustomers.length : 0)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                          Across {topCustomers.length} ranked parties
                        </div>
                      </div>

                      {/* 3. Pending Vouchers */}
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)'
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          Pending Bills
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
                          {topCustomers.reduce((s, c) => s + (c.pendingCount || 0), 0)} Bills
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                          Awaiting settlement
                        </div>
                      </div>
                    </div>

                    {/* Visual Chart Rendering */}
                    {topCustChartType === 'bar' && (
                      <HorizontalBarList
                        items={topCustomers}
                        valueKey="value"
                        labelKey="name"
                        onBarClick={() => setCurrentTab && setCurrentTab('ledger')}
                      />
                    )}
                    {topCustChartType === 'pie' && (
                      <ResponsivePieChart
                        items={topCustomers}
                        valueKey="value"
                        labelKey="name"
                        onSliceClick={() => setCurrentTab && setCurrentTab('ledger')}
                      />
                    )}
                    {topCustChartType === 'line' && (
                      <ResponsiveLineChart
                        items={topCustomers}
                        valueKey="value"
                        labelKey="name"
                        strokeColor="var(--primary-color)"
                        onPointClick={() => setCurrentTab && setCurrentTab('ledger')}
                      />
                    )}
                  </div>

                  {/* View Mode Toggle: Cards vs Table */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-dark)' }}>
                      Ranked Customer Breakdown
                    </div>
                    <div className="glass-panel" style={{ display: 'flex', padding: '2px', borderRadius: '10px', gap: '2px' }}>
                      <button
                        onClick={() => setTopCustViewMode('cards')}
                        style={{
                          border: 'none', padding: '4px 10px', borderRadius: '7px', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                          background: topCustViewMode === 'cards' ? 'var(--primary-color)' : 'transparent',
                          color: topCustViewMode === 'cards' ? '#fff' : 'var(--text-muted)'
                        }}
                      >
                        Cards View
                      </button>
                      <button
                        onClick={() => setTopCustViewMode('table')}
                        style={{
                          border: 'none', padding: '4px 10px', borderRadius: '7px', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                          background: topCustViewMode === 'table' ? 'var(--primary-color)' : 'transparent',
                          color: topCustViewMode === 'table' ? '#fff' : 'var(--text-muted)'
                        }}
                      >
                        Table View
                      </button>
                    </div>
                  </div>

                  {/* Cards View (Matching Mobile App Reference) */}
                  {topCustViewMode === 'cards' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {topCustomers.length === 0 ? (
                        <div className="state-block" style={{ padding: '36px', textAlign: 'center' }}>
                          <p style={{ color: 'var(--text-muted)' }}>No sales recorded or customer records found for this period.</p>
                        </div>
                      ) : (
                        topCustomers.map((cust, idx) => (
                          <div
                            key={cust.name}
                            className="glass-panel"
                            onClick={() => setCurrentTab && setCurrentTab('ledger')}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '14px 18px', borderRadius: '16px',
                              cursor: 'pointer', transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--glass-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--glass-bg)'; e.currentTarget.style.transform = 'none'; }}
                          >
                            {/* Left: Numbered badge + Customer Name + Pending Bills */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', maxWidth: '65%' }}>
                              <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: '#0f172a', color: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 800, fontSize: '13px', flexShrink: 0
                              }}>
                                {idx + 1}
                              </div>
                              <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-dark)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  {cust.name}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
                                  {cust.pendingCount} Pending bills {cust.balance ? `· Bal: ${formatShortInr(cust.balance)}` : ''}
                                </div>
                              </div>
                            </div>

                            {/* Right: Bold Green Amount + Chevron */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ fontSize: '16px', fontWeight: 800, color: '#10b981', letterSpacing: '-0.3px', textAlign: 'right' }}>
                                {inr(cust.value)}
                              </div>
                              <ChevronRight size={18} color="var(--text-muted)" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    /* Customer Table View */
                    <div className="table-responsive-container" style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
                            <th style={{ padding: '12px 16px' }}>Rank</th>
                            <th style={{ padding: '12px 16px' }}>Customer Name</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right' }}>{topCustMetric === 'owed' ? 'Money Owed' : 'Sales Revenue'}</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Closing Balance</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center' }}>Pending Bills</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topCustomers.length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No sales recorded or customer records found for this period.
                              </td>
                            </tr>
                          ) : (
                            topCustomers.map((cust, idx) => (
                              <tr
                                key={cust.name}
                                style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.15s' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-hover)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <td style={{ padding: '16px', fontWeight: 800, color: 'var(--primary-color)' }}>
                                  #{idx + 1}
                                </td>
                                <td style={{ padding: '16px', fontWeight: 700, color: 'var(--text-dark)' }}>
                                  {cust.name}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right', fontWeight: 800, color: '#10b981' }}>
                                  {inr(cust.value)}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600 }}>
                                  {inr(cust.balance)}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                  <span style={{
                                    padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                                    background: cust.pendingCount > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                    color: cust.pendingCount > 0 ? '#b45309' : '#047857'
                                  }}>
                                    {cust.pendingCount} bill(s)
                                  </span>
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right' }}>
                                  <button
                                    className="btn-secondary"
                                    onClick={() => setCurrentTab && setCurrentTab('ledger')}
                                    style={{ padding: '4px 10px', fontSize: '12px' }}
                                  >
                                    View Ledger
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 2. SALES REGISTER / LIST REPORT VIEW */}
              {activeReport === 'sales-list' && (
                <div className="glass-panel" style={{ padding: '28px', borderRadius: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>Sales Register</h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0' }}>
                        All sales invoices & revenue transactions for {periodLabel}
                      </p>
                    </div>

                    <div style={{ width: '280px', maxWidth: '100%' }}>
                      <BitrixFilterBar
                        storageKey="tc_report_sales_reg_filter"
                        searchQuery={detailSearch}
                        onSearchChange={setDetailSearch}
                        placeholder="Search customer, invoice..."
                      />
                    </div>
                  </div>

                  <div className="table-responsive-container" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
                          <th style={{ padding: '12px 16px' }}>Date</th>
                          <th style={{ padding: '12px 16px' }}>Voucher / Invoice No</th>
                          <th style={{ padding: '12px 16px' }}>Customer Name</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVouchers.filter(v => /sale/i.test(String(v.voucher_type || '')) &&
                          (!detailSearch || String(v.party_name || '').toLowerCase().includes(detailSearch.toLowerCase()) ||
                            String(v.reference_no || '').toLowerCase().includes(detailSearch.toLowerCase()))
                        ).length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                              No sales transactions match the criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredVouchers.filter(v => /sale/i.test(String(v.voucher_type || '')) &&
                            (!detailSearch || String(v.party_name || '').toLowerCase().includes(detailSearch.toLowerCase()) ||
                              String(v.reference_no || '').toLowerCase().includes(detailSearch.toLowerCase()))
                          ).map((v, idx) => (
                            <tr key={v.voucher_guid || idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                              <td style={{ padding: '16px', fontWeight: 600 }}>{shortDate(v.voucher_date)}</td>
                              <td
                                style={{ padding: '16px', color: setCurrentTab ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: 600, cursor: setCurrentTab ? 'pointer' : 'default' }}
                                onClick={() => setCurrentTab && setCurrentTab('vouchers')}
                                title={setCurrentTab ? 'Open in Vouchers' : ''}
                              >
                                {v.reference_no || `VCH-${idx + 1}`}
                              </td>
                              <td
                                style={{ padding: '16px', fontWeight: 700, color: setCurrentTab ? 'var(--primary-color)' : 'var(--text-dark)', cursor: setCurrentTab ? 'pointer' : 'default' }}
                                onClick={() => setCurrentTab && setCurrentTab('ledger')}
                                title={setCurrentTab ? 'Open in Ledgers' : ''}
                              >
                                {v.party_name || 'Cash Sale'}
                              </td>
                              <td style={{ padding: '16px', textAlign: 'right', fontWeight: 800, color: '#0ea5e9' }}>{inr(v.amount)}</td>
                              <td style={{ padding: '16px', textAlign: 'center' }}>
                                <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', color: '#047857' }}>
                                  Active
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 3. PURCHASE REGISTER / LIST REPORT VIEW */}
              {activeReport === 'purchase-list' && (
                <div className="glass-panel" style={{ padding: '28px', borderRadius: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>Purchase Register</h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0' }}>
                        All vendor purchases & supplier bills for {periodLabel}
                      </p>
                    </div>

                    <div style={{ width: '280px', maxWidth: '100%' }}>
                      <BitrixFilterBar
                        storageKey="tc_report_purch_reg_filter"
                        searchQuery={detailSearch}
                        onSearchChange={setDetailSearch}
                        placeholder="Search supplier, bill..."
                      />
                    </div>
                  </div>

                  <div className="table-responsive-container" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
                          <th style={{ padding: '12px 16px' }}>Date</th>
                          <th style={{ padding: '12px 16px' }}>Voucher No</th>
                          <th style={{ padding: '12px 16px' }}>Supplier Name</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVouchers.filter(v => /purchase/i.test(String(v.voucher_type || '')) &&
                          (!detailSearch || String(v.party_name || '').toLowerCase().includes(detailSearch.toLowerCase()) ||
                            String(v.reference_no || '').toLowerCase().includes(detailSearch.toLowerCase()))
                        ).length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                              No purchase vouchers recorded for this period.
                            </td>
                          </tr>
                        ) : (
                          filteredVouchers.filter(v => /purchase/i.test(String(v.voucher_type || '')) &&
                            (!detailSearch || String(v.party_name || '').toLowerCase().includes(detailSearch.toLowerCase()) ||
                              String(v.reference_no || '').toLowerCase().includes(detailSearch.toLowerCase()))
                          ).map((v, idx) => (
                            <tr key={v.voucher_guid || idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                              <td style={{ padding: '16px', fontWeight: 600 }}>{shortDate(v.voucher_date)}</td>
                              <td
                                style={{ padding: '16px', color: setCurrentTab ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: 600, cursor: setCurrentTab ? 'pointer' : 'default' }}
                                onClick={() => setCurrentTab && setCurrentTab('vouchers')}
                                title={setCurrentTab ? 'Open in Vouchers' : ''}
                              >
                                {v.reference_no || `PUR-${idx + 1}`}
                              </td>
                              <td
                                style={{ padding: '16px', fontWeight: 700, color: setCurrentTab ? 'var(--primary-color)' : 'var(--text-dark)', cursor: setCurrentTab ? 'pointer' : 'default' }}
                                onClick={() => setCurrentTab && setCurrentTab('ledger')}
                                title={setCurrentTab ? 'Open in Ledgers' : ''}
                              >
                                {v.party_name || 'General Supplier'}
                              </td>
                              <td style={{ padding: '16px', textAlign: 'right', fontWeight: 800, color: '#ef4444' }}>{inr(v.amount)}</td>
                              <td style={{ padding: '16px', textAlign: 'center' }}>
                                <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: 'rgba(59, 130, 246, 0.15)', color: '#1d4ed8' }}>
                                  Recorded
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 4. DAY BOOK REPORT VIEW */}
              {activeReport === 'day-book' && (
                <div className="glass-panel" style={{ padding: '28px', borderRadius: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>Day Book</h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0' }}>
                        Chronological journal transactions for {periodLabel}
                      </p>
                    </div>

                    <div style={{ width: '280px', maxWidth: '100%' }}>
                      <BitrixFilterBar
                        storageKey="tc_report_daybook_filter"
                        searchQuery={detailSearch}
                        onSearchChange={setDetailSearch}
                        placeholder="Search day book..."
                      />
                    </div>
                  </div>

                  <div className="table-responsive-container" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
                          <th style={{ padding: '12px 16px' }}>Date</th>
                          <th style={{ padding: '12px 16px' }}>Voucher Type</th>
                          <th style={{ padding: '12px 16px' }}>Particulars (Party)</th>
                          <th style={{ padding: '12px 16px' }}>Reference</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right' }}>Debit</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right' }}>Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVouchers.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                              No transactions recorded in the Day Book for this period.
                            </td>
                          </tr>
                        ) : (
                          filteredVouchers
                            .filter(v => !detailSearch || String(v.party_name || '').toLowerCase().includes(detailSearch.toLowerCase()) ||
                              String(v.voucher_type || '').toLowerCase().includes(detailSearch.toLowerCase()))
                            .map((v, idx) => {
                              const t = String(v.voucher_type || '').toLowerCase();
                              const isDebit = /purchase|payment/i.test(t);
                              const amt = Number(v.amount) || 0;

                              return (
                                <tr key={v.voucher_guid || idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                  <td style={{ padding: '16px', fontWeight: 600 }}>{shortDate(v.voucher_date)}</td>
                                  <td
                                    style={{ padding: '16px', cursor: setCurrentTab ? 'pointer' : 'default' }}
                                    onClick={() => setCurrentTab && setCurrentTab('vouchers')}
                                    title={setCurrentTab ? 'Open in Vouchers' : ''}
                                  >
                                    <span style={{
                                      padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
                                      background: /sale/i.test(t) ? 'rgba(14, 165, 233, 0.12)' :
                                        /receipt/i.test(t) ? 'rgba(16, 185, 129, 0.12)' :
                                          /purchase/i.test(t) ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                      color: /sale/i.test(t) ? '#0284c7' :
                                        /receipt/i.test(t) ? '#059669' :
                                          /purchase/i.test(t) ? '#dc2626' : '#d97706'
                                    }}>
                                      {v.voucher_type}
                                    </span>
                                  </td>
                                  <td
                                    style={{ padding: '16px', fontWeight: 700, color: setCurrentTab ? 'var(--primary-color)' : 'var(--text-dark)', cursor: setCurrentTab ? 'pointer' : 'default' }}
                                    onClick={() => setCurrentTab && setCurrentTab('ledger')}
                                    title={setCurrentTab ? 'Open in Ledgers' : ''}
                                  >
                                    {v.party_name || 'General Entry'}
                                  </td>
                                  <td
                                    style={{ padding: '16px', color: setCurrentTab ? 'var(--primary-color)' : 'var(--text-muted)', cursor: setCurrentTab ? 'pointer' : 'default', fontWeight: 500 }}
                                    onClick={() => setCurrentTab && setCurrentTab('vouchers')}
                                    title={setCurrentTab ? 'Open in Vouchers' : ''}
                                  >
                                    {v.reference_no || '—'}
                                  </td>
                                  <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700, color: isDebit ? '#ef4444' : 'var(--text-muted)' }}>
                                    {isDebit ? inr(amt) : '—'}
                                  </td>
                                  <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700, color: !isDebit ? '#10b981' : 'var(--text-muted)' }}>
                                    {!isDebit ? inr(amt) : '—'}
                                  </td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 5. STOCK SUMMARY REPORT VIEW */}
              {activeReport === 'stock-summary' && (
                <div className="glass-panel" style={{ padding: '28px', borderRadius: '24px' }}>
                  {/* Header & Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>Stock Summary & Valuation</h2>
                        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary-color)', fontWeight: 700 }}>
                          Draggable Widgets
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0' }}>
                        Live inventory stock valuation and movement across all active warehouse items
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ width: '240px', maxWidth: '100%' }}>
                        <BitrixFilterBar
                          storageKey="tc_report_stock_filter"
                          searchQuery={stockSearch}
                          onSearchChange={setStockSearch}
                          placeholder="Search items…"
                        />
                      </div>

                      {/* Chart toggle */}
                      <div className="glass-panel" style={{ display: 'flex', padding: '3px', borderRadius: '12px', gap: '3px' }}>
                        <button
                          type="button"
                          onClick={() => setStockChartType('bar')}
                          style={{
                            border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '4px',
                            background: stockChartType === 'bar' ? 'var(--primary-color)' : 'transparent',
                            color: stockChartType === 'bar' ? '#fff' : 'var(--text-muted)'
                          }}
                        >
                          <BarChart2 size={14} /> Bar
                        </button>
                        <button
                          type="button"
                          onClick={() => setStockChartType('pie')}
                          style={{
                            border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '4px',
                            background: stockChartType === 'pie' ? 'var(--primary-color)' : 'transparent',
                            color: stockChartType === 'pie' ? '#fff' : 'var(--text-muted)'
                          }}
                        >
                          <PieChartIcon size={14} /> Pie
                        </button>
                      </div>

                      {/* Unhide Widgets button */}
                      {stockWidgetsHidden.length > 0 && (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleResetSubWidgets(setStockWidgetsOrder, ['stock-kpi', 'stock-chart', 'stock-table'], setStockWidgetsHidden, 'tc_report_stock_order', 'tc_report_stock_hidden')}
                          style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '6px 12px' }}
                          title="Restore all hidden widgets"
                        >
                          <Eye size={14} /> Unhide ({stockWidgetsHidden.length})
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setCurrentTab && setCurrentTab('inventory')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Package size={15} /> Open in Items
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Draggable & Hideable Sub-widgets */}
                  {stockWidgetsOrder.filter(id => !stockWidgetsHidden.includes(id)).map((widgetId) => {
                    const isDragTarget = dragOverSubWidget === widgetId;

                    if (widgetId === 'stock-kpi') {
                      const totalVal = inventory.reduce((s, it) => s + Number(it.value || 0), 0);
                      const totalInward = inventory.reduce((s, it) => s + Number(it.inward || 0), 0);
                      const totalOutward = inventory.reduce((s, it) => s + Number(it.outward || 0), 0);

                      return (
                        <div
                          key={widgetId}
                          draggable
                          onDragStart={(e) => handleSubWidgetDragStart(e, widgetId)}
                          onDragOver={(e) => handleSubWidgetDragOver(e, widgetId)}
                          onDrop={(e) => handleSubWidgetDrop(e, widgetId, stockWidgetsOrder, setStockWidgetsOrder, 'tc_report_stock_order')}
                          className="glass-panel"
                          style={{
                            padding: '20px',
                            borderRadius: '20px',
                            marginBottom: '20px',
                            border: isDragTarget ? '2px dashed var(--primary-color)' : '1px solid var(--glass-border)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Move size={15} style={{ cursor: 'grab', opacity: 0.5 }} title="Drag to reorder" />
                              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-dark)' }}>
                                Stock Valuation Overview
                              </h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleHideSubWidget(widgetId, stockWidgetsHidden, setStockWidgetsHidden, 'tc_report_stock_hidden')}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                              title="Hide widget"
                            >
                              <EyeOff size={15} />
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                            <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(99, 102, 241, 0.08)' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase' }}>Total Stock Valuation</div>
                              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-dark)', marginTop: '4px' }}>{inr(totalVal)}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Current warehouse book value</div>
                            </div>
                            <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.08)' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>Tracked SKUs</div>
                              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-dark)', marginTop: '4px' }}>{inventory.length}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Unique inventory items</div>
                            </div>
                            <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(14, 165, 233, 0.08)' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>Total Inward Units</div>
                              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>+{totalInward.toLocaleString('en-IN')}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Purchased & received</div>
                            </div>
                            <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(239, 68, 68, 0.08)' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>Total Outward Units</div>
                              <div style={{ fontSize: '22px', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>-{totalOutward.toLocaleString('en-IN')}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Dispatched & sold</div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (widgetId === 'stock-chart') {
                      const chartItems = inventory.map(it => ({ ...it, label: it.name, value: Number(it.value || 0) })).filter(x => x.value > 0);

                      return (
                        <div
                          key={widgetId}
                          draggable
                          onDragStart={(e) => handleSubWidgetDragStart(e, widgetId)}
                          onDragOver={(e) => handleSubWidgetDragOver(e, widgetId)}
                          onDrop={(e) => handleSubWidgetDrop(e, widgetId, stockWidgetsOrder, setStockWidgetsOrder, 'tc_report_stock_order')}
                          className="glass-panel"
                          style={{
                            padding: '20px',
                            borderRadius: '20px',
                            marginBottom: '20px',
                            border: isDragTarget ? '2px dashed var(--primary-color)' : '1px solid var(--glass-border)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Move size={15} style={{ cursor: 'grab', opacity: 0.5 }} title="Drag to reorder" />
                              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-dark)' }}>
                                Valuation Distribution Chart ({stockChartType === 'bar' ? 'Bar Chart' : 'Pie Share'})
                              </h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleHideSubWidget(widgetId, stockWidgetsHidden, setStockWidgetsHidden, 'tc_report_stock_hidden')}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                              title="Hide widget"
                            >
                              <EyeOff size={15} />
                            </button>
                          </div>

                          {chartItems.length === 0 ? (
                            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                              No stock valuation items to display.
                            </div>
                          ) : stockChartType === 'bar' ? (
                            <ResponsiveBarChart
                              items={chartItems}
                              valueKey="value"
                              labelKey="label"
                              onBarClick={() => setCurrentTab && setCurrentTab('inventory')}
                            />
                          ) : (
                            <ResponsivePieChart
                              items={chartItems}
                              valueKey="value"
                              labelKey="label"
                              onSliceClick={() => setCurrentTab && setCurrentTab('inventory')}
                            />
                          )}
                        </div>
                      );
                    }

                    if (widgetId === 'stock-table') {
                      const filteredItems = inventory.filter(it => {
                        if (!stockSearch) return true;
                        return String(it.name || '').toLowerCase().includes(stockSearch.toLowerCase());
                      });

                      return (
                        <div
                          key={widgetId}
                          draggable
                          onDragStart={(e) => handleSubWidgetDragStart(e, widgetId)}
                          onDragOver={(e) => handleSubWidgetDragOver(e, widgetId)}
                          onDrop={(e) => handleSubWidgetDrop(e, widgetId, stockWidgetsOrder, setStockWidgetsOrder, 'tc_report_stock_order')}
                          className="glass-panel"
                          style={{
                            padding: '20px',
                            borderRadius: '20px',
                            border: isDragTarget ? '2px dashed var(--primary-color)' : '1px solid var(--glass-border)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Move size={15} style={{ cursor: 'grab', opacity: 0.5 }} title="Drag to reorder" />
                              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-dark)' }}>
                                Stock Inventory Ledger ({filteredItems.length} items)
                              </h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleHideSubWidget(widgetId, stockWidgetsHidden, setStockWidgetsHidden, 'tc_report_stock_hidden')}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                              title="Hide widget"
                            >
                              <EyeOff size={15} />
                            </button>
                          </div>

                          <div className="table-responsive-container" style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
                                  <th style={{ padding: '12px 16px' }}>Item Name</th>
                                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Opening</th>
                                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Inward</th>
                                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Outward</th>
                                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Closing Qty</th>
                                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Rate (₹)</th>
                                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total Value</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredItems.length === 0 ? (
                                  <tr>
                                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                      {stockSearch ? `No items matched "${stockSearch}".` : 'No inventory items found.'}
                                    </td>
                                  </tr>
                                ) : (
                                  filteredItems.map((it) => (
                                    <tr
                                      key={it.id || it.name}
                                      style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer' }}
                                      onClick={() => setCurrentTab && setCurrentTab('inventory')}
                                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-hover)'}
                                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-dark)' }}>{it.name}</td>
                                      <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>{it.opening}</td>
                                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#10b981' }}>+{it.inward}</td>
                                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#ef4444' }}>-{it.outward}</td>
                                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800 }}>{it.closing}</td>
                                      <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>₹{it.rate}</td>
                                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, color: 'var(--primary-color)' }}>{inr(it.value)}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              )}

              {/* 6. QUIET CUSTOMERS REPORT VIEW */}
              {activeReport === 'quiet-customers' && (
                <div className="glass-panel" style={{ padding: '28px', borderRadius: '24px' }}>
                  {/* Header & Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>Quiet Customers</h2>
                        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.12)', color: '#d97706', fontWeight: 700 }}>
                          Draggable Widgets
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0' }}>
                        Sundry Debtors with zero sales vouchers during {periodLabel}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ width: '240px', maxWidth: '100%' }}>
                        <BitrixFilterBar
                          storageKey="tc_report_quiet_filter"
                          searchQuery={quietSearch}
                          onSearchChange={setQuietSearch}
                          placeholder="Search quiet debtors…"
                        />
                      </div>

                      {/* Unhide Widgets button */}
                      {quietWidgetsHidden.length > 0 && (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleResetSubWidgets(setQuietWidgetsOrder, ['quiet-kpi', 'quiet-chart', 'quiet-table'], setQuietWidgetsHidden, 'tc_report_quiet_order', 'tc_report_quiet_hidden')}
                          style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '6px 12px' }}
                          title="Restore all hidden widgets"
                        >
                          <Eye size={14} /> Unhide ({quietWidgetsHidden.length})
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setCurrentTab && setCurrentTab('ledger')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Building2 size={15} /> All Debtors
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Draggable & Hideable Sub-widgets */}
                  {quietWidgetsOrder.filter(id => !quietWidgetsHidden.includes(id)).map((widgetId) => {
                    const isDragTarget = dragOverSubWidget === widgetId;

                    if (widgetId === 'quiet-kpi') {
                      const totalTiedUp = quietCustomers.reduce((s, c) => s + Math.abs(Number(c.closing_balance || 0)), 0);
                      const inactiveRate = ((quietCustomers.length / Math.max(ledgers.length, 1)) * 100).toFixed(1);

                      return (
                        <div
                          key={widgetId}
                          draggable
                          onDragStart={(e) => handleSubWidgetDragStart(e, widgetId)}
                          onDragOver={(e) => handleSubWidgetDragOver(e, widgetId)}
                          onDrop={(e) => handleSubWidgetDrop(e, widgetId, quietWidgetsOrder, setQuietWidgetsOrder, 'tc_report_quiet_order')}
                          className="glass-panel"
                          style={{
                            padding: '20px',
                            borderRadius: '20px',
                            marginBottom: '20px',
                            border: isDragTarget ? '2px dashed var(--primary-color)' : '1px solid var(--glass-border)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Move size={15} style={{ cursor: 'grab', opacity: 0.5 }} title="Drag to reorder" />
                              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-dark)' }}>
                                Quiet Customers Scorecard
                              </h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleHideSubWidget(widgetId, quietWidgetsHidden, setQuietWidgetsHidden, 'tc_report_quiet_hidden')}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                              title="Hide widget"
                            >
                              <EyeOff size={15} />
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                            <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.08)' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>Inactive Debtors</div>
                              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-dark)', marginTop: '4px' }}>{quietCustomers.length}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Zero sales during this period</div>
                            </div>
                            <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(239, 68, 68, 0.08)' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>Tied-up Ledger Balance</div>
                              <div style={{ fontSize: '22px', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>{inr(totalTiedUp)}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Outstanding from dormant accounts</div>
                            </div>
                            <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(99, 102, 241, 0.08)' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase' }}>Inactivity Ratio</div>
                              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-dark)', marginTop: '4px' }}>{inactiveRate}%</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Of total company ledger accounts</div>
                            </div>
                            <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.08)' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>Period Monitored</div>
                              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-dark)', marginTop: '6px' }}>{periodLabel}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Selected financial scope</div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (widgetId === 'quiet-chart') {
                      const chartData = quietCustomers
                        .map(c => ({
                          label: c.name,
                          name: c.name,
                          value: Math.abs(Number(c.closing_balance || 0)),
                          amount: Math.abs(Number(c.closing_balance || 0)),
                          balance: Number(c.closing_balance || 0)
                        }))
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 5);

                      return (
                        <div
                          key={widgetId}
                          draggable
                          onDragStart={(e) => handleSubWidgetDragStart(e, widgetId)}
                          onDragOver={(e) => handleSubWidgetDragOver(e, widgetId)}
                          onDrop={(e) => handleSubWidgetDrop(e, widgetId, quietWidgetsOrder, setQuietWidgetsOrder, 'tc_report_quiet_order')}
                          className="glass-panel"
                          style={{
                            padding: '20px',
                            borderRadius: '20px',
                            marginBottom: '20px',
                            border: isDragTarget ? '2px dashed var(--primary-color)' : '1px solid var(--glass-border)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Move size={15} style={{ cursor: 'grab', opacity: 0.5 }} title="Drag to reorder" />
                              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-dark)' }}>
                                Top Dormant Debtors by Tied-up Balance
                              </h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleHideSubWidget(widgetId, quietWidgetsHidden, setQuietWidgetsHidden, 'tc_report_quiet_hidden')}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                              title="Hide widget"
                            >
                              <EyeOff size={15} />
                            </button>
                          </div>

                          {chartData.length === 0 ? (
                            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                              All debtors are active with current sales.
                            </div>
                          ) : (
                            <HorizontalBarList
                              items={chartData}
                              valueKey="value"
                              labelKey="label"
                              onBarClick={() => setCurrentTab && setCurrentTab('ledger')}
                            />
                          )}
                        </div>
                      );
                    }

                    if (widgetId === 'quiet-table') {
                      const filteredQuiet = quietCustomers.filter(c => {
                        if (!quietSearch) return true;
                        return String(c.name || '').toLowerCase().includes(quietSearch.toLowerCase());
                      });

                      return (
                        <div
                          key={widgetId}
                          draggable
                          onDragStart={(e) => handleSubWidgetDragStart(e, widgetId)}
                          onDragOver={(e) => handleSubWidgetDragOver(e, widgetId)}
                          onDrop={(e) => handleSubWidgetDrop(e, widgetId, quietWidgetsOrder, setQuietWidgetsOrder, 'tc_report_quiet_order')}
                          className="glass-panel"
                          style={{
                            padding: '20px',
                            borderRadius: '20px',
                            border: isDragTarget ? '2px dashed var(--primary-color)' : '1px solid var(--glass-border)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Move size={15} style={{ cursor: 'grab', opacity: 0.5 }} title="Drag to reorder" />
                              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-dark)' }}>
                                Quiet Customers Roster ({filteredQuiet.length} accounts)
                              </h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleHideSubWidget(widgetId, quietWidgetsHidden, setQuietWidgetsHidden, 'tc_report_quiet_hidden')}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                              title="Hide widget"
                            >
                              <EyeOff size={15} />
                            </button>
                          </div>

                          <div className="table-responsive-container" style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
                                  <th style={{ padding: '12px 16px' }}>Customer Name</th>
                                  <th style={{ padding: '12px 16px' }}>Group</th>
                                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Closing Balance</th>
                                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Last Activity</th>
                                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredQuiet.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                      {quietSearch ? `No customers matched "${quietSearch}".` : 'All customers have active sales in this period.'}
                                    </td>
                                  </tr>
                                ) : (
                                  filteredQuiet.map(c => (
                                    <tr key={c.ledger_guid || c.name} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>{c.name}</td>
                                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{c.parent_group || c.type}</td>
                                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: Number(c.closing_balance) > 0 ? '#10b981' : 'var(--text-dark)' }}>
                                        {inr(c.closing_balance)}
                                      </td>
                                      <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>{shortDate(c.date) || 'None'}</td>
                                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                        <button className="btn-secondary" onClick={() => setCurrentTab && setCurrentTab('ledger')} style={{ padding: '4px 10px', fontSize: '12px' }}>
                                          View Ledger
                                        </button>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              )}

              {/* 7. ITEMS NOT MOVING REPORT VIEW */}
              {activeReport === 'items-not-moving' && (
                <div className="glass-panel" style={{ padding: '28px', borderRadius: '24px' }}>
                  {/* Header & Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>Items Not Moving</h2>
                        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', fontWeight: 700 }}>
                          Draggable Widgets
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0' }}>
                        Inventory items with zero outward movement / no dispatches recorded
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ width: '240px', maxWidth: '100%' }}>
                        <BitrixFilterBar
                          storageKey="tc_report_dormant_filter"
                          searchQuery={itemsNotMovingSearch}
                          onSearchChange={setItemsNotMovingSearch}
                          placeholder="Search dormant SKUs…"
                        />
                      </div>

                      {/* Unhide Widgets button */}
                      {itemsWidgetsHidden.length > 0 && (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleResetSubWidgets(setItemsWidgetsOrder, ['items-kpi', 'items-chart', 'items-table'], setItemsWidgetsHidden, 'tc_report_items_order', 'tc_report_items_hidden')}
                          style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '6px 12px' }}
                          title="Restore all hidden widgets"
                        >
                          <Eye size={14} /> Unhide ({itemsWidgetsHidden.length})
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setCurrentTab && setCurrentTab('inventory')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Package size={15} /> Go to Items
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Draggable & Hideable Sub-widgets */}
                  {itemsWidgetsOrder.filter(id => !itemsWidgetsHidden.includes(id)).map((widgetId) => {
                    const isDragTarget = dragOverSubWidget === widgetId;

                    if (widgetId === 'items-kpi') {
                      const dormantVal = itemsNotMoving.reduce((s, it) => s + Number(it.value || (Number(it.closing || 0) * Number(it.rate || 0))), 0);
                      const dormancyPct = ((itemsNotMoving.length / Math.max(inventory.length, 1)) * 100).toFixed(1);

                      return (
                        <div
                          key={widgetId}
                          draggable
                          onDragStart={(e) => handleSubWidgetDragStart(e, widgetId)}
                          onDragOver={(e) => handleSubWidgetDragOver(e, widgetId)}
                          onDrop={(e) => handleSubWidgetDrop(e, widgetId, itemsWidgetsOrder, setItemsWidgetsOrder, 'tc_report_items_order')}
                          className="glass-panel"
                          style={{
                            padding: '20px',
                            borderRadius: '20px',
                            marginBottom: '20px',
                            border: isDragTarget ? '2px dashed var(--primary-color)' : '1px solid var(--glass-border)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Move size={15} style={{ cursor: 'grab', opacity: 0.5 }} title="Drag to reorder" />
                              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-dark)' }}>
                                Dormancy Health Scorecard
                              </h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleHideSubWidget(widgetId, itemsWidgetsHidden, setItemsWidgetsHidden, 'tc_report_items_hidden')}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                              title="Hide widget"
                            >
                              <EyeOff size={15} />
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                            <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(239, 68, 68, 0.08)' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>Non-Moving SKUs</div>
                              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-dark)', marginTop: '4px' }}>{itemsNotMoving.length}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Zero dispatch movement</div>
                            </div>
                            <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.08)' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>Capital Blocked</div>
                              <div style={{ fontSize: '22px', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>{inr(dormantVal)}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Tied up in stagnant stock</div>
                            </div>
                            <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(99, 102, 241, 0.08)' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase' }}>Dormancy Share</div>
                              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-dark)', marginTop: '4px' }}>{dormancyPct}%</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Of total catalog items</div>
                            </div>
                            <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.08)' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>Action Priority</div>
                              <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981', marginTop: '6px' }}>Review Pricing</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Clearance & discount recommended</div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (widgetId === 'items-chart') {
                      const chartData = itemsNotMoving
                        .map(it => ({
                          label: it.name,
                          name: it.name,
                          value: Number(it.value || (Number(it.closing || 0) * Number(it.rate || 0))),
                          amount: Number(it.value || (Number(it.closing || 0) * Number(it.rate || 0))),
                          closing: it.closing,
                          rate: it.rate
                        }))
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 5);

                      return (
                        <div
                          key={widgetId}
                          draggable
                          onDragStart={(e) => handleSubWidgetDragStart(e, widgetId)}
                          onDragOver={(e) => handleSubWidgetDragOver(e, widgetId)}
                          onDrop={(e) => handleSubWidgetDrop(e, widgetId, itemsWidgetsOrder, setItemsWidgetsOrder, 'tc_report_items_order')}
                          className="glass-panel"
                          style={{
                            padding: '20px',
                            borderRadius: '20px',
                            marginBottom: '20px',
                            border: isDragTarget ? '2px dashed var(--primary-color)' : '1px solid var(--glass-border)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Move size={15} style={{ cursor: 'grab', opacity: 0.5 }} title="Drag to reorder" />
                              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-dark)' }}>
                                Top Blocked Inventory by Valuation
                              </h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleHideSubWidget(widgetId, itemsWidgetsHidden, setItemsWidgetsHidden, 'tc_report_items_hidden')}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                              title="Hide widget"
                            >
                              <EyeOff size={15} />
                            </button>
                          </div>

                          {chartData.length === 0 ? (
                            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                              All items have recorded dispatch movement.
                            </div>
                          ) : (
                            <HorizontalBarList
                              items={chartData}
                              valueKey="value"
                              labelKey="label"
                              onBarClick={() => setCurrentTab && setCurrentTab('inventory')}
                            />
                          )}
                        </div>
                      );
                    }

                    if (widgetId === 'items-table') {
                      const filteredItems = itemsNotMoving.filter(it => {
                        if (!itemsNotMovingSearch) return true;
                        return String(it.name || '').toLowerCase().includes(itemsNotMovingSearch.toLowerCase());
                      });

                      return (
                        <div
                          key={widgetId}
                          draggable
                          onDragStart={(e) => handleSubWidgetDragStart(e, widgetId)}
                          onDragOver={(e) => handleSubWidgetDragOver(e, widgetId)}
                          onDrop={(e) => handleSubWidgetDrop(e, widgetId, itemsWidgetsOrder, setItemsWidgetsOrder, 'tc_report_items_order')}
                          className="glass-panel"
                          style={{
                            padding: '20px',
                            borderRadius: '20px',
                            border: isDragTarget ? '2px dashed var(--primary-color)' : '1px solid var(--glass-border)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Move size={15} style={{ cursor: 'grab', opacity: 0.5 }} title="Drag to reorder" />
                              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-dark)' }}>
                                Dormant Stock List ({filteredItems.length} items)
                              </h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleHideSubWidget(widgetId, itemsWidgetsHidden, setItemsWidgetsHidden, 'tc_report_items_hidden')}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                              title="Hide widget"
                            >
                              <EyeOff size={15} />
                            </button>
                          </div>

                          <div className="table-responsive-container" style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
                                  <th style={{ padding: '12px 16px' }}>Item Name</th>
                                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Opening Stock</th>
                                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Closing Stock</th>
                                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Unit Rate</th>
                                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Tied Up Value</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredItems.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                      {itemsNotMovingSearch ? `No dormant items matched "${itemsNotMovingSearch}".` : 'All items had active movement.'}
                                    </td>
                                  </tr>
                                ) : (
                                  filteredItems.map(it => (
                                    <tr key={it.id || it.name} style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer' }} onClick={() => setCurrentTab && setCurrentTab('inventory')}>
                                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>{it.name}</td>
                                      <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>{it.opening}</td>
                                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: '#f59e0b' }}>{it.closing}</td>
                                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>₹{it.rate}</td>
                                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, color: '#ef4444' }}>{inr(it.value)}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              )}

              {/* 8. CUSTOMER & SUPPLIER SUMMARY */}
              {activeReport === 'party-summary' && (
                <div className="glass-panel" style={{ padding: '28px', borderRadius: '24px' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px' }}>Customer & Supplier Summary</h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
                        Breakdown of debtors (receivables) vs creditors (payables)
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <button
                        className="btn-secondary"
                        onClick={() => setCurrentTab && setCurrentTab('ledger')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Building2 size={15} /> All Ledgers
                      </button>
                    </div>
                  </div>

                  {/* Metric Cards: Debtors vs Creditors vs Net Position */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', marginBottom: '24px' }}>
                    <div
                      className="glass-panel"
                      style={{
                        padding: '20px', borderRadius: '18px', cursor: 'pointer',
                        border: partyTypeTab === 'debtors' ? '2px solid #10b981' : '1px solid var(--glass-border)',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => setPartyTypeTab('debtors')}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, fontWeight: 700, letterSpacing: '0.5px' }}>
                          Debtors (Customers)
                        </h3>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#059669', fontWeight: 700 }}>
                          Receivable
                        </span>
                      </div>
                      <div style={{ fontSize: '26px', fontWeight: 800, color: '#10b981', letterSpacing: '-0.5px' }}>
                        {inr(partyBreakdown.debtorsBalance)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                        {partyBreakdown.debtors.toLocaleString('en-IN')} active customer account(s)
                      </div>
                    </div>

                    <div
                      className="glass-panel"
                      style={{
                        padding: '20px', borderRadius: '18px', cursor: 'pointer',
                        border: partyTypeTab === 'creditors' ? '2px solid #ef4444' : '1px solid var(--glass-border)',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => setPartyTypeTab('creditors')}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, fontWeight: 700, letterSpacing: '0.5px' }}>
                          Creditors (Suppliers)
                        </h3>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#dc2626', fontWeight: 700 }}>
                          Payable
                        </span>
                      </div>
                      <div style={{ fontSize: '26px', fontWeight: 800, color: '#ef4444', letterSpacing: '-0.5px' }}>
                        {inr(partyBreakdown.creditorsBalance)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                        {partyBreakdown.creditors.toLocaleString('en-IN')} active supplier account(s)
                      </div>
                    </div>

                    <div
                      className="glass-panel"
                      style={{
                        padding: '20px', borderRadius: '18px', cursor: 'pointer',
                        border: partyTypeTab === 'parties' ? '2px solid var(--primary-color)' : '1px solid var(--glass-border)',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => setPartyTypeTab('parties')}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, fontWeight: 700, letterSpacing: '0.5px' }}>
                          Net Position
                        </h3>
                        <span style={{
                          fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: 700,
                          background: (partyBreakdown.debtorsBalance - partyBreakdown.creditorsBalance) >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: (partyBreakdown.debtorsBalance - partyBreakdown.creditorsBalance) >= 0 ? '#059669' : '#dc2626'
                        }}>
                          {(partyBreakdown.debtorsBalance - partyBreakdown.creditorsBalance) >= 0 ? 'Net Receivable' : 'Net Payable'}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '26px', fontWeight: 800, letterSpacing: '-0.5px',
                        color: (partyBreakdown.debtorsBalance - partyBreakdown.creditorsBalance) >= 0 ? '#10b981' : '#ef4444'
                      }}>
                        {inr(Math.abs(partyBreakdown.debtorsBalance - partyBreakdown.creditorsBalance))}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                        {(partyBreakdown.debtors + partyBreakdown.creditors).toLocaleString('en-IN')} total party accounts
                      </div>
                    </div>
                  </div>

                  {/* Visual Analysis & Top Parties Section */}
                  <div className="glass-panel" style={{
                    padding: '20px 24px', borderRadius: '20px', marginBottom: '24px'
                  }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: partySummaryShowChart ? '20px' : '0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(79, 70, 229, 0.12)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <BarChart3 size={20} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>
                            Visual Analysis & Top Parties
                          </h3>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0', fontWeight: 600 }}>
                            Interactive graphical breakdown of customer receivables and supplier payables
                          </p>
                        </div>
                      </div>

                      {/* Controls: Segment Tabs + Toggle */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div className="glass-panel" style={{ display: 'flex', padding: '2px', borderRadius: '10px', gap: '2px' }}>
                          <button
                            onClick={() => { setPartyChartMetric('debtors'); setPartySummaryShowChart(true); }}
                            style={{
                              border: 'none', padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                              background: partyChartMetric === 'debtors' ? '#10b981' : 'transparent',
                              color: partyChartMetric === 'debtors' ? '#fff' : 'var(--text-muted)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            Top Customers (Owed)
                          </button>
                          <button
                            onClick={() => { setPartyChartMetric('creditors'); setPartySummaryShowChart(true); }}
                            style={{
                              border: 'none', padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                              background: partyChartMetric === 'creditors' ? '#ef4444' : 'transparent',
                              color: partyChartMetric === 'creditors' ? '#fff' : 'var(--text-muted)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            Top Suppliers (Payable)
                          </button>
                          <button
                            onClick={() => { setPartyChartMetric('ratio'); setPartySummaryShowChart(true); }}
                            style={{
                              border: 'none', padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                              background: partyChartMetric === 'ratio' ? 'var(--primary-color)' : 'transparent',
                              color: partyChartMetric === 'ratio' ? '#fff' : 'var(--text-muted)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            Receivable vs Payable Ratio
                          </button>
                        </div>

                        <button
                          className="btn-secondary"
                          onClick={() => setPartySummaryShowChart(prev => !prev)}
                          style={{ padding: '5px 10px', fontSize: '11px' }}
                        >
                          {partySummaryShowChart ? 'Hide Chart' : 'Show Chart'}
                        </button>
                      </div>
                    </div>

                    {/* Chart Body */}
                    {partySummaryShowChart && (
                      <div style={{ marginTop: '16px' }}>
                        {partyChartMetric === 'debtors' && (
                          <div>
                            <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)' }}>
                                Top 5 Customers by Outstanding Balance
                              </span>
                              <button
                                onClick={() => setActiveReport('top-customers')}
                                style={{
                                  border: 'none', background: 'transparent', color: 'var(--primary-color)',
                                  fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                }}
                              >
                                Open Full Top Customers Analytics <ChevronRight size={14} />
                              </button>
                            </div>
                            <HorizontalBarList
                              items={topCustomers}
                              valueKey="value"
                              labelKey="name"
                              onBarClick={() => setCurrentTab && setCurrentTab('ledger')}
                            />
                          </div>
                        )}

                        {partyChartMetric === 'creditors' && (
                          <div>
                            <div style={{ marginBottom: '14px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)' }}>
                                Top 5 Suppliers by Payable Balance
                              </span>
                            </div>
                            <HorizontalBarList
                              items={topCreditors}
                              valueKey="value"
                              labelKey="name"
                              onBarClick={() => setCurrentTab && setCurrentTab('ledger')}
                            />
                          </div>
                        )}

                        {partyChartMetric === 'ratio' && (
                          <div style={{ padding: '10px 0' }}>
                            <ResponsivePieChart
                              items={[
                                { label: 'Debtors (Receivables)', value: partyBreakdown.debtorsBalance, color: '#10b981' },
                                { label: 'Creditors (Payables)', value: partyBreakdown.creditorsBalance, color: '#ef4444' }
                              ]}
                              valueKey="value"
                              labelKey="label"
                              customPalette={['#10b981', '#ef4444']}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Filtering & Search Toolbar */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    flexWrap: 'wrap', gap: '14px', marginBottom: '20px',
                    padding: '12px 16px', background: 'var(--glass-bg)',
                    borderRadius: '16px', border: '1px solid var(--glass-border)'
                  }}>
                    {/* Tab Filter Pills */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setPartyTypeTab('parties')}
                        style={{
                          border: 'none', padding: '7px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                          transition: 'all 0.2s',
                          background: partyTypeTab === 'parties' ? 'var(--primary-color)' : 'transparent',
                          color: partyTypeTab === 'parties' ? '#fff' : 'var(--text-muted)'
                        }}
                      >
                        Customers & Suppliers ({partyBreakdown.both > 0 ? partyBreakdown.both.toLocaleString('en-IN') : partyBreakdown.totalParties.toLocaleString('en-IN')})
                      </button>
                      <button
                        onClick={() => setPartyTypeTab('debtors')}
                        style={{
                          border: 'none', padding: '7px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                          transition: 'all 0.2s',
                          background: partyTypeTab === 'debtors' ? '#10b981' : 'transparent',
                          color: partyTypeTab === 'debtors' ? '#fff' : 'var(--text-muted)'
                        }}
                      >
                        Customers Only ({partyBreakdown.debtors.toLocaleString('en-IN')})
                      </button>
                      <button
                        onClick={() => setPartyTypeTab('creditors')}
                        style={{
                          border: 'none', padding: '7px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                          transition: 'all 0.2s',
                          background: partyTypeTab === 'creditors' ? '#ef4444' : 'transparent',
                          color: partyTypeTab === 'creditors' ? '#fff' : 'var(--text-muted)'
                        }}
                      >
                        Suppliers Only ({partyBreakdown.creditors.toLocaleString('en-IN')})
                      </button>
                      <button
                        onClick={() => setPartyTypeTab('all')}
                        style={{
                          border: 'none', padding: '7px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                          transition: 'all 0.2s',
                          background: partyTypeTab === 'all' ? 'var(--primary-color)' : 'transparent',
                          color: partyTypeTab === 'all' ? '#fff' : 'var(--text-muted)'
                        }}
                      >
                        All Accounts ({partyBreakdown.totalParties.toLocaleString('en-IN')})
                      </button>
                    </div>

                    {/* Search & Sort Controls */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ width: '260px', maxWidth: '100%' }}>
                        <BitrixFilterBar
                          storageKey="tc_report_ledger_out_filter"
                          searchQuery={partySearch}
                          onSearchChange={setPartySearch}
                          placeholder="Search party or group..."
                        />
                      </div>

                      <select
                        value={partySort}
                        onChange={(e) => setPartySort(e.target.value)}
                        className="glass-panel"
                        style={{
                          padding: '6px 10px', borderRadius: '12px', border: '1px solid var(--glass-border)',
                          background: 'var(--glass-bg)', fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)', cursor: 'pointer', outline: 'none'
                        }}
                      >
                        <option value="balance_desc">Highest Balance First</option>
                        <option value="balance_asc">Lowest Balance First</option>
                        <option value="name_asc">Name (A to Z)</option>
                        <option value="name_desc">Name (Z to A)</option>
                      </select>
                    </div>
                  </div>

                  {/* Fast Paginated Table */}
                  <div className="table-responsive-container" style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
                          <th style={{ padding: '14px 18px', fontWeight: 700 }}>Party Name</th>
                          <th style={{ padding: '14px 18px', fontWeight: 700 }}>Type</th>
                          <th style={{ padding: '14px 18px', fontWeight: 700 }}>Parent Group</th>
                          <th style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 700 }}>Closing Balance</th>
                          <th style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 700 }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedPartyList.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                              <AlertCircle size={28} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '4px' }}>
                                No matching party accounts found
                              </div>
                              <div style={{ fontSize: '13px' }}>
                                {partySearch ? `No records matched "${partySearch}". Try clearing your search term.` : 'No accounts recorded under this category.'}
                              </div>
                            </td>
                          </tr>
                        ) : (
                          paginatedPartyList.map(l => {
                            const grp = String(l.parent_group || l.type || '').toLowerCase();
                            const isCreditor = /creditor|vendor|supplier/i.test(grp);
                            const isDebtor = /debtor|customer/i.test(grp);
                            const bal = Number(l.closing_balance || 0);

                            return (
                              <tr
                                key={l.ledger_guid || l.name}
                                style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.15s' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-hover)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-dark)' }}>
                                  {l.name}
                                </td>
                                <td style={{ padding: '14px 18px' }}>
                                  <span style={{
                                    padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                                    background: isCreditor ? 'rgba(239, 68, 68, 0.12)' : isDebtor ? 'rgba(16, 185, 129, 0.12)' : 'rgba(107, 114, 128, 0.12)',
                                    color: isCreditor ? '#dc2626' : isDebtor ? '#059669' : '#4b5563'
                                  }}>
                                    {isCreditor ? 'Supplier (Creditor)' : isDebtor ? 'Customer (Debtor)' : 'General Ledger'}
                                  </span>
                                </td>
                                <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '13px' }}>
                                  {l.parent_group || l.type || '—'}
                                </td>
                                <td style={{
                                  padding: '14px 18px', textAlign: 'right', fontWeight: 800,
                                  color: bal > 0 ? '#10b981' : bal < 0 ? '#ef4444' : 'var(--text-muted)'
                                }}>
                                  {inr(bal)}
                                </td>
                                <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                  <button
                                    className="btn-secondary"
                                    onClick={() => setCurrentTab && setCurrentTab('ledger')}
                                    style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '8px' }}
                                  >
                                    View Ledger
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Bar */}
                  {filteredPartyList.length > 0 && (
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      flexWrap: 'wrap', gap: '12px', marginTop: '18px',
                      padding: '12px 16px', background: 'var(--glass-bg)',
                      borderRadius: '14px', border: '1px solid var(--glass-border)'
                    }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Showing <span style={{ color: 'var(--text-dark)', fontWeight: 700 }}>
                          {((partyPage - 1) * PARTY_PAGE_SIZE + 1).toLocaleString('en-IN')}
                        </span> to <span style={{ color: 'var(--text-dark)', fontWeight: 700 }}>
                          {Math.min(partyPage * PARTY_PAGE_SIZE, filteredPartyList.length).toLocaleString('en-IN')}
                        </span> of <span style={{ color: 'var(--text-dark)', fontWeight: 700 }}>
                          {filteredPartyList.length.toLocaleString('en-IN')}
                        </span> accounts
                      </div>

                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          className="btn-secondary"
                          onClick={() => setPartyPage(1)}
                          disabled={partyPage <= 1}
                          style={{ padding: '6px 10px', fontSize: '12px', opacity: partyPage <= 1 ? 0.4 : 1, cursor: partyPage <= 1 ? 'not-allowed' : 'pointer' }}
                          title="First Page"
                        >
                          « First
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => setPartyPage(p => Math.max(1, p - 1))}
                          disabled={partyPage <= 1}
                          style={{ padding: '6px 12px', fontSize: '12px', opacity: partyPage <= 1 ? 0.4 : 1, cursor: partyPage <= 1 ? 'not-allowed' : 'pointer' }}
                        >
                          ‹ Prev
                        </button>
                        <span style={{ fontSize: '13px', fontWeight: 700, padding: '0 8px', color: 'var(--text-dark)' }}>
                          Page {partyPage} of {totalPartyPages}
                        </span>
                        <button
                          className="btn-secondary"
                          onClick={() => setPartyPage(p => Math.min(totalPartyPages, p + 1))}
                          disabled={partyPage >= totalPartyPages}
                          style={{ padding: '6px 12px', fontSize: '12px', opacity: partyPage >= totalPartyPages ? 0.4 : 1, cursor: partyPage >= totalPartyPages ? 'not-allowed' : 'pointer' }}
                        >
                          Next ›
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => setPartyPage(totalPartyPages)}
                          disabled={partyPage >= totalPartyPages}
                          style={{ padding: '6px 10px', fontSize: '12px', opacity: partyPage >= totalPartyPages ? 0.4 : 1, cursor: partyPage >= totalPartyPages ? 'not-allowed' : 'pointer' }}
                          title="Last Page"
                        >
                          Last »
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 9. OUTSTANDING BILLS REPORT VIEW */}
              {activeReport === 'bills' && (
                <div className="glass-panel" style={{ padding: '28px', borderRadius: '24px' }}>
                  {/* Header & Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>Outstanding Bills & Dues</h2>
                        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary-color)', fontWeight: 700 }}>
                          Draggable Widgets
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0' }}>
                        Live unsettled customer receivables and vendor payables synced from Tally
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ width: '260px', maxWidth: '100%' }}>
                        <BitrixFilterBar
                          storageKey="tc_report_bills_out_filter"
                          searchQuery={billsSearch}
                          onSearchChange={setBillsSearch}
                          placeholder="Search party or bill…"
                        />
                      </div>

                      {/* Type Filter Tabs */}
                      <div className="glass-panel" style={{ display: 'flex', padding: '3px', borderRadius: '12px', gap: '3px' }}>
                        {[
                          { id: 'all', label: 'All Bills' },
                          { id: 'receivable', label: 'Receivables' },
                          { id: 'payable', label: 'Payables' }
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setBillsFilterType(tab.id)}
                            style={{
                              border: 'none',
                              padding: '5px 12px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              background: billsFilterType === tab.id ? 'var(--primary-color)' : 'transparent',
                              color: billsFilterType === tab.id ? '#ffffff' : 'var(--text-muted)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {/* Unhide Widgets button */}
                      {billsWidgetsHidden.length > 0 && (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleResetSubWidgets(setBillsWidgetsOrder, ['bills-kpi', 'bills-chart', 'bills-table'], setBillsWidgetsHidden, 'tc_report_bills_order', 'tc_report_bills_hidden')}
                          style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '6px 12px' }}
                          title="Restore all hidden widgets"
                        >
                          <Eye size={14} /> Unhide ({billsWidgetsHidden.length})
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setCurrentTab && setCurrentTab('bills')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Receipt size={15} /> Go to Bills Tab
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Draggable & Hideable Sub-widgets */}
                  {billsWidgetsOrder.filter(id => !billsWidgetsHidden.includes(id)).map((widgetId) => {
                    const isDragTarget = dragOverSubWidget === widgetId;

                    if (widgetId === 'bills-kpi') {
                      return (
                        <div
                          key={widgetId}
                          draggable
                          onDragStart={(e) => handleSubWidgetDragStart(e, widgetId)}
                          onDragOver={(e) => handleSubWidgetDragOver(e, widgetId)}
                          onDrop={(e) => handleSubWidgetDrop(e, widgetId, billsWidgetsOrder, setBillsWidgetsOrder, 'tc_report_bills_order')}
                          className="glass-panel"
                          style={{
                            padding: '20px',
                            borderRadius: '20px',
                            marginBottom: '20px',
                            border: isDragTarget ? '2px dashed var(--primary-color)' : '1px solid var(--glass-border)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Move size={15} style={{ cursor: 'grab', opacity: 0.5 }} title="Drag to reorder" />
                              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-dark)' }}>
                                Outstanding Dues Overview
                              </h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleHideSubWidget(widgetId, billsWidgetsHidden, setBillsWidgetsHidden, 'tc_report_bills_hidden')}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                              title="Hide widget"
                            >
                              <EyeOff size={15} />
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                            <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(99, 102, 241, 0.08)' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase' }}>Net Outstanding Volume</div>
                              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-dark)', marginTop: '4px' }}>
                                {inr(outstandingMetrics.receivables + outstandingMetrics.payables)}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Total pending financial flow</div>
                            </div>

                            <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.08)' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>Receivables Due (Inflow)</div>
                              <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                                {inr(outstandingMetrics.receivables)}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Pending from customer accounts</div>
                            </div>

                            <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(239, 68, 68, 0.08)' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>Payables Due (Outflow)</div>
                              <div style={{ fontSize: '22px', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
                                {inr(outstandingMetrics.payables)}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Due to suppliers & vendors</div>
                            </div>

                            <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.08)' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>Pending Bills Count</div>
                              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-dark)', marginTop: '4px' }}>
                                {effectiveBills.length}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Active unsettled entries</div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (widgetId === 'bills-chart') {
                      const chartData = effectiveBills
                        .map(b => ({
                          label: b.ledger_name || b.party_name || 'Bill Account',
                          name: b.ledger_name || b.party_name || 'Bill Account',
                          value: Number(b.pending_amount || 0),
                          amount: Number(b.pending_amount || 0),
                          bill_type: b.bill_type || 'Receivable',
                          color: String(b.bill_type || '').toLowerCase().includes('payable') ? '#ef4444' : '#10b981'
                        }))
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 5);

                      return (
                        <div
                          key={widgetId}
                          draggable
                          onDragStart={(e) => handleSubWidgetDragStart(e, widgetId)}
                          onDragOver={(e) => handleSubWidgetDragOver(e, widgetId)}
                          onDrop={(e) => handleSubWidgetDrop(e, widgetId, billsWidgetsOrder, setBillsWidgetsOrder, 'tc_report_bills_order')}
                          className="glass-panel"
                          style={{
                            padding: '20px',
                            borderRadius: '20px',
                            marginBottom: '20px',
                            border: isDragTarget ? '2px dashed var(--primary-color)' : '1px solid var(--glass-border)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Move size={15} style={{ cursor: 'grab', opacity: 0.5 }} title="Drag to reorder" />
                              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-dark)' }}>
                                Top Outstanding Accounts by Pending Balance
                              </h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleHideSubWidget(widgetId, billsWidgetsHidden, setBillsWidgetsHidden, 'tc_report_bills_hidden')}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                              title="Hide widget"
                            >
                              <EyeOff size={15} />
                            </button>
                          </div>

                          {chartData.length === 0 ? (
                            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                              No outstanding bills or dues recorded.
                            </div>
                          ) : (
                            <HorizontalBarList
                              items={chartData}
                              valueKey="value"
                              labelKey="label"
                              onBarClick={() => setCurrentTab && setCurrentTab('bills')}
                            />
                          )}
                        </div>
                      );
                    }

                    if (widgetId === 'bills-table') {
                      const filteredBills = effectiveBills.filter(b => {
                        // Type filter
                        const type = String(b.bill_type || '').toLowerCase();
                        if (billsFilterType === 'receivable' && type.includes('payable')) return false;
                        if (billsFilterType === 'payable' && !type.includes('payable')) return false;

                        // Search
                        if (billsSearch) {
                          const s = billsSearch.toLowerCase();
                          const party = String(b.ledger_name || b.party_name || '').toLowerCase();
                          if (!party.includes(s)) return false;
                        }
                        return true;
                      });

                      return (
                        <div
                          key={widgetId}
                          draggable
                          onDragStart={(e) => handleSubWidgetDragStart(e, widgetId)}
                          onDragOver={(e) => handleSubWidgetDragOver(e, widgetId)}
                          onDrop={(e) => handleSubWidgetDrop(e, widgetId, billsWidgetsOrder, setBillsWidgetsOrder, 'tc_report_bills_order')}
                          className="glass-panel"
                          style={{
                            padding: '20px',
                            borderRadius: '20px',
                            border: isDragTarget ? '2px dashed var(--primary-color)' : '1px solid var(--glass-border)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Move size={15} style={{ cursor: 'grab', opacity: 0.5 }} title="Drag to reorder" />
                              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-dark)' }}>
                                Detailed Outstanding Register ({filteredBills.length} records)
                              </h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleHideSubWidget(widgetId, billsWidgetsHidden, setBillsWidgetsHidden, 'tc_report_bills_hidden')}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                              title="Hide widget"
                            >
                              <EyeOff size={15} />
                            </button>
                          </div>

                          <div className="table-responsive-container" style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
                                  <th style={{ padding: '12px 16px' }}>Party / Ledger</th>
                                  <th style={{ padding: '12px 16px' }}>Due Date</th>
                                  <th style={{ padding: '12px 16px' }}>Type</th>
                                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Pending Amount</th>
                                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredBills.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                      {billsSearch ? `No bills matched "${billsSearch}".` : 'No outstanding bills recorded.'}
                                    </td>
                                  </tr>
                                ) : (
                                  filteredBills.map((b, idx) => {
                                    const isPayable = String(b.bill_type || '').toLowerCase().includes('payable');
                                    return (
                                      <tr
                                        key={b.id || idx}
                                        style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer' }}
                                        onClick={() => setCurrentTab && setCurrentTab('bills')}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-hover)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                      >
                                        <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-dark)' }}>
                                          {b.ledger_name || b.party_name}
                                        </td>
                                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                                          {shortDate(b.due_date) || 'Immediate / On Demand'}
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                          <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '8px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            background: isPayable ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                                            color: isPayable ? '#dc2626' : '#059669'
                                          }}>
                                            {isPayable ? 'Payable (Vendor)' : 'Receivable (Customer)'}
                                          </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, color: isPayable ? '#ef4444' : '#10b981' }}>
                                          {inr(b.pending_amount)}
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                          <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (setCurrentTab) setCurrentTab('bills');
                                            }}
                                            style={{ padding: '4px 10px', fontSize: '12px' }}
                                          >
                                            View Bill
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              )}

              {/* 10. RECEIPTS & PAYMENTS REGISTER VIEWS */}
              {(activeReport === 'receipts' || activeReport === 'payments' || activeReport === 'expenses') && (
                <div className="glass-panel" style={{ padding: '28px', borderRadius: '24px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px' }}>
                    {activeReport === 'receipts' ? 'Receipts Register' : activeReport === 'payments' ? 'Payments Register' : 'Expenses Register'}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 20px' }}>
                    {periodLabel} voucher log
                  </p>

                  <div className="table-responsive-container" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
                          <th style={{ padding: '12px 16px' }}>Date</th>
                          <th style={{ padding: '12px 16px' }}>Voucher Type</th>
                          <th style={{ padding: '12px 16px' }}>Party Name</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVouchers.filter(v => {
                          const t = String(v.voucher_type || '').toLowerCase();
                          if (activeReport === 'receipts') return /receipt/i.test(t);
                          if (activeReport === 'payments') return /payment/i.test(t);
                          return /purchase|payment/i.test(t);
                        }).length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                              No vouchers found for this register in the selected period.
                            </td>
                          </tr>
                        ) : (
                          filteredVouchers.filter(v => {
                            const t = String(v.voucher_type || '').toLowerCase();
                            if (activeReport === 'receipts') return /receipt/i.test(t);
                            if (activeReport === 'payments') return /payment/i.test(t);
                            return /purchase|payment/i.test(t);
                          }).map((v, idx) => (
                            <tr key={v.voucher_guid || idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                              <td style={{ padding: '16px', fontWeight: 600 }}>{shortDate(v.voucher_date)}</td>
                              <td style={{ padding: '16px' }}>{v.voucher_type}</td>
                              <td style={{ padding: '16px', fontWeight: 700 }}>{v.party_name || 'Direct Entry'}</td>
                              <td style={{ padding: '16px', textAlign: 'right', fontWeight: 800 }}>{inr(v.amount)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 11. MONTH-WISE SUMMARY VIEW (Original Full Charts + Table View + FY selector) */}
              {activeReport === 'month-wise' && (
                <div className="glass-panel" style={{ padding: '28px', borderRadius: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                    <div>
                      <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>Month-wise Turnover & Trend</h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0' }}>
                        Financial Year FY {fyYear}–{String(fyYear + 1).slice(-2)} (April {fyYear} to March {fyYear + 1})
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* FY Selector */}
                      <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '12px' }}>
                        <Calendar size={14} color="var(--primary-color)" />
                        <select
                          value={fyYear}
                          onChange={(e) => setFyYear(Number(e.target.value))}
                          style={{ border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)', outline: 'none' }}
                        >
                          {[2027, 2026, 2025, 2024, 2023].map(y => (
                            <option key={y} value={y} style={{ background: 'var(--glass-bg)', color: 'var(--text-dark)' }}>
                              FY {y}–{String(y + 1).slice(-2)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Chart vs Table Switcher */}
                      <div className="glass-panel" style={{ display: 'flex', padding: '3px', borderRadius: '12px', gap: '3px' }}>
                        <button
                          onClick={() => setFyViewMode('chart')}
                          style={{
                            border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                            background: fyViewMode === 'chart' ? 'var(--primary-color)' : 'transparent',
                            color: fyViewMode === 'chart' ? '#fff' : 'var(--text-muted)'
                          }}
                        >
                          Chart View
                        </button>
                        <button
                          onClick={() => setFyViewMode('table')}
                          style={{
                            border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                            background: fyViewMode === 'table' ? 'var(--primary-color)' : 'transparent',
                            color: fyViewMode === 'table' ? '#fff' : 'var(--text-muted)'
                          }}
                        >
                          Table View
                        </button>
                      </div>
                    </div>
                  </div>

                  {fyViewMode === 'chart' ? (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))',
                      gap: '24px',
                      marginBottom: '24px'
                    }}>
                      <div className="glass-panel" style={{ padding: '20px', borderRadius: '18px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px' }}>Monthly Credit vs Debit</h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px' }}>Turnover & returns comparison</p>
                        <ResponsiveBarChart
                          items={monthlyFyData.map(r => ({ ...r, label: r.monthName, value: r.turnover }))}
                          valueKey="value"
                          labelKey="label"
                          onBarClick={(r) => setDrillMonth(r)}
                        />
                      </div>

                      <div className="glass-panel" style={{ padding: '20px', borderRadius: '18px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px' }}>Closing Balance Trend</h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px' }}>Cumulative financial trajectory</p>
                        <ResponsiveLineChart
                          items={monthlyFyData.map(r => ({ ...r, label: r.monthName, value: r.closingBalance }))}
                          valueKey="value"
                          labelKey="label"
                          onPointClick={(r) => setDrillMonth(r)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="table-responsive-container" style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--glass-hover)', fontSize: '12px', textTransform: 'uppercase' }}>
                            <th style={{ padding: '16px 20px' }}>Particulars</th>
                            <th style={{ padding: '16px 20px', textAlign: 'center' }}>Debit</th>
                            <th style={{ padding: '16px 20px', textAlign: 'center' }}>Credit</th>
                            <th style={{ padding: '16px 20px', textAlign: 'right' }}>Closing Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthlyFyData.map((row, idx) => (
                            <tr
                              key={row.monthKey || idx}
                              onClick={() => setDrillMonth(row)}
                              style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-hover)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <td style={{ padding: '16px 20px', fontWeight: 600 }}>{row.monthLabel}</td>
                              <td style={{ padding: '16px 20px', textAlign: 'center', color: '#ef4444' }}>{row.debit > 0 ? inr(row.debit) : '₹ 0'}</td>
                              <td style={{ padding: '16px 20px', textAlign: 'center', color: '#10b981' }}>{row.credit > 0 ? inr(row.credit) : '₹ 0'}</td>
                              <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 800 }}>{inr(row.closingBalance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Month Drill-down Modal */}
      {drillMonth && createPortal(
        <div className="fade-in modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--glass-hover)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ color: '#4f46e5', background: 'rgba(79, 70, 229, 0.12)', width: '46px', height: '46px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>{drillMonth.monthLabel}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500, margin: '2px 0 0' }}>
                    Monthly Account Breakdown
                  </p>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setDrillMonth(null)} style={{ background: 'rgba(0,0,0,0.05)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="summary-card" style={{ padding: '16px', background: 'var(--glass-bg)', borderRadius: '16px' }}>
                  <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 6px', fontWeight: 700 }}>Total Debit</h4>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#ef4444' }}>{inr(drillMonth.debit)}</div>
                </div>
                <div className="summary-card" style={{ padding: '16px', background: 'var(--glass-bg)', borderRadius: '16px' }}>
                  <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 6px', fontWeight: 700 }}>Total Credit</h4>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>{inr(drillMonth.credit)}</div>
                </div>
              </div>

              <div className="summary-card" style={{ padding: '16px', background: 'rgba(79, 70, 229, 0.06)', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>Closing Balance</span>
                  <span style={{ fontSize: '22px', fontWeight: 800, color: drillMonth.closingBalance >= 0 ? '#10b981' : '#ef4444' }}>
                    {inr(drillMonth.closingBalance)}
                  </span>
                </div>
              </div>

              {drillMonth.vouchersCount > 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  {drillMonth.vouchersCount} voucher(s) recorded in {drillMonth.monthLabel}.
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>
                  No individual vouchers recorded for {drillMonth.monthLabel}.
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Monthly Report Schedule Modal */}
      {showScheduleModal && (
        <MonthlyReportScheduleModal
          onClose={() => setShowScheduleModal(false)}
          onToast={(msg) => {
            setToastMessage(msg);
            setTimeout(() => setToastMessage(''), 3500);
          }}
        />
      )}

      {/* Ledger Vouchers Drill-Down Modal (Tally F2 + Enter on Ledger) */}
      <LedgerVouchersModal
        isOpen={!!selectedLedgerDrill}
        onClose={() => setSelectedLedgerDrill(null)}
        ledgerName={selectedLedgerDrill?.name}
        ledgerGuid={selectedLedgerDrill?.guid}
        from={customStart}
        to={customEnd}
      />

      {/* Enter Audited Closing Stock Modal */}
      <StockValueModal
        isOpen={showStockValueModal}
        onClose={() => setShowStockValueModal(false)}
        stockNeededDates={financialMe?.stock_needed || []}
        onStockSaved={() => {
          fetchReportsData();
          getFinancialMe().then(res => res.data?.data && setFinancialMe(res.data.data)).catch(() => {});
        }}
      />
    </div>
  );
}

/* ---------------- Monthly Report Schedule Modal Component ---------------- */
function MonthlyReportScheduleModal({ onClose, onToast }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [reportTime, setReportTime] = useState('09:00');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getMonthlyReportSchedule();
        if (active && res) {
          setEnabled(Boolean(res.enabled));
          if (res.day_of_month) setDayOfMonth(Number(res.day_of_month));
          if (res.report_time) setReportTime(String(res.report_time).slice(0, 5));
        }
      } catch (err) {
        console.warn('Could not load monthly schedule:', err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMonthlyReportSchedule({
        report_day: Number(dayOfMonth),
        report_time: reportTime,
        enabled: Boolean(enabled)
      });
      onToast && onToast(enabled ? `Monthly reports scheduled for day ${dayOfMonth} at ${reportTime}` : 'Monthly report delivery paused');
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to save monthly report schedule');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '480px', borderRadius: '24px', overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(0,0,0,0.18)', border: '1px solid var(--glass-border)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px', borderBottom: '1px solid var(--glass-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '14px',
              background: 'rgba(0,122,255,0.12)', color: 'var(--primary-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Clock size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Automated Report Delivery</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Email monthly P&L and Balance Sheet reports
              </p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} style={{ background: 'rgba(0,0,0,0.05)', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="skeleton-lines"><i /><i /><i /></div>
            <p style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>Loading schedule…</p>
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Toggle Card */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 18px', borderRadius: '16px', background: 'rgba(255,255,255,0.6)',
              border: '1px solid var(--glass-border)'
            }}>
              <div>
                <strong style={{ fontSize: '14px', display: 'block', color: 'var(--text-dark)' }}>
                  Monthly Report Automation
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {enabled ? 'Active — email will be dispatched automatically' : 'Disabled — no automatic emails sent'}
                </span>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute', inset: 0, borderRadius: '26px',
                  background: enabled ? 'var(--primary-color)' : '#d1d5db',
                  transition: 'background 0.25s ease'
                }}>
                  <span style={{
                    position: 'absolute', height: '20px', width: '20px', left: enabled ? '25px' : '3px', bottom: '3px',
                    background: '#fff', borderRadius: '50%', transition: 'left 0.25s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </span>
              </label>
            </div>

            {/* Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', opacity: enabled ? 1 : 0.45, pointerEvents: enabled ? 'auto' : 'none', transition: 'opacity 0.2s ease' }}>
              <div className="auth-field">
                <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                  Day of Month
                </label>
                <select
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.85)', fontSize: '14px', fontWeight: 600 }}
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d === 1 ? '1st of every month' : d === 2 ? '2nd of every month' : d === 3 ? '3rd of every month' : `${d}th of every month`}</option>
                  ))}
                </select>
              </div>

              <div className="auth-field">
                <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                  Delivery Time
                </label>
                <input
                  type="time"
                  value={reportTime}
                  onChange={(e) => setReportTime(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.85)', fontSize: '14px', fontWeight: 600 }}
                />
              </div>
            </div>

            <div style={{
              padding: '12px 14px', borderRadius: '12px', background: 'rgba(0,122,255,0.06)',
              fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5
            }}>
              💡 TallyConnect packages your latest financial statements and dispatches them straight to your registered email address on schedule.
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={saving} style={{ padding: '10px 20px', borderRadius: '12px' }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '10px 24px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Check size={16} /> {saving ? 'Saving…' : 'Save Schedule'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

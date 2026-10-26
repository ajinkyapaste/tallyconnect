import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Download, FileText, ChevronDown, Eye, X, RotateCcw, Grid, CheckCircle2,
  Package, Landmark, Receipt, TrendingUp, BarChart3, Layers, Search, ShoppingCart,
  Building2, User, Clock
} from 'lucide-react';

/* ------------------------------------------------------------------
   Reusable touch-hold long press handler for mobile/touch devices.
   Triggers callback on 1.3s (1300ms) hold without scrolling, with haptic feedback.
   ------------------------------------------------------------------ */
export const createHoldTouchHandler = (onTrigger, duration = 1300) => {
  let timer = null;
  let startX = 0;
  let startY = 0;
  let triggered = false;

  const onTouchStart = (e) => {
    triggered = false;
    if (e.touches && e.touches[0]) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }
    timer = setTimeout(() => {
      triggered = true;
      try { navigator.vibrate?.(60); } catch { }
      onTrigger({ x: startX, y: startY, nativeEvent: e });
    }, duration);
  };

  const onTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      const dx = Math.abs(e.touches[0].clientX - startX);
      const dy = Math.abs(e.touches[0].clientY - startY);
      if (dx > 12 || dy > 12) {
        clearTimeout(timer);
      }
    }
  };

  const onTouchEnd = (e) => {
    clearTimeout(timer);
    if (triggered) {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation?.();
    }
  };

  const onTouchCancel = () => {
    clearTimeout(timer);
  };

  return { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel };
};

/* ------------------------------------------------------------------
   Unified Export dropdown button providing both CSV and PDF options.
   Replaces separate Export CSV & Export PDF buttons across all views.
   ------------------------------------------------------------------ */
export const ExportDropdown = ({ onExportCSV, onExportPDF, label = 'Export', align = 'right' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) {
      document.addEventListener('mousedown', handleOutside);
      document.addEventListener('touchstart', handleOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [open]);

  return (
    <div className="export-dropdown-wrapper" ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className="btn-secondary export-trigger-btn"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          height: '36px',
          padding: '0 14px',
          fontSize: '13px',
          fontWeight: 650,
          borderRadius: '10px',
          cursor: 'pointer',
          background: 'var(--glass-bg, rgba(255, 255, 255, 0.75))',
          border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.8))',
          color: 'var(--text-dark, #0f172a)',
          transition: 'all 0.15s ease'
        }}
        title="Export data (CSV or PDF)"
        aria-expanded={open}
      >
        <Download size={15} />
        <span>{label}</span>
        <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {open && (
        <div
          className="export-dropdown-menu glass-panel fade-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            [align === 'left' ? 'left' : 'right']: 0,
            zIndex: 99999,
            minWidth: '160px',
            padding: '6px',
            borderRadius: '14px',
            background: 'var(--dropdown-bg, rgba(255, 255, 255, 0.97))',
            backdropFilter: 'blur(40px) saturate(220%)',
            WebkitBackdropFilter: 'blur(40px) saturate(220%)',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.22), 0 4px 14px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px'
          }}
        >
          {onExportCSV && (
            <button
              type="button"
              className="export-menu-item"
              onClick={() => {
                setOpen(false);
                onExportCSV();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 12px',
                border: 'none',
                background: 'transparent',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-dark)',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'background 0.15s ease'
              }}
            >
              <Download size={14} style={{ color: 'var(--primary-color)' }} />
              <span>Export CSV</span>
            </button>
          )}

          {onExportPDF && (
            <button
              type="button"
              className="export-menu-item"
              onClick={() => {
                setOpen(false);
                if (onExportPDF) onExportPDF();
                else window.print();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 12px',
                border: 'none',
                background: 'transparent',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-dark)',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'background 0.15s ease'
              }}
            >
              <FileText size={14} style={{ color: '#ef4444' }} />
              <span>Export PDF</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------
   Standardized Schedule Button
   Consistent 36px height, spacing, and styling to pair with ExportDropdown
   ------------------------------------------------------------------ */
export const ScheduleButton = ({ onClick, label = 'Schedule', title = 'Schedule Automated Report Emails', style = {} }) => {
  return (
    <button
      type="button"
      className="btn-secondary schedule-trigger-btn"
      onClick={onClick}
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        height: '36px',
        padding: '0 14px',
        fontSize: '13px',
        fontWeight: 650,
        borderRadius: '10px',
        cursor: 'pointer',
        background: 'var(--glass-bg, rgba(255, 255, 255, 0.75))',
        border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.8))',
        color: 'var(--text-dark, #0f172a)',
        transition: 'all 0.15s ease',
        ...style
      }}
    >
      <Clock size={15} color="var(--primary-color, #4f46e5)" />
      <span>{label}</span>
    </button>
  );
};

/* ------------------------------------------------------------------
   Modal for managing and unhiding hidden cards & tiles.
   ------------------------------------------------------------------ */
export const UnhideModal = ({
  isOpen,
  onClose,
  hiddenItems = [],
  onUnhideOne,
  onUnhideAll,
  title = 'Hidden Cards & Tiles'
}) => {
  if (!isOpen) return null;
  return createPortal(
    <div className="feedback-modal-overlay unhide-modal-overlay" onClick={onClose} style={{ zIndex: 100002 }}>
      <div className="feedback-modal-dialog unhide-modal-dialog glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="feedback-modal-header" style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="feedback-modal-icon-badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <Eye size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>{title}</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-dim)' }}>
                {hiddenItems.length === 0 ? 'No hidden items' : `${hiddenItems.length} hidden item${hiddenItems.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {hiddenItems.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px' }}>
            All items are currently visible.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto', marginBottom: '16px', paddingRight: '4px' }}>
            {hiddenItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(0,0,0,0.03)',
                  border: '1px solid var(--glass-border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: `${item.color || 'var(--primary-color)'}1f`,
                    color: item.color || 'var(--primary-color)'
                  }}>
                    {React.isValidElement(item.icon)
                      ? item.icon
                      : (typeof item.icon === 'function' ? React.createElement(item.icon, { size: 16 }) : <Grid size={16} />)}
                  </span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)' }}>
                      {item.name || item.title || item.label || item.id}
                    </div>
                    {item.hint && <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{item.hint}</div>}
                    {item.subtitle && <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{item.subtitle}</div>}
                    {item.description && <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{item.description}</div>}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '12px', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => onUnhideOne(item.id)}
                >
                  <Eye size={12} /> Unhide
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
          {hiddenItems.length > 0 && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                onUnhideAll();
                onClose();
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={14} /> Restore All
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

/* ------------------------------------------------------------------
   Master Unhide & Restore Modal accessed globally from Account Menu.
   Aggregates hidden cards, tabs, and tiles from across the entire app.
   ------------------------------------------------------------------ */
const KNOWN_ITEMS_REGISTRY = {
  // Financial KPIs
  'kpi-receivable': { name: 'Receivable KPI Card', category: 'Dashboard KPI', color: '#10b981' },
  'kpi-payable': { name: 'Payable KPI Card', category: 'Dashboard KPI', color: '#ef4444' },
  'kpi-cash-bank': { name: 'Cash & Bank KPI Card', category: 'Dashboard KPI', color: '#0ea5e9' },
  receivable: { name: 'Receivable KPI Card', category: 'Dashboard KPI', color: '#10b981' },
  payable: { name: 'Payable KPI Card', category: 'Dashboard KPI', color: '#ef4444' },
  cash_bank: { name: 'Cash & Bank KPI Card', category: 'Dashboard KPI', color: '#0ea5e9' },

  // Quick Action Tiles
  inventory: { name: 'Items Tile', category: 'Quick Action', color: '#007aff' },
  ledger: { name: 'Ledgers Tile', category: 'Quick Action', color: '#34c759' },
  vouchers: { name: 'Vouchers Tile', category: 'Quick Action', color: '#5856d6' },
  invoices: { name: 'Invoices Tile', category: 'Quick Action', color: '#af52de' },
  bills: { name: 'Bills Tile', category: 'Quick Action', color: '#ff9500' },
  orders: { name: 'Order Book Tile', category: 'Quick Action', color: '#ff3b30' },
  monthly: { name: 'Reports Tile', category: 'Quick Action', color: '#0ea5e9' },
  settings: { name: 'Settings Tile', category: 'Quick Action', color: '#6366f1' },
  items: { name: 'Items Tile', category: 'Quick Action', color: '#007aff' },
  party: { name: 'Ledgers Tile', category: 'Quick Action', color: '#34c759' },
  reports: { name: 'Reports Tile', category: 'Quick Action', color: '#0ea5e9' },

  // Ledger Stat Cards
  all: { name: 'All Ledgers Stat Card', category: 'Ledgers', color: '#007aff' },
  customers: { name: 'Customers Stat Card', category: 'Ledgers', color: '#34c759' },
  suppliers: { name: 'Suppliers Stat Card', category: 'Ledgers', color: '#ff9500' },

  // Bills Summary Cards
  'bills-receivables': { name: 'Receivables (Incoming) Card', category: 'Bills', color: '#10b981' },
  'bills-payables': { name: 'Payables (Outgoing) Card', category: 'Bills', color: '#ef4444' },
  'bills-outstanding': { name: 'Total Outstanding Card', category: 'Bills', color: '#007aff' },
  receivables_incoming: { name: 'Receivables (Incoming) Card', category: 'Bills', color: '#10b981' },
  payables_outgoing: { name: 'Payables (Outgoing) Card', category: 'Bills', color: '#ef4444' },
  overdue_critical: { name: 'Overdue / Critical Bills Card', category: 'Bills', color: '#f59e0b' },
  settled_history: { name: 'Settled & Cleared Bills Card', category: 'Bills', color: '#6366f1' },

  // Reports Cards
  'top-customers': { name: 'Top Customers Card', category: 'Reports', color: '#10b981' },
  'sales-list': { name: 'Sales Register Card', category: 'Reports', color: '#6366f1' },
  'purchase-list': { name: 'Purchase Register Card', category: 'Reports', color: '#007aff' },
  'day-book': { name: 'Day Book Card', category: 'Reports', color: '#f59e0b' },
  'stock-summary': { name: 'Stock Summary Card', category: 'Reports', color: '#0ea5e9' },
  'quiet-customers': { name: 'Inactive Parties Card', category: 'Reports', color: '#ec4899' },
  'items-not-moving': { name: 'Slow Moving Stock Card', category: 'Reports', color: '#f43f5e' },
  'party-summary': { name: 'Party Ledger Summary Card', category: 'Reports', color: '#10b981' },
  'summary-sales': { name: 'Sales Summary Card', category: 'Reports', color: '#0ea5e9' },
  'summary-purchases': { name: 'Purchases Summary Card', category: 'Reports', color: '#ef4444' },
  'summary-receipts': { name: 'Receipts Summary Card', category: 'Reports', color: '#10b981' },
  'summary-payments': { name: 'Payments Summary Card', category: 'Reports', color: '#f59e0b' },
  'summary-revenue': { name: 'Total Sales Summary', category: 'Reports', color: '#10b981' },
  'summary-profit': { name: 'Gross Profit Summary', category: 'Reports', color: '#6366f1' },
  'summary-receivables': { name: 'Receivables Summary', category: 'Reports', color: '#0ea5e9' },
  'summary-payables': { name: 'Payables Summary', category: 'Reports', color: '#f59e0b' },
  top_customers: { name: 'Top Customers Ranking Card', category: 'Reports', color: '#10b981' },
  top_suppliers: { name: 'Top Suppliers Ranking Card', category: 'Reports', color: '#ef4444' },
  top_items: { name: 'Top Moving Items Card', category: 'Reports', color: '#0ea5e9' },
  vouchers_breakdown: { name: 'Vouchers Activity Card', category: 'Reports', color: '#8b5cf6' },
  monthly_trend: { name: 'Monthly Trend Card', category: 'Reports', color: '#f59e0b' },
  cash_flow: { name: 'Cash Flow Ranking Card', category: 'Reports', color: '#06b6d4' },

  // Navigation Tabs
  dashboard: { name: 'Dashboard Tab', category: 'Navigation Tab', color: '#007aff' },
  ledger: { name: 'Ledgers Tab', category: 'Navigation Tab', color: '#34c759' },
  vouchers: { name: 'Vouchers Tab', category: 'Navigation Tab', color: '#5856d6' },
  bills: { name: 'Bills Tab', category: 'Navigation Tab', color: '#ff9500' },
  invoices: { name: 'Invoices Tab', category: 'Navigation Tab', color: '#af52de' },
  monthly: { name: 'Reports Tab', category: 'Navigation Tab', color: '#0ea5e9' },
  orders: { name: 'Order Book Tab', category: 'Navigation Tab', color: '#ff3b30' },
  inventory: { name: 'Items Tab', category: 'Navigation Tab', color: '#007aff' },
  companies: { name: 'Companies Tab', category: 'Navigation Tab', color: '#6366f1' },
  deleted: { name: 'Delete History Tab', category: 'Navigation Tab', color: '#64748b' },
  users: { name: 'Users & Roles Tab', category: 'Navigation Tab', color: '#3b82f6' },
  notifications: { name: 'Notifications Tab', category: 'Navigation Tab', color: '#f59e0b' },
  settings: { name: 'Settings Tab', category: 'Navigation Tab', color: '#6366f1' },
  history: { name: 'Ledger History Tab', category: 'Navigation Tab', color: '#34c759' },
};

export const HIDDEN_STORAGE_KEYS = [
  { key: 'tc_items_kpi_hidden', category: 'Items Summary', iconType: 'item' },
  { key: 'tc_activity_kpi_hidden', category: 'Activity Summary', iconType: 'action' },
  { key: 'tc_activity_cards_hidden', category: 'Activity', iconType: 'action' },
  { key: 'tc_insights_hidden', category: 'Financial Insights', iconType: 'report' },
  { key: 'tc_ranked_party_kpi_hidden', category: 'Ranked Parties', iconType: 'ledger' },
  { key: 'tc_ranked_party_rows_hidden', category: 'Ranked Parties', iconType: 'ledger' },

  { key: 'tc_kpi_hidden', category: 'Dashboard KPI', iconType: 'kpi' },
  { key: 'tc_dashboard_hidden', category: 'Quick Action', iconType: 'action' },
  { key: 'tc_dash_hidden', category: 'Quick Action', iconType: 'action' },
  { key: 'tc_ledger_stat_hidden', category: 'Ledger Summary', iconType: 'ledger' },
  { key: 'tc_ledgers_hidden', category: 'Ledgers', iconType: 'ledger' },
  { key: 'tc_vouchers_hidden', category: 'Vouchers', iconType: 'voucher' },
  { key: 'tc_orders_hidden', category: 'Orders', iconType: 'order' },
  { key: 'tc_bills_summary_hidden', category: 'Bills Summary', iconType: 'bill' },
  { key: 'tc_bills_hidden', category: 'Bills', iconType: 'bill' },
  { key: 'tc_reports_hidden', category: 'Reports', iconType: 'report' },
  { key: 'tc_reports_summary_hidden', category: 'Reports Summary', iconType: 'report' },
  { key: 'tc_reports_cards_hidden', category: 'Reports', iconType: 'report' },
  { key: 'tc_nav_hidden', category: 'Navigation Tab', iconType: 'nav' },
  { key: 'tc_items_hidden', category: 'Items', iconType: 'item' },
  { key: 'tc_companies_hidden', category: 'Companies', iconType: 'company' },
  { key: 'tc_users_hidden', category: 'Users & Roles', iconType: 'user' },
];

export const getGlobalHiddenCount = () => {
  try {
    let count = 0;
    const seen = new Set();
    for (const reg of HIDDEN_STORAGE_KEYS) {
      const raw = JSON.parse(localStorage.getItem(reg.key) || '[]');
      if (Array.isArray(raw)) {
        for (const id of raw) {
          const combo = `${reg.key}:${id}`;
          if (!seen.has(combo)) {
            seen.add(combo);
            count++;
          }
        }
      }
    }
    return count;
  } catch {
    return 0;
  }
};

export const MasterUnhideModal = ({ isOpen, onClose }) => {
  const [items, setItems] = useState([]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [query, setQuery] = useState('');

  const refreshHidden = () => {
    try {
      const list = [];
      const seen = new Set();

      let itemsMetaMap = {};
      let ledgersMetaMap = {};
      let vouchersMetaMap = {};
      let billsMetaMap = {};
      let ordersMetaMap = {};
      let companiesMetaMap = {};
      let usersMetaMap = {};

      try { itemsMetaMap = JSON.parse(localStorage.getItem('tc_items_meta_map') || '{}'); } catch { }
      try { ledgersMetaMap = JSON.parse(localStorage.getItem('tc_ledgers_meta_map') || '{}'); } catch { }
      try { vouchersMetaMap = JSON.parse(localStorage.getItem('tc_vouchers_meta_map') || '{}'); } catch { }
      try { billsMetaMap = JSON.parse(localStorage.getItem('tc_bills_meta_map') || '{}'); } catch { }
      try { ordersMetaMap = JSON.parse(localStorage.getItem('tc_orders_meta_map') || '{}'); } catch { }
      try { companiesMetaMap = JSON.parse(localStorage.getItem('tc_companies_meta_map') || '{}'); } catch { }
      try { usersMetaMap = JSON.parse(localStorage.getItem('tc_users_meta_map') || '{}'); } catch { }

      for (const reg of HIDDEN_STORAGE_KEYS) {
        const raw = JSON.parse(localStorage.getItem(reg.key) || '[]');
        if (Array.isArray(raw)) {
          for (const id of raw) {
            const combo = `${reg.key}:${id}`;
            if (!seen.has(combo)) {
              seen.add(combo);
              let meta = KNOWN_ITEMS_REGISTRY[id];
              let displayName = id;
              let category = reg.category;
              let color = '#4f46e5';
              let iconType = reg.iconType;

              if (reg.key === 'tc_items_hidden') {
                displayName = itemsMetaMap[id] || id;
                color = '#e11d48';
                category = 'Inventory Items';
                iconType = 'item';
              } else if (reg.key === 'tc_ledgers_hidden') {
                displayName = ledgersMetaMap[id] || id;
                color = '#34c759';
                category = 'Ledgers';
                iconType = 'ledger';
              } else if (reg.key === 'tc_vouchers_hidden') {
                displayName = vouchersMetaMap[id] || id;
                color = '#5856d6';
                category = 'Vouchers';
                iconType = 'voucher';
              } else if (reg.key === 'tc_orders_hidden') {
                displayName = ordersMetaMap[id] || id;
                color = '#ff3b30';
                category = 'Orders';
                iconType = 'order';
              } else if (reg.key === 'tc_bills_hidden') {
                displayName = billsMetaMap[id] || id;
                color = '#ff9500';
                category = 'Bills';
                iconType = 'bill';
              } else if (reg.key === 'tc_companies_hidden') {
                displayName = companiesMetaMap[id] || id;
                color = '#6366f1';
                category = 'Companies';
                iconType = 'company';
              } else if (reg.key === 'tc_users_hidden') {
                displayName = usersMetaMap[id] || (String(id).startsWith('user-') ? id : `User #${id}`);
                color = '#007aff';
                category = 'Users & Roles';
                iconType = 'user';
              } else if (meta) {
                displayName = meta.name;
                color = meta.color;
                category = meta.category;
              } else {
                displayName = `${String(id).replace(/^kpi-|^bills-|^summary-/, '').replace(/[-_]/g, ' ')}`.replace(/\b\w/g, (c) => c.toUpperCase());
              }

              list.push({
                id,
                storageKey: reg.key,
                name: displayName,
                category,
                color,
                iconType
              });
            }
          }
        }
      }
      setItems(list);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    if (isOpen) refreshHidden();
  }, [isOpen]);

  useEffect(() => {
    const handleSync = () => {
      if (isOpen) refreshHidden();
    };
    window.addEventListener('tc-unhide-sync', handleSync);
    return () => window.removeEventListener('tc-unhide-sync', handleSync);
  }, [isOpen]);

  const handleUnhideOne = (item) => {
    try {
      const current = JSON.parse(localStorage.getItem(item.storageKey) || '[]');
      const updated = current.filter((x) => x !== item.id);
      if (updated.length > 0) {
        localStorage.setItem(item.storageKey, JSON.stringify(updated));
      } else {
        localStorage.removeItem(item.storageKey);
      }
      window.dispatchEvent(new Event('tc-unhide-sync'));
      window.dispatchEvent(new Event('storage'));
      refreshHidden();
    } catch { }
  };

  const handleRestoreAll = () => {
    for (const reg of HIDDEN_STORAGE_KEYS) {
      try { localStorage.removeItem(reg.key); } catch { }
    }
    window.dispatchEvent(new Event('tc-unhide-sync'));
    window.dispatchEvent(new Event('storage'));
    setItems([]);
    onClose();
  };

  // Categories list with counts
  const categories = useMemo(() => {
    const counts = { all: items.length };
    items.forEach((it) => {
      counts[it.category] = (counts[it.category] || 0) + 1;
    });
    return Object.keys(counts).map((cat) => ({ id: cat, count: counts[cat] }));
  }, [items]);

  const filteredItems = useMemo(() => {
    let list = items;
    if (selectedCat !== 'all') {
      list = list.filter((it) => it.category === selectedCat);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((it) =>
        it.name.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, selectedCat, query]);

  const renderIcon = (item) => {
    switch (item.iconType) {
      case 'item': return <Package size={16} />;
      case 'ledger': return <Landmark size={16} />;
      case 'voucher': return <FileText size={16} />;
      case 'bill': return <Receipt size={16} />;
      case 'order': return <ShoppingCart size={16} />;
      case 'kpi': return <TrendingUp size={16} />;
      case 'report': return <BarChart3 size={16} />;
      case 'nav': return <Layers size={16} />;
      case 'company': return <Building2 size={16} />;
      case 'user': return <User size={16} />;
      default: return <Grid size={16} />;
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="feedback-modal-overlay unhide-modal-overlay" onClick={onClose} style={{ zIndex: 100005 }}>
      <div className="feedback-modal-dialog unhide-modal-dialog glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        {/* Header */}
        <div className="feedback-modal-header" style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="feedback-modal-icon-badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <Eye size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Account → Hidden Items</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-dim)' }}>
                {items.length === 0 ? 'Everything is currently visible' : `${items.length} element${items.length === 1 ? '' : 's'} hidden across your workspace`}
              </p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
            {/* Category tabs */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCat(c.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: '1px solid transparent',
                    cursor: 'pointer',
                    background: selectedCat === c.id ? 'var(--primary-color)' : 'rgba(0,0,0,0.05)',
                    color: selectedCat === c.id ? '#ffffff' : 'var(--text-dark)',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {c.id === 'all' ? 'All' : c.id} ({c.count})
                </button>
              ))}
            </div>

            {/* Search input inside modal */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.04)', borderRadius: '10px', padding: '6px 12px' }}>
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search hidden items..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', width: '100%', color: 'var(--text-dark)' }}
              />
              {query && (
                <button onClick={() => setQuery('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: 'var(--text-muted)' }}>
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 10px', display: 'block' }} />
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-dark)' }}>All items are active!</div>
            <p style={{ fontSize: '13px', margin: '4px 0 0', color: 'var(--text-dim)' }}>
              No cards, ledgers, vouchers, bills, or inventory items are currently hidden.
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px' }}>
            No hidden items match "{query}".
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto', marginBottom: '16px', paddingRight: '4px' }}>
            {filteredItems.map((item) => (
              <div
                key={`${item.storageKey}-${item.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.65)',
                  border: '1px solid var(--glass-border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: `${item.color}1f`,
                    color: item.color,
                    flexShrink: 0
                  }}>
                    {renderIcon(item)}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: item.color, background: `${item.color}12`, padding: '1px 6px', borderRadius: '4px' }}>
                      {item.category}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', flexShrink: 0, marginLeft: '8px' }}
                  onClick={() => handleUnhideOne(item)}
                >
                  <Eye size={13} style={{ color: '#10b981' }} /> Unhide
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', paddingTop: '14px', borderTop: '1px solid var(--glass-border)' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
          {items.length > 0 && (
            <button
              type="button"
              className="btn-primary"
              onClick={handleRestoreAll}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={14} /> Restore All Elements ({items.length})
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

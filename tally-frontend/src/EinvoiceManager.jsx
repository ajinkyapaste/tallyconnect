import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText, AlertTriangle, CheckCircle2, XCircle, Clock, Search,
  Eye, RefreshCcw, Layers, Pin, EyeOff, Move, MoreVertical,
  Copy, Share2, Printer, X, Check, QrCode, RefreshCw
} from 'lucide-react';
import { getEinvoiceList, getEinvoiceVoucher } from './api';
import StandardPagination from './StandardPagination';
import StandardDateFilter from './StandardDateFilter';
import { CardContextMenu, HiddenCardsChip, useCardGridPreferences } from './CardGridPreferences';
import { createHoldTouchHandler, UnhideModal } from './uiUtils';
import { DisplayPreferencesBar } from './DisplayPreferencesBar';

const formatInr = (n) =>
  `\u20B9${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_META = {
  all: { label: 'All', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  pending: { label: 'Pending', color: '#d97706', bg: 'rgba(245,158,11,0.14)' },
  done: { label: 'E-Invoiced', color: '#059669', bg: 'rgba(16,185,129,0.14)' },
  cancelled: { label: 'Cancelled', color: '#e11d48', bg: 'rgba(244,63,94,0.14)' },
  not_needed: { label: 'Not Needed', color: '#64748b', bg: 'rgba(148,163,184,0.16)' },
  alerts: { label: 'Alerts', color: '#e11d48', bg: 'rgba(244,63,94,0.14)' },
};

const FILTER_TABS = ['all', 'pending', 'done', 'cancelled', 'not_needed', 'alerts'];

const ALERT_LABELS = {
  overdue: 'Overdue (>30 days)',
  due_soon: 'Due Soon',
  late_report: 'Late Report (>30 days)',
  ack_before_invoice: 'Ack before Invoice',
};

const ALL_COLUMNS = [
  { id: 'date', label: 'Date' },
  { id: 'voucher', label: 'Voucher' },
  { id: 'party', label: 'Party' },
  { id: 'gstin', label: 'GSTIN' },
  { id: 'amount', label: 'Amount' },
  { id: 'status', label: 'Status' },
  { id: 'irn', label: 'IRN / ACK' },
  { id: 'alerts', label: 'Alerts' },
];

function formatDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return String(d);
  }
}

function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function rangeFor(filter, customStart, customEnd) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const to = isoDate(today);
  if (filter === 'custom') {
    return {
      from: customStart || to,
      to: customEnd || to,
    };
  }
  if (filter === 'all') return { from: '2000-01-01', to };
  const start = new Date(today);
  if (filter === '7days') start.setDate(start.getDate() - 7);
  else if (filter === '1month') start.setMonth(start.getMonth() - 1);
  else if (filter === '3months') start.setMonth(start.getMonth() - 3);
  else start.setFullYear(start.getFullYear() - 1);
  return { from: isoDate(start), to };
}

export default function EinvoiceManager({ user }) {
  const [status, setStatus] = useState('all');
  const [dateFilter, setDateFilter] = useState('1year');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Display Preferences
  const [viewMode, setViewMode] = useState(() => {
    try { return localStorage.getItem('tc_pref_einvoice_mode') || 'table'; } catch { return 'table'; }
  });
  const [pageSize, setPageSize] = useState(() => {
    try { return parseInt(localStorage.getItem('tc_pref_einvoice_size'), 10) || 25; } catch { return 25; }
  });
  const [sortBy, setSortBy] = useState(() => {
    try { return localStorage.getItem('tc_pref_einvoice_sort') || ''; } catch { return ''; }
  });
  const [hiddenColumns, setHiddenColumns] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tc_pref_einvoice_hidden_cols') || '[]'); } catch { return []; }
  });

  // Reorder, Pinned & Hidden Rows/Cards
  const [pinnedInvoices, setPinnedInvoices] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tc_einvoice_pinned_records') || '[]'); } catch { return []; }
  });
  const [hiddenInvoices, setHiddenInvoices] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tc_einvoice_hidden_records') || '[]'); } catch { return []; }
  });
  const [customOrder, setCustomOrder] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tc_einvoice_row_order') || '[]'); } catch { return []; }
  });

  // Drag-and-drop & Context Menu State
  const wasDraggingRef = useRef(false);
  const [draggedKey, setDraggedKey] = useState(null);
  const [dragOverKey, setDragOverKey] = useState(null);
  const [menuInvoice, setMenuInvoice] = useState(null);

  // Centered View Modal State
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Unhide Modal & Toasts
  const [showUnhideModal, setShowUnhideModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const range = useMemo(
    () => rangeFor(dateFilter, customStart, customEnd),
    [dateFilter, customStart, customEnd]
  );

  const fetchList = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await getEinvoiceList({ from: range.from, to: range.to, status });
      if (res?.success) setData(res);
    } catch (err) {
      console.warn('E-Invoice list failed:', err?.message || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from, range.to, status]);

  // Handle ESC key for modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (selected) setSelected(null);
        if (menuInvoice) setMenuInvoice(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, menuInvoice]);

  // Base filtered list
  const baseRows = useMemo(() => {
    const list = data?.rows || [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => {
      return [r.party_name, r.party_gstin, r.voucher_no, r.irn].some((v) =>
        String(v || '').toLowerCase().includes(q)
      );
    });
  }, [data, search]);

  // Sorted and organized rows (unhidden, custom-order, pinned to top)
  const sortedRows = useMemo(() => {
    let list = baseRows.filter((r) => !hiddenInvoices.includes(r.voucher_guid));

    // Sort order
    if (sortBy) {
      list = [...list].sort((a, b) => {
        if (sortBy === 'date_desc') return new Date(b.date || 0) - new Date(a.date || 0);
        if (sortBy === 'date_asc') return new Date(a.date || 0) - new Date(b.date || 0);
        if (sortBy === 'amount_desc') return (b.amount || 0) - (a.amount || 0);
        if (sortBy === 'amount_asc') return (a.amount || 0) - (b.amount || 0);
        if (sortBy === 'party_asc') return String(a.party_name || '').localeCompare(String(b.party_name || ''));
        return 0;
      });
    } else if (customOrder.length > 0) {
      const orderMap = new Map(customOrder.map((id, idx) => [id, idx]));
      list = [...list].sort((a, b) => {
        const idxA = orderMap.has(a.voucher_guid) ? orderMap.get(a.voucher_guid) : 999999;
        const idxB = orderMap.has(b.voucher_guid) ? orderMap.get(b.voucher_guid) : 999999;
        return idxA - idxB;
      });
    }

    // Pinned records float to top
    const pinnedList = list.filter((r) => pinnedInvoices.includes(r.voucher_guid));
    const unpinnedList = list.filter((r) => !pinnedInvoices.includes(r.voucher_guid));
    return [...pinnedList, ...unpinnedList];
  }, [baseRows, hiddenInvoices, sortBy, customOrder, pinnedInvoices]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize]);

  useEffect(() => { setPage(1); }, [search, status, range.from, range.to, sortBy]);

  const openDetail = async (row) => {
    setSelected(row);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await getEinvoiceVoucher(row.voucher_guid);
      if (res?.success) setDetail(res.invoice);
    } catch (err) {
      console.warn('E-Invoice detail failed:', err?.message || err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Row Drag Handlers
  const handleItemDragStart = (e, r) => {
    wasDraggingRef.current = true;
    setDraggedKey(r.voucher_guid);
    try {
      e.dataTransfer.setData('text/plain', r.voucher_guid);
      e.dataTransfer.effectAllowed = 'move';
    } catch {}
  };

  const handleItemDragOver = (e, r) => {
    e.preventDefault();
    try { e.dataTransfer.dropEffect = 'move'; } catch {}
    if (dragOverKey !== r.voucher_guid) setDragOverKey(r.voucher_guid);
  };

  const handleItemDrop = (e, targetRow) => {
    e.preventDefault();
    if (!draggedKey || draggedKey === targetRow.voucher_guid) {
      setDraggedKey(null);
      setDragOverKey(null);
      return;
    }
    const currentGuids = sortedRows.map((r) => r.voucher_guid);
    const fromIdx = currentGuids.indexOf(draggedKey);
    const toIdx = currentGuids.indexOf(targetRow.voucher_guid);
    if (fromIdx !== -1 && toIdx !== -1) {
      const next = [...currentGuids];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      setCustomOrder(next);
      try { localStorage.setItem('tc_einvoice_row_order', JSON.stringify(next)); } catch {}
      showToast('E-Invoice order updated');
    }
    setDraggedKey(null);
    setDragOverKey(null);
  };

  // Row Pin Toggle
  const handleTogglePin = (inv) => {
    const isPinned = pinnedInvoices.includes(inv.voucher_guid);
    let next;
    if (isPinned) {
      next = pinnedInvoices.filter((id) => id !== inv.voucher_guid);
      showToast('Unpinned from top');
    } else {
      next = [inv.voucher_guid, ...pinnedInvoices];
      showToast('Pinned to top');
    }
    setPinnedInvoices(next);
    try { localStorage.setItem('tc_einvoice_pinned_records', JSON.stringify(next)); } catch {}
    setMenuInvoice(null);
  };

  // Row Hide
  const handleHide = (inv) => {
    if (!hiddenInvoices.includes(inv.voucher_guid)) {
      const next = [...hiddenInvoices, inv.voucher_guid];
      setHiddenInvoices(next);
      try { localStorage.setItem('tc_einvoice_hidden_records', JSON.stringify(next)); } catch {}
      showToast('E-Invoice hidden from view');
    }
    setMenuInvoice(null);
  };

  // Copy IRN
  const handleCopyIrn = (irnText) => {
    if (!irnText) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(irnText);
      showToast('IRN copied to clipboard');
    }
  };

  // Share Invoice
  const handleShareInvoice = (inv) => {
    const shareText = `E-Invoice: ${inv.voucher_no || 'Invoice'} • ${inv.party_name || 'Party'} • Amount: ${formatInr(inv.amount)} • Status: ${STATUS_META[inv.status]?.label || inv.status}${inv.irn ? ` • IRN: ${inv.irn}` : ''}`;
    if (navigator.share) {
      navigator.share({
        title: `E-Invoice ${inv.voucher_no || ''}`,
        text: shareText
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      showToast('Invoice summary copied to clipboard');
    }
  };

  // Hidden Invoices List for UnhideModal
  const hiddenInvoicesList = useMemo(() => {
    return hiddenInvoices.map((id) => {
      const inv = (data?.rows || []).find((r) => r.voucher_guid === id);
      const name = inv ? `${inv.voucher_no || 'Invoice'} • ${inv.party_name || ''}` : id;
      return {
        id,
        name,
        title: name,
        label: name,
        hint: inv ? `${formatInr(inv.amount)} • ${formatDate(inv.date)}` : 'E-Invoice',
        subtitle: inv ? `${formatInr(inv.amount)} • ${formatDate(inv.date)}` : 'E-Invoice',
        color: '#2563eb',
        icon: <FileText size={16} />
      };
    });
  }, [hiddenInvoices, data]);

  const handleUnhideOneInvoice = (id) => {
    const updated = hiddenInvoices.filter((k) => k !== id);
    setHiddenInvoices(updated);
    try { localStorage.setItem('tc_einvoice_hidden_records', JSON.stringify(updated)); } catch {}
    showToast('E-Invoice restored to view');
  };

  const handleUnhideAllInvoices = () => {
    setHiddenInvoices([]);
    try { localStorage.removeItem('tc_einvoice_hidden_records'); } catch {}
    setShowUnhideModal(false);
    showToast('All hidden e-invoices restored');
  };

  // Top KPI summary cards
  const summary = data?.summary || {};
  const cards = [
    {
      key: 'total',
      status: 'all',
      label: 'Total Invoices',
      value: summary.total || 0,
      note: 'In the selected period',
      icon: Layers,
      color: '#2563eb',
      tint: '37, 99, 235',
    },
    {
      key: 'pending',
      status: 'pending',
      label: 'Pending E-Invoice',
      value: summary.pending || 0,
      note: 'Awaiting IRN generation',
      icon: Clock,
      color: '#b45309',
      tint: '245, 158, 11',
    },
    {
      key: 'done',
      status: 'done',
      label: 'E-Invoiced',
      value: summary.done || 0,
      note: 'IRN generated successfully',
      icon: CheckCircle2,
      color: '#047857',
      tint: '16, 185, 129',
    },
    {
      key: 'alerts',
      status: 'alerts',
      label: 'Requires Attention',
      value: summary.overdue || 0,
      note: 'Overdue compliance alerts',
      icon: AlertTriangle,
      color: '#be123c',
      tint: '244, 63, 94',
    },
  ];

  const filterCount = (key) => {
    if (key === 'all') return summary.total || 0;
    if (key === 'alerts') return null;
    return summary[key] || 0;
  };

  const clearFilters = () => {
    setStatus('all');
    setDateFilter('1year');
    setCustomStart('');
    setCustomEnd('');
    setSearch('');
    setPage(1);
  };

  const invoiceCards = useMemo(
    () =>
      cards.map((c) => ({
        id: `einv-${c.key}`,
        key: c.key,
        status: c.status,
        label: c.label,
        value: c.value,
        note: c.note,
        icon: c.icon,
        color: c.color,
        tint: c.tint,
      })),
    [cards]
  );

  const {
    visibleCards: visibleInvoiceCards,
    hiddenCards: hiddenInvoiceCards,
    pinned: pinnedInvoiceCards,
    menu: invoiceMenu,
    setMenu: setInvoiceMenu,
    togglePin: toggleInvoicePin,
    hide: hideInvoiceCard,
    unhide: unhideInvoiceCard,
    unhideAll: unhideAllInvoiceCards,
    reset: resetInvoiceCards,
    handleDragStart: onInvoiceDragStart,
    handleDragOver: onInvoiceDragOver,
    handleDrop: onInvoiceDrop,
    handleDragEnd: onInvoiceDragEnd,
    openMenu: openInvoiceMenu,
    isPinned: isInvoicePinned,
  } = useCardGridPreferences('tc_einvoice_kpi', invoiceCards);

  return (
    <div className="fade-in">
      {/* Page Header matching Ledgers & Vouchers */}
      <div className="page-header">
        <div>
          <h1>E-Invoice</h1>
          <p>Track IRN / ACK, signed QR and compliance alerts for your invoices</p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {hiddenInvoices.length > 0 && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowUnhideModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="View and restore hidden e-invoices"
            >
              <Eye size={15} />
              <span>Unhide ({hiddenInvoices.length})</span>
            </button>
          )}
          <button className="btn-secondary" onClick={() => fetchList(true)} disabled={refreshing}>
            <RefreshCcw size={16} className={refreshing ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Hidden Chip */}
      <HiddenCardsChip hiddenCards={hiddenInvoiceCards} onUnhide={unhideInvoiceCard} />

      {/* Top KPI Summary Cards - Standardized .ledger-stats styling matching Ledgers & Vouchers */}
      <div className="ledger-stats">
        {visibleInvoiceCards.map((c) => {
          const active = status === c.status;
          const Icon = c.icon;
          const pinned = isInvoicePinned(c.id);
          return (
            <div
              key={c.id}
              className={`ledger-stat glass-panel draggable-card ${pinned ? 'is-pinned' : ''} ${active ? 'active' : ''}`}
              role="button"
              tabIndex={0}
              draggable={true}
              onDragStart={(e) => onInvoiceDragStart(e, c.id)}
              onDragOver={(e) => onInvoiceDragOver(e, c.id)}
              onDrop={(e) => onInvoiceDrop(e, c.id)}
              onDragEnd={onInvoiceDragEnd}
              onContextMenu={(e) => openInvoiceMenu(e, c)}
              {...createHoldTouchHandler((pos) => openInvoiceMenu({ clientX: pos.x, clientY: pos.y, preventDefault: () => {} }, c))}
              onClick={() => setStatus(c.status)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setStatus(c.status);
                }
              }}
              title={`Filter by ${c.label} • Drag to reorder • Right-click or hold for options`}
              style={{
                cursor: 'pointer',
                textAlign: 'left',
                position: 'relative',
                border: active ? `2px solid rgb(${c.tint})` : undefined,
                background: active ? `rgba(${c.tint}, 0.12)` : undefined
              }}
            >
              {pinned && (
                <div className="tile-pin-badge" title="Pinned to top">
                  <Pin size={10} />
                </div>
              )}
              <div
                className="ledger-stat-icon"
                style={{
                  background: `rgba(${c.tint}, 0.15)`,
                  color: c.color
                }}
              >
                <Icon size={20} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="ledger-stat-value">{(c.value || 0).toLocaleString('en-IN')}</div>
                <div className="ledger-stat-label">{c.label}</div>
                <div className="ledger-stat-sub">{c.note}</div>
              </div>
              <button
                type="button"
                className="tile-menu-btn"
                title="Card options"
                onClick={(e) => {
                  e.stopPropagation();
                  openInvoiceMenu(e, c);
                }}
              >
                <MoreVertical size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* KPI Card Context Menu */}
      <CardContextMenu
        menu={invoiceMenu}
        onClose={() => setInvoiceMenu(null)}
        pinned={pinnedInvoiceCards}
        onTogglePin={toggleInvoicePin}
        onHide={hideInvoiceCard}
        onReset={resetInvoiceCards}
        onUnhideAll={unhideAllInvoiceCards}
        hiddenCount={hiddenInvoiceCards.length}
      />

      {/* Filters and Search Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '14px 20px',
          borderRadius: '20px',
          background: 'var(--glass-bg, rgba(255, 255, 255, 0.7))',
          backdropFilter: 'blur(var(--glass-blur, 24px))',
          WebkitBackdropFilter: 'blur(var(--glass-blur, 24px))',
          border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.85))',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <StandardDateFilter
            value={dateFilter}
            onChange={setDateFilter}
            customStart={customStart}
            customEnd={customEnd}
            onCustomStartChange={setCustomStart}
            onCustomEndChange={setCustomEnd}
          />

          <div
            className="header-search glass-panel"
            style={{
              width: '280px',
              maxWidth: '100%',
              background: 'var(--glass-bg, rgba(255, 255, 255, 0.7))',
              border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.8))',
              backdropFilter: 'blur(var(--glass-blur, 24px))',
              WebkitBackdropFilter: 'blur(var(--glass-blur, 24px))'
            }}
          >
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search party, GSTIN, voucher, IRN"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
              >
                <XCircle size={14} color="#64748b" />
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', maxWidth: '100%' }}>
          {FILTER_TABS.map((tab) => {
            const isActive = status === tab;
            const count = filterCount(tab);
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setStatus(tab)}
                style={{
                  border: 'none',
                  background: isActive ? '#0663f9' : 'rgba(0, 0, 0, 0.04)',
                  color: isActive ? '#ffffff' : 'var(--text-dark, #334155)',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '13px',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{STATUS_META[tab].label}</span>
                {count != null && (
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '1px 6px',
                      borderRadius: '999px',
                      background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.08)',
                      color: isActive ? '#ffffff' : 'var(--text-muted, #64748b)'
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {data?.truncated && (
        <div
          className="glass-panel"
          style={{
            padding: '10px 16px',
            borderRadius: '14px',
            marginBottom: '16px',
            fontSize: '12.5px',
            fontWeight: 600,
            color: '#92400e',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)'
          }}
        >
          Showing the first 500 invoices in this period. Narrow the date range to see all records.
        </div>
      )}

      {/* Main Records Container (Card or Table) */}
      <div
        className="glass-panel"
        style={{
          background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.75))',
          backdropFilter: 'blur(var(--glass-blur, 24px))',
          WebkitBackdropFilter: 'blur(var(--glass-blur, 24px))',
          borderRadius: '24px',
          border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.85))',
          overflow: 'hidden',
          boxShadow: 'var(--glass-shadow, 0 8px 30px rgba(15, 23, 42, 0.04))'
        }}
      >
        {loading && (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <RefreshCcw size={28} className="spin-icon" style={{ color: 'var(--primary-color)', margin: '0 auto 12px' }} />
            <h4 style={{ margin: '0 0 6px', color: '#0f172a' }}>Loading e-invoices...</h4>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Reading the current company's e-invoice records</p>
          </div>
        )}

        {!loading && sortedRows.length === 0 && (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <FileText size={36} style={{ color: '#94a3b8', margin: '0 auto 14px' }} />
            <h3 style={{ margin: '0 0 6px', color: '#1e293b' }}>No e-invoices found</h3>
            <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '14px' }}>
              No records match the selected period, status or search.
            </p>
            <button className="btn-secondary" onClick={clearFilters} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              Clear all filters
            </button>
          </div>
        )}

        {!loading && sortedRows.length > 0 && (
          <>
            {viewMode === 'card' ? (
              /* CARD VIEW - Matching Ledgers and Vouchers party-card design */
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '14px',
                  padding: '16px'
                }}
              >
                {paged.map((r) => {
                  const isPinned = pinnedInvoices.includes(r.voucher_guid);
                  const isDragging = draggedKey === r.voucher_guid;
                  const isDragOver = dragOverKey === r.voucher_guid;
                  const st = STATUS_META[r.status] || STATUS_META.not_needed;
                  return (
                    <div
                      key={r.voucher_guid}
                      className={`party-card draggable-card ${isPinned ? 'is-pinned' : ''} ${isDragging ? 'is-dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                      draggable={true}
                      onDragStart={(e) => handleItemDragStart(e, r)}
                      onDragOver={(e) => handleItemDragOver(e, r)}
                      onDrop={(e) => handleItemDrop(e, r)}
                      onDragEnd={() => {
                        setDraggedKey(null);
                        setDragOverKey(null);
                        setTimeout(() => { wasDraggingRef.current = false; }, 200);
                      }}
                      onClick={() => {
                        if (wasDraggingRef.current) return;
                        openDetail(r);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setMenuInvoice(r);
                      }}
                      {...createHoldTouchHandler(() => setMenuInvoice(r))}
                      title="Click to view details, drag to reorder, hold/right-click for options"
                      style={{
                        position: 'relative',
                        cursor: 'pointer',
                        background: isPinned ? 'rgba(99, 102, 241, 0.05)' : (isDragOver ? 'rgba(99, 102, 241, 0.12)' : undefined),
                        opacity: isDragging ? 0.4 : 1
                      }}
                    >
                      <div
                        className="party-avatar"
                        style={{
                          background: st.bg,
                          color: st.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <FileText size={20} />
                      </div>
                      <div className="party-body" style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="party-name">{r.party_name || '—'}</div>
                          {isPinned && (
                            <span className="item-pinned-tag" style={{ flexShrink: 0 }}>
                              <Pin size={10} /> Pinned
                            </span>
                          )}
                        </div>
                        <div className="party-sub">
                          {r.voucher_no || 'Invoice'} • {r.voucher_type || 'Sales'} • {formatDate(r.date)}
                        </div>
                        <div className="party-footer" style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                          <span className="position-pill" style={{ background: st.bg, color: st.color, fontSize: '11px' }}>
                            {st.label}
                          </span>
                          {r.party_gstin && (
                            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
                              {r.party_gstin}
                            </span>
                          )}
                          {r.alerts && r.alerts.length > 0 && (
                            <span className="pill" style={{ background: 'rgba(244, 63, 94, 0.12)', color: '#be123c', fontSize: '10.5px' }}>
                              {ALERT_LABELS[r.alerts[0]] || r.alerts[0]}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="party-right" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        <div className="party-balance-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
                          <div className="party-balance" style={{ fontWeight: 800, color: '#0f172a' }}>
                            {r.amount != null ? formatInr(r.amount) : '—'}
                          </div>
                          <div className="party-meta" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {r.irn ? `Ack ${r.ack_no || 'Done'}` : (r.status === 'pending' && r.days_left != null ? `${r.days_left}d left` : 'Pending')}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="tile-menu-btn"
                            onClick={() => handleHide(r)}
                            title="Hide e-invoice"
                            style={{ padding: '6px' }}
                          >
                            <EyeOff size={15} />
                          </button>
                          <button
                            type="button"
                            className="tile-menu-btn"
                            onClick={() => setMenuInvoice(r)}
                            title="Options"
                            style={{ padding: '6px' }}
                          >
                            <MoreVertical size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* TABLE VIEW - With drag handles, hover states, and actions */
              <div className="table-responsive-container">
                <table className="standard-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}></th>
                      {!hiddenColumns.includes('date') && <th>Date</th>}
                      {!hiddenColumns.includes('voucher') && <th>Voucher</th>}
                      {!hiddenColumns.includes('party') && <th>Party</th>}
                      {!hiddenColumns.includes('gstin') && <th>GSTIN</th>}
                      {!hiddenColumns.includes('amount') && <th style={{ textAlign: 'right' }}>Amount</th>}
                      {!hiddenColumns.includes('status') && <th>Status</th>}
                      {!hiddenColumns.includes('irn') && <th>IRN / ACK</th>}
                      {!hiddenColumns.includes('alerts') && <th>Alerts</th>}
                      <th style={{ textAlign: 'right', width: '110px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((r) => {
                      const st = STATUS_META[r.status] || STATUS_META.not_needed;
                      const isPinned = pinnedInvoices.includes(r.voucher_guid);
                      const isDragging = draggedKey === r.voucher_guid;
                      const isDragOver = dragOverKey === r.voucher_guid;
                      return (
                        <tr
                          key={r.voucher_guid}
                          draggable={true}
                          onDragStart={(e) => handleItemDragStart(e, r)}
                          onDragOver={(e) => handleItemDragOver(e, r)}
                          onDrop={(e) => handleItemDrop(e, r)}
                          onDragEnd={() => {
                            setDraggedKey(null);
                            setDragOverKey(null);
                            setTimeout(() => { wasDraggingRef.current = false; }, 200);
                          }}
                          onClick={() => {
                            if (wasDraggingRef.current) return;
                            openDetail(r);
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setMenuInvoice(r);
                          }}
                          {...createHoldTouchHandler(() => setMenuInvoice(r))}
                          className={`table-row-hover draggable-card ${isPinned ? 'is-pinned' : ''} ${isDragging ? 'is-dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                          style={{
                            cursor: 'pointer',
                            background: isPinned ? 'rgba(99, 102, 241, 0.05)' : (isDragOver ? 'rgba(99, 102, 241, 0.12)' : undefined),
                            opacity: isDragging ? 0.4 : 1
                          }}
                          title="Click to view details, drag to reorder, hold/right-click for options"
                        >
                          <td style={{ padding: '12px 8px', textAlign: 'center', width: '40px' }} onClick={(e) => e.stopPropagation()}>
                            <div className="item-drag-handle" title="Drag to reorder" style={{ cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Move size={14} color="var(--text-muted)" />
                            </div>
                          </td>
                          {!hiddenColumns.includes('date') && (
                            <td style={{ whiteSpace: 'nowrap' }}>{formatDate(r.date)}</td>
                          )}
                          {!hiddenColumns.includes('voucher') && (
                            <td>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.voucher_no || '—'}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.voucher_type || ''}</div>
                            </td>
                          )}
                          {!hiddenColumns.includes('party') && (
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ fontWeight: 600 }}>{r.party_name || '—'}</div>
                                {isPinned && (
                                  <span className="item-pinned-tag" style={{ padding: '2px 6px', fontSize: '10px' }}>
                                    <Pin size={9} /> Pinned
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.registration_type || ''}</div>
                            </td>
                          )}
                          {!hiddenColumns.includes('gstin') && (
                            <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{r.party_gstin || '—'}</td>
                          )}
                          {!hiddenColumns.includes('amount') && (
                            <td style={{ textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>
                              {r.amount != null ? formatInr(r.amount) : '—'}
                            </td>
                          )}
                          {!hiddenColumns.includes('status') && (
                            <td>
                              <span className="pill" style={{ background: st.bg, color: st.color, borderColor: st.color }}>
                                {st.label}
                              </span>
                              {r.status === 'pending' && r.days_left != null && (
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                  {r.days_left} days left
                                </div>
                              )}
                            </td>
                          )}
                          {!hiddenColumns.includes('irn') && (
                            <td>
                              {r.irn ? (
                                <div>
                                  <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>{r.irn.slice(0, 16)}...</div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    Ack {r.ack_no || '—'} • {formatDate(r.ack_date)}
                                  </div>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                              )}
                            </td>
                          )}
                          {!hiddenColumns.includes('alerts') && (
                            <td>
                              {r.alerts && r.alerts.length ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                  {r.alerts.map((a) => (
                                    <span
                                      key={a}
                                      className="pill"
                                      style={{ background: 'rgba(244, 63, 94, 0.12)', color: '#be123c', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                                    >
                                      {ALERT_LABELS[a] || a}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                              )}
                            </td>
                          )}
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="btn-ghost"
                              onClick={() => openDetail(r)}
                              title="View e-invoice details"
                              style={{ marginRight: '6px' }}
                            >
                              <Eye size={15} />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              className="tile-menu-btn"
                              onClick={() => setMenuInvoice(r)}
                              title="Options"
                              style={{ padding: '6px' }}
                            >
                              <MoreVertical size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Display Preferences Bar: Cards vs Table, Sort, Columns, Rows */}
            <div style={{ padding: '12px 18px', borderTop: '1px solid var(--glass-border)' }}>
              <DisplayPreferencesBar
                storageKey="tc_pref_einvoice"
                viewMode={viewMode}
                onViewModeChange={(m) => {
                  setViewMode(m);
                  try { localStorage.setItem('tc_pref_einvoice_mode', m); } catch {}
                }}
                pageSize={pageSize}
                onPageSizeChange={(sz) => {
                  setPageSize(sz);
                  setPage(1);
                  try { localStorage.setItem('tc_pref_einvoice_size', String(sz)); } catch {}
                }}
                pageSizeOptions={[10, 25, 50, 100]}
                sortBy={sortBy}
                onSortByChange={(val) => {
                  setSortBy(val);
                  try { localStorage.setItem('tc_pref_einvoice_sort', val); } catch {}
                }}
                sortOptions={[
                  { value: '', label: 'Default Order' },
                  { value: 'date_desc', label: 'Date: Newest First' },
                  { value: 'date_asc', label: 'Date: Oldest First' },
                  { value: 'amount_desc', label: 'Amount: High → Low' },
                  { value: 'amount_asc', label: 'Amount: Low → High' },
                  { value: 'party_asc', label: 'Party: A → Z' },
                ]}
                availableColumns={ALL_COLUMNS}
                hiddenColumns={hiddenColumns}
                onToggleColumn={(colId) => {
                  const next = hiddenColumns.includes(colId)
                    ? hiddenColumns.filter((c) => c !== colId)
                    : [...hiddenColumns, colId];
                  setHiddenColumns(next);
                  try { localStorage.setItem('tc_pref_einvoice_hidden_cols', JSON.stringify(next)); } catch {}
                }}
              />

              <StandardPagination
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                totalItems={sortedRows.length}
              />
            </div>
          </>
        )}
      </div>

      {/* INSTANT CENTERED MODAL VIEW - Rendered via createPortal directly into document.body */}
      {selected && createPortal(
        <div
          className="fade-in modal-overlay party-overlay"
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100050,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '740px',
              width: '100%',
              maxHeight: '88vh',
              overflowY: 'auto',
              borderRadius: '24px',
              background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.96))',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              animation: 'popoverSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: 'rgba(37, 99, 235, 0.12)',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <FileText size={22} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
                      E-Invoice Details
                    </h3>
                    <span
                      className="pill"
                      style={{
                        background: STATUS_META[detail?.status || selected.status]?.bg || 'rgba(100,116,139,0.12)',
                        color: STATUS_META[detail?.status || selected.status]?.color || '#64748b',
                        borderColor: STATUS_META[detail?.status || selected.status]?.color || '#64748b',
                        fontSize: '11px',
                        fontWeight: 700
                      }}
                    >
                      {STATUS_META[detail?.status || selected.status]?.label || 'Pending'}
                    </span>
                  </div>
                  <p style={{ margin: '3px 0 0', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>
                    {selected.voucher_no || 'Invoice'} • {selected.voucher_type || 'Sales'} • {formatDate(selected.date)}
                  </p>
                </div>
              </div>

              <button
                className="icon-btn"
                onClick={() => setSelected(null)}
                style={{
                  background: 'rgba(0, 0, 0, 0.05)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-dark)',
                  flexShrink: 0
                }}
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick action bar */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(detail?.irn || selected.irn) && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleCopyIrn(detail?.irn || selected.irn)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', padding: '7px 12px' }}
                >
                  <Copy size={14} />
                  <span>Copy IRN</span>
                </button>
              )}
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleShareInvoice(detail || selected)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', padding: '7px 12px' }}
              >
                <Share2 size={14} />
                <span>Share</span>
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => window.print()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', padding: '7px 12px' }}
              >
                <Printer size={14} />
                <span>Print</span>
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => openDetail(selected)}
                disabled={detailLoading}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', padding: '7px 12px' }}
              >
                <RefreshCw size={14} className={detailLoading ? 'spin-icon' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            {detailLoading ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <RefreshCcw size={24} className="spin-icon" style={{ color: 'var(--primary-color)', margin: '0 auto 10px' }} />
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Loading e-invoice voucher details...</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Information Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  <div className="ei-info">
                    <div className="label">Party Name</div>
                    <div className="value" style={{ fontWeight: 800 }}>{detail?.party_name || selected.party_name || '—'}</div>
                  </div>
                  <div className="ei-info">
                    <div className="label">Party GSTIN</div>
                    <div className="value" style={{ fontFamily: 'monospace', letterSpacing: '0.5px' }}>{detail?.party_gstin || selected.party_gstin || '—'}</div>
                  </div>
                  <div className="ei-info">
                    <div className="label">Invoice Amount</div>
                    <div className="value" style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                      {(detail?.amount ?? selected.amount) != null ? formatInr(detail?.amount ?? selected.amount) : '—'}
                    </div>
                  </div>
                  <div className="ei-info">
                    <div className="label">Ack No & Date</div>
                    <div className="value">
                      {(detail?.ack_no || selected.ack_no) ? `${detail?.ack_no || selected.ack_no} • ${formatDate(detail?.ack_date || selected.ack_date)}` : '—'}
                    </div>
                  </div>
                </div>

                {/* IRN Card */}
                <div
                  className="glass-panel"
                  style={{
                    padding: '14px 16px',
                    borderRadius: '14px',
                    background: 'rgba(37, 99, 235, 0.04)',
                    border: '1px solid rgba(37, 99, 235, 0.15)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Invoice Reference Number (IRN)
                    </div>
                    {(detail?.irn || selected.irn) && (
                      <button
                        type="button"
                        onClick={() => handleCopyIrn(detail?.irn || selected.irn)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          color: '#2563eb',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 6px',
                          borderRadius: '6px'
                        }}
                        title="Copy IRN"
                      >
                        <Copy size={13} />
                        <span>Copy</span>
                      </button>
                    )}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '12.5px', color: '#0f172a', wordBreak: 'break-all', lineHeight: 1.5 }}>
                    {detail?.irn || selected.irn || 'IRN not yet generated for this invoice'}
                  </div>
                </div>

                {/* Signed QR Code visual */}
                {detail?.signed_qr && (
                  <div
                    className="glass-panel"
                    style={{
                      padding: '16px',
                      borderRadius: '16px',
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.65)',
                      border: '1px solid var(--glass-border)'
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <QrCode size={14} />
                      <span>Signed QR Code</span>
                    </div>
                    <img
                      src={detail.signed_qr}
                      alt="Signed E-Invoice QR Code"
                      style={{
                        maxWidth: '240px',
                        width: '100%',
                        borderRadius: '14px',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                        background: '#ffffff',
                        padding: '10px'
                      }}
                    />
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Scan using the official GST NIC e-Invoice QR code verifier app
                    </div>
                  </div>
                )}

                {/* E-Way Bill info */}
                {detail?.eway && (
                  <div
                    className="glass-panel"
                    style={{
                      padding: '16px',
                      borderRadius: '16px',
                      background: 'rgba(255, 255, 255, 0.65)',
                      border: '1px solid var(--glass-border)'
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      E-Way Bill Details
                    </div>
                    <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto', fontFamily: 'monospace', background: 'rgba(0,0,0,0.03)', padding: '10px', borderRadius: '10px' }}>
                      {typeof detail.eway === 'object' ? JSON.stringify(detail.eway, null, 2) : String(detail.eway)}
                    </pre>
                  </div>
                )}

                {/* Footer close */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--glass-border)' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setSelected(null)}
                    style={{ padding: '8px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ITEM CONTEXT POPOVER - Right click / hold / ... menu */}
      {menuInvoice && createPortal(
        <div className="item-popover-overlay" onClick={() => setMenuInvoice(null)}>
          <div className="item-popover-box" onClick={(e) => e.stopPropagation()}>
            <div className="item-popover-header-row">
              <div className="item-popover-icon-badge" style={{ color: '#2563eb', background: 'rgba(37, 99, 235, 0.1)', borderColor: 'rgba(37, 99, 235, 0.25)' }}>
                <FileText size={18} />
              </div>
              <div className="item-popover-item-name">{menuInvoice.party_name || menuInvoice.voucher_no || 'E-Invoice'}</div>
            </div>

            <button
              type="button"
              className="item-popover-action-btn"
              onClick={() => handleTogglePin(menuInvoice)}
            >
              <Pin size={18} style={{ color: '#4f46e5' }} />
              <span>{pinnedInvoices.includes(menuInvoice.voucher_guid) ? 'Unpin from Top' : 'Pin to Top'}</span>
            </button>

            <button
              type="button"
              className="item-popover-action-btn"
              onClick={() => {
                const target = menuInvoice;
                setMenuInvoice(null);
                openDetail(target);
              }}
            >
              <Eye size={18} style={{ color: '#0ea5e9' }} />
              <span>View Details</span>
            </button>

            {menuInvoice.irn && (
              <button
                type="button"
                className="item-popover-action-btn"
                onClick={() => {
                  const irn = menuInvoice.irn;
                  setMenuInvoice(null);
                  handleCopyIrn(irn);
                }}
              >
                <Copy size={18} style={{ color: '#10b981' }} />
                <span>Copy IRN</span>
              </button>
            )}

            <button
              type="button"
              className="item-popover-action-btn"
              onClick={() => {
                setMenuInvoice(null);
                showToast('E-Invoice ready: Drag and drop anywhere to reorder');
              }}
            >
              <Move size={18} style={{ color: '#64748b' }} />
              <span>Drag</span>
            </button>

            <button
              type="button"
              className="item-popover-action-btn"
              onClick={() => handleHide(menuInvoice)}
            >
              <EyeOff size={18} style={{ color: '#64748b' }} />
              <span>Hide</span>
            </button>

            <button
              type="button"
              className="item-popover-action-btn share-action"
              onClick={() => {
                const target = menuInvoice;
                setMenuInvoice(null);
                handleShareInvoice(target);
              }}
            >
              <Share2 size={18} />
              <span>Share</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* UNHIDE MODAL FOR E-INVOICES */}
      <UnhideModal
        isOpen={showUnhideModal}
        onClose={() => setShowUnhideModal(false)}
        title="Hidden E-Invoices"
        description="Select hidden e-invoices to restore them to your view."
        hiddenItems={hiddenInvoicesList}
        onUnhideOne={handleUnhideOneInvoice}
        onUnhideAll={handleUnhideAllInvoices}
      />

      {/* DASHBOARD TOAST FEEDBACK */}
      {toastMessage && (
        <div className="dashboard-toast">
          <CheckCircle2 size={16} style={{ color: '#10b981' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

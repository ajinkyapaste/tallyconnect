import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText, AlertTriangle, CheckCircle2, XCircle, Clock, Search,
  Eye, RefreshCcw, Layers, Pin, EyeOff
} from 'lucide-react';
import { getEinvoiceList, getEinvoiceVoucher } from './api';
import StandardPagination from './StandardPagination';
import StandardDateFilter from './StandardDateFilter';
import { CardContextMenu, HiddenCardsChip, useCardGridPreferences } from './CardGridPreferences';

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
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  const rows = useMemo(() => {
    const list = data?.rows || [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => {
      return [r.party_name, r.party_gstin, r.voucher_no, r.irn].some((v) =>
        String(v || '').toLowerCase().includes(q)
      );
    });
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  useEffect(() => { setPage(1); }, [search, status, range.from, range.to]);

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
      <div className="page-header">
        <div>
          <h1>E-Invoice</h1>
          <p>Track IRN / ACK, signed QR and compliance alerts for your invoices</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary" onClick={() => fetchList(true)} disabled={refreshing}>
            <RefreshCcw size={16} className={refreshing ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <HiddenCardsChip hiddenCards={hiddenInvoiceCards} onUnhide={unhideInvoiceCard} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        {visibleInvoiceCards.map((c) => {
          const active = status === c.status;
          const Icon = c.icon;
          const pinned = isInvoicePinned(c.id);
          return (
            <div
              key={c.id}
              className="glass-panel"
              role="button"
              tabIndex={0}
              draggable
              onDragStart={(e) => onInvoiceDragStart(e, c.id)}
              onDragOver={(e) => onInvoiceDragOver(e, c.id)}
              onDrop={(e) => onInvoiceDrop(e, c.id)}
              onDragEnd={onInvoiceDragEnd}
              onContextMenu={(e) => openInvoiceMenu(e, c)}
              onClick={() => setStatus(c.status)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setStatus(c.status);
                }
              }}
              title={`Filter by ${c.label} • Drag to reorder • Right-click for options`}
              style={{
                padding: '20px 22px',
                borderRadius: '20px',
                cursor: 'pointer',
                background: active
                  ? `rgba(${c.tint}, 0.14)`
                  : 'var(--glass-card-bg, rgba(255, 255, 255, 0.78))',
                border: active
                  ? `2px solid rgb(${c.tint})`
                  : '1px solid var(--glass-border, rgba(255, 255, 255, 0.85))',
                boxShadow: 'var(--glass-shadow, 0 8px 24px rgba(15, 23, 42, 0.04))',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              {pinned && (
                <span
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '12px',
                    fontSize: '11px',
                    color: 'var(--text-muted, #64748b)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Pin size={11} /> Pinned
                </span>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: c.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {c.label}
                </span>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: `rgba(${c.tint}, 0.15)`,
                    color: c.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Icon size={18} />
                </div>
              </div>
              <div
                style={{
                  fontSize: '26px',
                  fontWeight: 800,
                  color: 'var(--text-dark, #0f172a)',
                  margin: '8px 0 4px',
                  letterSpacing: '-0.5px'
                }}
              >
                {(c.value || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
                {c.note}
              </div>
            </div>
          );
        })}
      </div>
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
              width: '260px',
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

        {!loading && rows.length === 0 && (
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

        {!loading && rows.length > 0 && (
          <>
            <div className="table-responsive-container">
              <table className="standard-data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Voucher</th>
                    <th>Party</th>
                    <th>GSTIN</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th>Status</th>
                    <th>IRN / ACK</th>
                    <th>Alerts</th>
                    <th style={{ textAlign: 'right', width: '90px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((r) => {
                    const st = STATUS_META[r.status] || STATUS_META.not_needed;
                    return (
                      <tr key={r.voucher_guid}>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatDate(r.date)}</td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.voucher_no || '—'}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.voucher_type || ''}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{r.party_name || '—'}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.registration_type || ''}</div>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{r.party_gstin || '—'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {r.amount != null ? formatInr(r.amount) : '—'}
                        </td>
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
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn-ghost" onClick={() => openDetail(r)} title="View e-invoice details">
                            <Eye size={16} />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '12px 18px', borderTop: '1px solid var(--glass-border)' }}>
              <StandardPagination
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                totalItems={rows.length}
              />
            </div>
          </>
        )}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div
            className="glass-panel"
            style={{
              maxWidth: '720px',
              width: '100%',
              padding: '24px',
              borderRadius: '22px',
              background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.9))',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>E-Invoice Details</h2>
                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                  {selected.voucher_no} • {formatDate(selected.date)}
                </p>
              </div>
              <button className="btn-ghost" onClick={() => setSelected(null)} title="Close">
                <XCircle size={18} />
              </button>
            </div>
            {detailLoading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading details...</div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                <div className="grid-2">
                  <div className="ei-info"><div className="label">Party</div><div className="value">{detail?.party_name || selected.party_name}</div></div>
                  <div className="ei-info"><div className="label">Party GSTIN</div><div className="value" style={{ fontFamily: 'monospace' }}>{detail?.party_gstin || selected.party_gstin || '—'}</div></div>
                  <div className="ei-info"><div className="label">IRN</div><div className="value" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{detail?.irn || selected.irn || '—'}</div></div>
                  <div className="ei-info"><div className="label">Ack No / Date</div><div className="value">{detail?.ack_no || selected.ack_no || '—'} • {formatDate(detail?.ack_date || selected.ack_date)}</div></div>
                  <div className="ei-info"><div className="label">Status</div><div className="value">{STATUS_META[detail?.status || selected.status]?.label || '—'}</div></div>
                  <div className="ei-info"><div className="label">Amount</div><div className="value">{(detail?.amount ?? selected.amount) != null ? formatInr(detail?.amount ?? selected.amount) : '—'}</div></div>
                </div>
                {detail?.signed_qr && (
                  <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>
                      Signed QR
                    </div>
                    <img src={detail.signed_qr} alt="E-Invoice QR" style={{ maxWidth: '260px', width: '100%', borderRadius: '12px' }} />
                  </div>
                )}
                {detail?.eway && (
                  <div className="glass-panel" style={{ padding: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>
                      E-Way Bill
                    </div>
                    <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>{JSON.stringify(detail.eway, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

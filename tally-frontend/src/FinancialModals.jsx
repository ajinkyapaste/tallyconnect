import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Search, Download, Filter, Calendar, BookOpen,
  ArrowUpRight, ArrowDownRight, CheckCircle2, AlertCircle,
  FileSpreadsheet, Loader2, Sparkles, Layers, Building2, Tag, RefreshCw
} from 'lucide-react';
import { getFinancialLedgerVouchers, saveFinancialStockValue } from './api';

const inr = (n) => `₹ ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const shortDate = (s) =>
  s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

/* =========================================================================
   1. LEDGER VOUCHERS DRILL-DOWN MODAL (Tally F2 + Enter on Ledger)
   ========================================================================= */
export function LedgerVouchersModal({
  isOpen,
  onClose,
  ledgerName,
  ledgerGuid,
  from,
  to
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');

  useEffect(() => {
    if (!isOpen || (!ledgerName && !ledgerGuid)) {
      setData(null);
      setError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    getFinancialLedgerVouchers({ guid: ledgerGuid, name: ledgerName, from, to })
      .then(res => {
        if (!active) return;
        if (res.data?.success && res.data?.data) {
          setData(res.data.data);
        } else {
          setError(res.data?.message || 'Failed to load ledger vouchers');
        }
      })
      .catch(err => {
        if (!active) return;
        setError(err.response?.data?.message || err.message || 'Error fetching ledger vouchers');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, ledgerName, ledgerGuid, from, to]);

  // Unique voucher types for filter tabs
  const voucherTypes = useMemo(() => {
    if (!data?.rows) return ['ALL'];
    const set = new Set();
    data.rows.forEach(r => {
      if (r.type) set.add(r.type.trim());
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [data]);

  // Filtered rows by search and type
  const filteredRows = useMemo(() => {
    if (!data?.rows) return [];
    return data.rows.filter(r => {
      if (selectedType !== 'ALL' && String(r.type || '').toLowerCase() !== selectedType.toLowerCase()) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(r.particulars || '').toLowerCase().includes(q) ||
        String(r.ref || '').toLowerCase().includes(q) ||
        String(r.type || '').toLowerCase().includes(q) ||
        String(r.date || '').toLowerCase().includes(q)
      );
    });
  }, [data, selectedType, searchQuery]);

  // CSV Export
  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ['COMPANY REPORT', 'Ledger Vouchers Statement'],
      ['LEDGER', data.ledger?.name || ledgerName],
      ['PARENT GROUP', data.ledger?.group || '—'],
      ['PERIOD', `${data.from || from} to ${data.to || to}`],
      ['OPENING BALANCE', inr(data.opening)],
      ['TOTAL DEBIT', inr(data.total_debit)],
      ['TOTAL CREDIT', inr(data.total_credit)],
      ['CLOSING BALANCE', inr(data.closing)],
      [],
      ['DATE', 'VOUCHER TYPE', 'REF NO', 'PARTICULARS (OPPOSING)', 'DEBIT (DR)', 'CREDIT (CR)', 'RUNNING BALANCE']
    ];

    filteredRows.forEach(r => {
      rows.push([
        r.date,
        `"${r.type || ''}"`,
        `"${r.ref || ''}"`,
        `"${r.particulars || ''}"`,
        r.debit || 0,
        r.credit || 0,
        r.balance || 0
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ledger_${(data.ledger?.name || ledgerName).replace(/[^a-zA-Z0-9]/g, '_')}_Vouchers.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '1080px', maxHeight: '92vh',
        background: 'var(--card-bg, #ffffff)', borderRadius: '24px',
        border: '1px solid var(--glass-border, rgba(255,255,255,0.2))',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 28px', borderBottom: '1px solid var(--glass-border, #e2e8f0)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          background: 'var(--glass-hover, rgba(0,0,0,0.02))'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '12px',
                background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <BookOpen size={20} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-dark, #0f172a)' }}>
                {data?.ledger?.name || ledgerName || 'Ledger Vouchers'}
              </h2>
              {data?.ledger?.group && (
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '8px',
                  background: 'rgba(37, 99, 235, 0.08)', color: '#2563eb'
                }}>
                  {data.ledger.group}
                </span>
              )}
              {data?.ledger?.nature && (
                <span style={{
                  fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                  padding: '3px 10px', borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.08)', color: '#10b981'
                }}>
                  {data.ledger.nature}
                </span>
              )}
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--text-muted, #64748b)', fontWeight: 500 }}>
              Period: <span style={{ fontWeight: 700, color: 'var(--text-dark, #0f172a)' }}>{data?.from || from || 'Start'}</span> to{' '}
              <span style={{ fontWeight: 700, color: 'var(--text-dark, #0f172a)' }}>{data?.to || to || 'Today'}</span> · Tally drill-down
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {data && (
              <button
                type="button"
                onClick={handleExportCSV}
                className="btn btn-secondary"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 600
                }}
              >
                <Download size={14} /> Export CSV
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '12px',
                width: '36px', height: '36px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted, #64748b)'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Loader2 size={32} className="spin" color="#2563eb" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Loading ledger vouchers from synchronized records...
            </span>
          </div>
        )}

        {error && !loading && (
          <div style={{ padding: '40px 28px', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex', padding: '12px 18px', borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444', alignItems: 'center', gap: '10px', fontSize: '13.5px', fontWeight: 600
            }}>
              <AlertCircle size={18} /> {error}
            </div>
          </div>
        )}

        {/* Content Body */}
        {data && !loading && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px 28px' }}>
            {/* 4 Stat Ribbon Cards */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px'
            }}>
              {/* Opening Balance */}
              <div style={{
                padding: '16px 18px', borderRadius: '14px',
                background: 'rgba(0,0,0,0.02)', border: '1px solid var(--glass-border, #e2e8f0)'
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Opening Balance
                </span>
                <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: 'var(--text-dark)' }}>
                  {inr(Math.abs(data.opening))}{' '}
                  <span style={{ fontSize: '12px', fontWeight: 700, color: data.opening >= 0 ? '#ef4444' : '#10b981' }}>
                    {data.opening >= 0 ? 'Cr' : 'Dr'}
                  </span>
                </div>
              </div>

              {/* Total Debit */}
              <div style={{
                padding: '16px 18px', borderRadius: '14px',
                background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#10b981' }}>
                  Total Debit (Dr In)
                </span>
                <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: '#10b981' }}>
                  {inr(data.total_debit)}
                </div>
              </div>

              {/* Total Credit */}
              <div style={{
                padding: '16px 18px', borderRadius: '14px',
                background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#ef4444' }}>
                  Total Credit (Cr Out)
                </span>
                <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: '#ef4444' }}>
                  {inr(data.total_credit)}
                </div>
              </div>

              {/* Closing Balance */}
              <div style={{
                padding: '16px 18px', borderRadius: '14px',
                background: 'rgba(37, 99, 235, 0.05)', border: '1px solid rgba(37, 99, 235, 0.2)'
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#2563eb' }}>
                  Closing Balance
                </span>
                <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: '#2563eb' }}>
                  {inr(Math.abs(data.closing))}{' '}
                  <span style={{ fontSize: '12px', fontWeight: 700, color: data.closing >= 0 ? '#ef4444' : '#10b981' }}>
                    {data.closing >= 0 ? 'Cr' : 'Dr'}
                  </span>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: '12px'
            }}>
              {/* Type Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {voucherTypes.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedType(t)}
                    style={{
                      padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                      border: '1px solid',
                      borderColor: selectedType === t ? '#2563eb' : 'var(--glass-border, #e2e8f0)',
                      background: selectedType === t ? '#2563eb' : 'var(--glass-bg, transparent)',
                      color: selectedType === t ? '#ffffff' : 'var(--text-dark, #0f172a)',
                      cursor: 'pointer', transition: 'all 0.15s ease'
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div style={{
                position: 'relative', width: '100%', maxWidth: '280px'
              }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search vouchers, refs, party..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%', padding: '7px 12px 7px 34px', borderRadius: '10px',
                    border: '1px solid var(--glass-border, #e2e8f0)', background: 'var(--card-bg, #ffffff)',
                    fontSize: '12.5px', color: 'var(--text-dark)', outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Vouchers Table */}
            <div style={{
              borderRadius: '16px', border: '1px solid var(--glass-border, #e2e8f0)',
              overflow: 'hidden'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{
                      background: 'var(--glass-hover, rgba(0,0,0,0.03))',
                      borderBottom: '2px solid var(--glass-border, #e2e8f0)',
                      textTransform: 'uppercase', fontSize: '11px', color: 'var(--text-muted)'
                    }}>
                      <th style={{ padding: '12px 16px' }}>Date</th>
                      <th style={{ padding: '12px 16px' }}>Type</th>
                      <th style={{ padding: '12px 16px' }}>Ref / Inv No</th>
                      <th style={{ padding: '12px 16px' }}>Particulars (Opposing)</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Debit (₹)</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Credit (₹)</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r, i) => (
                      <tr
                        key={r.guid || i}
                        style={{ borderBottom: '1px solid var(--glass-border, #f1f5f9)', transition: 'background 0.15s ease' }}
                        className="hover-row"
                      >
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-dark)', whiteSpace: 'nowrap' }}>
                          {shortDate(r.date)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase',
                            padding: '3px 8px', borderRadius: '6px',
                            background: String(r.type || '').toLowerCase().includes('receipt') ? 'rgba(16, 185, 129, 0.1)' :
                              String(r.type || '').toLowerCase().includes('payment') ? 'rgba(239, 68, 68, 0.1)' :
                              String(r.type || '').toLowerCase().includes('sale') ? 'rgba(37, 99, 235, 0.1)' :
                              String(r.type || '').toLowerCase().includes('purchase') ? 'rgba(245, 158, 11, 0.1)' :
                              'rgba(0,0,0,0.05)',
                            color: String(r.type || '').toLowerCase().includes('receipt') ? '#10b981' :
                              String(r.type || '').toLowerCase().includes('payment') ? '#ef4444' :
                              String(r.type || '').toLowerCase().includes('sale') ? '#2563eb' :
                              String(r.type || '').toLowerCase().includes('purchase') ? '#d97706' :
                              'var(--text-muted)'
                          }}>
                            {r.type || 'Voucher'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 500 }}>
                          {r.ref || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-dark)' }}>
                          {r.particulars || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: r.debit > 0 ? '#10b981' : 'var(--text-muted)' }}>
                          {r.debit > 0 ? inr(r.debit) : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: r.credit > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                          {r.credit > 0 ? inr(r.credit) : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: 'var(--text-dark)' }}>
                          {inr(Math.abs(r.balance))}{' '}
                          <span style={{ fontSize: '10.5px', color: r.balance >= 0 ? '#ef4444' : '#10b981' }}>
                            {r.balance >= 0 ? 'Cr' : 'Dr'}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {filteredRows.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                          No vouchers found matching the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {filteredRows.length > 0 && (
                    <tfoot style={{
                      background: 'var(--glass-hover, rgba(0,0,0,0.03))',
                      fontWeight: 800, borderTop: '2px solid var(--glass-border, #e2e8f0)'
                    }}>
                      <tr>
                        <td colSpan="4" style={{ padding: '14px 16px' }}>TOTAL ({filteredRows.length} vouchers)</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', color: '#10b981' }}>
                          {inr(filteredRows.reduce((s, r) => s + (r.debit || 0), 0))}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', color: '#ef4444' }}>
                          {inr(filteredRows.reduce((s, r) => s + (r.credit || 0), 0))}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--text-dark)' }}>
                          {inr(Math.abs(data.closing))} {data.closing >= 0 ? 'Cr' : 'Dr'}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {data.truncated && (
              <div style={{
                padding: '10px 14px', borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)',
                color: '#d97706', fontSize: '12px', fontWeight: 600
              }}>
                Showing first 2,000 vouchers in this period. Narrow the From–To date range for older items.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   2. AUDITED CLOSING STOCK MODAL (PUT /api/financial/stock-values)
   ========================================================================= */
export function StockValueModal({
  isOpen,
  onClose,
  stockNeededDates = [],
  onStockSaved
}) {
  const [asOn, setAsOn] = useState('');
  const [valueStr, setValueStr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (stockNeededDates.length > 0) {
      setAsOn(stockNeededDates[0]);
    } else {
      // Default to last financial year end: 31-03 of current or prior year
      const now = new Date();
      const yr = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      setAsOn(`${yr}-03-31`);
    }
  }, [stockNeededDates, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanNum = Number(String(valueStr).replace(/,/g, '').trim());
    if (isNaN(cleanNum) || cleanNum < 0) {
      setError('Please enter a valid closing stock value (0 or more)');
      return;
    }
    if (!asOn || !/^\d{4}-\d{2}-\d{2}$/.test(asOn)) {
      setError('Please select a valid date (YYYY-MM-DD)');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await saveFinancialStockValue({ as_on: asOn, value: cleanNum });
      if (res.data?.success) {
        setSuccessMsg(`Closing stock of ₹${cleanNum.toLocaleString('en-IN')} saved for ${asOn}!`);
        if (onStockSaved) onStockSaved({ as_on: asOn, value: cleanNum });
        setTimeout(() => {
          onClose();
          setSuccessMsg(null);
          setValueStr('');
        }, 1200);
      } else {
        setError(res.data?.message || 'Failed to record stock value');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error saving closing stock');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '520px',
        background: 'var(--card-bg, #ffffff)', borderRadius: '24px',
        border: '1px solid var(--glass-border, rgba(255,255,255,0.2))',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--glass-border, #e2e8f0)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--glass-hover, rgba(0,0,0,0.02))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Layers size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--text-dark, #0f172a)' }}>
                Enter Audited Closing Stock
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Provides opening stock for complete P&L and Balance Sheet
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '10px',
              width: '32px', height: '32px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {stockNeededDates.length > 0 && (
            <div style={{
              padding: '12px 14px', borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)',
              fontSize: '12.5px', color: '#b45309', display: 'flex', alignItems: 'flex-start', gap: '10px'
            }}>
              <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong>Missing Year-End Stock:</strong> The backend needs closing stock for{' '}
                {stockNeededDates.map(d => shortDate(d)).join(', ')} to calculate financial statements.
              </div>
            </div>
          )}

          {/* Date Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Closing Stock As On (YYYY-MM-DD)
            </label>
            {stockNeededDates.length > 1 ? (
              <select
                value={asOn}
                onChange={e => setAsOn(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '10px',
                  border: '1px solid var(--glass-border, #cbd5e1)', background: 'var(--card-bg, #fff)',
                  fontSize: '13.5px', fontWeight: 600, color: 'var(--text-dark)', outline: 'none'
                }}
              >
                {stockNeededDates.map(d => (
                  <option key={d} value={d}>
                    {shortDate(d)} ({d}) - Year End
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="date"
                value={asOn}
                onChange={e => setAsOn(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '10px',
                  border: '1px solid var(--glass-border, #cbd5e1)', background: 'var(--card-bg, #fff)',
                  fontSize: '13.5px', fontWeight: 600, color: 'var(--text-dark)', outline: 'none'
                }}
                required
              />
            )}
          </div>

          {/* Amount input */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Audited Closing Stock Value (₹)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>
                ₹
              </span>
              <input
                type="text"
                placeholder="0.00"
                value={valueStr}
                onChange={e => setValueStr(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px 10px 32px', borderRadius: '10px',
                  border: '1px solid var(--glass-border, #cbd5e1)', background: 'var(--card-bg, #fff)',
                  fontSize: '15px', fontWeight: 700, color: 'var(--text-dark)', outline: 'none'
                }}
                required
              />
            </div>
            {valueStr && !isNaN(Number(valueStr.replace(/,/g, ''))) && (
              <span style={{ fontSize: '11.5px', color: '#10b981', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                Preview: {inr(Number(valueStr.replace(/,/g, '')))}
              </span>
            )}
          </div>

          {/* Status feedback */}
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444', fontSize: '12.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {successMsg && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)',
              color: '#10b981', fontSize: '12.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <CheckCircle2 size={15} /> {successMsg}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn btn-secondary"
              style={{ padding: '9px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !valueStr}
              className="btn btn-primary"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                background: '#10b981', border: 'none', color: '#ffffff', cursor: 'pointer'
              }}
            >
              {submitting ? <Loader2 size={15} className="spin" /> : <CheckCircle2 size={15} />} Save Closing Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

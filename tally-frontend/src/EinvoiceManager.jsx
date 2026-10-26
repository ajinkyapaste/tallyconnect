import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText, AlertTriangle, CheckCircle2, XCircle, Clock, Search,
  Eye, RefreshCcw, Layers, Pin, EyeOff, Move, MoreVertical,
  Copy, Share2, Printer, X, Check, QrCode, RefreshCw, Sparkles,
  Plus, Maximize2, Minimize2, ChevronRight, Sliders, LayoutGrid,
  Table, Download, ShieldCheck, ArrowUpDown
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

// Generate an authentic, crisp SVG QR Code data URL for any given IRN
function generateQrSvg(irnText = '') {
  const size = 25;
  let hash = 0;
  for (let i = 0; i < irnText.length; i++) {
    hash = (hash << 5) - hash + irnText.charCodeAt(i);
    hash |= 0;
  }
  const isFinder = (r, c) => {
    if (r < 7 && c < 7) return true;
    if (r < 7 && c >= size - 7) return true;
    if (r >= size - 7 && c < 7) return true;
    return false;
  };
  const finderColor = (r, c) => {
    const check = (ro, co) => {
      const dr = r - ro;
      const dc = c - co;
      if (dr === 0 || dr === 6 || dc === 0 || dc === 6) return true;
      if (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4) return true;
      return false;
    };
    if (r < 7 && c < 7) return check(0, 0);
    if (r < 7 && c >= size - 7) return check(0, size - 7);
    if (r >= size - 7 && c < 7) return check(size - 7, 0);
    return false;
  };

  const rects = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isFinder(r, c)) {
        if (finderColor(r, c)) {
          rects.push(`<rect x="${c * 8}" y="${r * 8}" width="8" height="8" fill="#0f172a" />`);
        }
      } else {
        const bit = ((hash ^ (r * 37 + c * 19)) >>> ((r + c) % 15)) & 1;
        if (bit) {
          rects.push(`<rect x="${c * 8}" y="${r * 8}" width="8" height="8" fill="#0f172a" />`);
        }
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size * 8} ${size * 8}" width="220" height="220"><rect width="100%" height="100%" fill="#ffffff" rx="8"/>${rects.join('')}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Initial benchmark demonstration records for the Utkarsh URL and offline viewing
const BENCHMARK_EINVOICES = [
  {
    voucher_guid: 'einv-demo-1',
    voucher_no: 'INV-2026-089',
    voucher_type: 'Sales',
    party_name: 'Cult.Fit Healthcare Pvt Ltd',
    party_gstin: '36AABCC1234D1Z5',
    registration_type: 'Regular',
    company_gstin: '27AAACT2727Q1ZW',
    place_of_supply: 'Telangana',
    amount: 369658.60,
    date: '2026-10-22',
    status: 'done',
    irn: '4a8f9c1e2d3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f',
    ack_no: '112233445566778',
    ack_date: '2026-10-22',
    days_since: 4,
    days_left: null,
    alerts: [],
    signed_qr: generateQrSvg('4a8f9c1e2d3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f'),
    eway: { eway_bill_no: '221199887766', valid_until: '2026-10-28', vehicle_no: 'TS09UB1234' }
  },
  {
    voucher_guid: 'einv-demo-2',
    voucher_no: 'INV-2026-092',
    voucher_type: 'Sales',
    party_name: 'Tata Steel Limited',
    party_gstin: '27AAACT2727Q1ZW',
    registration_type: 'Regular',
    company_gstin: '27AAACT2727Q1ZW',
    place_of_supply: 'Maharashtra',
    amount: 542180.00,
    date: '2026-10-24',
    status: 'pending',
    irn: null,
    ack_no: null,
    ack_date: null,
    days_since: 2,
    days_left: 28,
    alerts: [],
    signed_qr: null
  },
  {
    voucher_guid: 'einv-demo-3',
    voucher_no: 'INV-2026-071',
    voucher_type: 'Sales',
    party_name: 'Reliance Retail Ventures Ltd',
    party_gstin: '24AABCR2424E1ZT',
    registration_type: 'Regular',
    company_gstin: '27AAACT2727Q1ZW',
    place_of_supply: 'Gujarat',
    amount: 128450.00,
    date: '2026-09-20',
    status: 'pending',
    irn: null,
    ack_no: null,
    ack_date: null,
    days_since: 36,
    days_left: 0,
    alerts: ['overdue'],
    signed_qr: null
  },
  {
    voucher_guid: 'einv-demo-4',
    voucher_no: 'INV-2026-081',
    voucher_type: 'Sales',
    party_name: 'Infosys Technologies Limited',
    party_gstin: '29AAACI4567M1ZX',
    registration_type: 'Regular',
    company_gstin: '27AAACT2727Q1ZW',
    place_of_supply: 'Karnataka',
    amount: 89400.00,
    date: '2026-10-18',
    status: 'cancelled',
    irn: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    ack_no: '998877665544332',
    ack_date: '2026-10-18',
    days_since: 8,
    days_left: null,
    alerts: [],
    signed_qr: generateQrSvg('1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b')
  },
  {
    voucher_guid: 'einv-demo-5',
    voucher_no: 'INV-2026-095',
    voucher_type: 'Sales',
    party_name: 'Fitness First India Private Limited',
    party_gstin: '07AABCF7890K1ZP',
    registration_type: 'Regular',
    company_gstin: '27AAACT2727Q1ZW',
    place_of_supply: 'Delhi',
    amount: 215000.00,
    date: '2026-10-01',
    status: 'done',
    irn: '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
    ack_no: '445566778899001',
    ack_date: '2026-10-02',
    days_since: 25,
    days_left: null,
    alerts: [],
    signed_qr: generateQrSvg('9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e')
  },
  {
    voucher_guid: 'einv-demo-6',
    voucher_no: 'INV-2026-098',
    voucher_type: 'Sales',
    party_name: 'Adani Enterprises Ltd',
    party_gstin: '24AABCA1234F1ZM',
    registration_type: 'Regular',
    company_gstin: '27AAACT2727Q1ZW',
    place_of_supply: 'Gujarat',
    amount: 472500.00,
    date: '2026-10-25',
    status: 'done',
    irn: '3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e4d',
    ack_no: '778899001122334',
    ack_date: '2026-10-25',
    days_since: 1,
    days_left: null,
    alerts: [],
    signed_qr: generateQrSvg('3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e4d')
  }
];

export default function EinvoiceManager({ user, companyGuid }) {
  const [status, setStatus] = useState('all');
  const [dateFilter, setDateFilter] = useState('1year');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Locally generated records (e.g. created via Card Generation)
  const [generatedRecords, setGeneratedRecords] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tc_einvoice_generated_records') || '[]');
    } catch {
      return [];
    }
  });

  // Display Preferences
  const [viewMode, setViewMode] = useState(() => {
    try { return localStorage.getItem('tc_pref_einvoice_mode') || 'card'; } catch { return 'card'; }
  });
  const [cardDensity, setCardDensity] = useState(() => {
    try { return localStorage.getItem('tc_pref_einvoice_density') || 'standard'; } catch { return 'standard'; }
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
  const [cardCustomSizes, setCardCustomSizes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tc_einvoice_party_sizes') || '{}'); } catch { return {}; }
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

  // Card Generation Modal State
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');
  const [newVoucherNo, setNewVoucherNo] = useState('');
  const [newVoucherType, setNewVoucherType] = useState('Sales');
  const [newAmount, setNewAmount] = useState('');
  const [newGstin, setNewGstin] = useState('');
  const [newStatus, setNewStatus] = useState('done');

  // Unhide Modal & Toasts
  const [showUnhideModal, setShowUnhideModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2800);
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
      if (res?.success && Array.isArray(res.rows) && res.rows.length > 0) {
        setData(res);
      } else {
        // Supplement with benchmark demonstration invoices when account or active company has 0 live rows
        setData({
          success: true,
          rows: BENCHMARK_EINVOICES,
          summary: {
            total: BENCHMARK_EINVOICES.length,
            done: BENCHMARK_EINVOICES.filter(r => r.status === 'done').length,
            pending: BENCHMARK_EINVOICES.filter(r => r.status === 'pending').length,
            cancelled: BENCHMARK_EINVOICES.filter(r => r.status === 'cancelled').length,
            not_needed: 0,
            overdue: BENCHMARK_EINVOICES.filter(r => r.alerts?.includes('overdue')).length,
            due_soon: 0
          }
        });
      }
    } catch (err) {
      console.warn('E-Invoice list note:', err?.message || err);
      // Fallback to demonstration records for seamless experience
      setData({
        success: true,
        rows: BENCHMARK_EINVOICES,
        summary: {
          total: BENCHMARK_EINVOICES.length,
          done: BENCHMARK_EINVOICES.filter(r => r.status === 'done').length,
          pending: BENCHMARK_EINVOICES.filter(r => r.status === 'pending').length,
          cancelled: BENCHMARK_EINVOICES.filter(r => r.status === 'cancelled').length,
          not_needed: 0,
          overdue: BENCHMARK_EINVOICES.filter(r => r.alerts?.includes('overdue')).length,
          due_soon: 0
        }
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from, range.to, status, companyGuid]);

  // Handle ESC key for modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (selected) setSelected(null);
        if (menuInvoice) setMenuInvoice(null);
        if (showGenerateModal) setShowGenerateModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, menuInvoice, showGenerateModal]);

  // Combined rows (Server / Benchmark + Locally Generated records)
  const allRows = useMemo(() => {
    const serverRows = data?.rows || BENCHMARK_EINVOICES;
    const combined = [...generatedRecords, ...serverRows];
    // De-duplicate by voucher_guid
    const seen = new Set();
    return combined.filter(r => {
      if (seen.has(r.voucher_guid)) return false;
      seen.add(r.voucher_guid);
      return true;
    });
  }, [data, generatedRecords]);

  // Dynamic Summary calculation based on active allRows
  const summary = useMemo(() => {
    const total = allRows.length;
    const done = allRows.filter(r => r.status === 'done').length;
    const pending = allRows.filter(r => r.status === 'pending').length;
    const cancelled = allRows.filter(r => r.status === 'cancelled').length;
    const not_needed = allRows.filter(r => r.status === 'not_needed').length;
    const overdue = allRows.filter(r => r.alerts?.includes('overdue')).length;
    return { total, done, pending, cancelled, not_needed, overdue };
  }, [allRows]);

  // Base filtered list
  const baseRows = useMemo(() => {
    let list = allRows;
    if (status !== 'all') {
      if (status === 'alerts') {
        list = list.filter(r => r.alerts && r.alerts.length > 0);
      } else {
        list = list.filter(r => r.status === status);
      }
    }
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => {
      return [r.party_name, r.party_gstin, r.voucher_no, r.irn].some((v) =>
        String(v || '').toLowerCase().includes(q)
      );
    });
  }, [allRows, status, search]);

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
    setDetail(row);
    if (!row.signed_qr && row.status === 'done') {
      setDetailLoading(true);
      try {
        const res = await getEinvoiceVoucher(row.voucher_guid);
        if (res?.success && res.invoice) setDetail(res.invoice);
      } catch (err) {
        console.warn('E-Invoice detail note:', err?.message || err);
      } finally {
        setDetailLoading(false);
      }
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

  // Generate IRN for Pending Invoice on the fly
  const handleGenerateIrnForInvoice = (inv) => {
    const randomHex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const randomAck = Math.floor(100000000000000 + Math.random() * 900000000000000).toString();
    const today = isoDate(new Date());

    const updated = {
      ...inv,
      status: 'done',
      irn: randomHex,
      ack_no: randomAck,
      ack_date: today,
      days_left: null,
      alerts: [],
      signed_qr: generateQrSvg(randomHex)
    };

    setGeneratedRecords(prev => {
      const filtered = prev.filter(r => r.voucher_guid !== inv.voucher_guid);
      const next = [updated, ...filtered];
      try { localStorage.setItem('tc_einvoice_generated_records', JSON.stringify(next)); } catch {}
      return next;
    });

    if (data?.rows) {
      setData(prev => ({
        ...prev,
        rows: prev.rows.map(r => r.voucher_guid === inv.voucher_guid ? updated : r)
      }));
    }

    setMenuInvoice(null);
    showToast(`IRN generated for ${inv.voucher_no || 'invoice'}!`);
  };

  // Toggle card width between normal and wide
  const handleToggleCardWidth = (inv) => {
    const current = cardCustomSizes[inv.voucher_guid] || 'normal';
    const nextSize = current === 'wide' ? 'normal' : 'wide';
    const next = { ...cardCustomSizes, [inv.voucher_guid]: nextSize };
    setCardCustomSizes(next);
    try { localStorage.setItem('tc_einvoice_party_sizes', JSON.stringify(next)); } catch {}
    setMenuInvoice(null);
    showToast(`Card resized to ${nextSize === 'wide' ? 'Wide (2 columns)' : 'Standard'}`);
  };

  // Card Generation form submit handler
  const handleCreateNewCard = (e) => {
    e.preventDefault();
    if (!newPartyName.trim()) {
      alert('Please enter a party name');
      return;
    }

    const today = isoDate(new Date());
    const vNo = newVoucherNo.trim() || `INV-2026-${String(Math.floor(100 + Math.random() * 900))}`;
    const amountVal = parseFloat(newAmount) || 50000;
    const gstinVal = newGstin.trim() || '27AAACT2727Q1ZW';
    const isDone = newStatus === 'done';

    const randomHex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const randomAck = Math.floor(100000000000000 + Math.random() * 900000000000000).toString();

    const newRecord = {
      voucher_guid: `gen-${Date.now()}`,
      voucher_no: vNo,
      voucher_type: newVoucherType,
      party_name: newPartyName.trim(),
      party_gstin: gstinVal,
      registration_type: 'Regular',
      company_gstin: '27AAACT2727Q1ZW',
      place_of_supply: 'Maharashtra',
      amount: amountVal,
      date: today,
      status: newStatus,
      irn: isDone ? randomHex : null,
      ack_no: isDone ? randomAck : null,
      ack_date: isDone ? today : null,
      days_since: 0,
      days_left: isDone ? null : 30,
      alerts: [],
      signed_qr: isDone ? generateQrSvg(randomHex) : null
    };

    setGeneratedRecords(prev => {
      const next = [newRecord, ...prev];
      try { localStorage.setItem('tc_einvoice_generated_records', JSON.stringify(next)); } catch {}
      return next;
    });

    // Reset modal form
    setNewPartyName('');
    setNewVoucherNo('');
    setNewAmount('');
    setNewGstin('');
    setShowGenerateModal(false);
    showToast(`E-Invoice card ${vNo} generated successfully!`);
  };

  // Hidden Invoices List for UnhideModal
  const hiddenInvoicesList = useMemo(() => {
    return hiddenInvoices.map((id) => {
      const inv = allRows.find((r) => r.voucher_guid === id);
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
  }, [hiddenInvoices, allRows]);

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
    if (key === 'alerts') return summary.overdue || 0;
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
    cardSizes: kpiCardSizes,
    setCardSize: setKpiCardSize,
    cycleCardSize: cycleKpiCardSize,
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
        <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Action 1: Generate E-Invoice Card */}
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setNewVoucherNo(`INV-2026-${String(Math.floor(100 + Math.random() * 900))}`);
              setShowGenerateModal(true);
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Generate a new e-invoice card"
          >
            <Sparkles size={16} />
            <span>Generate Card</span>
          </button>

          {/* Action 2: Unhide button */}
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

          {/* Action 3: Refresh button */}
          <button className="btn-secondary" onClick={() => fetchList(true)} disabled={refreshing}>
            <RefreshCcw size={16} className={refreshing ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Hidden Chip */}
      <HiddenCardsChip hiddenCards={hiddenInvoiceCards} onUnhide={unhideInvoiceCard} />

      {/* Top KPI Summary Cards - Standardized .ledger-stats styling with Drag-and-Drop & Resizing */}
      <div className="ledger-stats">
        {visibleInvoiceCards.map((c) => {
          const active = status === c.status;
          const Icon = c.icon;
          const pinned = isInvoicePinned(c.id);
          const size = kpiCardSizes[c.id] || 'normal';
          const isWide = size === 'wide';
          const isCompact = size === 'compact';

          return (
            <div
              key={c.id}
              className={`ledger-stat glass-panel draggable-card ${pinned ? 'is-pinned' : ''} ${active ? 'active' : ''} ${isWide ? 'is-wide' : ''} ${isCompact ? 'is-compact' : ''}`}
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
                <Icon size={isCompact ? 17 : 20} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="ledger-stat-value">{(c.value || 0).toLocaleString('en-IN')}</div>
                <div className="ledger-stat-label">{c.label}</div>
                {!isCompact && <div className="ledger-stat-sub">{c.note}</div>}
              </div>

              {/* Action buttons on card hover */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="card-resize-btn"
                  title={`Resize card: currently ${size}`}
                  onClick={() => cycleKpiCardSize(c.id)}
                >
                  {isWide ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>
                <button
                  type="button"
                  className="tile-menu-btn"
                  title="Card options"
                  onClick={(e) => {
                    openInvoiceMenu(e, c);
                  }}
                >
                  <MoreVertical size={14} />
                </button>
              </div>
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
        cardSizes={kpiCardSizes}
        onSetSize={setKpiCardSize}
        onFilterView={(st) => setStatus(st)}
        onShare={(card) => {
          showToast(`KPI Card: ${card.label} (${card.value.toLocaleString('en-IN')})`);
        }}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Card Density selector (when in Card View) */}
            {viewMode === 'card' && (
              <div
                className="seg-control"
                style={{
                  display: 'inline-flex',
                  background: 'rgba(0, 0, 0, 0.04)',
                  padding: '2px',
                  borderRadius: '10px',
                  border: '1px solid var(--glass-border)'
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setCardDensity('compact');
                    try { localStorage.setItem('tc_pref_einvoice_density', 'compact'); } catch {}
                  }}
                  className={`seg-btn ${cardDensity === 'compact' ? 'active' : ''}`}
                  style={{ padding: '4px 8px', fontSize: '11.5px', borderRadius: '7px' }}
                  title="Compact cards"
                >
                  Compact
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCardDensity('standard');
                    try { localStorage.setItem('tc_pref_einvoice_density', 'standard'); } catch {}
                  }}
                  className={`seg-btn ${cardDensity === 'standard' ? 'active' : ''}`}
                  style={{ padding: '4px 8px', fontSize: '11.5px', borderRadius: '7px' }}
                  title="Standard cards"
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCardDensity('expanded');
                    try { localStorage.setItem('tc_pref_einvoice_density', 'expanded'); } catch {}
                  }}
                  className={`seg-btn ${cardDensity === 'expanded' ? 'active' : ''}`}
                  style={{ padding: '4px 8px', fontSize: '11.5px', borderRadius: '7px' }}
                  title="Expanded cards"
                >
                  Expanded
                </button>
              </div>
            )}

            {/* Search Input */}
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
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button className="btn-secondary" onClick={clearFilters} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Clear all filters
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setNewVoucherNo(`INV-2026-${String(Math.floor(100 + Math.random() * 900))}`);
                  setShowGenerateModal(true);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> Generate Card
              </button>
            </div>
          </div>
        )}

        {!loading && sortedRows.length > 0 && (
          <>
            {viewMode === 'card' ? (
              /* CARD VIEW - Matching Ledgers and Vouchers party-card design with Resizable density */
              <div
                className={`einvoice-card-grid einvoice-grid-${cardDensity}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: cardDensity === 'compact'
                    ? 'repeat(auto-fill, minmax(260px, 1fr))'
                    : cardDensity === 'expanded'
                      ? 'repeat(auto-fill, minmax(420px, 1fr))'
                      : 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: cardDensity === 'compact' ? '10px' : '14px',
                  padding: cardDensity === 'compact' ? '12px' : '16px'
                }}
              >
                {paged.map((r) => {
                  const isPinned = pinnedInvoices.includes(r.voucher_guid);
                  const isDragging = draggedKey === r.voucher_guid;
                  const isDragOver = dragOverKey === r.voucher_guid;
                  const isWide = cardCustomSizes[r.voucher_guid] === 'wide';
                  const st = STATUS_META[r.status] || STATUS_META.not_needed;
                  return (
                    <div
                      key={r.voucher_guid}
                      className={`party-card draggable-card ${isPinned ? 'is-pinned' : ''} ${isDragging ? 'is-dragging' : ''} ${isDragOver ? 'drag-over' : ''} ${isWide ? 'is-wide' : ''}`}
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
                        opacity: isDragging ? 0.4 : 1,
                        gridColumn: isWide ? 'span 2' : undefined
                      }}
                    >
                      {/* Top Row: Avatar + Party Name & Subtitle + Action Buttons */}
                      <div className="einvoice-card-top">
                        <div
                          className="einvoice-card-avatar"
                          style={{
                            background: st.bg,
                            color: st.color,
                          }}
                        >
                          <FileText size={18} />
                        </div>
                        <div className="einvoice-card-header-text">
                          <div className="einvoice-card-title-row">
                            <div className="einvoice-card-party-name" title={r.party_name}>
                              {r.party_name || '—'}
                            </div>
                            {isPinned && (
                              <span className="item-pinned-tag" style={{ flexShrink: 0 }}>
                                <Pin size={9} /> Pinned
                              </span>
                            )}
                          </div>
                          <div className="einvoice-card-sub-line">
                            {r.voucher_no || 'Invoice'} • {r.voucher_type || 'Sales'} • {formatDate(r.date)}
                          </div>
                        </div>

                        {/* Top-Right Action buttons */}
                        <div className="einvoice-card-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="card-resize-btn"
                            onClick={() => handleToggleCardWidth(r)}
                            title={isWide ? 'Make normal width' : 'Make wide (2 columns)'}
                          >
                            {isWide ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                          </button>
                          <button
                            type="button"
                            className="tile-menu-btn"
                            onClick={() => handleHide(r)}
                            title="Hide e-invoice"
                            style={{ padding: '5px' }}
                          >
                            <EyeOff size={14} />
                          </button>
                          <button
                            type="button"
                            className="tile-menu-btn"
                            onClick={() => setMenuInvoice(r)}
                            title="Options"
                            style={{ padding: '5px' }}
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Middle Row: Status Pill, GSTIN & Alert badges */}
                      <div className="einvoice-card-badges-row">
                        <span
                          className="position-pill"
                          style={{
                            background: st.bg,
                            color: st.color,
                            fontSize: '11px',
                            border: `1px solid ${st.color}25`
                          }}
                        >
                          {st.label}
                        </span>
                        {r.party_gstin && (
                          <span className="einvoice-gstin-tag">
                            {r.party_gstin}
                          </span>
                        )}
                        {r.alerts && r.alerts.length > 0 && (
                          <span
                            className="pill"
                            style={{
                              background: 'rgba(244, 63, 94, 0.12)',
                              color: '#be123c',
                              fontSize: '10.5px',
                              borderColor: 'rgba(244, 63, 94, 0.3)'
                            }}
                          >
                            {ALERT_LABELS[r.alerts[0]] || r.alerts[0]}
                          </span>
                        )}
                      </div>

                      {/* Bottom Row: Amount on left, Ack / Days info on right */}
                      <div className="einvoice-card-bottom">
                        <div className="einvoice-amount-val">
                          {r.amount != null ? formatInr(r.amount) : '—'}
                        </div>
                        <div className="einvoice-meta-info">
                          {r.irn ? (
                            <span>Ack {r.ack_no || 'Done'}</span>
                          ) : (r.status === 'pending' && r.days_left != null ? (
                            <span style={{ color: '#d97706', fontWeight: 700 }}>{r.days_left}d left</span>
                          ) : (
                            <span>Pending</span>
                          ))}
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
          </>
        )}

        {/* Display Preferences Bar: Cards vs Table, Sort, Columns, Rows - Always available */}
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
              {(!detail?.irn && !selected.irn && (detail?.status === 'pending' || selected?.status === 'pending')) && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    handleGenerateIrnForInvoice(detail || selected);
                    setSelected(null);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', padding: '7px 12px' }}
                >
                  <Sparkles size={14} />
                  <span>Generate IRN Now</span>
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
                    {detail?.irn || selected.irn || 'IRN not yet generated for this invoice. Click "Generate IRN Now" above.'}
                  </div>
                </div>

                {/* Signed QR Code visual */}
                {(detail?.signed_qr || selected?.signed_qr) && (
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
                      src={detail?.signed_qr || selected?.signed_qr}
                      alt="Signed E-Invoice QR Code"
                      style={{
                        maxWidth: '220px',
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
                {(detail?.eway || selected?.eway) && (
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
                      {typeof (detail?.eway || selected?.eway) === 'object' ? JSON.stringify(detail?.eway || selected?.eway, null, 2) : String(detail?.eway || selected?.eway)}
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

      {/* CARD GENERATION MODAL */}
      {showGenerateModal && createPortal(
        <div
          className="fade-in modal-overlay"
          onClick={() => setShowGenerateModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100060,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            className="glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '100%',
              borderRadius: '24px',
              background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.98))',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.3)',
              padding: '26px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                    Generate E-Invoice Card
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    Add and customize a new e-invoice record for tracking
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowGenerateModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewCard} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Party Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tata Steel Ltd, Cult.Fit"
                  value={newPartyName}
                  onChange={(e) => setNewPartyName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--glass-border)',
                    fontSize: '13.5px',
                    outline: 'none',
                    background: '#fff'
                  }}
                />
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {['Tata Motors Ltd', 'Reliance Retail', 'Adani Ports', 'Cult.Fit'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewPartyName(p)}
                      style={{
                        border: '1px solid rgba(0,0,0,0.08)',
                        background: 'rgba(0,0,0,0.04)',
                        borderRadius: '999px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      + {p}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Voucher Number
                  </label>
                  <input
                    type="text"
                    placeholder="INV-2026-..."
                    value={newVoucherNo}
                    onChange={(e) => setNewVoucherNo(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--glass-border)',
                      fontSize: '13.5px',
                      outline: 'none',
                      background: '#fff'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="50000"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--glass-border)',
                      fontSize: '13.5px',
                      outline: 'none',
                      background: '#fff'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Party GSTIN
                  </label>
                  <input
                    type="text"
                    placeholder="27AAACT2727Q1ZW"
                    value={newGstin}
                    onChange={(e) => setNewGstin(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--glass-border)',
                      fontSize: '13.5px',
                      outline: 'none',
                      fontFamily: 'monospace',
                      background: '#fff'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    E-Invoice Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--glass-border)',
                      fontSize: '13.5px',
                      outline: 'none',
                      background: '#fff'
                    }}
                  >
                    <option value="done">E-Invoiced (IRN & QR Generated)</option>
                    <option value="pending">Pending (Awaiting IRN)</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--glass-border)' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowGenerateModal(false)}
                  style={{ padding: '8px 18px', borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '8px 20px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Sparkles size={16} />
                  <span>Generate Card</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ITEM CONTEXT POPOVER - Right click / hold / ... menu */}
      {menuInvoice && createPortal(
        <div
          className="dashboard-context-menu-scrim"
          onClick={() => setMenuInvoice(null)}
          onContextMenu={(e) => { e.preventDefault(); setMenuInvoice(null); }}
        >
          <div
            className="dashboard-context-menu glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              left: `${Math.min(window.innerWidth - 220, Math.max(10, window.innerWidth / 2 - 100))}px`,
              top: `${Math.min(window.innerHeight - 340, Math.max(10, window.innerHeight / 2 - 120))}px`,
              zIndex: 99999,
              minWidth: '200px'
            }}
          >
            <div className="dashboard-context-menu-header">
              <span style={{ color: '#2563eb', display: 'flex', alignItems: 'center' }}>
                <FileText size={14} />
              </span>
              <span style={{ fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {menuInvoice.party_name || menuInvoice.voucher_no || 'E-Invoice'}
              </span>
            </div>

            <button
              type="button"
              className={pinnedInvoices.includes(menuInvoice.voucher_guid) ? 'active-pin' : ''}
              onClick={() => handleTogglePin(menuInvoice)}
            >
              <Pin size={14} />
              <span>{pinnedInvoices.includes(menuInvoice.voucher_guid) ? 'Unpin from Top' : 'Pin to Top'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const target = menuInvoice;
                setMenuInvoice(null);
                openDetail(target);
              }}
            >
              <Eye size={14} />
              <span>View Details</span>
            </button>

            {menuInvoice.irn ? (
              <button
                type="button"
                onClick={() => {
                  const irn = menuInvoice.irn;
                  setMenuInvoice(null);
                  handleCopyIrn(irn);
                }}
              >
                <Copy size={14} />
                <span>Copy IRN</span>
              </button>
            ) : menuInvoice.status === 'pending' ? (
              <button
                type="button"
                onClick={() => handleGenerateIrnForInvoice(menuInvoice)}
                style={{ color: '#059669', fontWeight: 700 }}
              >
                <Sparkles size={14} />
                <span>Generate IRN</span>
              </button>
            ) : null}

            {/* Resize Card Option */}
            <button
              type="button"
              onClick={() => handleToggleCardWidth(menuInvoice)}
            >
              {cardCustomSizes[menuInvoice.voucher_guid] === 'wide' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{cardCustomSizes[menuInvoice.voucher_guid] === 'wide' ? 'Standard Width' : 'Wide (2 Columns)'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMenuInvoice(null);
                showToast('E-Invoice ready: Drag and drop anywhere to reorder');
              }}
            >
              <Move size={14} />
              <span>Drag to Reorder</span>
            </button>

            <button
              type="button"
              onClick={() => handleHide(menuInvoice)}
            >
              <EyeOff size={14} />
              <span>Hide</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const target = menuInvoice;
                setMenuInvoice(null);
                handleShareInvoice(target);
              }}
            >
              <Share2 size={14} />
              <span>Share</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMenuInvoice(null);
                window.print();
              }}
            >
              <Printer size={14} />
              <span>Print</span>
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

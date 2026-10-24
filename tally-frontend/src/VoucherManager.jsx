import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Receipt, ShoppingBag, ShoppingCart, ArrowDownToLine, ArrowUpFromLine,
  BookOpen, ArrowLeftRight, FileText, Truck, ClipboardList, Inbox,
  ClipboardCheck, PackageX, RefreshCw, Layers, Search, Share2,
  ChevronLeft, ChevronRight, ChevronDown, Printer, X, Check, CheckCircle2, Pin,
  Move, EyeOff, MoreVertical, Calendar, Building2, Plus, Download,
  SlidersHorizontal, ArrowUpRight, ArrowDownRight, Tag, Landmark,
  AlertCircle, Sparkles, Filter, Shield, Edit3
} from 'lucide-react';
import { api, IS_HOSTED, getUser } from './api';
import { createHoldTouchHandler, ExportDropdown, UnhideModal } from './uiUtils';
import { CreateVoucherWizard } from './CreateVoucherWizard';
import StandardDateFilter, { isWithinStandardDateRange, getStandardDateRangeLabel } from './StandardDateFilter';
import StandardPagination from './StandardPagination';
import DisplayPreferencesBar from './DisplayPreferencesBar';


/* ------------------------------------------------------------------
   Liquid Glass Custom Sort Dropdown Component (Matches Image 2)
   ------------------------------------------------------------------ */
const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Newest first' },
  { value: 'date_asc', label: 'Oldest first' },
  { value: 'amount_desc', label: 'Amount: High → Low' },
  { value: 'amount_asc', label: 'Amount: Low → High' }
];

const LiquidGlassSortDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const currentOption = SORT_OPTIONS.find((o) => o.value === value) || SORT_OPTIONS[0];

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '999px',
          border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.75))',
          background: 'var(--glass-bg, rgba(255, 255, 255, 0.72))',
          backdropFilter: 'blur(var(--glass-blur, 24px))',
          WebkitBackdropFilter: 'blur(var(--glass-blur, 24px))',
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--text-dark, #0f172a)',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <span>{currentOption.label}</span>
        <ChevronDown size={15} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
      </button>

      {open && (
        <div
          className="fade-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 9999,
            minWidth: '200px',
            borderRadius: '18px',
            background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.94))',
            backdropFilter: 'blur(var(--glass-blur, 28px))',
            WebkitBackdropFilter: 'blur(var(--glass-blur, 28px))',
            border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.85))',
            boxShadow: 'var(--glass-shadow, 0 16px 40px rgba(15, 23, 42, 0.16))',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          {SORT_OPTIONS.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isSelected ? 'rgba(225, 29, 72, 0.1)' : 'transparent',
                  color: isSelected ? '#be123c' : 'var(--text-dark, #0f172a)',
                  fontSize: '13px',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease'
                }}
                onMouseOver={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'var(--glass-hover, rgba(0, 0, 0, 0.04))';
                }}
                onMouseOut={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={14} color="#be123c" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------
   Currency & Date formatting helpers matching mobile app screenshots
   ------------------------------------------------------------------ */
export const inr = (n, forceDecimals = false) => {
  const num = Number(n || 0);
  if (forceDecimals || num % 1 !== 0) {
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export const inrFull = (n) => {
  const num = Number(n || 0);
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDayMonth = (d) => {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return String(d);
  }
};

export const formatFullDate = (d) => {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return String(d);
  }
};

/* ------------------------------------------------------------------
   Voucher Category Definitions with iconic mobile aesthetic styling
   ------------------------------------------------------------------ */
const STANDARD_CATEGORIES = [
  { id: 'all', name: 'All', icon: <Receipt size={24} />, keyMatch: () => true },
  { id: 'sales', name: 'Sales', icon: <ShoppingBag size={24} />, keyMatch: (t) => /sales/i.test(t) && !/order/i.test(t) },
  { id: 'purchase', name: 'Purchase', icon: <ShoppingCart size={24} />, keyMatch: (t) => /purchase/i.test(t) && !/order/i.test(t) },
  { id: 'receipt', name: 'Receipt', icon: <ArrowDownToLine size={24} />, keyMatch: (t) => /^receipt/i.test(t) && !/note/i.test(t) },
  { id: 'payment', name: 'Payment', icon: <ArrowUpFromLine size={24} />, keyMatch: (t) => /payment/i.test(t) },
  { id: 'journal', name: 'Journal', icon: <BookOpen size={24} />, keyMatch: (t) => /^journal/i.test(t) && !/stock/i.test(t) },
  { id: 'contra', name: 'Contra', icon: <ArrowLeftRight size={24} />, keyMatch: (t) => /contra/i.test(t) },
  { id: 'credit_note', name: 'Credit Note', icon: <Receipt size={24} />, keyMatch: (t) => /credit\s*note/i.test(t) },
  { id: 'debit_note', name: 'Debit Note', icon: <Receipt size={24} />, keyMatch: (t) => /debit\s*note/i.test(t) },
  { id: 'delivery_challan', name: 'Delivery Challan', icon: <Truck size={24} />, keyMatch: (t) => /delivery\s*challan/i.test(t) },
  { id: 'purchase_order', name: 'Purchase Order', icon: <ClipboardList size={24} />, keyMatch: (t) => /purchase\s*order/i.test(t) },
  { id: 'receipt_note', name: 'Receipt Note', icon: <Inbox size={24} />, keyMatch: (t) => /receipt\s*note/i.test(t) },
  { id: 'sales_order', name: 'Sales Order', icon: <ClipboardCheck size={24} />, keyMatch: (t) => /sales\s*order/i.test(t) },
  { id: 'rejections_out', name: 'Rejections Out', icon: <PackageX size={24} />, keyMatch: (t) => /rejection/i.test(t) },
  { id: 'replacement', name: 'Replacement', icon: <RefreshCw size={24} />, keyMatch: (t) => /replacement/i.test(t) },
  { id: 'stock_journal', name: 'Stock Journal', icon: <Layers size={24} />, keyMatch: (t) => /stock\s*journal/i.test(t) },
];

/* ------------------------------------------------------------------
   Voucher Dataset Generator matching mobile app screenshots
   ------------------------------------------------------------------ */
export const createLumiloDataset = (companyName = 'Lumilo') => {
  const CATEGORY_SPECS = [
    { type: 'Sales', count: 499, total: 76939278.80, parties: ['Acme Traders', 'Reliance Retail', 'Cult.Fit Limited', 'Tata Consumer', 'Adani Wilmar', 'ITC Limited', 'Godrej Consumer'] },
    { type: 'Purchase', count: 908, total: 55916013.86, parties: ['Steel Corp of India', 'Bharat Logistics', 'Supreme Industries', 'JSW Steel', 'Hindalco Industries', 'Vedanta Limited'] },
    { type: 'Receipt', count: 413, total: 72795840.65, parties: ['HDFC Bank Clearing', 'THE LIGHT HOUSE NEW', 'Cult.Fit Limited', 'Axis Settlement', 'ICICI Commercial Account'] },
    { type: 'Payment', count: 1345, total: 74554897.82, parties: ['Petty Cash', 'Office Rent Acc', 'Staff Salaries', 'Electricity Board', 'Vendor Payments', 'Logistics Freight'] },
    { type: 'Journal', count: 1026, total: 31150000.00, parties: ['Depreciation Reserve', 'General Balancing', 'Prepaid Insurance', 'Accrued Expenses'] },
    { type: 'Contra', count: 33, total: 2450000.00, parties: ['Cash Withdrawal', 'Bank to Bank Transfer', 'Petty Cash Float'] },
    { type: 'Credit Note', count: 11, total: 1120000.00, parties: ['Goods Return - Cult.Fit', 'Discount Allowance', 'Rate Difference'] },
    { type: 'Debit Note', count: 20, total: 1850000.00, parties: ['Purchase Return - Supreme', 'Shortage Claim', 'Vendor Debit'] },
    { type: 'Delivery Challan', count: 261, total: 12500000.00, parties: ['Cult.Fit Limited (Maharashtra)', '—', 'Zomato Warehouse', 'Blinkit Hub', 'Delhivery Express'] },
    { type: 'Purchase Order', count: 464, total: 10250000.00, parties: ['Supplier Orders Q3', 'Bulk Packaging Material', 'Hardware PO', 'Electrical Fittings'] },
    { type: 'Receipt Note', count: 20, total: 840000.00, parties: ['THE LIGHT HOUSE NEW', 'Inward Logistics', 'Warehouse Gate 2', 'Hub Logistics'] },
    { type: 'Rejections Out', count: 5, total: 450000.00, parties: ['Defective Stock Return', 'Quality Reject Line A'] },
    { type: 'Replacement', count: 250, total: 3100000.00, parties: ['Cult.Fit Limited (Haryana)', 'SPAR Hyper Market', 'CULTSPORT PRIVATE LIMITED', 'FitLife Stores'] },
    { type: 'Stock Journal', count: 261, total: 4697107.62, parties: ['Finished Goods Transfer', 'Raw Material Consumption', 'Assembly Lot 4'] }
  ];

  const featured = [
    {
      voucher_guid: 'lumilo-dc-84',
      voucher_type: 'Delivery Challan',
      reference_no: '84',
      voucher_date: '2026-10-08',
      party_name: 'Cult.Fit Limited (Maharashtra)',
      amount: 4950,
      is_active: true,
      ledger_entries: [
        { ledger_name: 'Cult.Fit Limited (Maharashtra)', amount: 4950, is_debit: true },
        { ledger_name: 'Delivery Stock Clearing', amount: 4950, is_debit: false }
      ]
    },
    {
      voucher_guid: 'lumilo-dc-64',
      voucher_type: 'Delivery Challan',
      reference_no: '64',
      voucher_date: '2026-10-08',
      party_name: '—',
      amount: 0,
      is_active: true,
      ledger_entries: [
        { ledger_name: 'General Stock Dispatch', amount: 0, is_debit: true }
      ]
    },
    {
      voucher_guid: 'lumilo-rep-63',
      voucher_type: 'Replacement',
      reference_no: '63',
      voucher_date: '2026-10-08',
      party_name: 'Cult.Fit Limited (Haryana)',
      amount: 0,
      is_active: true,
      ledger_entries: [
        { ledger_name: 'Cult.Fit Limited (Haryana)', amount: 0, is_debit: true },
        { ledger_name: 'Replacement Reserve', amount: 0, is_debit: false }
      ]
    },
    {
      voucher_guid: 'lumilo-rep-61',
      voucher_type: 'Replacement',
      reference_no: '61',
      voucher_date: '2026-10-07',
      party_name: 'SPAR Hyper Market',
      amount: 0,
      is_active: true,
      ledger_entries: [
        { ledger_name: 'SPAR Hyper Market', amount: 0, is_debit: true },
        { ledger_name: 'Replacement Reserve', amount: 0, is_debit: false }
      ]
    },
    {
      voucher_guid: 'lumilo-rep-60',
      voucher_type: 'Replacement',
      reference_no: '60',
      voucher_date: '2026-10-07',
      party_name: 'CULTSPORT PRIVATE LIMITED',
      amount: 0,
      is_active: true,
      ledger_entries: [
        { ledger_name: 'CULTSPORT PRIVATE LIMITED', amount: 0, is_debit: true },
        { ledger_name: 'Replacement Reserve', amount: 0, is_debit: false }
      ]
    },
    {
      voucher_guid: 'lumilo-pay-59',
      voucher_type: 'Payment',
      reference_no: '59',
      voucher_date: '2026-10-06',
      party_name: 'Petty Cash',
      amount: 1070,
      is_active: true,
      ledger_entries: [
        { ledger_name: 'Office Expenses', amount: 1070, is_debit: true },
        { ledger_name: 'Petty Cash', amount: 1070, is_debit: false }
      ]
    },
    {
      voucher_guid: 'lumilo-rn-20',
      voucher_type: 'Receipt Note',
      reference_no: '20',
      voucher_date: '2026-03-23',
      party_name: 'THE LIGHT HOUSE NEW',
      amount: 18250,
      is_active: true,
      ledger_entries: [
        { ledger_name: 'THE LIGHT HOUSE NEW', amount: 18250, is_debit: true },
        { ledger_name: 'Sales / Revenue Account', amount: 18250, is_debit: false }
      ]
    }
  ];

  const all = [...featured];
  const featuredGuids = new Set(featured.map(f => f.voucher_guid));

  CATEGORY_SPECS.forEach(spec => {
    const featInCat = featured.filter(f => f.voucher_type === spec.type);
    const featCount = featInCat.length;
    const featTotal = featInCat.reduce((acc, f) => acc + f.amount, 0);

    const remCount = spec.count - featCount;
    const remTotal = spec.total - featTotal;
    const avg = remCount > 0 ? remTotal / remCount : 0;

    for (let i = 0; i < remCount; i++) {
      const isLast = i === remCount - 1;
      const amt = isLast
        ? Number((remTotal - (Math.round(avg * 100) / 100) * (remCount - 1)).toFixed(2))
        : Number((Math.round(avg * 100) / 100).toFixed(2));

      const party = spec.parties[i % spec.parties.length];
      const guid = `lumilo-${spec.type.toLowerCase().replace(/\\s+/g, '_')}-${i + 1}`;
      if (!featuredGuids.has(guid)) {
        all.push({
          voucher_guid: guid,
          voucher_type: spec.type,
          reference_no: String(spec.count + 100 - i),
          voucher_date: i < 5 ? '2026-10-08' : i < 15 ? '2026-10-07' : i < 40 ? '2026-10-05' : '2026-09-28',
          party_name: party,
          amount: amt,
          is_active: true,
          ledger_entries: [
            { ledger_name: party, amount: amt, is_debit: true },
            { ledger_name: `${spec.type} General Account`, amount: amt, is_debit: false }
          ]
        });
      }
    }
  });

  return all;
};

/* ------------------------------------------------------------------
   VoucherManager Component
   ------------------------------------------------------------------ */
export const VoucherManager = ({
  companyGuid,
  externalQuery,
  setCurrentTab,
  prefillParty,
  consumePrefill,
  startCreate,
  consumeStartCreate,
  user: propUser
}) => {
  const user = propUser || getUser();
  const canViewVouchers = !user || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || (user.vouchers_permissions?.can_view !== false && user.vouchersPermissions?.can_view !== false);
  const canCreate = !user || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || (user.vouchers_permissions?.can_create !== false && user.vouchersPermissions?.can_create !== false);

  // Navigation & View Mode: 'overview' (Screen 1 & 2) vs 'list' (Screen 3) vs 'detail' (Screen 4)
  const [viewMode, setViewMode] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeDateFilter, setActiveDateFilter] = useState('1year');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  // Data states
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [companies, setCompanies] = useState([]);
  const [activeCompanyName, setActiveCompanyName] = useState('Lumilo');

  // Search & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const effectiveSearch = searchQuery || externalQuery || '';
  const [sortBy, setSortBy] = useState('date_desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    try { return Number(localStorage.getItem('tc_pref_vm_size')) || 25; } catch { return 25; }
  });
  const [displayMode, setDisplayMode] = useState(() => {
    try { return localStorage.getItem('tc_pref_vm_mode') || 'cards'; } catch { return 'cards'; }
  });
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('tc_pref_vm_cols');
      return saved ? JSON.parse(saved) : ['date', 'type', 'party', 'ref', 'amount', 'status'];
    } catch {
      return ['date', 'type', 'party', 'ref', 'amount', 'status'];
    }
  });

  // Single Voucher Detail State (account-wise Dr/Cr entries)
  const [voucherDetail, setVoucherDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [billPdfModal, setBillPdfModal] = useState(false);

  // Create Voucher Modal State
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState('Sales');
  const [createFeed, setCreateFeed] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createDate, setCreateDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [createRef, setCreateRef] = useState('');
  const [createParty, setCreateParty] = useState('');
  const [createItems, setCreateItems] = useState([{ ledger_name: '', is_debit: false, amount: '' }]);
  const [parties, setParties] = useState([]);
  const [editingVoucher, setEditingVoucher] = useState(null);

  // Drag, Pin, and Hide states
  const [voucherOrder, setVoucherOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('tc_vouchers_order');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [voucherHidden, setVoucherHidden] = useState(() => {
    try {
      const saved = localStorage.getItem('tc_vouchers_hidden');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [voucherPinned, setVoucherPinned] = useState(() => {
    try {
      const saved = localStorage.getItem('tc_vouchers_pinned');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [menuVoucher, setMenuVoucher] = useState(null);
  const [draggedKey, setDraggedKey] = useState(null);
  const [dragOverKey, setDragOverKey] = useState(null);
  const wasDraggingRef = useRef(false);

  // Category tiles drag & drop reordering
  const [categoryOrder, setCategoryOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('tc_vouchers_cat_order');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [draggedCatId, setDraggedCatId] = useState(null);
  const [dragOverCatId, setDragOverCatId] = useState(null);
  const wasDraggingCatRef = useRef(false);

  const [toastMessage, setToastMessage] = useState('');
  const [showUnhideModal, setShowUnhideModal] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Hidden Vouchers list for UnhideModal
  const hiddenVouchersList = useMemo(() => {
    const meta = (() => {
      try { return JSON.parse(localStorage.getItem('tc_vouchers_meta_map') || '{}'); } catch { return {}; }
    })();
    return voucherHidden.map((id) => {
      const vItem = vouchers.find((v) => getVKey(v) === id || v.voucher_guid === id || v.id === id);
      const name = vItem ? `${vItem.voucher_type || 'Voucher'} #${vItem.reference_no || vItem.voucher_number || ''} • ${vItem.party_name || ''}` : (meta[id] || id);
      return {
        id,
        name,
        title: name,
        label: name,
        hint: vItem ? `${inr(vItem.amount)} • ${formatDayMonth(vItem.voucher_date)}` : 'Voucher',
        subtitle: vItem ? `${inr(vItem.amount)} • ${formatDayMonth(vItem.voucher_date)}` : 'Voucher',
        color: '#5856d6',
        icon: <Receipt size={16} />
      };
    });
  }, [voucherHidden, vouchers]);

  const handleUnhideOneVoucher = (id) => {
    const updated = voucherHidden.filter((k) => k !== id);
    setVoucherHidden(updated);
    try { localStorage.setItem('tc_vouchers_hidden', JSON.stringify(updated)); } catch {}
    window.dispatchEvent(new Event('tc-unhide-sync'));
    showToast('Voucher restored to view');
  };

  const handleUnhideAllVouchers = () => {
    setVoucherHidden([]);
    try { localStorage.removeItem('tc_vouchers_hidden'); } catch {}
    window.dispatchEvent(new Event('tc-unhide-sync'));
    setShowUnhideModal(false);
    showToast('All hidden vouchers restored');
  };

  // Sync unhide across tabs
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem('tc_vouchers_hidden');
        setVoucherHidden(saved ? JSON.parse(saved) : []);
      } catch { }
    };
    window.addEventListener('tc-unhide-sync', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('tc-unhide-sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Fetch Companies to get company name
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/company');
        const list = Array.isArray(res) ? res : (res?.data || []);
        setCompanies(list);
        if (companyGuid) {
          const match = list.find((c) => c.company_guid === companyGuid);
          if (match && (match.company_name || match.name)) {
            setActiveCompanyName(match.company_name || match.name);
          }
        } else if (list.length > 0) {
          setActiveCompanyName(list[0].company_name || list[0].name || 'Lumilo');
        }
      } catch {
        setActiveCompanyName('Lumilo');
      }
    })();
  }, [companyGuid]);

  // Fetch Vouchers for the company
  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await api.get('/voucher-entry', companyGuid ? { company_guid: companyGuid } : {});
      const list = Array.isArray(res) ? res : (res?.data || res?.vouchers || []);
      const isStaff = user && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN';
      if (list && list.length > 0) {
        setVouchers(list);
      } else if (!isStaff) {
        setVouchers(createLumiloDataset(activeCompanyName));
      } else {
        setVouchers([]);
      }
    } catch (err) {
      console.warn('Backend voucher API fallback:', err);
      const isStaff = user && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN';
      if (!isStaff) {
        setVouchers(createLumiloDataset(activeCompanyName));
      } else {
        setVouchers([]);
      }
    } finally {
      setLoading(false);
    }
  }, [companyGuid, activeCompanyName, user]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  // Handle external prefill or quick add
  const prefillRef = useRef(null);
  useEffect(() => {
    if (prefillParty && prefillParty !== prefillRef.current) {
      prefillRef.current = prefillParty;
      setShowCreate(true);
      setCreateType('Sales');
      setCreateParty(prefillParty);
      setCreateFeed(null);
      if (typeof consumePrefill === 'function') consumePrefill();
    }
  }, [prefillParty, consumePrefill]);

  const startCreateRef = useRef(false);
  useEffect(() => {
    if (startCreate && !startCreateRef.current) {
      startCreateRef.current = true;
      setShowCreate(true);
      setCreateType('Sales');
      setCreateFeed(null);
      setCreateParty('');
      setCreateRef('');
      setCreateDate(new Date().toISOString().slice(0, 10));
      setCreateItems([{ ledger_name: '', is_debit: false, amount: '' }]);
      if (typeof consumeStartCreate === 'function') consumeStartCreate();
    }
  }, [startCreate, consumeStartCreate]);

  // Fetch party ledger list for creation
  useEffect(() => {
    if (showCreate) {
      api.get('/ledger', { company_guid: companyGuid })
        .then((r) => setParties(r?.data || []))
        .catch(() => setParties([]));
    }
  }, [showCreate, companyGuid]);

  // Fetch single voucher details (Dr/Cr entries)
  const openVoucherDetail = async (v) => {
    setSelectedVoucher(v);
    setViewMode('detail');
    if (v.ledger_entries && v.ledger_entries.length > 0) {
      setVoucherDetail(v);
      setDetailLoading(false);
      return;
    }
    setDetailLoading(true);
    setVoucherDetail(null);
    try {
      const guid = v.voucher_guid || v.id;
      if (guid && !String(guid).startsWith('lumilo-')) {
        const res = await api.get(`/voucher-entry/${encodeURIComponent(guid)}`);
        setVoucherDetail(res);
      } else {
        setVoucherDetail({
          voucher_guid: v.voucher_guid,
          voucher_date: v.voucher_date,
          voucher_type: v.voucher_type,
          reference_no: v.reference_no,
          party_name: v.party_name,
          amount: v.amount,
          ledger_entries: [
            { ledger_name: v.party_name || 'Primary Party', amount: v.amount, is_debit: true },
            { ledger_name: `${v.voucher_type || 'General'} Account`, amount: v.amount, is_debit: false }
          ]
        });
      }
    } catch (err) {
      console.warn('Failed to fetch detailed voucher, using fallback ledger representation:', err);
      setVoucherDetail({
        voucher_guid: v.voucher_guid,
        voucher_date: v.voucher_date,
        voucher_type: v.voucher_type,
        reference_no: v.reference_no,
        party_name: v.party_name,
        amount: v.amount,
        ledger_entries: [
          { ledger_name: v.party_name || 'Primary Account', amount: v.amount, is_debit: true },
          { ledger_name: `${v.voucher_type || 'Contra'} Balancing Account`, amount: v.amount, is_debit: false }
        ]
      });
    } finally {
      setDetailLoading(false);
    }
  };

  // Helper key
  const getVKey = (v) => String(v.voucher_guid || v.id || `${v.reference_no}-${v.voucher_date}`);
  const isVoucherPinned = (v) => voucherPinned.includes(getVKey(v));

  // Date filtering logic using standard 5 options
  const dateFilteredVouchers = useMemo(() => {
    if (!vouchers || vouchers.length === 0) return [];
    const isStaff = user && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN';
    const allowedVouchers = user?.voucher_selection_permissions?.allowed_vouchers || user?.voucherSelectionPermissions?.allowed_vouchers;
    const hasRestriction = isStaff && Array.isArray(allowedVouchers) && allowedVouchers.length > 0;

    return vouchers.filter((v) => {
      const vKey = getVKey(v);
      if (voucherHidden.includes(vKey)) return false;
      if (hasRestriction) {
        const vGuid = v.voucher_guid || v.id;
        if (!allowedVouchers.includes(vGuid) && !allowedVouchers.includes(v.voucher_guid) && !allowedVouchers.includes(v.id)) {
          return false;
        }
      }
      return isWithinStandardDateRange(v.voucher_date, activeDateFilter, customStart, customEnd);
    });
  }, [vouchers, activeDateFilter, customStart, customEnd, voucherHidden, user]);

  // Calculate 4 Key Metrics (Sales, Purchase, Receipts, Payments) matching Screenshot 1
  const summaryMetrics = useMemo(() => {
    let sales = 0;
    let purchase = 0;
    let receipts = 0;
    let payments = 0;

    dateFilteredVouchers.forEach((v) => {
      const amt = Number(v.amount || 0);
      const type = String(v.voucher_type || '').toLowerCase();
      if (/sales/i.test(type)) sales += amt;
      else if (/purchase/i.test(type)) purchase += amt;
      else if (/receipt/i.test(type)) receipts += amt;
      else if (/payment/i.test(type)) payments += amt;
    });

    return { sales, purchase, receipts, payments };
  }, [dateFilteredVouchers]);

  // Compute category list with counts
  const categoryTiles = useMemo(() => {
    // Collect standard categories
    const map = new Map();
    STANDARD_CATEGORIES.forEach((cat) => {
      map.set(cat.name, { ...cat, count: 0 });
    });

    // Also collect any dynamic categories from actual vouchers
    dateFilteredVouchers.forEach((v) => {
      const vType = (v.voucher_type || 'General').trim();
      let matched = false;

      // Count for "All"
      map.get('All').count += 1;

      for (let [catName, catObj] of map.entries()) {
        if (catName !== 'All' && catObj.keyMatch && catObj.keyMatch(vType)) {
          catObj.count += 1;
          matched = true;
          break;
        }
      }

      if (!matched && vType) {
        if (!map.has(vType)) {
          map.set(vType, {
            id: vType.toLowerCase().replace(/\s+/g, '_'),
            name: vType,
            icon: <Receipt size={24} />,
            keyMatch: (t) => String(t || '').toLowerCase() === vType.toLowerCase(),
            count: 1
          });
        } else {
          map.get(vType).count += 1;
        }
      }
    });

    const list = Array.from(map.values());
    if (categoryOrder && categoryOrder.length > 0) {
      list.sort((a, b) => {
        const aIdx = categoryOrder.indexOf(a.id);
        const bIdx = categoryOrder.indexOf(b.id);
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
        return 0;
      });
    }

    return list;
  }, [dateFilteredVouchers, categoryOrder]);

  // Filter vouchers by selected category & search query
  const filteredList = useMemo(() => {
    let list = dateFilteredVouchers;

    // Filter by category
    if (selectedCategory && selectedCategory !== 'All') {
      const catObj = categoryTiles.find((c) => c.name === selectedCategory);
      if (catObj && catObj.keyMatch) {
        list = list.filter((v) => catObj.keyMatch(v.voucher_type || ''));
      } else {
        list = list.filter((v) => String(v.voucher_type || '').toLowerCase() === selectedCategory.toLowerCase());
      }
    }

    // Filter by search term
    const term = effectiveSearch.trim().toLowerCase();
    if (term) {
      list = list.filter((v) => {
        const party = String(v.party_name || '').toLowerCase();
        const ref = String(v.reference_no || '').toLowerCase();
        const type = String(v.voucher_type || '').toLowerCase();
        const amt = String(v.amount || '').toLowerCase();
        return party.includes(term) || ref.includes(term) || type.includes(term) || amt.includes(term);
      });
    }

    // Sort list
    list.sort((a, b) => {
      if (sortBy === 'date_asc') return new Date(a.voucher_date) - new Date(b.voucher_date);
      if (sortBy === 'amount_desc') return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      if (sortBy === 'amount_asc') return (Number(a.amount) || 0) - (Number(b.amount) || 0);
      return new Date(b.voucher_date) - new Date(a.voucher_date);
    });

    // Pinned vouchers first, then custom order
    list.sort((a, b) => {
      const aPin = isVoucherPinned(a);
      const bPin = isVoucherPinned(b);
      if (aPin && !bPin) return -1;
      if (!aPin && bPin) return 1;

      const aKey = getVKey(a);
      const bKey = getVKey(b);
      const aIdx = voucherOrder.indexOf(aKey);
      const bIdx = voucherOrder.indexOf(bKey);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return 0;
    });

    return list;
  }, [dateFilteredVouchers, selectedCategory, effectiveSearch, sortBy, categoryTiles, voucherPinned, voucherOrder]);

  // Aggregate stats for currently viewed category list (Screenshot 3 header card)
  const listCategorySummary = useMemo(() => {
    let totalValue = 0;
    filteredList.forEach((v) => {
      totalValue += Number(v.amount || 0);
    });
    return {
      count: filteredList.length,
      totalValue
    };
  }, [filteredList]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const paginatedRows = filteredList.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, activeDateFilter, effectiveSearch, sortBy]);

  // Drag and Drop handlers
  const handleDragStart = (e, v) => {
    wasDraggingRef.current = true;
    const key = getVKey(v);
    setDraggedKey(key);
    try {
      e.dataTransfer.setData('text/plain', key);
      e.dataTransfer.effectAllowed = 'move';
    } catch { }
  };

  const handleDragOver = (e, v) => {
    e.preventDefault();
    try { e.dataTransfer.dropEffect = 'move'; } catch { }
    const key = getVKey(v);
    if (dragOverKey !== key) setDragOverKey(key);
  };

  const handleDrop = (e, targetV) => {
    e.preventDefault();
    let sourceKey = draggedKey;
    if (!sourceKey && e.dataTransfer) {
      try { sourceKey = e.dataTransfer.getData('text/plain'); } catch { }
    }
    const targetKey = getVKey(targetV);
    setDraggedKey(null);
    setDragOverKey(null);
    setTimeout(() => { wasDraggingRef.current = false; }, 200);

    if (!sourceKey || sourceKey === targetKey) return;

    const currentKeys = filteredList.map((v) => getVKey(v));
    const fromIdx = currentKeys.indexOf(sourceKey);
    const toIdx = currentKeys.indexOf(targetKey);
    if (fromIdx === -1 || toIdx === -1) return;

    const newOrder = [...currentKeys];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, moved);

    setVoucherOrder(newOrder);
    try { localStorage.setItem('tc_vouchers_order', JSON.stringify(newOrder)); } catch { }
    showToast('Voucher reordered');
  };

  // Category Drag and Drop handlers
  const handleCatDragStart = (e, tile) => {
    wasDraggingCatRef.current = true;
    setDraggedCatId(tile.id);
    try {
      e.dataTransfer.setData('text/plain', tile.id);
      e.dataTransfer.effectAllowed = 'move';
    } catch {}
  };

  const handleCatDragOver = (e, tile) => {
    e.preventDefault();
    try { e.dataTransfer.dropEffect = 'move'; } catch {}
    if (dragOverCatId !== tile.id) setDragOverCatId(tile.id);
  };

  const handleCatDrop = (e, targetTile) => {
    e.preventDefault();
    let sourceId = draggedCatId;
    if (!sourceId && e.dataTransfer) {
      try { sourceId = e.dataTransfer.getData('text/plain'); } catch {}
    }
    const targetId = targetTile.id;
    setDraggedCatId(null);
    setDragOverCatId(null);
    setTimeout(() => { wasDraggingCatRef.current = false; }, 200);

    if (!sourceId || sourceId === targetId) return;

    const currentIds = categoryTiles.map((t) => t.id);
    const fromIdx = currentIds.indexOf(sourceId);
    const toIdx = currentIds.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const newOrder = [...currentIds];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, moved);

    setCategoryOrder(newOrder);
    try { localStorage.setItem('tc_vouchers_cat_order', JSON.stringify(newOrder)); } catch {}
    showToast('Category reordered');
  };

  const handleTogglePin = (v) => {
    const key = getVKey(v);
    const pinned = isVoucherPinned(v);
    let next;
    if (pinned) {
      next = voucherPinned.filter((k) => k !== key);
      showToast('Unpinned voucher');
    } else {
      next = [key, ...voucherPinned.filter((k) => k !== key)];
      showToast('Pinned voucher to top');
    }
    setVoucherPinned(next);
    try { localStorage.setItem('tc_vouchers_pinned', JSON.stringify(next)); } catch { }
    setMenuVoucher(null);
  };

  const handleHide = (v) => {
    const key = getVKey(v);
    const next = [...new Set([...voucherHidden, key])];
    setVoucherHidden(next);
    try {
      localStorage.setItem('tc_vouchers_hidden', JSON.stringify(next));
      const meta = JSON.parse(localStorage.getItem('tc_vouchers_meta_map') || '{}');
      meta[key] = `${v.voucher_type || 'Voucher'} - ${v.party_name || 'General'} (${inr(v.amount)})`;
      localStorage.setItem('tc_vouchers_meta_map', JSON.stringify(meta));
    } catch { }
    window.dispatchEvent(new Event('tc-unhide-sync'));
    setMenuVoucher(null);
    showToast('Voucher hidden. Restore anytime in Account.');
  };

  const handleShareVoucher = (v) => {
    const text = `🧾 ${v.voucher_type || 'Voucher'} #${v.reference_no || '—'}\n` +
      `Party: ${v.party_name || 'General'}\n` +
      `Amount: ${inr(v.amount)}\n` +
      `Date: ${formatFullDate(v.voucher_date)}\n` +
      `Company: ${activeCompanyName}\n` +
      `Status: Synced with Tally\n` +
      `Shared from TallyConnect`;

    if (navigator.share) {
      navigator.share({ title: `${v.voucher_type} - ${v.party_name || 'Voucher'}`, text }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast('Voucher details copied to clipboard!');
    } else {
      showToast('Voucher details ready');
    }
  };

  // Submit Create Voucher
  const submitCreate = async (e) => {
    e.preventDefault();
    if (!createType) {
      setCreateFeed({ error: 'Please select a voucher type' });
      return;
    }

    let dr = 0; let cr = 0;
    for (let it of createItems) {
      if (!it.ledger_name || !it.amount) {
        setCreateFeed({ error: 'All ledger rows must have a name and amount' });
        return;
      }
      if (it.is_debit) dr += Number(it.amount);
      else cr += Number(it.amount);
    }
    if (dr !== cr) {
      setCreateFeed({ error: `Debit (${inr(dr)}) and Credit (${inr(cr)}) totals must match` });
      return;
    }

    setCreateLoading(true);
    setCreateFeed(null);
    try {
      const res = await api.post('/voucher-command/create', {
        company_guid: companyGuid,
        voucher_type: createType,
        voucher_date: createDate,
        reference_no: createRef,
        party: createParty,
        ledger_entries: createItems.map((it) => ({
          ledger_name: it.ledger_name,
          amount: Number(it.amount),
          is_debit: it.is_debit
        }))
      });
      if (res.success || res.voucher_guid) {
        setShowCreate(false);
        fetchVouchers();
        showToast('Voucher created successfully!');
      } else {
        setCreateFeed({ error: res.message || 'Failed to create voucher' });
      }
    } catch (err) {
      setCreateFeed({ error: err.message || 'Error creating voucher' });
    } finally {
      setCreateLoading(false);
    }
  };

  // Export CSV
  const exportCSV = () => {
    if (!filteredList.length) return alert('No vouchers to export');
    const headers = ['Date', 'Type', 'Party', 'Voucher Number', 'Amount', 'Status'];
    const rows = [headers.join(',')];
    filteredList.forEach((r) => {
      rows.push([
        r.voucher_date ? r.voucher_date.slice(0, 10) : '',
        r.voucher_type || '',
        r.party_name || '',
        r.reference_no || '',
        r.amount || 0,
        r.is_active ? 'Active' : 'Inactive'
      ].map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Vouchers_${selectedCategory}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const exportPDF = () => window.print();

  // Date Filter Label for Summary
  const periodLabel = getStandardDateRangeLabel(activeDateFilter, customStart, customEnd);

  if (!canViewVouchers) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <h1>Vouchers &amp; Invoices</h1>
            <p>Financial records and audit trail</p>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center', borderRadius: '24px', maxWidth: '540px', margin: '40px auto' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Shield size={28} />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800 }}>Access Restricted</h3>
          <p style={{ margin: '0 0 20px', color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.5 }}>
            You do not have permission to view vouchers or invoices. Please contact your company administrator to request access.
          </p>
          {setCurrentTab && (
            <button className="btn-primary" onClick={() => setCurrentTab('dashboard')}>
              Return to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="voucher-manager-container fade-in" style={{ paddingBottom: '40px' }}>
      {/* =========================================================================
          VIEW MODE 1: OVERVIEW / CATEGORIES HUB (Matches Mobile Screenshot 1 & 2)
          ========================================================================= */}
      {viewMode === 'overview' && (
        <>
          {/* Header Bar */}
          <div className="page-header" style={{ marginBottom: '20px' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.5px' }}>
                Vouchers
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: 500, marginTop: '4px' }}>
                Entries you have already saved
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                className="btn-secondary"
                onClick={() => {
                  setSelectedCategory('All');
                  setViewMode('list');
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
              >
                <Receipt size={16} /> View All Records
              </button>
              <ExportDropdown onExportCSV={exportCSV} onExportPDF={exportPDF} />
              {canCreate && (
                <button
                  className="btn-primary"
                  onClick={() => {
                    setShowCreate(true);
                    setCreateType('Sales');
                    setCreateFeed(null);
                    setCreateParty('');
                    setCreateRef('');
                    setCreateDate(new Date().toISOString().slice(0, 10));
                    setCreateItems([{ ledger_name: '', is_debit: false, amount: '' }]);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> Create Voucher
                </button>
              )}
            </div>
          </div>

          {/* Standardized 5-Option Date Filter */}
          <div style={{ marginBottom: '22px' }}>
            <StandardDateFilter
              value={activeDateFilter}
              onChange={(val) => {
                setActiveDateFilter(val);
                setPage(1);
              }}
              customStart={customStart}
              onCustomStartChange={(cs) => {
                setCustomStart(cs);
                setPage(1);
              }}
              customEnd={customEnd}
              onCustomEndChange={(ce) => {
                setCustomEnd(ce);
                setPage(1);
              }}
            />
          </div>

          {/* Summary Card with 4 Metrics (Matches Screenshot 1 2x2 grid) */}
          <div
            className="glass-panel"
            style={{
              padding: '24px 28px',
              borderRadius: '24px',
              marginBottom: '32px',
              background: 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 12px 32px rgba(15, 23, 42, 0.05)'
            }}
          >
            {/* Summary Card Header: Period · Company & "From Tally" badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#334155' }}>
                  {periodLabel} · {activeCompanyName}
                </span>
              </div>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '999px',
                  background: 'rgba(244, 63, 94, 0.1)',
                  color: '#e11d48',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.2px'
                }}
              >
                From Tally
              </span>
            </div>

            {/* 4 Metric Boxes in 2x2 Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px'
              }}
            >
              {/* Box 1: Sales */}
              <div
                onClick={() => {
                  setSelectedCategory('Sales');
                  setViewMode('list');
                }}
                style={{
                  padding: '18px 20px',
                  borderRadius: '18px',
                  background: 'rgba(254, 242, 242, 0.75)',
                  border: '1px solid rgba(254, 205, 211, 0.6)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title="Click to view Sales vouchers"
              >
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                  Sales
                </div>
                <div className="vm-summary-val" style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
                  {inr(summaryMetrics.sales, true)}
                </div>
              </div>

              {/* Box 2: Purchase */}
              <div
                onClick={() => {
                  setSelectedCategory('Purchase');
                  setViewMode('list');
                }}
                style={{
                  padding: '18px 20px',
                  borderRadius: '18px',
                  background: 'rgba(241, 245, 249, 0.75)',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title="Click to view Purchase vouchers"
              >
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                  Purchase
                </div>
                <div className="vm-summary-val" style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
                  {inr(summaryMetrics.purchase, true)}
                </div>
              </div>

              {/* Box 3: Receipts */}
              <div
                onClick={() => {
                  setSelectedCategory('Receipt');
                  setViewMode('list');
                }}
                style={{
                  padding: '18px 20px',
                  borderRadius: '18px',
                  background: 'rgba(236, 253, 245, 0.75)',
                  border: '1px solid rgba(167, 243, 208, 0.6)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title="Click to view Receipt vouchers"
              >
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                  Receipts
                </div>
                <div className="vm-summary-val" style={{ fontSize: '22px', fontWeight: 800, color: '#059669', letterSpacing: '-0.3px' }}>
                  {inr(summaryMetrics.receipts, true)}
                </div>
              </div>

              {/* Box 4: Payments */}
              <div
                onClick={() => {
                  setSelectedCategory('Payment');
                  setViewMode('list');
                }}
                style={{
                  padding: '18px 20px',
                  borderRadius: '18px',
                  background: 'rgba(255, 241, 242, 0.75)',
                  border: '1px solid rgba(254, 205, 211, 0.6)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title="Click to view Payment vouchers"
              >
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                  Payments
                </div>
                <div className="vm-summary-val" style={{ fontSize: '22px', fontWeight: 800, color: '#e11d48', letterSpacing: '-0.3px' }}>
                  {inr(summaryMetrics.payments, true)}
                </div>
              </div>
            </div>
          </div>

          {/* Section Heading */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
              Voucher Categories
            </h2>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
              {dateFilteredVouchers.length} total entries recorded
            </span>
          </div>

          {/* Category Cards Grid (Matches Mobile Screenshots 1 & 2) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '16px',
              marginBottom: '40px'
            }}
          >
            {categoryTiles.map((tile) => {
              const isCatDragging = draggedCatId === tile.id;
              const isCatDragOver = dragOverCatId === tile.id;

              return (
                <div
                  key={tile.id}
                  className={`vm-cat-card draggable-card ${isCatDragging ? 'is-dragging' : ''} ${isCatDragOver ? 'drag-over' : ''}`}
                  data-category-id={tile.id}
                  draggable={true}
                  onDragStart={(e) => handleCatDragStart(e, tile)}
                  onDragOver={(e) => handleCatDragOver(e, tile)}
                  onDrop={(e) => handleCatDrop(e, tile)}
                  onDragEnd={() => {
                    setDraggedCatId(null);
                    setDragOverCatId(null);
                    setTimeout(() => { wasDraggingCatRef.current = false; }, 200);
                  }}
                  onClick={() => {
                    if (wasDraggingCatRef.current) return;
                    setSelectedCategory(tile.name);
                    setViewMode('list');
                  }}
                  style={{
                    position: 'relative',
                    background: isCatDragOver ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: isCatDragOver ? '1px dashed #6366f1' : '1px solid rgba(255, 255, 255, 0.8)',
                    borderRadius: '24px',
                    padding: '24px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    textAlign: 'center',
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
                    opacity: isCatDragging ? 0.4 : 1,
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  onMouseOver={(e) => {
                    if (!isCatDragging) {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 14px 28px rgba(15, 23, 42, 0.09)';
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isCatDragging) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.04)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.8)';
                    }
                  }}
                >
                  {/* Category Drag Handle */}
                  <div
                    className="item-drag-handle"
                    title="Drag to reorder category"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      cursor: 'grab',
                      color: 'var(--text-muted, #94a3b8)',
                      opacity: 0.7,
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Move size={14} />
                  </div>

                  {/* Rounded Icon Container */}
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '18px',
                      background: '#ffffff',
                      border: '1px solid rgba(225, 29, 72, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9f1239',
                      marginBottom: '14px',
                      boxShadow: '0 4px 12px rgba(159, 18, 57, 0.08)'
                    }}
                  >
                    {tile.icon}
                  </div>

                  {/* Category Name */}
                  <h3
                    className="vm-cat-name"
                    style={{
                      fontSize: '17px',
                      fontWeight: 800,
                      color: '#0f172a',
                      margin: '0 0 4px',
                      letterSpacing: '-0.3px',
                      lineHeight: '1.2'
                    }}
                  >
                    {tile.name}
                  </h3>

                  {/* Entry Count */}
                  <span className="vm-cat-count" style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                    {tile.count} total
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* =========================================================================
          VIEW MODE 2: VOUCHER LIST VIEW (Matches Mobile Screenshot 3)
          ========================================================================= */}
      {viewMode === 'list' && (
        <>
          {/* Header Bar with Back navigation to Categories */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                className="btn-secondary"
                onClick={() => setViewMode('overview')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '12px',
                  fontWeight: 700
                }}
              >
                <ChevronLeft size={18} /> Vouchers
              </button>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.5px' }}>
                  {selectedCategory === 'All' ? 'All Vouchers' : `${selectedCategory} Vouchers`}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500, margin: '2px 0 0' }}>
                  {activeCompanyName} · {periodLabel}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ExportDropdown onExportCSV={exportCSV} onExportPDF={exportPDF} />
              {canCreate && (
                <button
                  className="btn-primary"
                  onClick={() => {
                    setShowCreate(true);
                    setCreateType(selectedCategory === 'All' ? 'Sales' : selectedCategory);
                    setCreateFeed(null);
                    setCreateParty('');
                    setCreateRef('');
                    setCreateDate(new Date().toISOString().slice(0, 10));
                    setCreateItems([{ ledger_name: '', is_debit: false, amount: '' }]);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> Create Voucher
                </button>
              )}
            </div>
          </div>

          {/* Summary Header Card (Matches Screenshot 3 top card: Entries + Total Value) */}
          <div
            className="glass-panel"
            style={{
              padding: '20px 24px',
              borderRadius: '22px',
              marginBottom: '20px',
              background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.78))',
              backdropFilter: 'blur(var(--glass-blur, 24px))',
              WebkitBackdropFilter: 'blur(var(--glass-blur, 24px))',
              border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.85))',
              boxShadow: 'var(--glass-shadow, 0 8px 24px rgba(15, 23, 42, 0.05))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  background: 'var(--glass-bg, rgba(255, 255, 255, 0.65))',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid var(--glass-border, rgba(225, 29, 72, 0.15))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#be123c',
                  boxShadow: '0 4px 12px rgba(190, 18, 60, 0.08)'
                }}
              >
                <Receipt size={26} />
              </div>

              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Entries
                </span>
                <div className="vm-list-hero-val" style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px' }}>
                  {listCategorySummary.count.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Vertical Divider */}
            <div style={{ width: '1px', height: '40px', background: 'rgba(0, 0, 0, 0.08)' }} className="hide-on-mobile" />

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Total value
              </span>
              <div className="vm-list-hero-val" style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px' }}>
                {inr(listCategorySummary.totalValue, true)}
              </div>
            </div>
          </div>

          {/* Horizontal Category Switcher Pills (Matches Screenshot 3 category pill bar) */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '8px',
              marginBottom: '16px',
              scrollbarWidth: 'none'
            }}
          >
            {categoryTiles.map((cat) => {
              const active = selectedCategory.toLowerCase() === cat.name.toLowerCase();
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '999px',
                    border: 'none',
                    background: active ? '#0f172a' : 'rgba(255, 255, 255, 0.6)',
                    color: active ? '#ffffff' : '#475569',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: active ? '0 4px 12px rgba(15, 23, 42, 0.15)' : 'none',
                    transition: 'all 0.18s ease'
                  }}
                >
                  {cat.name} ({cat.count})
                </button>
              );
            })}
          </div>

          {/* Date Filter & Search / Sort Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
              flexWrap: 'wrap'
            }}
          >
            {/* Standardized Date Filter */}
            <StandardDateFilter
              value={activeDateFilter}
              onChange={(val) => {
                setActiveDateFilter(val);
                setPage(1);
              }}
              customStart={customStart}
              onCustomStartChange={(cs) => {
                setCustomStart(cs);
                setPage(1);
              }}
              customEnd={customEnd}
              onCustomEndChange={(ce) => {
                setCustomEnd(ce);
                setPage(1);
              }}
            />

            {/* Search & Sort */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                className="header-search glass-panel"
                style={{
                  width: '240px',
                  background: 'var(--glass-bg, rgba(255, 255, 255, 0.7))',
                  border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.8))',
                  backdropFilter: 'blur(var(--glass-blur, 24px))',
                  WebkitBackdropFilter: 'blur(var(--glass-blur, 24px))'
                }}
              >
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search party, voucher #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
                    <X size={14} color="#64748b" />
                  </button>
                )}
              </div>

              {/* Custom Liquid Glass Sort Dropdown (Image 2) */}
              <LiquidGlassSortDropdown value={sortBy} onChange={setSortBy} />
            </div>
          </div>

          {/* Hidden Vouchers Restore Banner */}
          {voucherHidden.length > 0 && (
            <div className="items-hidden-banner" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <EyeOff size={16} />
                <span>
                  <strong>{voucherHidden.length} voucher{voucherHidden.length > 1 ? 's' : ''}</strong> hidden from view
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowUnhideModal(true)}
                  style={{
                    background: 'rgba(225, 29, 72, 0.1)',
                    border: 'none',
                    color: '#be123c',
                    fontWeight: 700,
                    fontSize: '12px',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Manage hidden
                </button>
                <button
                  type="button"
                  onClick={handleUnhideAllVouchers}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#be123c',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Restore all
                </button>
              </div>
            </div>
          )}

          {/* VOUCHER LIST (Matches Mobile Screenshot 3 cards) */}
          <div
            className="voucher-records-container glass-panel"
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
                <RefreshCw size={28} className="spin-icon" style={{ color: 'var(--primary-color)', margin: '0 auto 12px' }} />
                <h4 style={{ margin: '0 0 6px', color: '#0f172a' }}>Loading company vouchers...</h4>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Connecting to Tally database</p>
              </div>
            )}

            {!loading && filteredList.length === 0 && (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <Receipt size={36} style={{ color: '#94a3b8', margin: '0 auto 14px' }} />
                <h3 style={{ margin: '0 0 6px', color: '#1e293b' }}>No vouchers found</h3>
                <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '14px' }}>
                  {loadError || 'No records match your selected filter or search query.'}
                </p>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setSelectedCategory('All');
                    setActiveDateFilter('all_time');
                    setSearchQuery('');
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  Clear all filters
                </button>
              </div>
            )}

            {!loading && filteredList.length > 0 && (
              displayMode === 'table' ? (
                <div className="table-responsive-container">
                  <table className="standard-data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px', textAlign: 'center' }}></th>
                        {visibleColumns.includes('date') && <th>Date</th>}
                        {visibleColumns.includes('type') && <th>Type</th>}
                        {visibleColumns.includes('party') && <th>Party Name</th>}
                        {visibleColumns.includes('ref') && <th>Voucher # / Ref</th>}
                        {visibleColumns.includes('amount') && <th style={{ textAlign: 'right' }}>Amount</th>}
                        {visibleColumns.includes('status') && <th>Status</th>}
                        <th style={{ textAlign: 'center', width: '80px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRows.map((v) => {
                        const vKey = getVKey(v);
                        const isPinned = isVoucherPinned(v);
                        const isDragging = draggedKey === vKey;
                        const isDragOver = dragOverKey === vKey;
                        return (
                          <tr
                            key={vKey}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, v)}
                            onDragOver={(e) => handleDragOver(e, v)}
                            onDrop={(e) => handleDrop(e, v)}
                            onDragEnd={() => {
                              setDraggedKey(null);
                              setDragOverKey(null);
                              setTimeout(() => { wasDraggingRef.current = false; }, 200);
                            }}
                            onClick={() => {
                              if (wasDraggingRef.current) return;
                              openVoucherDetail(v);
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setMenuVoucher(v);
                            }}
                            className={`table-row-hover draggable-card ${isPinned ? 'is-pinned' : ''} ${isDragging ? 'is-dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                            style={{ cursor: 'pointer', background: isPinned ? 'rgba(99, 102, 241, 0.05)' : (isDragOver ? 'rgba(99, 102, 241, 0.12)' : undefined), opacity: isDragging ? 0.4 : 1 }}
                            title="Click to view voucher details, right-click for actions, drag to reorder"
                          >
                            <td style={{ padding: '12px 8px', textAlign: 'center', width: '40px' }} onClick={(e) => e.stopPropagation()}>
                              <div className="item-drag-handle" title="Drag to reorder" style={{ cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Move size={14} color="var(--text-muted)" />
                              </div>
                            </td>
                            {visibleColumns.includes('date') && (
                              <td>
                                <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{formatDayMonth(v.voucher_date)}</span>
                              </td>
                            )}
                            {visibleColumns.includes('type') && (
                              <td>
                                <span className="vtype-chip" style={{ color: 'var(--primary-color)', background: 'var(--primary-light)' }}>
                                  {v.voucher_type || 'Voucher'}
                                </span>
                              </td>
                            )}
                            {visibleColumns.includes('party') && (
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{v.party_name || '—'}</span>
                                  {isPinned && <span className="item-pinned-tag" style={{ padding: '2px 6px', fontSize: '10px' }}><Pin size={9} /> Pinned</span>}
                                </div>
                              </td>
                            )}
                            {visibleColumns.includes('ref') && (
                              <td>
                                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{v.reference_no || v.voucher_number || '—'}</span>
                              </td>
                            )}
                            {visibleColumns.includes('amount') && (
                              <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-dark)' }}>
                                {inr(v.amount)}
                              </td>
                            )}
                            {visibleColumns.includes('status') && (
                              <td>
                                <span className="badge badge-success">Synced</span>
                              </td>
                            )}
                            <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className="tile-menu-btn"
                                onClick={() => handleHide(v)}
                                title="Hide voucher"
                                style={{ padding: '4px 6px', marginRight: '4px' }}
                              >
                                <EyeOff size={15} />
                              </button>
                              <button
                                type="button"
                                className="tile-menu-btn"
                                onClick={() => setMenuVoucher(v)}
                                title="Options"
                                style={{ padding: '4px 8px' }}
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
              ) : (
                paginatedRows.map((v, i) => {
                  const vKey = getVKey(v);
                  const isPinned = isVoucherPinned(v);
                  const isDragging = draggedKey === vKey;
                  const isDragOver = dragOverKey === vKey;

                  return (
                    <div
                      key={vKey}
                      className={`vm-voucher-row draggable-card ${isPinned ? 'is-pinned' : ''} ${isDragging ? 'is-dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, v)}
                      onDragOver={(e) => handleDragOver(e, v)}
                      onDrop={(e) => handleDrop(e, v)}
                      onDragEnd={() => {
                        setDraggedKey(null);
                        setDragOverKey(null);
                        setTimeout(() => { wasDraggingRef.current = false; }, 200);
                      }}
                      onClick={() => {
                        if (wasDraggingRef.current) return;
                        openVoucherDetail(v);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setMenuVoucher(v);
                      }}
                      {...createHoldTouchHandler(() => setMenuVoucher(v))}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        borderBottom: i < paginatedRows.length - 1 ? '1px solid var(--glass-border, rgba(0, 0, 0, 0.05))' : 'none',
                        cursor: 'pointer',
                        background: isPinned ? 'rgba(99, 102, 241, 0.06)' : (isDragOver ? 'rgba(99, 102, 241, 0.12)' : 'transparent'),
                        opacity: isDragging ? 0.4 : 1,
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                        <div
                          className="item-drag-handle"
                          title="Drag to reorder"
                          onClick={(e) => e.stopPropagation()}
                          style={{ cursor: 'grab', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                        >
                          <Move size={15} />
                        </div>

                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '14px',
                            background: 'var(--glass-bg, rgba(255, 255, 255, 0.7))',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            border: '1px solid var(--glass-border, rgba(225, 29, 72, 0.12))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#9f1239',
                            boxShadow: '0 2px 8px rgba(159, 18, 57, 0.06)',
                            flexShrink: 0
                          }}
                        >
                          <Receipt size={20} />
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4
                              className="vm-voucher-party"
                              style={{
                                fontSize: '16px',
                                fontWeight: 700,
                                color: '#0f172a',
                                margin: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {v.party_name || '—'}
                            </h4>
                            {isPinned && (
                              <span className="item-pinned-tag" style={{ flexShrink: 0 }}>
                                <Pin size={10} /> Pinned
                              </span>
                            )}
                          </div>

                          <p className="vm-voucher-sub" style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                            {v.reference_no ? `${v.reference_no} · ` : ''}
                            {formatDayMonth(v.voucher_date)} · {v.voucher_type || 'Voucher'}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div className="vm-voucher-amount" style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                            {inr(v.amount)}
                          </div>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', marginTop: '2px' }}>
                            Synced
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="item-quick-hide-btn tile-menu-btn"
                            onClick={() => handleHide(v)}
                            title="Hide voucher"
                            aria-label="Hide voucher"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '8px'
                            }}
                          >
                            <EyeOff size={15} />
                          </button>
                          <button
                            type="button"
                            className="tile-menu-btn"
                            onClick={() => setMenuVoucher(v)}
                            title="Voucher actions"
                            aria-label="Options"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '8px'
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>

          <div style={{ marginTop: '16px' }}>
            <DisplayPreferencesBar
              viewMode={displayMode}
              onViewModeChange={(m) => {
                setDisplayMode(m);
                try { localStorage.setItem('tc_pref_vm_mode', m); } catch {}
              }}
              pageSize={pageSize}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setPage(1);
                try { localStorage.setItem('tc_pref_vm_size', String(sz)); } catch {}
              }}
              columns={[
                { id: 'date', label: 'Date' },
                { id: 'type', label: 'Voucher Type' },
                { id: 'party', label: 'Party Name' },
                { id: 'ref', label: 'Voucher # / Ref' },
                { id: 'amount', label: 'Amount' },
                { id: 'status', label: 'Status' }
              ]}
              visibleColumns={visibleColumns}
              onColumnToggle={(colId) => {
                const next = visibleColumns.includes(colId) ? visibleColumns.filter(c => c !== colId) : [...visibleColumns, colId];
                setVisibleColumns(next);
                try { localStorage.setItem('tc_pref_vm_cols', JSON.stringify(next)); } catch {}
              }}
            />

            <StandardPagination
              currentPage={page}
              totalPages={totalPages}
              totalRecords={filteredList.length}
              pageSize={pageSize}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setPage(1);
                try { localStorage.setItem('tc_pref_vm_size', String(sz)); } catch {}
              }}
            />
          </div>
        </>
      )}

      {/* =========================================================================
          VIEW MODE 3: DETAILED VOUCHER VIEW (Matches Mobile Screenshot 4)
          ========================================================================= */}
      {viewMode === 'detail' && selectedVoucher && (
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          {/* Top Bar: < Vouchers & Share button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '999px',
                border: '1px solid rgba(225, 29, 72, 0.2)',
                background: '#ffffff',
                color: '#be123c',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}
            >
              <ChevronLeft size={18} /> Vouchers
            </button>

            <button
              onClick={() => handleShareVoucher(selectedVoucher)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                background: '#ffffff',
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}
              title="Share voucher"
            >
              <Share2 size={18} />
            </button>
          </div>

          {/* Main Hero Card (Matches Screenshot 4 Hero Card) */}
          <div
            className="glass-panel"
            style={{
              padding: '32px 24px',
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.9)',
              textAlign: 'center',
              marginBottom: '16px',
              boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)'
            }}
          >
            {/* Center Squircle Icon */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: '#ffffff',
                border: '1px solid rgba(225, 29, 72, 0.15)',
                color: '#be123c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 4px 16px rgba(190, 18, 60, 0.1)'
              }}
            >
              <Receipt size={30} />
            </div>

            {/* Subtitle: Type · Number */}
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
              {selectedVoucher.voucher_type || 'Voucher'} · {selectedVoucher.reference_no || '—'}
            </div>

            {/* Huge Hero Amount */}
            <div className="vm-detail-amount" style={{ fontSize: '38px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.8px', marginBottom: '8px' }}>
              {inr(selectedVoucher.amount)}
            </div>

            {/* Party Name */}
            <div className="vm-detail-party" style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', marginBottom: '14px' }}>
              {selectedVoucher.party_name || 'Primary Account'}
            </div>

            {/* Synced with Tally Status Badge */}
            <div className="vm-synced-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontSize: '12px', fontWeight: 700 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              Synced with Tally
            </div>
          </div>

          {/* Details Card (Key-Value List matching Screenshot 4) */}
          <div
            className="glass-panel"
            style={{
              padding: '8px 20px',
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.9)',
              marginBottom: '20px',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)'
            }}
          >
            {[
              { label: 'Type', value: selectedVoucher.voucher_type || '—' },
              { label: 'Number', value: selectedVoucher.reference_no || '—' },
              { label: 'Date', value: formatFullDate(selectedVoucher.voucher_date) },
              {
                label: 'Party / account',
                value: selectedVoucher.party_name || '—',
                isLink: true,
                onClick: () => {
                  if (setCurrentTab) setCurrentTab('ledger');
                }
              },
              { label: 'Amount', value: inr(selectedVoucher.amount) },
              { label: 'Company', value: activeCompanyName }
            ].map((row, rIdx, arr) => (
              <div
                key={rIdx}
                className="vm-detail-kv-row"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 0',
                  borderBottom: rIdx < arr.length - 1 ? '1px solid rgba(0, 0, 0, 0.06)' : 'none'
                }}
              >
                <span className="vm-detail-k" style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>
                  {row.label}
                </span>
                <span
                  className="vm-detail-v"
                  onClick={row.onClick}
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: row.isLink ? 'var(--primary-color)' : '#0f172a',
                    cursor: row.isLink ? 'pointer' : 'default',
                    textAlign: 'right'
                  }}
                  title={row.isLink ? 'Open in Ledgers' : ''}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* ACCOUNTS IN THIS ENTRY (DR / CR) Section (Matches Screenshot 4) */}
          <div style={{ marginBottom: '90px' }}>
            <h4
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                margin: '0 0 12px 6px'
              }}
            >
              Accounts in this entry (Dr / Cr)
            </h4>

            <div
              className="glass-panel"
              style={{
                padding: '8px 20px',
                borderRadius: '24px',
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)'
              }}
            >
              {detailLoading && (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '14px', fontWeight: 600 }}>
                  <RefreshCw size={18} className="spin-icon" style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                  Loading ledger entries...
                </div>
              )}

              {!detailLoading && voucherDetail && (
                <>
                  {(voucherDetail.ledger_entries || []).map((e, idx, arr) => (
                    <div
                      key={idx}
                      className="vm-ledger-row"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px 0',
                        borderBottom: idx < arr.length - 1 ? '1px solid rgba(0, 0, 0, 0.06)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: e.is_debit ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: e.is_debit ? '#2563eb' : '#059669',
                            fontWeight: 800,
                            fontSize: '12px'
                          }}
                        >
                          {e.is_debit ? 'Dr' : 'Cr'}
                        </span>
                        <span
                          className="vm-ledger-name"
                          onClick={() => setCurrentTab && setCurrentTab('ledger')}
                          style={{
                            fontWeight: 700,
                            fontSize: '15px',
                            color: '#0f172a',
                            cursor: setCurrentTab ? 'pointer' : 'default'
                          }}
                          title={setCurrentTab ? 'Open in Ledgers' : ''}
                        >
                          {e.ledger_name || 'General Ledger'}
                        </span>
                      </div>
                      <span className="vm-ledger-amt" style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                        {inr(e.amount)}
                      </span>
                    </div>
                  ))}

                  {(!voucherDetail.ledger_entries || voucherDetail.ledger_entries.length === 0) && (
                    <div style={{ padding: '16px 0', color: '#64748b', fontSize: '14px' }}>
                      No separate ledger splits recorded for this voucher.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Bottom Sticky Action Bar: Share & See bill PDF (Matches Screenshot 4) */}
          <div
            style={{
              position: 'fixed',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'calc(100% - 48px)',
              maxWidth: '600px',
              zIndex: 999,
              display: 'flex',
              gap: '12px'
            }}
          >
            <button
              onClick={() => handleShareVoucher(selectedVoucher)}
              style={{
                flex: 1,
                padding: '16px 20px',
                borderRadius: '999px',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                background: '#ffffff',
                color: '#0f172a',
                fontSize: '16px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Share2 size={18} /> Share
            </button>

            <button
              onClick={() => setBillPdfModal(true)}
              style={{
                flex: 1.5,
                padding: '16px 24px',
                borderRadius: '999px',
                border: 'none',
                background: '#1e293b',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 10px 25px rgba(15, 23, 42, 0.25)'
              }}
            >
              <FileText size={18} /> See bill PDF
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: PRINTABLE BILL / TAX INVOICE PDF (Opened by "See bill PDF")
          ========================================================================= */}
      {billPdfModal && selectedVoucher && createPortal(
        <div
          className="fade-in modal-overlay"
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '720px',
              maxHeight: '90vh',
              background: '#ffffff',
              borderRadius: '24px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="var(--primary-color)" />
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  Bill Preview • {selectedVoucher.voucher_type} #{selectedVoucher.reference_no || '—'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  className="btn-primary"
                  onClick={() => window.print()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}
                >
                  <Printer size={16} /> Print / Save PDF
                </button>
                <button
                  className="vm-modal-close"
                  onClick={() => setBillPdfModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '8px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#64748b'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div
              id="printable-bill-sheet"
              style={{
                padding: '36px 32px',
                overflowY: 'auto',
                color: '#0f172a',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
            >
              {/* Header: Company & Tax Invoice Tag */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '20px', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.5px' }}>
                    {activeCompanyName}
                  </h2>
                  <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>TallyConnect Verified Financial Record</p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>Synced live from Tally Prime</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0f172a' }}>
                    {selectedVoucher.voucher_type || 'VOUCHER'} RECEIPT
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', marginTop: '4px' }}>
                    Voucher No: {selectedVoucher.reference_no || '—'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    Date: {formatFullDate(selectedVoucher.voucher_date)}
                  </div>
                </div>
              </div>

              {/* Billed To / Party Box */}
              <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '14px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                  Account / Party Details
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {selectedVoucher.party_name || 'Primary Ledger Account'}
                </div>
              </div>

              {/* Account-wise Dr/Cr Breakdown Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '28px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '13px', fontWeight: 800, color: '#334155' }}>Type</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '13px', fontWeight: 800, color: '#334155' }}>Particulars / Ledger</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: '13px', fontWeight: 800, color: '#334155' }}>Debit (₹)</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: '13px', fontWeight: 800, color: '#334155' }}>Credit (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {voucherDetail && (voucherDetail.ledger_entries || []).map((e, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 700, color: e.is_debit ? '#2563eb' : '#059669' }}>
                        {e.is_debit ? 'Debit (Dr)' : 'Credit (Cr)'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '14px', fontWeight: 600 }}>{e.ledger_name || '—'}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '14px', fontWeight: 700 }}>
                        {e.is_debit ? inr(e.amount) : '—'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '14px', fontWeight: 700 }}>
                        {!e.is_debit ? inr(e.amount) : '—'}
                      </td>
                    </tr>
                  ))}
                  {(!voucherDetail || !voucherDetail.ledger_entries || voucherDetail.ledger_entries.length === 0) && (
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 700, color: '#2563eb' }}>Dr</td>
                      <td style={{ padding: '12px 14px', fontSize: '14px', fontWeight: 600 }}>{selectedVoucher.party_name || 'Primary Account'}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '14px', fontWeight: 700 }}>{inr(selectedVoucher.amount)}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '14px', fontWeight: 700 }}>—</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8fafc', borderTop: '2px solid #0f172a' }}>
                    <td colSpan="2" style={{ padding: '14px', fontSize: '15px', fontWeight: 800 }}>Net Voucher Total</td>
                    <td colSpan="2" style={{ padding: '14px', textAlign: 'right', fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>
                      {inr(selectedVoucher.amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Signatures & Footer Note */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '20px', marginTop: '20px' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  This is a computer-generated voucher statement from TallyConnect.
                </div>
                <div style={{ textAlign: 'center', borderTop: '1px solid #94a3b8', width: '180px', paddingTop: '6px', fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                  Authorized Signatory
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Context Menu for Individual Voucher Card */}
      {menuVoucher && createPortal(
        <div className="item-popover-overlay" onClick={() => setMenuVoucher(null)}>
          <div className="item-popover-box" onClick={(e) => e.stopPropagation()}>
            <div className="item-popover-header-row">
              <div className="item-popover-icon-badge" style={{ color: '#be123c', background: 'rgba(225, 29, 72, 0.1)' }}>
                <Receipt size={18} />
              </div>
              <div className="item-popover-item-name">{menuVoucher.party_name || menuVoucher.voucher_type || 'Voucher'}</div>
            </div>

            <button
              type="button"
              className="item-popover-action-btn"
              onClick={() => handleTogglePin(menuVoucher)}
            >
              <Pin size={18} style={{ color: '#4f46e5' }} />
              <span>{isVoucherPinned(menuVoucher) ? 'Unpin' : 'Pin'}</span>
            </button>

            <button
              type="button"
              className="item-popover-action-btn"
              onClick={() => {
                const target = menuVoucher;
                setMenuVoucher(null);
                openVoucherDetail(target);
              }}
            >
              <Receipt size={18} style={{ color: '#0ea5e9' }} />
              <span>View Details</span>
            </button>

            <button
              type="button"
              className="item-popover-action-btn"
              onClick={() => {
                const target = menuVoucher;
                setMenuVoucher(null);
                setEditingVoucher(target);
              }}
            >
              <Edit3 size={18} style={{ color: '#2563eb' }} />
              <span>Edit Voucher</span>
            </button>

            <button
              type="button"
              className="item-popover-action-btn"
              onClick={() => {
                setMenuVoucher(null);
                showToast('Voucher ready: Drag and drop anywhere to reorder');
              }}
            >
              <Move size={18} style={{ color: '#64748b' }} />
              <span>Drag</span>
            </button>

            <button
              type="button"
              className="item-popover-action-btn"
              onClick={() => handleHide(menuVoucher)}
            >
              <EyeOff size={18} style={{ color: '#64748b' }} />
              <span>Hide</span>
            </button>

            <button
              type="button"
              className="item-popover-action-btn share-action"
              onClick={() => {
                const target = menuVoucher;
                setMenuVoucher(null);
                handleShareVoucher(target);
              }}
            >
              <Share2 size={18} />
              <span>Share</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Create Voucher Wizard (Matches Antigravity Reference Screenshots 1, 2, 3, 4) */}
      <CreateVoucherWizard
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => {
          fetchVouchers();
        }}
        initialType={createType || (selectedCategory === 'All' ? 'Sales' : selectedCategory)}
        companyGuid={companyGuid}
        activeCompanyName={activeCompanyName}
        parties={parties}
        showToast={showToast}
      />

      {/* Edit Voucher Wizard (Alters existing synced voucher in Tally) */}
      {editingVoucher && (
        <CreateVoucherWizard
          isOpen={!!editingVoucher}
          initialVoucher={editingVoucher}
          initialType={editingVoucher.voucher_type || 'Sales'}
          onClose={() => setEditingVoucher(null)}
          onSuccess={() => {
            setEditingVoucher(null);
            fetchVouchers();
            showToast('Voucher alteration queued for Tally sync');
          }}
          companyGuid={companyGuid}
          activeCompanyName={activeCompanyName}
          parties={parties}
          showToast={showToast}
        />
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="dashboard-toast">
          <CheckCircle2 size={16} style={{ color: '#10b981' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Unhide Modal for Vouchers */}
      <UnhideModal
        isOpen={showUnhideModal}
        onClose={() => setShowUnhideModal(false)}
        title="Hidden Vouchers"
        description="Select hidden vouchers to restore them to your view."
        hiddenItems={hiddenVouchersList}
        onUnhideOne={handleUnhideOneVoucher}
        onUnhideAll={handleUnhideAllVouchers}
      />
    </div>
  );
};

export default VoucherManager;

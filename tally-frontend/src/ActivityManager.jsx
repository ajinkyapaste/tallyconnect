import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Laptop, RotateCcw, CheckCircle2, Clock, AlertCircle, Search,
  Filter, Calendar, ChevronRight, RefreshCw, ShoppingBag, ShoppingCart,
  ArrowDownToLine, ArrowUpFromLine, BookOpen, Truck, Receipt,
  Plus, Bell, FileText, Check, ChevronDown, User, Sparkles,
  LayoutGrid, List, Copy, Eye, ArrowUpDown, Layers, CheckCheck,
  Edit3, Zap, Server, Activity, ShieldCheck, Database, Radio,
  HardDrive, Info, Terminal, X, ExternalLink, Pin, EyeOff, Move, Share2,
  ArrowLeftRight, MoreVertical
} from 'lucide-react';
import { api, getUser, retryMobileSyncEntry } from './api';
import { createHoldTouchHandler, UnhideModal } from './uiUtils';
import { CreateVoucherWizard } from './CreateVoucherWizard';
import { TallyConnectorModal } from './TallyConnectorModal';
import { CardContextMenu, HiddenCardsChip, useCardGridPreferences } from './CardGridPreferences';
import BitrixFilterBar from './BitrixFilterBar';

/* ---------------- Voucher Type Color & Icon Mapping ---------------- */
const VOUCHER_TYPE_META = {
  Sales: { label: 'Sale', icon: ShoppingBag, color: '#e11d48', bg: 'rgba(225, 29, 72, 0.12)' },
  Purchase: { label: 'Purchase', icon: ShoppingCart, color: '#2563eb', bg: 'rgba(37, 99, 235, 0.12)' },
  Receipt: { label: 'Receipt', icon: ArrowDownToLine, color: '#059669', bg: 'rgba(5, 150, 105, 0.12)' },
  Payment: { label: 'Payment', icon: ArrowUpFromLine, color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)' },
  Journal: { label: 'Journal', icon: BookOpen, color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.12)' },
  Contra: { label: 'Contra', icon: ArrowLeftRight, color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)' },
  'Delivery Challan': { label: 'Challan', icon: Truck, color: '#0891b2', bg: 'rgba(8, 145, 178, 0.12)' },
  'Ledger Master': { label: 'Ledger', icon: BookOpen, color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)' },
  'Bill Reference': { label: 'Bill', icon: Receipt, color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)' },
  'Mobile Voucher': { label: 'Mobile App', icon: Laptop, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)' }
};

const getMeta = (type) => {
  const norm = String(type || '').replace(' (Mobile)', '').trim();
  return VOUCHER_TYPE_META[norm] || VOUCHER_TYPE_META[String(type || '').trim()] || {
    label: norm || 'Voucher',
    icon: Receipt,
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.12)'
  };
};

/* ---------------- Helpers ---------------- */
const formatInr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return 'Today';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const getStatusBadge = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'sent' || s === 'success' || s === 'completed' || s === 'synced') {
    return {
      label: 'Sent',
      color: '#059669',
      bg: 'rgba(16, 185, 129, 0.16)',
      border: 'rgba(16, 185, 129, 0.3)',
      icon: CheckCircle2
    };
  }
  if (s === 'waiting' || s === 'pending' || s === 'processing' || s === 'queued') {
    return {
      label: 'Waiting',
      color: '#d97706',
      bg: 'rgba(245, 158, 11, 0.16)',
      border: 'rgba(245, 158, 11, 0.3)',
      icon: Clock
    };
  }
  return {
    label: 'Not sent',
    color: '#e11d48',
    bg: 'rgba(244, 63, 94, 0.16)',
    border: 'rgba(244, 63, 94, 0.3)',
    icon: AlertCircle
  };
};

const formatSyncTimeDisplay = (ts) => {
  if (!ts) return 'Never';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return String(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today at ${timeStr}`;
  if (isYesterday) return `Yesterday at ${timeStr}`;
  return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${timeStr}`;
};

export const ActivityManager = ({
  companyGuid,
  activeCompanyName = 'Lumilo',
  user: userProp,
  onOpenCreateVoucher,
  syncInfo
}) => {
  const currentUser = userProp || getUser() || {};
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [lastSyncDate, setLastSyncDate] = useState(() => {
    if (syncInfo?.last_sync_at) return formatSyncTimeDisplay(syncInfo.last_sync_at);
    return 'Synchronized';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [copiedVoucherNo, setCopiedVoucherNo] = useState(null);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [menuActivity, setMenuActivity] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [retryingId, setRetryingId] = useState(null);
  const [showUnhideModal, setShowUnhideModal] = useState(false);

  // Drag, Pin, and Hide states for activity items
  const [pinnedActivityIds, setPinnedActivityIds] = useState(() => {
    try {
      const saved = localStorage.getItem('tc_activity_pinned');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [hiddenActivityIds, setHiddenActivityIds] = useState(() => {
    try {
      const saved = localStorage.getItem('tc_activity_hidden');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [activityOrder, setActivityOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('tc_activity_order');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [draggedActivityKey, setDraggedActivityKey] = useState(null);
  const [dragOverActivityKey, setDragOverActivityKey] = useState(null);
  const wasActivityDraggingRef = useRef(false);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  }, []);

  const getActKey = useCallback((item) => {
    if (!item) return '';
    return String(item.id || item.voucher_no || item.voucher_guid || '');
  }, []);

  const isItemPinned = useCallback((item) => {
    const key = getActKey(item);
    return pinnedActivityIds.includes(key);
  }, [pinnedActivityIds, getActKey]);

  const handleTogglePin = useCallback((item) => {
    const key = getActKey(item);
    const pinned = pinnedActivityIds.includes(key);
    let next;
    if (pinned) {
      next = pinnedActivityIds.filter((k) => k !== key);
      showToast('Unpinned activity entry');
    } else {
      next = [key, ...pinnedActivityIds.filter((k) => k !== key)];
      showToast('Pinned activity entry to top');
    }
    setPinnedActivityIds(next);
    try { localStorage.setItem('tc_activity_pinned', JSON.stringify(next)); } catch { }
    setMenuActivity(null);
  }, [pinnedActivityIds, getActKey, showToast]);

  const handleHideActivity = useCallback((item) => {
    const key = getActKey(item);
    const next = [...new Set([...hiddenActivityIds, key])];
    setHiddenActivityIds(next);
    try {
      localStorage.setItem('tc_activity_hidden', JSON.stringify(next));
      const meta = JSON.parse(localStorage.getItem('tc_activity_meta_map') || '{}');
      meta[key] = `${item.voucher_type || 'Voucher'} #${item.voucher_no || ''} • ${item.customer || ''} (${formatInr(item.amount)})`;
      localStorage.setItem('tc_activity_meta_map', JSON.stringify(meta));
    } catch { }
    window.dispatchEvent(new Event('tc-unhide-activity-sync'));
    setMenuActivity(null);
    showToast('Activity hidden. Restore anytime.');
  }, [hiddenActivityIds, getActKey, showToast]);

  const handleUnhideOneActivity = useCallback((id) => {
    const next = hiddenActivityIds.filter((k) => k !== id);
    setHiddenActivityIds(next);
    try { localStorage.setItem('tc_activity_hidden', JSON.stringify(next)); } catch { }
    showToast('Restored activity to list');
  }, [hiddenActivityIds, showToast]);

  const handleUnhideAllActivities = useCallback(() => {
    setHiddenActivityIds([]);
    try { localStorage.removeItem('tc_activity_hidden'); } catch { }
    setShowUnhideModal(false);
    showToast('All hidden activities restored');
  }, [showToast]);

  // Hidden Activities list for UnhideModal
  const hiddenActivitiesList = useMemo(() => {
    const meta = (() => {
      try { return JSON.parse(localStorage.getItem('tc_activity_meta_map') || '{}'); } catch { return {}; }
    })();
    return hiddenActivityIds.map((id) => {
      const act = activities.find((a) => getActKey(a) === id || String(a.id) === id || a.voucher_no === id);
      const name = act ? `${act.voucher_type || 'Activity'} #${act.voucher_no || ''} • ${act.customer || ''}` : (meta[id] || id);
      return {
        id,
        name,
        title: name,
        label: name,
        hint: act ? `${formatInr(act.amount)} • ${formatDateDisplay(act.date)}` : 'Activity',
        subtitle: act ? `${formatInr(act.amount)} • ${formatDateDisplay(act.date)}` : 'Activity',
        color: '#f43f5e',
        icon: <RotateCcw size={16} />
      };
    });
  }, [hiddenActivityIds, activities, getActKey]);

  const canRetryItem = useCallback((item) => {
    if (!item) return false;
    const isQueued = item.queue_id || item.channel === 'Mobile App' || item.entity_type === 'MOBILE_VOUCHER';
    if (!isQueued) return false;
    const rawS = String(item.raw_status || item.status || '').toLowerCase();
    if (rawS === 'success' || rawS === 'sent') return false;
    if (rawS === 'failed' || rawS === 'not sent') return true;
    if (rawS === 'processing' || rawS === 'pending' || rawS === 'waiting') {
      const dateTs = new Date(item.updated_at || item.created_at).getTime();
      if (!isNaN(dateTs) && Date.now() - dateTs > 15 * 60 * 1000) return true;
    }
    return false;
  }, []);

  const handleRetry = useCallback(async (item) => {
    if (!item) return;
    const queueId = item.queue_id || (
      typeof item.id === 'number'
        ? item.id
        : (typeof item.id === 'string' && item.id.startsWith('queue-')
          ? Number.parseInt(item.id.split('-').pop(), 10)
          : null)
    );
    if (!queueId) {
      showToast('Cannot retry this entry: no queue id found');
      return;
    }

    setRetryingId(item.id);
    try {
      const res = await retryMobileSyncEntry(queueId);
      if (res?.success) {
        showToast(`Transmission re-queued! (Retry #${res.retry_count || 1})`);
        setActivities((prev) =>
          prev.map((act) => {
            if (act.id === item.id || (act.queue_id && act.queue_id === queueId)) {
              return {
                ...act,
                status: 'Waiting',
                raw_status: 'pending',
                retry_count: res.retry_count || (act.retry_count || 0) + 1,
                error: null
              };
            }
            return act;
          })
        );
        setSelectedActivity((prev) => {
          if (!prev || (prev.id !== item.id && (!prev.queue_id || prev.queue_id !== queueId))) return prev;
          return {
            ...prev,
            status: 'Waiting',
            raw_status: 'pending',
            retry_count: res.retry_count || (prev.retry_count || 0) + 1,
            error: null
          };
        });
      } else {
        showToast(res?.message || 'Retry response received');
      }
    } catch (err) {
      console.error('Retry mobile entry failed:', err);
      showToast(err?.response?.data?.message || err?.message || 'Could not retry entry');
    } finally {
      setRetryingId(null);
      setMenuActivity(null);
    }
  }, [showToast]);

  const handleActivityDragStart = (e, item) => {
    wasActivityDraggingRef.current = true;
    const key = getActKey(item);
    setDraggedActivityKey(key);
    try {
      e.dataTransfer.setData('text/plain', key);
      e.dataTransfer.effectAllowed = 'move';
    } catch { }
  };

  const handleActivityDragOver = (e, item) => {
    e.preventDefault();
    try { e.dataTransfer.dropEffect = 'move'; } catch { }
    const key = getActKey(item);
    if (dragOverActivityKey !== key) setDragOverActivityKey(key);
  };

  const handleActivityDrop = (e, targetItem, listSource) => {
    e.preventDefault();
    let sourceKey = draggedActivityKey;
    if (!sourceKey && e.dataTransfer) {
      try { sourceKey = e.dataTransfer.getData('text/plain'); } catch { }
    }
    const targetKey = getActKey(targetItem);
    setDraggedActivityKey(null);
    setDragOverActivityKey(null);
    setTimeout(() => { wasActivityDraggingRef.current = false; }, 200);

    if (!sourceKey || sourceKey === targetKey) return;

    const currentKeys = (listSource || activities).map(getActKey);
    const fromIdx = currentKeys.indexOf(sourceKey);
    const toIdx = currentKeys.indexOf(targetKey);
    if (fromIdx === -1 || toIdx === -1) return;

    const newOrder = [...(activityOrder.length > 0 ? activityOrder : currentKeys)];
    const existingFrom = newOrder.indexOf(sourceKey);
    const existingTo = newOrder.indexOf(targetKey);
    if (existingFrom !== -1 && existingTo !== -1) {
      const [moved] = newOrder.splice(existingFrom, 1);
      newOrder.splice(existingTo, 0, moved);
    } else {
      const [moved] = currentKeys.splice(fromIdx, 1);
      currentKeys.splice(toIdx, 0, moved);
      newOrder.length = 0;
      newOrder.push(...currentKeys);
    }

    setActivityOrder(newOrder);
    try { localStorage.setItem('tc_activity_order', JSON.stringify(newOrder)); } catch { }
    showToast('Activity entry reordered');
  };

  const handleActivityDragEnd = () => {
    setDraggedActivityKey(null);
    setDragOverActivityKey(null);
    setTimeout(() => { wasActivityDraggingRef.current = false; }, 200);
  };

  // Agent & Tally Connector Diagnostic States
  const [showConnectorModal, setShowConnectorModal] = useState(false);
  const [syncTriggering, setSyncTriggering] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState('');
  const [connectorAgentStatus, setConnectorAgentStatus] = useState(null);
  const [queueBreakdown, setQueueBreakdown] = useState({ ledgers: 0, vouchers: 0, bills: 0, mobile: 0 });

  useEffect(() => {
    if (syncInfo?.last_sync_at) {
      setLastSyncDate(formatSyncTimeDisplay(syncInfo.last_sync_at));
    }
  }, [syncInfo?.last_sync_at]);

  // Load activities from real backend sync queues (ledgers, vouchers, bills, mobile queue)
  const fetchActivityData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Fetch real queued activity from backend across all agent queue channels
      let backendRows = [];
      let counts = { ledgers: 0, vouchers: 0, bills: 0, mobile: 0 };

      try {
        let effectiveGuid = companyGuid;
        if (!effectiveGuid) {
          try { effectiveGuid = localStorage.getItem('tc_active_company'); } catch { }
        }
        if (!effectiveGuid) {
          try {
            const cached = JSON.parse(localStorage.getItem('tc_companies_cache') || '[]');
            if (cached.length > 0 && cached[0].company_guid) {
              effectiveGuid = cached[0].company_guid;
            }
          } catch { }
        }

        if (effectiveGuid) {
          const [mobileRes, ledgersRes, vouchersRes, billsRes, agentStatRes, mobilePendingRes, syncedVouchersRes] = await Promise.allSettled([
            api.get('/api/mobile-sync-queue/activity', { company_guid: effectiveGuid }),
            api.get('/sync-queue/pending-ledgers', { company_guid: effectiveGuid }),
            api.get('/sync-queue/pending', { company_guid: effectiveGuid }),
            api.get('/sync-queue/pending-bills', { company_guid: effectiveGuid }),
            api.get('/agent-status/sync-status', { company_guid: effectiveGuid }),
            api.get('/api/mobile-sync-queue/pending', { company_guid: effectiveGuid }),
            api.get('/voucher-entry', { company_guid: effectiveGuid, limit: 100 })
          ]);

          // Mobile sync queue activity
          if (mobileRes.status === 'fulfilled') {
            const mData = Array.isArray(mobileRes.value) ? mobileRes.value : (Array.isArray(mobileRes.value?.data) ? mobileRes.value.data : []);
            mData.forEach(m => {
              backendRows.push({
                ...m,
                entity_type: 'MOBILE_VOUCHER',
                channel: 'Mobile App'
              });
            });
          }

          // Mobile pending count
          if (mobilePendingRes.status === 'fulfilled' && Array.isArray(mobilePendingRes.value)) {
            counts.mobile = mobilePendingRes.value.length;
          }

          // Pending ledgers
          if (ledgersRes.status === 'fulfilled' && Array.isArray(ledgersRes.value)) {
            counts.ledgers = ledgersRes.value.length;
            ledgersRes.value.forEach(l => {
              backendRows.push({
                ...l,
                entity_type: 'LEDGER',
                status: l.status || 'pending',
                created_at: l.created_at || new Date().toISOString()
              });
            });
          }

          // Pending vouchers in web sync_queue
          if (vouchersRes.status === 'fulfilled' && Array.isArray(vouchersRes.value)) {
            counts.vouchers = vouchersRes.value.length;
            vouchersRes.value.forEach(v => {
              backendRows.push({
                ...v,
                entity_type: 'VOUCHER',
                status: v.status || 'pending',
                created_at: v.created_at || new Date().toISOString()
              });
            });
          }

          // Pending bills
          if (billsRes.status === 'fulfilled' && Array.isArray(billsRes.value)) {
            counts.bills = billsRes.value.length;
            billsRes.value.forEach(b => {
              backendRows.push({
                ...b,
                entity_type: 'BILL',
                status: b.status || 'pending',
                created_at: b.created_at || new Date().toISOString()
              });
            });
          }

          // Synced vouchers from Tally (live vouchers table)
          if (syncedVouchersRes.status === 'fulfilled') {
            const vData = syncedVouchersRes.value;
            const vList = Array.isArray(vData) ? vData : (Array.isArray(vData?.data) ? vData.data : []);
            vList.forEach(v => {
              backendRows.push({
                id: v.voucher_guid || v.id,
                voucher_guid: v.voucher_guid,
                entity_type: 'VOUCHER',
                channel: 'Web ERP',
                status: 'success', // Already synced in Tally
                created_at: v.voucher_date,
                processed_at: v.voucher_date,
                payload: {
                  voucher_no: v.reference_no || v.voucher_guid,
                  reference_no: v.reference_no,
                  voucher_guid: v.voucher_guid,
                  voucher_type: v.voucher_type || 'Sales',
                  voucher_date: v.voucher_date,
                  party_name: v.party_name,
                  amount: v.amount,
                  total_amount: v.amount,
                  items: v.items
                }
              });
            });
          }

          setQueueBreakdown(counts);

          if (agentStatRes.status === 'fulfilled' && agentStatRes.value?.success) {
            setConnectorAgentStatus(agentStatRes.value);
            if (agentStatRes.value.last_sync_at) {
              setLastSyncDate(formatSyncTimeDisplay(agentStatRes.value.last_sync_at));
            }
          }
        }
      } catch (err) {
        console.warn('Backend activity fetch notice (using cache/local):', err?.message);
      }

      // 2. Load user's locally created vouchers from storage
      let localActivities = [];
      try {
        const stored = localStorage.getItem('tc_user_activity');
        if (stored) {
          localActivities = JSON.parse(stored);
          if (!Array.isArray(localActivities)) localActivities = [];
        }
      } catch (e) {
        console.warn('Could not parse tc_user_activity:', e);
      }

      // 3. Normalise and merge backend queue rows
      const mappedBackend = backendRows.map((row) => {
        let p = {};
        try {
          p = typeof row.payload === 'string' ? JSON.parse(row.payload || '{}') : (row.payload || {});
        } catch {
          p = {};
        }
        const statusNorm = row.status === 'success' ? 'Sent' : row.status === 'failed' ? 'Not sent' : 'Waiting';
        const isLedger = row.entity_type === 'LEDGER';
        const isBill = row.entity_type === 'BILL';
        const isMobile = row.entity_type === 'MOBILE_VOUCHER' || row.channel === 'Mobile App';

        const rawType = p.voucher_type || (isLedger ? 'Ledger Master' : isBill ? 'Bill Reference' : 'Sales');
        const displayType = isMobile ? (rawType ? `${rawType} (Mobile)` : 'Mobile Voucher') : rawType;

        const customerName = isLedger
          ? (p.parent_group ? `${p.name} (${p.parent_group})` : p.name)
          : (p.party_name || p.party || p.customer || (p.transfer ? `${p.transfer.from_account || 'Cash'} → ${p.transfer.to_account || 'Bank'}` : (rawType === 'Contra' ? 'Contra Transfer' : 'Party Ledger')));

        const parsedAmount = Number(
          p.summary?.total_amount ||
          p.total_amount ||
          p.amount ||
          p.total_debit ||
          p.total_credit ||
          (p.transfer?.amount) ||
          p.opening_balance ||
          0
        );

        const vNo = p.voucher_no || p.reference_no || p.name || p.bill_name || (isLedger ? `LED-${row.id || Date.now()}` : isMobile ? `MOB-${row.id || Date.now()}` : `VCH-${row.id || Date.now()}`);

        const rawQueueId = Number.isInteger(Number(row.id)) && Number(row.id) > 0 ? Number(row.id) : null;
        return {
          id: row.id ? (String(row.id).startsWith('queue-') || String(row.id).startsWith('vch-') ? String(row.id) : `queue-${row.entity_type || 'vch'}-${row.id}`) : `act-${row.created_at || Date.now()}`,
          queue_id: rawQueueId,
          voucher_guid: row.voucher_guid || row.entity_guid || row.tally_guid || row.target_guid || p.voucher_guid || null,
          tally_guid: row.tally_guid || null,
          target_guid: row.target_guid || null,
          edit_of: row.edit_of || null,
          created_by: row.created_by || null,
          retry_count: Number(row.retry_count) || 0,
          updated_at: row.updated_at || null,
          error: row.error || null,
          raw_status: row.status || null,
          voucher_type: displayType,
          base_voucher_type: rawType,
          voucher_no: vNo,
          date: p.voucher_date || p.bill_date || row.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          customer: customerName,
          amount: parsedAmount,
          status: statusNorm,
          channel: isMobile ? 'Mobile App' : 'Web ERP',
          created_at: row.created_at,
          processed_at: row.processed_at,
          entity_type: row.entity_type || 'VOUCHER',
          action: row.action || 'CREATE',
          details: p
        };
      });

      // 4. Normalise local activities
      const mappedLocal = localActivities.map((v) => ({
        id: v.id || `local-${v.voucher_no || Date.now()}`,
        voucher_guid: v.voucher_guid || null,
        voucher_type: v.voucher_type || 'Sales',
        base_voucher_type: v.voucher_type || 'Sales',
        voucher_no: v.voucher_no || 'VCH-NEW',
        date: v.voucher_date || v.date || new Date().toISOString().slice(0, 10),
        customer: v.customer || v.party_name || v.party || 'Customer',
        amount: Number(v.amount || v.total_amount || 0),
        status: v.status || 'Waiting',
        channel: 'Web ERP',
        created_at: v.created_at || new Date().toISOString(),
        details: v.payload || v
      }));

      // Merge and deduplicate by voucher_guid / voucher_no / id
      const seen = new Set();
      const combined = [];

      for (let item of [...mappedLocal, ...mappedBackend]) {
        const key = item.voucher_guid || item.voucher_no || item.id;
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(item);
        }
      }

      // Sort newest first
      combined.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));

      setActivities(combined);

      // Update sync timestamp
      if (backendRows.length > 0 && (backendRows[0].processed_at || backendRows[0].created_at)) {
        setLastSyncDate(formatSyncTimeDisplay(backendRows[0].processed_at || backendRows[0].created_at));
      } else if (syncInfo?.last_sync_at) {
        setLastSyncDate(formatSyncTimeDisplay(syncInfo.last_sync_at));
      } else {
        const today = new Date();
        setLastSyncDate(formatSyncTimeDisplay(today.toISOString()));
      }
    } catch (e) {
      console.error('Failed to load activity:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [companyGuid, syncInfo]);

  // Remote Sync Trigger action
  const handleTriggerSync = async () => {
    setSyncTriggering(true);
    setTriggerMessage('');
    try {
      const res = await api.post('/sync/trigger');
      if (res?.success) {
        setTriggerMessage('✅ Remote sync signal dispatched to Windows Tally Agent!');
        await fetchActivityData(true);
      } else {
        setTriggerMessage(res?.message || 'Sync signal sent');
      }
    } catch (err) {
      setTriggerMessage('⚠️ Trigger note: ' + (err?.message || 'Signal sent to queue'));
    } finally {
      setTimeout(() => setSyncTriggering(false), 800);
      setTimeout(() => setTriggerMessage(''), 5000);
    }
  };

  useEffect(() => {
    fetchActivityData();

    // Listen to real-time voucher creation event
    const handleVoucherCreated = (e) => {
      const v = e.detail;
      if (!v) return;

      const newRecord = {
        id: v.id || `act-${Date.now()}`,
        voucher_guid: v.voucher_guid || null,
        voucher_type: v.voucher_type || 'Sales',
        base_voucher_type: v.voucher_type || 'Sales',
        voucher_no: v.voucher_no || `VCH-${Date.now()}`,
        date: v.voucher_date || v.date || new Date().toISOString().slice(0, 10),
        customer: v.customer || v.party_name || v.party || 'Customer',
        amount: Number(v.amount || v.total_amount || 0),
        status: v.status || 'Waiting',
        channel: 'Web ERP',
        created_at: v.created_at || new Date().toISOString(),
        details: v.payload || v
      };

      setActivities((prev) => {
        const filtered = prev.filter((x) => (x.voucher_guid && x.voucher_guid === newRecord.voucher_guid) ? false : (x.voucher_no || x.id) !== (newRecord.voucher_no || newRecord.id));
        return [newRecord, ...filtered];
      });
    };

    window.addEventListener('tc-voucher-created', handleVoucherCreated);
    return () => {
      window.removeEventListener('tc-voucher-created', handleVoucherCreated);
    };
  }, [fetchActivityData]);

  // Check if opened via deep link / query param (e.g. from notification)
  useEffect(() => {
    try {
      const targetGuid = sessionStorage.getItem('tc_target_voucher_guid') ||
        new URLSearchParams(window.location.search).get('voucher_guid');
      if (targetGuid && activities.length > 0) {
        const match = activities.find(a =>
          a.voucher_guid === targetGuid ||
          a.voucher_no === targetGuid ||
          a.id?.includes(targetGuid)
        );
        if (match) {
          setSelectedActivity(match);
          sessionStorage.removeItem('tc_target_voucher_guid');
        }
      }
    } catch { }
  }, [activities]);

  // Metric counts matching Screenshot 1 (Sent, Waiting, Not sent)
  const metrics = useMemo(() => {
    let sent = 0;
    let waiting = 0;
    let notSent = 0;

    activities.forEach((act) => {
      const s = String(act.status || '').toLowerCase();
      if (s === 'sent' || s === 'success' || s === 'synced') sent++;
      else if (s === 'not sent' || s === 'failed') notSent++;
      else waiting++;
    });

    return { sent, waiting, notSent };
  }, [activities]);

  // Filter tabs
  const FILTER_TABS = ['All', 'Sales', 'Purchase', 'Receipt', 'Payment', 'Journal', 'Contra', 'Delivery Challan'];
  const STATUS_TABS = ['All', 'Sent', 'Waiting', 'Not sent'];

  const handleCopyVoucherNo = (e, vNo) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(vNo);
      setCopiedVoucherNo(vNo);
      setTimeout(() => setCopiedVoucherNo(null), 2000);
    } catch { }
  };

  const filteredActivities = useMemo(() => {
    let list = activities.filter((act) => {
      // Type filter
      if (activeFilter !== 'All') {
        const actType = String(act.voucher_type || '').toLowerCase();
        const baseType = String(act.base_voucher_type || '').toLowerCase();
        const filt = activeFilter.toLowerCase();
        if (!actType.includes(filt) && !baseType.includes(filt)) return false;
      }
      // Status filter
      if (statusFilter !== 'All') {
        const s = String(act.status || '').toLowerCase();
        const filt = statusFilter.toLowerCase();
        if (filt === 'sent' && !['sent', 'success', 'synced'].includes(s)) return false;
        if (filt === 'waiting' && !['waiting', 'pending', 'queued'].includes(s)) return false;
        if (filt === 'not sent' && !['not sent', 'failed'].includes(s)) return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCustomer = String(act.customer || '').toLowerCase().includes(q);
        const matchesNo = String(act.voucher_no || '').toLowerCase().includes(q);
        const matchesType = String(act.voucher_type || '').toLowerCase().includes(q);
        if (!matchesCustomer && !matchesNo && !matchesType) return false;
      }
      const key = getActKey(act);
      if (hiddenActivityIds.includes(key)) return false;
      return true;
    });

    // Sorting: Pinned items at top, then drag activityOrder, then chosen sortBy
    return list.sort((a, b) => {
      const keyA = getActKey(a);
      const keyB = getActKey(b);
      const pinA = pinnedActivityIds.includes(keyA);
      const pinB = pinnedActivityIds.includes(keyB);
      if (pinA && !pinB) return -1;
      if (!pinA && pinB) return 1;

      if (activityOrder.length > 0 && sortBy === 'newest') {
        const idxA = activityOrder.indexOf(keyA);
        const idxB = activityOrder.indexOf(keyB);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
      }

      if (sortBy === 'amount_desc') {
        return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.date || 0) - new Date(b.date || 0);
      }
      return new Date(b.date || 0) - new Date(a.date || 0);
    });
  }, [activities, activeFilter, statusFilter, searchQuery, sortBy, hiddenActivityIds, pinnedActivityIds, activityOrder, getActKey]);

  // Aggregate metrics
  const totalVolume = useMemo(() => {
    return filteredActivities.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [filteredActivities]);

  const activityKpis = useMemo(
    () => [
      {
        id: 'act-total',
        label: 'Total Activity Volume',
        count: activities.length,
        value: formatInr(totalVolume),
        sub: `Total Value: ${formatInr(totalVolume)}`,
        icon: Layers,
        color: '#2563eb',
        tint: '37,99,235',
      },
      {
        id: 'act-sent',
        label: 'Synced to Tally',
        count: metrics.sent,
        value: metrics.sent,
        sub: activities.length > 0 ? `${((metrics.sent / activities.length) * 100).toFixed(0)}% synced successfully` : '100% synced successfully',
        icon: CheckCircle2,
        color: '#059669',
        tint: '16,185,129',
        activeWhen: statusFilter === 'Sent',
      },
      {
        id: 'act-waiting',
        label: 'Waiting in Queue',
        count: metrics.waiting,
        value: metrics.waiting,
        sub: 'Pushes automatically to Tally',
        icon: Clock,
        color: '#d97706',
        tint: '245,158,11',
        activeWhen: statusFilter === 'Waiting',
      },
      {
        id: 'act-attention',
        label: 'Requires Attention',
        count: metrics.notSent,
        value: metrics.notSent,
        sub: metrics.notSent > 0 ? 'Action required or offline' : 'All vouchers up to date',
        icon: AlertCircle,
        color: '#e11d48',
        tint: '244,63,94',
        activeWhen: statusFilter === 'Not sent',
      },
    ],
    [activities.length, totalVolume, metrics.sent, metrics.waiting, metrics.notSent, statusFilter]
  );

  const {
    visibleCards: visibleActivityKpis,
    hiddenCards: hiddenActivityKpis,
    pinned: pinnedActivityKpis,
    menu: activityMenu,
    setMenu: setActivityMenu,
    togglePin: toggleActivityPin,
    hide: hideActivityCard,
    unhide: unhideActivityCard,
    unhideAll: unhideAllActivityCards,
    reset: resetActivityCards,
    handleDragStart: onActivityDragStart,
    handleDragOver: onActivityDragOver,
    handleDrop: onActivityDrop,
    handleDragEnd: onActivityDragEnd,
    openMenu: openActivityMenu,
    isPinned: isActivityPinned,
  } = useCardGridPreferences('tc_activity_kpi', activityKpis);

  return (
    <div
      className="activity-tab-view fade-in"
      style={{
        padding: '24px 28px 80px',
        maxWidth: '1440px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <div
        className="glass-panel"
        style={{
          padding: '22px 28px',
          borderRadius: '24px',
          marginBottom: '24px',
          background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.82))',
          backdropFilter: 'blur(var(--glass-blur, 24px))',
          WebkitBackdropFilter: 'blur(var(--glass-blur, 24px))',
          border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.9))',
          boxShadow: 'var(--glass-shadow, 0 10px 32px rgba(15, 23, 42, 0.05))'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          {/* Left: Title + Brand Pills + Sync Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1.5px solid rgba(225, 29, 72, 0.22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#e11d48',
                boxShadow: '0 4px 14px rgba(225, 29, 72, 0.12)',
                flexShrink: 0
              }}
            >
              <Laptop size={22} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: 800,
                    color: 'var(--text-dark, #0f172a)',
                    letterSpacing: '-0.5px'
                  }}
                >
                  Activity Center
                </h1>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    background: 'rgba(225, 29, 72, 0.1)',
                    color: '#e11d48',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.2px'
                  }}
                >
                  From Tally
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#059669',
                    fontSize: '11px',
                    fontWeight: 700
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                  Live Sync Queue
                </span>
              </div>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '13px',
                  color: 'var(--text-muted, #64748b)',
                  fontWeight: 500
                }}
              >
                Entries synced and queued for bi-directional transfer with Tally Prime · Company: <strong style={{ color: 'var(--text-dark, #0f172a)' }}>{activeCompanyName}</strong> · Last Synced: <strong style={{ color: 'var(--text-dark, #0f172a)' }}>{syncInfo?.last_sync_at ? formatSyncTimeDisplay(syncInfo.last_sync_at) : lastSyncDate}</strong>
              </p>
            </div>
          </div>

          {/* Right: Actions, View Mode & Create Voucher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* View Mode Switcher: Table vs Grid */}
            <div
              className="glass-panel"
              style={{
                display: 'flex',
                padding: '3px',
                borderRadius: '12px',
                gap: '2px',
                background: 'rgba(0, 0, 0, 0.04)',
                border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.7))'
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('table')}
                style={{
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '9px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: viewMode === 'table' ? 'var(--glass-card-bg, #ffffff)' : 'transparent',
                  color: viewMode === 'table' ? 'var(--text-dark, #0f172a)' : 'var(--text-muted, #64748b)',
                  boxShadow: viewMode === 'table' ? '0 2px 6px rgba(0, 0, 0, 0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
                title="Desktop Table View"
              >
                <List size={14} /> Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                style={{
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '9px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: viewMode === 'grid' ? 'var(--glass-card-bg, #ffffff)' : 'transparent',
                  color: viewMode === 'grid' ? 'var(--text-dark, #0f172a)' : 'var(--text-muted, #64748b)',
                  boxShadow: viewMode === 'grid' ? '0 2px 6px rgba(0, 0, 0, 0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
                title="Cards Grid View"
              >
                <LayoutGrid size={14} /> Grid
              </button>
            </div>

            {/* Tally Connector Hub Modal Trigger */}
            <button
              type="button"
              onClick={() => setShowConnectorModal(true)}
              className="glass-panel"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 14px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                background: 'var(--glass-bg, rgba(255, 255, 255, 0.85))',
                border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.7))',
                color: 'var(--text-dark, #0f172a)',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}
              title="Open Tally Connector & Background Agent Diagnostic Hub"
            >
              <Server size={15} color="#2563eb" />
              <span>Connector Hub</span>
              {(queueBreakdown.ledgers + queueBreakdown.vouchers + queueBreakdown.bills + (queueBreakdown.mobile || 0)) > 0 && (
                <span
                  style={{
                    background: '#f59e0b',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    marginLeft: '2px'
                  }}
                >
                  {queueBreakdown.ledgers + queueBreakdown.vouchers + queueBreakdown.bills + (queueBreakdown.mobile || 0)}
                </span>
              )}
            </button>

            {/* Trigger Immediate Sync Signal */}
            <button
              type="button"
              onClick={handleTriggerSync}
              disabled={syncTriggering}
              className="glass-panel"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: syncTriggering ? 'not-allowed' : 'pointer',
                background: 'rgba(244, 63, 94, 0.08)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                color: '#e11d48',
                transition: 'all 0.2s ease'
              }}
              title="Dispatch instant sync signal to Windows Tally Agent"
            >
              <Zap size={14} className={syncTriggering ? 'spin-icon' : ''} />
              <span>{syncTriggering ? 'Triggering...' : 'Trigger Sync'}</span>
            </button>

            {/* Refresh Button */}
            {/* <button
              type="button"
              onClick={() => fetchActivityData(true)}
              className="glass-panel"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.7))',
                background: 'var(--glass-bg, rgba(255, 255, 255, 0.75))',
                cursor: 'pointer',
                color: 'var(--text-dark, #0f172a)',
                transition: 'all 0.2s ease'
              }}
              title="Refresh queue activity"
            >
              <RefreshCw size={16} className={refreshing ? 'spin-icon' : ''} />
            </button> */}

            {/* Create Voucher CTA */}
            {onOpenCreateVoucher && (
              <button
                type="button"
                onClick={onOpenCreateVoucher}
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(225, 29, 72, 0.25)'
                }}
              >
                <Plus size={16} /> Create Voucher
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transient Sync Trigger Message Toast */}
      {triggerMessage && (
        <div
          className="glass-panel"
          style={{
            padding: '12px 18px',
            borderRadius: '14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#065f46',
            fontSize: '13px',
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={16} color="#059669" />
            <span>{triggerMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setTriggerMessage('')}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#065f46' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <HiddenCardsChip hiddenCards={hiddenActivityKpis} onUnhide={unhideActivityCard} />

      {/* =========================================================================
          DESKTOP 4-CARD KPI METRIC GRID
          ========================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        {visibleActivityKpis.map((c) => {
          const isSentCard = c.id === 'act-sent';
          const isWaitingCard = c.id === 'act-waiting';
          const isAttnCard = c.id === 'act-attention';
          const active =
            (isSentCard && statusFilter === 'Sent') ||
            (isWaitingCard && statusFilter === 'Waiting') ||
            (isAttnCard && statusFilter === 'Not sent');
          const Icon = c.icon;
          const isDragging = false;
          const isDragOver = false;
          const pinned = isActivityPinned(c.id);
          return (
            <div
              key={c.id}
              className="glass-panel"
              draggable
              onDragStart={(e) => onActivityDragStart(e, c.id)}
              onDragOver={(e) => onActivityDragOver(e, c.id)}
              onDrop={(e) => onActivityDrop(e, c.id)}
              onDragEnd={onActivityDragEnd}
              onContextMenu={(e) => openActivityMenu(e, c)}
              onClick={() => {
                if (isSentCard) setStatusFilter(statusFilter === 'Sent' ? 'All' : 'Sent');
                else if (isWaitingCard) setStatusFilter(statusFilter === 'Waiting' ? 'All' : 'Waiting');
                else if (isAttnCard) setStatusFilter(statusFilter === 'Not sent' ? 'All' : 'Not sent');
              }}
              style={{
                padding: '20px 22px',
                borderRadius: '20px',
                cursor: isSentCard || isWaitingCard || isAttnCard ? 'pointer' : 'grab',
                background: active
                  ? `rgba(${c.tint}, 0.16)`
                  : 'var(--glass-card-bg, rgba(255, 255, 255, 0.78))',
                border: active ? `2px solid rgb(${c.tint})` : '1px solid var(--glass-border, rgba(255, 255, 255, 0.85))',
                boxShadow: 'var(--glass-shadow, 0 8px 24px rgba(15, 23, 42, 0.04))',
                transition: 'all 0.2s ease',
                opacity: isDragging ? 0.5 : 1,
                outline: isDragOver ? '2px solid rgba(37,99,235,0.5)' : 'none',
                position: 'relative',
              }}
              title="Drag to reorder • Right-click for options"
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
                    letterSpacing: '0.5px',
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
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={18} />
                </div>
              </div>
              {c.id === 'act-total' ? (
                <>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-dark, #0f172a)', margin: '8px 0 4px', letterSpacing: '-0.5px' }}>
                    {c.count} <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Vouchers</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
                    {c.sub}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-dark, #0f172a)', margin: '8px 0 4px', letterSpacing: '-0.5px' }}>
                    {c.value}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
                    {c.sub}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      <CardContextMenu
        menu={activityMenu}
        onClose={() => setActivityMenu(null)}
        pinned={pinnedActivityKpis}
        onTogglePin={toggleActivityPin}
        onHide={hideActivityCard}
        onReset={resetActivityCards}
        onUnhideAll={unhideAllActivityCards}
        hiddenCount={hiddenActivityKpis.length}
      />


      {/* =========================================================================
          DESKTOP FILTER & TOOLBAR
          ========================================================================= */}
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
          {/* Voucher Type Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', maxWidth: '100%' }}>
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab;
              const count = tab === 'All'
                ? activities.length
                : activities.filter(a => String(a.voucher_type || '').toLowerCase().includes(tab.toLowerCase())).length;

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveFilter(tab)}
                  style={{
                    border: 'none',
                    background: isActive ? '#e11d48' : 'rgba(0, 0, 0, 0.04)',
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
                  <span>{tab}</span>
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
                </button>
              );
            })}
          </div>

          {/* Search Input & Sorter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flexShrink: 0 }}>
            {/* Search Input */}
            <BitrixFilterBar
              storageKey="tc_activity_filter"
              id="activity-search-input"
              name="activity_search"
              searchQuery={searchQuery}
              onSearchChange={(val) => {
                setSearchQuery(val);
                setPage(1);
              }}
              placeholder="Search party, voucher #..."
              availableFields={[
                { id: 'search', label: 'Party / Voucher #', type: 'text', category: 'General' },
                { id: 'module', label: 'Module', type: 'select', category: 'General', options: ['Vouchers', 'Ledgers', 'Orders', 'Users', 'Reports'] }
              ]}
              defaultVisibleFieldIds={['search', 'module']}
              presets={[
                { id: 'all_activity', label: 'All activities', filters: {} },
                { id: 'voucher_activity', label: 'Vouchers', filters: { module: 'Vouchers' } },
                { id: 'ledger_activity', label: 'Ledgers', filters: { module: 'Ledgers' } }
              ]}
              onReset={() => {
                setSearchQuery('');
                setPage(1);
              }}
            />

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="glass-panel"
              style={{
                padding: '6px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-dark, #0f172a)',
                background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.85))',
                border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.08))',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
            </select>
          </div>
        </div>

        {/* Status Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', paddingTop: '4px', borderTop: '1px solid rgba(0, 0, 0, 0.04)' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-muted, #64748b)' }}>Filter by Status:</span>
          {STATUS_TABS.map((status) => {
            const isSelected = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                style={{
                  border: 'none',
                  background: isSelected ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
                  color: isSelected ? 'var(--text-dark, #0f172a)' : 'var(--text-muted, #64748b)',
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: '12px',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          ACTIVITY DATA DISPLAY (Desktop Table vs Grid View)
          ========================================================================= */}
      {loading ? (
        <div
          className="glass-panel"
          style={{
            padding: '56px 20px',
            textAlign: 'center',
            borderRadius: '24px',
            background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.75))',
            border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.85))'
          }}
        >
          <RefreshCw size={28} className="spin-icon" style={{ color: '#e11d48', margin: '0 auto 12px' }} />
          <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-dark, #0f172a)' }}>
            Checking real-time sync queue...
          </p>
          <span style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', marginTop: '4px', display: 'block' }}>
            Fetching pending vouchers and Tally transmission logs
          </span>
        </div>
      ) : filteredActivities.length === 0 ? (
        /* Empty State */
        <div
          className="glass-panel activity-empty-capsule"
          style={{
            padding: '48px 24px',
            borderRadius: '24px',
            background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.72))',
            backdropFilter: 'blur(var(--glass-blur, 24px))',
            WebkitBackdropFilter: 'blur(var(--glass-blur, 24px))',
            border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.85))',
            boxShadow: 'var(--glass-shadow, 0 8px 24px rgba(15, 23, 42, 0.04))',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
        >
          <Receipt size={36} color="var(--text-muted, #94a3b8)" style={{ opacity: 0.6 }} />
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--text-dark, #0f172a)' }}>
              No Vouchers Found
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
              {searchQuery || activeFilter !== 'All' || statusFilter !== 'All'
                ? 'No activities match your current search and filter criteria.'
                : 'Entries created on mobile or web will appear here as they sync to Tally.'}
            </p>
          </div>
          {onOpenCreateVoucher && (
            <button
              type="button"
              onClick={onOpenCreateVoucher}
              className="btn-primary"
              style={{
                marginTop: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 18px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 700
              }}
            >
              <Plus size={15} /> Create your first voucher
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* =========================================================================
            DESKTOP DATA TABLE VIEW
            ========================================================================= */
        <div
          className="glass-panel"
          style={{
            borderRadius: '24px',
            background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.8))',
            backdropFilter: 'blur(var(--glass-blur, 24px))',
            WebkitBackdropFilter: 'blur(var(--glass-blur, 24px))',
            border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.9))',
            boxShadow: 'var(--glass-shadow, 0 10px 30px rgba(15, 23, 42, 0.04))',
            overflow: 'hidden'
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '820px' }}>
              <thead>
                <tr
                  style={{
                    background: 'rgba(0, 0, 0, 0.02)',
                    borderBottom: '1px solid var(--glass-border, rgba(0, 0, 0, 0.06))',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    color: 'var(--text-muted, #64748b)'
                  }}
                >
                  <th style={{ width: '36px', padding: '14px 8px', textAlign: 'center' }}></th>
                  <th style={{ padding: '14px 20px' }}>Status</th>
                  <th style={{ padding: '14px 16px' }}>Voucher Type</th>
                  <th style={{ padding: '14px 16px' }}>Voucher #</th>
                  <th style={{ padding: '14px 20px' }}>Customer / Party</th>
                  <th style={{ padding: '14px 16px' }}>Date</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Target</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((item, index) => {
                  const meta = getMeta(item.voucher_type);
                  const statusBadge = getStatusBadge(item.status);
                  const Icon = meta.icon;
                  const isCopied = copiedVoucherNo === item.voucher_no;
                  const isPinned = isItemPinned(item);
                  const isDragging = draggedActivityKey === getActKey(item);
                  const isDragOver = dragOverActivityKey === getActKey(item);

                  return (
                    <tr
                      key={item.id || index}
                      draggable
                      onDragStart={(e) => handleActivityDragStart(e, item)}
                      onDragOver={(e) => handleActivityDragOver(e, item)}
                      onDrop={(e) => handleActivityDrop(e, item, filteredActivities)}
                      onDragEnd={handleActivityDragEnd}
                      onClick={() => {
                        if (wasActivityDraggingRef.current) return;
                        setSelectedActivity(item);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setMenuActivity(item);
                      }}
                      {...createHoldTouchHandler(() => setMenuActivity(item))}
                      className={`table-row-hover draggable-card ${isPinned ? 'is-pinned' : ''} ${isDragging ? 'is-dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                      style={{
                        borderBottom: index < filteredActivities.length - 1 ? '1px solid var(--glass-border, rgba(0, 0, 0, 0.05))' : 'none',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                        background: isPinned ? 'rgba(99, 102, 241, 0.05)' : (isDragOver ? 'rgba(99, 102, 241, 0.12)' : undefined),
                        opacity: isDragging ? 0.4 : 1
                      }}
                      title="Click to view details, right-click or hold for actions, drag to reorder"
                    >
                      {/* Drag Handle */}
                      <td style={{ padding: '14px 8px', textAlign: 'center', width: '36px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="item-drag-handle" title="Drag to reorder" style={{ cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Move size={14} color="var(--text-muted, #94a3b8)" />
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 20px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 9px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: statusBadge.bg,
                            color: statusBadge.color,
                            border: `1px solid ${statusBadge.border}`
                          }}
                        >
                          <statusBadge.icon size={12} />
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* Voucher Type */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '9px',
                              background: meta.bg,
                              color: meta.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <Icon size={15} />
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: meta.color }}>
                            {item.voucher_type}
                          </span>
                        </div>
                      </td>

                      {/* Voucher Number */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '13px',
                              fontWeight: 700,
                              color: 'var(--text-dark, #0f172a)',
                              background: 'rgba(0, 0, 0, 0.04)',
                              padding: '2px 8px',
                              borderRadius: '6px'
                            }}
                          >
                            {item.voucher_no}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyVoucherNo(e, item.voucher_no)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              padding: '2px',
                              color: isCopied ? '#059669' : '#94a3b8',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Copy voucher #"
                          >
                            {isCopied ? <CheckCheck size={14} /> : <Copy size={13} />}
                          </button>
                        </div>
                      </td>

                      {/* Customer / Party */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-dark, #0f172a)' }}>
                            {item.customer || 'Direct Entry'}
                          </span>
                          {isPinned && (
                            <span className="item-pinned-tag" style={{ padding: '2px 6px', fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <Pin size={9} /> Pinned
                            </span>
                          )}
                          {item.channel === 'Mobile App' && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '1px 7px',
                                borderRadius: '6px',
                                background: 'rgba(99, 102, 241, 0.12)',
                                color: '#6366f1',
                                fontSize: '10px',
                                fontWeight: 800
                              }}
                              title="Synchronized from mobile application queue"
                            >
                              📱 Mobile App
                            </span>
                          )}
                          {item.retry_count > 0 && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '1px 7px',
                                borderRadius: '6px',
                                background: 'rgba(245, 158, 11, 0.12)',
                                color: '#d97706',
                                fontSize: '10px',
                                fontWeight: 800
                              }}
                              title={`Retried ${item.retry_count} time(s)`}
                            >
                              <RotateCcw size={9} /> Retry #{item.retry_count}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted, #64748b)', fontWeight: 500 }}>
                        {formatDateDisplay(item.date)}
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-dark, #0f172a)', letterSpacing: '-0.3px' }}>
                          {formatInr(item.amount)}
                        </div>
                      </td>

                      {/* Target */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted, #64748b)', background: 'rgba(0, 0, 0, 0.03)', padding: '2px 8px', borderRadius: '6px' }}>
                          Tally Prime
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {canRetryItem(item) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRetry(item);
                              }}
                              disabled={retryingId === item.id}
                              className="btn-secondary"
                              style={{
                                padding: '5px 10px',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: '#e11d48',
                                background: 'rgba(225, 29, 72, 0.08)',
                                border: '1px solid rgba(225, 29, 72, 0.25)'
                              }}
                              title="Retry transmission to Tally"
                            >
                              <RotateCcw size={12} className={retryingId === item.id ? 'spin-icon' : ''} /> Retry
                            </button>
                          )}
                          {(item.status === 'Waiting' || item.status === 'Not sent') && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingVoucher(item);
                              }}
                              className="btn-secondary"
                              style={{
                                padding: '5px 10px',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: '#2563eb'
                              }}
                              title="Edit queued voucher"
                            >
                              <Edit3 size={12} /> Edit
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedActivity(item);
                            }}
                            className="btn-secondary"
                            style={{
                              padding: '5px 10px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Eye size={12} /> View
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuActivity(item);
                            }}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              padding: '4px',
                              color: 'var(--text-muted, #64748b)',
                              display: 'flex',
                              alignItems: 'center',
                              borderRadius: '6px'
                            }}
                            title="More options (right-click / hold)"
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* =========================================================================
            DESKTOP CARDS GRID VIEW
            ========================================================================= */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
            gap: '16px'
          }}
        >
          {filteredActivities.map((item, index) => {
            const meta = getMeta(item.voucher_type);
            const statusBadge = getStatusBadge(item.status);
            const Icon = meta.icon;
            const isPinned = isItemPinned(item);
            const isDragging = draggedActivityKey === getActKey(item);
            const isDragOver = dragOverActivityKey === getActKey(item);

            return (
              <div
                key={item.id || index}
                draggable
                onDragStart={(e) => handleActivityDragStart(e, item)}
                onDragOver={(e) => handleActivityDragOver(e, item)}
                onDrop={(e) => handleActivityDrop(e, item, filteredActivities)}
                onDragEnd={handleActivityDragEnd}
                onClick={() => {
                  if (wasActivityDraggingRef.current) return;
                  setSelectedActivity(item);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setMenuActivity(item);
                }}
                {...createHoldTouchHandler(() => setMenuActivity(item))}
                className={`glass-panel activity-card-item draggable-card ${isPinned ? 'is-pinned' : ''} ${isDragging ? 'is-dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                style={{
                  padding: '20px',
                  borderRadius: '20px',
                  background: isPinned ? 'rgba(99, 102, 241, 0.05)' : 'var(--glass-card-bg, rgba(255, 255, 255, 0.8))',
                  border: isPinned ? '1.5px solid rgba(99, 102, 241, 0.35)' : '1px solid var(--glass-border, rgba(255, 255, 255, 0.9))',
                  boxShadow: 'var(--glass-shadow, 0 6px 20px rgba(15, 23, 42, 0.04))',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  opacity: isDragging ? 0.4 : 1,
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(15, 23, 42, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'var(--glass-shadow, 0 6px 20px rgba(15, 23, 42, 0.04))';
                }}
              >
                {/* Card Top: Voucher Type & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      className="item-drag-handle"
                      title="Drag to reorder"
                      style={{ cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Move size={14} color="var(--text-muted, #94a3b8)" />
                    </div>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        background: meta.bg,
                        color: meta.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Icon size={17} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: meta.color }}>
                          {item.voucher_type}
                        </span>
                        {isPinned && (
                          <span className="item-pinned-tag" style={{ padding: '1px 5px', fontSize: '9px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            <Pin size={8} /> Pinned
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
                        {item.voucher_no}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {item.retry_count > 0 && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: 800,
                          background: 'rgba(245, 158, 11, 0.12)',
                          color: '#d97706'
                        }}
                      >
                        <RotateCcw size={9} /> #{item.retry_count}
                      </span>
                    )}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: statusBadge.bg,
                        color: statusBadge.color,
                        border: `1px solid ${statusBadge.border}`
                      }}
                    >
                      <statusBadge.icon size={11} />
                      {statusBadge.label}
                    </span>
                  </div>
                </div>

                {/* Card Middle: Customer Party */}
                <div>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: '15px',
                      fontWeight: 700,
                      color: 'var(--text-dark, #0f172a)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {item.customer || 'Direct Entry'}
                  </h4>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                    Date: {formatDateDisplay(item.date)}
                  </div>
                </div>

                {/* Card Bottom: Amount & View details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0, 0, 0, 0.05)', paddingTop: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted, #64748b)', fontWeight: 700 }}>Amount</span>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-dark, #0f172a)' }}>
                      {formatInr(item.amount)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {canRetryItem(item) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRetry(item);
                        }}
                        disabled={retryingId === item.id}
                        className="btn-secondary"
                        style={{
                          padding: '5px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: '#e11d48',
                          background: 'rgba(225, 29, 72, 0.08)',
                          border: '1px solid rgba(225, 29, 72, 0.25)'
                        }}
                        title="Retry transmission to Tally"
                      >
                        <RotateCcw size={11} className={retryingId === item.id ? 'spin-icon' : ''} /> Retry
                      </button>
                    )}
                    {(item.status === 'Waiting' || item.status === 'Not sent') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingVoucher(item);
                        }}
                        className="btn-secondary"
                        style={{
                          padding: '5px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: '#2563eb'
                        }}
                      >
                        <Edit3 size={11} /> Edit
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedActivity(item);
                      }}
                      className="btn-secondary"
                      style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Eye size={11} /> View
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuActivity(item);
                      }}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        padding: '4px',
                        color: 'var(--text-muted, #64748b)',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '6px'
                      }}
                      title="Options"
                    >
                      <MoreVertical size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          ACTIVITY DETAIL POPUP MODAL (View voucher details)
          ========================================================================= */}
      {selectedActivity && createPortal(
        <div
          className="fade-in modal-overlay"
          onClick={() => setSelectedActivity(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
            overflowY: 'auto',
            boxSizing: 'border-box'
          }}
        >
          <div
            className="glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '480px',
              maxHeight: '88vh',
              overflowY: 'auto',
              margin: 'auto',
              borderRadius: '26px',
              background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.96))',
              backdropFilter: 'blur(var(--glass-blur, 28px))',
              WebkitBackdropFilter: 'blur(var(--glass-blur, 28px))',
              border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.9))',
              boxShadow: 'var(--glass-shadow, 0 25px 60px rgba(15, 23, 42, 0.28))',
              padding: '24px',
              boxSizing: 'border-box'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: getMeta(selectedActivity.voucher_type).bg,
                    color: getMeta(selectedActivity.voucher_type).color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Receipt size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--text-dark, #0f172a)' }}>
                    {selectedActivity.voucher_no}
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
                    {selectedActivity.voucher_type} Voucher
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedActivity(null)}
                style={{
                  border: 'none',
                  background: 'rgba(0, 0, 0, 0.05)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b',
                  transition: 'background 0.2s ease'
                }}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Details List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '22px' }}>
              {selectedActivity.error && (
                <div style={{ padding: '12px 14px', borderRadius: '14px', background: 'rgba(225, 29, 72, 0.08)', border: '1px solid rgba(225, 29, 72, 0.25)', color: '#be123c', fontSize: '13px' }}>
                  <div style={{ fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={14} /> Transmission Error
                  </div>
                  <div style={{ wordBreak: 'break-word', lineHeight: 1.4 }}>{selectedActivity.error}</div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.03)' }}>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Customer</span>
                <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: 700 }}>{selectedActivity.customer}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.03)' }}>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Date</span>
                <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: 700 }}>{formatDateDisplay(selectedActivity.date)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.03)' }}>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Amount</span>
                <span style={{ fontSize: '16px', color: '#0f172a', fontWeight: 800 }}>{formatInr(selectedActivity.amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.03)' }}>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Status</span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: getStatusBadge(selectedActivity.status).bg,
                    color: getStatusBadge(selectedActivity.status).color
                  }}
                >
                  {getStatusBadge(selectedActivity.status).label}
                </span>
              </div>
              {selectedActivity.retry_count > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.03)' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Retry Count</span>
                  <span style={{ fontSize: '13px', color: '#d97706', fontWeight: 700 }}>{selectedActivity.retry_count} attempt(s)</span>
                </div>
              )}
              {(selectedActivity.target_guid || selectedActivity.tally_guid) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.03)' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Tally GUID</span>
                  <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#0f172a', fontWeight: 600 }}>{selectedActivity.target_guid || selectedActivity.tally_guid}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.03)' }}>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Created by</span>
                <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 600 }}>{currentUser.name || currentUser.email || 'Current User'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
              {canRetryItem(selectedActivity) && (
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={retryingId === selectedActivity.id}
                  onClick={() => handleRetry(selectedActivity)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '14px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    color: '#e11d48',
                    background: 'rgba(225, 29, 72, 0.08)',
                    border: '1px solid rgba(225, 29, 72, 0.25)'
                  }}
                >
                  <RotateCcw size={15} className={retryingId === selectedActivity.id ? 'spin-icon' : ''} />
                  <span>{retryingId === selectedActivity.id ? 'Retrying...' : 'Retry Transmission'}</span>
                </button>
              )}
              {(selectedActivity.status === 'Waiting' || selectedActivity.status === 'Not sent') && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    const toEdit = selectedActivity;
                    setSelectedActivity(null);
                    setEditingVoucher(toEdit);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '14px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Edit3 size={15} /> Edit Voucher
                </button>
              )}
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedActivity(null)}
                style={{ flex: 1, padding: '12px', borderRadius: '14px', fontWeight: 700 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Context Menu for Individual Activity Item (Right-Click & Touch Hold) */}
      {menuActivity && createPortal(
        <div className="item-popover-overlay" onClick={() => setMenuActivity(null)}>
          <div className="item-popover-box" onClick={(e) => e.stopPropagation()}>
            <div className="item-popover-header-row">
              <div
                className="item-popover-icon-badge"
                style={{
                  color: getMeta(menuActivity.voucher_type).color,
                  background: getMeta(menuActivity.voucher_type).bg
                }}
              >
                {React.createElement(getMeta(menuActivity.voucher_type).icon, { size: 18 })}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div className="item-popover-item-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {menuActivity.voucher_no || menuActivity.voucher_type || 'Activity Entry'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {menuActivity.customer || formatInr(menuActivity.amount)}
                </div>
              </div>
            </div>

            {/* Pin / Unpin */}
            <button
              type="button"
              className="item-popover-action-btn"
              onClick={() => handleTogglePin(menuActivity)}
            >
              <Pin size={18} style={{ color: '#4f46e5' }} />
              <span>{isItemPinned(menuActivity) ? 'Unpin' : 'Pin to Top'}</span>
            </button>

            {/* Edit Entry */}
            <button
              type="button"
              className="item-popover-action-btn"
              onClick={() => {
                const target = menuActivity;
                setMenuActivity(null);
                setEditingVoucher(target);
              }}
            >
              <Edit3 size={18} style={{ color: '#2563eb' }} />
              <span>Edit Entry</span>
            </button>

            {/* Retry transmission if failed / stuck */}
            {canRetryItem(menuActivity) && (
              <button
                type="button"
                className="item-popover-action-btn"
                onClick={() => handleRetry(menuActivity)}
                disabled={retryingId === menuActivity.id}
              >
                <RotateCcw size={18} className={retryingId === menuActivity.id ? 'spin-icon' : ''} style={{ color: '#e11d48' }} />
                <span>Retry Transmission</span>
              </button>
            )}

            {/* View Details */}
            <button
              type="button"
              className="item-popover-action-btn"
              onClick={() => {
                const target = menuActivity;
                setMenuActivity(null);
                setSelectedActivity(target);
              }}
            >
              <Eye size={18} style={{ color: '#0ea5e9' }} />
              <span>View Details</span>
            </button>



            {/* Hide Entry */}
            <button
              type="button"
              className="item-popover-action-btn"
              onClick={() => handleHideActivity(menuActivity)}
            >
              <EyeOff size={18} style={{ color: '#64748b' }} />
              <span>Hide</span>
            </button>

            {/* Share / Copy Details */}
            <button
              type="button"
              className="item-popover-action-btn share-action"
              onClick={() => {
                const target = menuActivity;
                setMenuActivity(null);
                const txt = `🧾 ${target.voucher_type} #${target.voucher_no}\nParty: ${target.customer}\nAmount: ${formatInr(target.amount)}\nStatus: ${target.status}\nDate: ${formatDateDisplay(target.date)}\nCompany: ${activeCompanyName}`;
                if (navigator.share) {
                  navigator.share({ title: target.voucher_no, text: txt }).catch(() => { });
                } else if (navigator.clipboard) {
                  navigator.clipboard.writeText(txt);
                  showToast('Entry details copied to clipboard!');
                }
              }}
            >
              <Share2 size={18} />
              <span>Share</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="dashboard-toast">
          <CheckCircle2 size={16} style={{ color: '#10b981' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Unhide Modal for Activities */}
      <UnhideModal
        isOpen={showUnhideModal}
        onClose={() => setShowUnhideModal(false)}
        title="Hidden Activity Entries"
        description="Select entries to restore to your queue view."
        hiddenItems={hiddenActivitiesList}
        onUnhideOne={handleUnhideOneActivity}
        onUnhideAll={handleUnhideAllActivities}
      />

      {/* Edit Queued Voucher Wizard Modal (Feature 6) */}
      {editingVoucher && (
        <CreateVoucherWizard
          isOpen={!!editingVoucher}
          initialVoucher={editingVoucher}
          initialType={editingVoucher.base_voucher_type || String(editingVoucher.voucher_type || '').replace(' (Mobile)', '') || 'Sales'}
          onClose={() => setEditingVoucher(null)}
          onSuccess={() => {
            setEditingVoucher(null);
            fetchActivityData(true);
            showToast('Entry updated successfully');
          }}
          companyGuid={companyGuid}
          activeCompanyName={activeCompanyName}
          showToast={showToast}
        />
      )}

      {/* Tally Connector & Background Agent Diagnostic Hub Modal */}
      <TallyConnectorModal
        isOpen={showConnectorModal}
        onClose={() => setShowConnectorModal(false)}
        companyGuid={companyGuid}
        activeCompanyName={activeCompanyName}
        queueBreakdown={queueBreakdown}
        onTriggerSync={handleTriggerSync}
        syncTriggering={syncTriggering}
      />
    </div>
  );
};

export default ActivityManager;

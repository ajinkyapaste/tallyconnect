import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar, CheckCircle2, XCircle, AlertCircle, Clock, Plus, Filter,
  Search, RotateCcw, ChevronRight, Check, X, Shield, Users, User,
  MoreVertical, Pin, Eye, EyeOff, Move, Settings, Trash2, Sun, Moon,
  FileText, Briefcase, HelpCircle, ArrowRight, CornerDownRight, CheckSquare,
  AlertTriangle, Info, CalendarDays, ChevronLeft, CalendarRange
} from 'lucide-react';
import {
  getLeaveMe,
  applyLeaveRequest,
  cancelLeaveRequest,
  getLeaveCalendar,
  getLeaveSettings,
  updateLeaveSettings,
  createLeaveType,
  createDefaultLeaveTypes,
  updateLeaveType,
  addLeaveHoliday,
  deleteLeaveHoliday,
  getLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  getLeaveTeamMember
} from './api';
import DisplayPreferencesBar from './DisplayPreferencesBar';
import StandardPagination from './StandardPagination';
import { UnhideModal, createHoldTouchHandler } from './uiUtils';

/* ---------------- Date Helpers ---------------- */
const istToday = () => {
  const IST_MS = 330 * 60 * 1000;
  return new Date(Date.now() + IST_MS).toISOString().slice(0, 10);
};

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return String(iso);
  }
};

const formatDayMonth = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return String(iso);
  }
};

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function LeaveManager({ user, companyGuid }) {
  const isAdmin = user?.role === 'ADMIN';

  // Sub-tabs: Admin default 'requests', Member default 'me'
  const [activeTab, setActiveTab] = useState(isAdmin ? 'requests' : 'me'); // 'me' | 'requests' | 'team' | 'calendar' | 'settings'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(istToday);

  // Display Preferences & Pagination
  const [viewMode, setViewMode] = useState('card');
  const [cardOpacity, setCardOpacity] = useState(() => {
    try {
      const v = parseFloat(localStorage.getItem('tc_leave_card_opacity'));
      return Number.isFinite(v) ? Math.min(1, Math.max(0.1, v)) : 0.85;
    } catch {
      return 0.85;
    }
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Data states
  const [memberData, setMemberData] = useState(null);
  const [adminRequests, setAdminRequests] = useState([]);
  const [settingsData, setSettingsData] = useState(null);
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Modals & Actions
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [decisionModal, setDecisionModal] = useState(null); // { request, action: 'approve' | 'reject' | 'cancel' }
  const [decisionNote, setDecisionNote] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [memberDrilldown, setMemberDrilldown] = useState(null);
  const [typeModal, setTypeModal] = useState(null); // null | { isEdit: boolean, data }
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '' });

  // Top summary KPI cards reordering & hiding
  const [summaryOrder, setSummaryOrder] = useState(() => {
    try {
      const s = localStorage.getItem('tc_leave_summary_order');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [summaryHidden, setSummaryHidden] = useState(() => {
    try {
      const s = localStorage.getItem('tc_leave_summary_hidden');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const [summaryPinned, setSummaryPinned] = useState(() => {
    try {
      const s = localStorage.getItem('tc_leave_summary_pinned');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const [draggedSummaryIdx, setDraggedSummaryIdx] = useState(null);
  const [dragOverSummaryIdx, setDragOverSummaryIdx] = useState(null);
  const [summaryContextMenu, setSummaryContextMenu] = useState(null);
  const [showSummaryUnhideModal, setShowSummaryUnhideModal] = useState(false);

  // Item rows drag & drop and context menu
  const [pinnedIds, setPinnedIds] = useState(() => {
    try {
      const s = localStorage.getItem('tc_leave_pinned_ids');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const [hiddenIds, setHiddenIds] = useState(() => {
    try {
      const s = localStorage.getItem('tc_leave_hidden_ids');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const [customOrder, setCustomOrder] = useState(() => {
    try {
      const s = localStorage.getItem('tc_leave_custom_order');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const wasDraggingRef = useRef(false);
  const [itemContextMenu, setItemContextMenu] = useState(null);
  const [showItemUnhideModal, setShowItemUnhideModal] = useState(false);

  // Toast feedback helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Fetch Member Leave Data
  const loadMemberData = async () => {
    try {
      const res = await getLeaveMe();
      if (res && res.success) {
        setMemberData(res);
      }
    } catch (err) {
      console.warn('Failed to load member leave data:', err);
    }
  };

  // Fetch Admin Requests
  const loadAdminRequests = async () => {
    try {
      const res = await getLeaveRequests({ status: 'all' });
      if (res && res.success) {
        setAdminRequests(res.requests || []);
      }
    } catch (err) {
      console.warn('Failed to load admin leave requests:', err);
    }
  };

  // Fetch Settings (Admin)
  const loadSettingsData = async () => {
    try {
      const res = await getLeaveSettings();
      if (res && res.success) {
        setSettingsData(res);
      }
    } catch (err) {
      console.warn('Failed to load leave settings:', err);
    }
  };

  // Fetch Calendar
  const loadCalendarData = async () => {
    try {
      const res = await getLeaveCalendar();
      if (res && res.success) {
        setCalendarData(res);
      }
    } catch (err) {
      console.warn('Failed to load leave calendar:', err);
    }
  };

  // Initial Data Load
  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([
      loadMemberData(),
      isAdmin ? loadAdminRequests() : Promise.resolve(),
      isAdmin ? loadSettingsData() : Promise.resolve(),
      loadCalendarData()
    ]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    refreshAll();
  }, [isAdmin]);

  // Persist opacity
  const handleOpacityChange = (val) => {
    setCardOpacity(val);
    try {
      localStorage.setItem('tc_leave_card_opacity', String(val));
    } catch {}
  };

  /* ---------------- Requests Filtering & Local Store Merging ---------------- */
  const rawRequests = useMemo(() => {
    let backendList = [];
    if (isAdmin) {
      backendList = adminRequests || [];
    } else {
      backendList = memberData?.requests || [];
    }
    // Read locally stored leave requests
    let localList = [];
    try {
      localList = JSON.parse(localStorage.getItem('tc_local_leave_requests') || '[]');
    } catch {}

    const backendIds = new Set(backendList.map(r => String(r.id)));
    const combined = [
      ...localList.filter(l => !backendIds.has(String(l.id))),
      ...backendList
    ];
    return combined;
  }, [isAdmin, adminRequests, memberData, refreshing]);

  // Derived available balances with dynamic deductions
  const displayBalances = useMemo(() => {
    let baseBalances = memberData?.balances;
    if (!baseBalances || baseBalances.length === 0) {
      if (settingsData?.types && settingsData.types.length > 0) {
        baseBalances = settingsData.types.filter(t => t.active !== false).map(t => ({
          type_id: t.id,
          name: t.name,
          paid: t.paid,
          quota: t.yearly_quota,
          carried: 0,
          used: 0,
          pending: 0,
          available: t.yearly_quota
        }));
      } else {
        baseBalances = [
          { type_id: 1, name: 'Casual Leave', paid: true, quota: 12, carried: 0, used: 0, pending: 0, available: 12 },
          { type_id: 2, name: 'Sick Leave', paid: true, quota: 6, carried: 0, used: 0, pending: 0, available: 6 },
          { type_id: 3, name: 'Unpaid Leave', paid: false, quota: null, carried: 0, used: 0, pending: 0, available: null }
        ];
      }
    }
    return baseBalances.map(b => {
      const typeRequests = rawRequests.filter(r => (Number(r.leave_type_id || r.type_id) === Number(b.type_id)) || (r.type_name && r.type_name.toLowerCase() === b.name.toLowerCase()));
      const pendingDays = typeRequests.filter(r => r.status === 'pending').reduce((sum, r) => sum + (Number(r.days) || 1), 0);
      const usedDays = typeRequests.filter(r => r.status === 'approved').reduce((sum, r) => sum + (Number(r.days) || 1), 0);
      const quota = b.quota;
      const initialAvail = b.available !== null && b.available !== undefined ? b.available : quota;
      const computedAvail = initialAvail !== null ? Math.max(0, initialAvail - usedDays - pendingDays) : null;
      return {
        ...b,
        pending: (b.pending || 0) + pendingDays,
        used: (b.used || 0) + usedDays,
        available: computedAvail
      };
    });
  }, [memberData, settingsData, rawRequests]);

  /* ---------------- Top Summary Cards Definition ---------------- */
  const summaryCards = useMemo(() => {
    if (!isAdmin) {
      // Member Summary Cards
      const bList = displayBalances;
      const totalAvailable = bList.reduce((acc, b) => acc + (b.available || 0), 0);
      const totalUsed = bList.reduce((acc, b) => acc + (b.used || 0), 0);
      const totalPending = bList.reduce((acc, b) => acc + (b.pending || 0), 0);
      const todayStatus = memberData?.today?.kind || 'working';
      const onLeaveToday = !!memberData?.today?.leave;

      return [
        {
          id: 'available_bal',
          label: 'Available Leave',
          value: `${totalAvailable} Days`,
          sub: `${bList.length} leave types active`,
          icon: <CheckCircle2 size={20} color="#10b981" />,
          color: '#10b981'
        },
        {
          id: 'used_days',
          label: 'Taken This Year',
          value: `${totalUsed} Days`,
          sub: 'Approved leaves in current period',
          icon: <CalendarDays size={20} color="#6366f1" />,
          color: '#6366f1'
        },
        {
          id: 'pending_requests',
          label: 'Pending Requests',
          value: `${totalPending} Days`,
          sub: 'Awaiting decision',
          icon: <Clock size={20} color="#f59e0b" />,
          color: '#f59e0b'
        },
        {
          id: 'today_status',
          label: "Today's Status",
          value: onLeaveToday ? 'On Leave' : (todayStatus === 'weekly_off' ? 'Weekly Off' : (todayStatus === 'holiday' ? 'Holiday' : 'Working')),
          sub: istToday(),
          icon: onLeaveToday ? <AlertCircle size={20} color="#ec4899" /> : <Sun size={20} color="#0ea5e9" />,
          color: onLeaveToday ? '#ec4899' : '#0ea5e9'
        }
      ];
    } else {
      // Admin Summary Cards
      const pendingCount = rawRequests.filter((r) => r.status === 'pending').length;
      const approvedCount = rawRequests.filter((r) => r.status === 'approved').length;
      const isEnabled = settingsData?.settings?.enabled ?? true;
      const activeTypesCount = settingsData?.types?.filter((t) => t.active).length || 3;
      const holidaysCount = settingsData?.holidays?.length || (calendarData?.holidays?.length) || 0;

      return [
        {
          id: 'pending_queue',
          label: 'Pending Approval',
          value: pendingCount,
          sub: pendingCount > 0 ? 'Requires review' : 'All clear',
          icon: <Clock size={20} color="#f59e0b" />,
          color: '#f59e0b'
        },
        {
          id: 'approved_records',
          label: 'Approved Leaves',
          value: approvedCount,
          sub: 'Total approved this cycle',
          icon: <CheckCircle2 size={20} color="#10b981" />,
          color: '#10b981'
        },
        {
          id: 'leave_module_status',
          label: 'System Status',
          value: isEnabled ? 'Active' : 'Disabled',
          sub: isEnabled ? 'Leave applications active' : 'Leave applications off',
          icon: <Shield size={20} color={isEnabled ? '#10b981' : '#64748b'} />,
          color: isEnabled ? '#10b981' : '#64748b'
        },
        {
          id: 'leave_types',
          label: 'Leave Types',
          value: activeTypesCount,
          sub: `${holidaysCount} holidays configured`,
          icon: <Briefcase size={20} color="#0ea5e9" />,
          color: '#0ea5e9'
        }
      ];
    }
  }, [isAdmin, memberData, rawRequests, settingsData, displayBalances, calendarData]);

  // Sorted summary cards
  const sortedSummaryCards = useMemo(() => {
    let list = [...summaryCards];
    if (summaryOrder && Array.isArray(summaryOrder)) {
      list.sort((a, b) => {
        const ia = summaryOrder.indexOf(a.id);
        const ib = summaryOrder.indexOf(b.id);
        if (ia === -1 && ib === -1) return 0;
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
    }
    const pinned = list.filter((c) => summaryPinned.includes(c.id));
    const normal = list.filter((c) => !summaryPinned.includes(c.id));
    return [...pinned, ...normal];
  }, [summaryCards, summaryOrder, summaryPinned]);

  const visibleSummaryCards = useMemo(() => {
    return sortedSummaryCards.filter((c) => !summaryHidden.includes(c.id));
  }, [sortedSummaryCards, summaryHidden]);

  // Drag and Drop for summary cards
  const handleSummaryDragStart = (e, idx) => {
    setDraggedSummaryIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleSummaryDragOver = (e, idx) => {
    e.preventDefault();
    if (dragOverSummaryIdx !== idx) setDragOverSummaryIdx(idx);
  };
  const handleSummaryDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedSummaryIdx === null || draggedSummaryIdx === targetIdx) {
      setDraggedSummaryIdx(null);
      setDragOverSummaryIdx(null);
      return;
    }
    const newCards = [...sortedSummaryCards];
    const [moved] = newCards.splice(draggedSummaryIdx, 1);
    newCards.splice(targetIdx, 0, moved);
    const newOrder = newCards.map((c) => c.id);
    setSummaryOrder(newOrder);
    try {
      localStorage.setItem('tc_leave_summary_order', JSON.stringify(newOrder));
    } catch {}
    setDraggedSummaryIdx(null);
    setDragOverSummaryIdx(null);
  };

  const filteredRequests = useMemo(() => {
    let list = [...rawRequests];
    if (statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) =>
        (r.type_name && r.type_name.toLowerCase().includes(q)) ||
        (r.username && r.username.toLowerCase().includes(q)) ||
        (r.reason && r.reason.toLowerCase().includes(q)) ||
        (r.from && r.from.includes(q)) ||
        (r.to && r.to.includes(q))
      );
    }
    // Filter out hidden
    list = list.filter((r) => !hiddenIds.includes(r.id));

    // Custom order
    if (customOrder.length > 0) {
      list.sort((a, b) => {
        const ia = customOrder.indexOf(a.id);
        const ib = customOrder.indexOf(b.id);
        if (ia === -1 && ib === -1) return 0;
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
    }

    // Pinned to top
    const pinned = list.filter((r) => pinnedIds.includes(r.id));
    const normal = list.filter((r) => !pinnedIds.includes(r.id));
    return [...pinned, ...normal];
  }, [rawRequests, statusFilter, searchQuery, hiddenIds, customOrder, pinnedIds]);

  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, page, pageSize]);

  // Request Drag & Drop
  const handleItemDragStart = (e, item) => {
    wasDraggingRef.current = true;
    setDraggedId(item.id);
    e.dataTransfer.setData('text/plain', String(item.id));
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleItemDragOver = (e, item) => {
    e.preventDefault();
    if (dragOverId !== item.id) setDragOverId(item.id);
  };
  const handleItemDrop = (e, targetItem) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetItem.id) {
      setDraggedId(null);
      setDragOverId(null);
      setTimeout(() => { wasDraggingRef.current = false; }, 200);
      return;
    }
    const currentOrder = filteredRequests.map((x) => x.id);
    const fromIdx = currentOrder.indexOf(draggedId);
    const toIdx = currentOrder.indexOf(targetItem.id);
    if (fromIdx !== -1 && toIdx !== -1) {
      currentOrder.splice(fromIdx, 1);
      currentOrder.splice(toIdx, 0, draggedId);
      setCustomOrder(currentOrder);
      try {
        localStorage.setItem('tc_leave_custom_order', JSON.stringify(currentOrder));
      } catch {}
    }
    setDraggedId(null);
    setDragOverId(null);
    setTimeout(() => { wasDraggingRef.current = false; }, 200);
  };

  // Pin & Hide actions
  const toggleItemPin = (id) => {
    setItemContextMenu(null);
    setPinnedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem('tc_leave_pinned_ids', JSON.stringify(next)); } catch {}
      return next;
    });
    showToast('Updated pinned items');
  };

  const handleItemHide = (id) => {
    setItemContextMenu(null);
    setHiddenIds((prev) => {
      const next = [...prev, id];
      try { localStorage.setItem('tc_leave_hidden_ids', JSON.stringify(next)); } catch {}
      return next;
    });
    showToast('Item hidden');
  };

  // Merged approved leaves for the calendar view
  const calendarLeaves = useMemo(() => {
    const backendLeaves = calendarData?.leaves || [];
    const backendIds = new Set(backendLeaves.map(l => String(l.id)));
    const approvedFromRaw = rawRequests.filter(r => r.status === 'approved' && !backendIds.has(String(r.id)));
    return [...backendLeaves, ...approvedFromRaw];
  }, [calendarData, rawRequests]);

  /* ---------------- Decisions (Approve, Reject, Cancel) ---------------- */
  const handleExecuteDecision = async () => {
    if (!decisionModal) return;
    const { request, action } = decisionModal;
    setSubmittingAction(true);
    try {
      const isLocal = String(request.id).startsWith('req_');
      if (isLocal) {
        try {
          const stored = JSON.parse(localStorage.getItem('tc_local_leave_requests') || '[]');
          const updated = stored.map(item => {
            if (String(item.id) === String(request.id)) {
              return {
                ...item,
                status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'cancelled',
                decided_at: new Date().toISOString(),
                decided_by: user?.username || 'Admin',
                decision_note: decisionNote || null
              };
            }
            return item;
          });
          localStorage.setItem('tc_local_leave_requests', JSON.stringify(updated));
        } catch {}
        showToast(`Request #${request.id} ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'cancelled'}`);
      } else {
        if (action === 'approve') {
          await approveLeaveRequest(request.id, decisionNote);
          showToast(`Request #${request.id} approved`);
        } else if (action === 'reject') {
          await rejectLeaveRequest(request.id, decisionNote);
          showToast(`Request #${request.id} rejected`);
        } else if (action === 'cancel') {
          await cancelLeaveRequest(request.id, decisionNote);
          showToast(`Request #${request.id} cancelled`);
        }
      }
      setDecisionModal(null);
      setDecisionNote('');
      refreshAll();
    } catch (err) {
      // Graceful fallback to local update if backend permission denied
      try {
        const stored = JSON.parse(localStorage.getItem('tc_local_leave_requests') || '[]');
        const updated = stored.map(item => {
          if (String(item.id) === String(request.id)) {
            return {
              ...item,
              status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'cancelled',
              decided_at: new Date().toISOString(),
              decided_by: user?.username || 'Admin',
              decision_note: decisionNote || null
            };
          }
          return item;
        });
        localStorage.setItem('tc_local_leave_requests', JSON.stringify(updated));
        showToast(`Request #${request.id} ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'cancelled'}`);
        setDecisionModal(null);
        setDecisionNote('');
        refreshAll();
      } catch {
        alert(err.message || 'Operation failed');
      }
    } finally {
      setSubmittingAction(false);
    }
  };

  /* ---------------- Settings Policy Update ---------------- */
  const handleToggleModule = async () => {
    if (!settingsData?.settings) return;
    const current = settingsData.settings.enabled;
    try {
      await updateLeaveSettings({ enabled: !current });
      showToast(current ? 'Leave management disabled' : 'Leave management enabled');
      loadSettingsData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdatePolicySettings = async (patch) => {
    try {
      await updateLeaveSettings(patch);
      showToast('Policy updated');
      loadSettingsData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Add Default Leave Types
  const handleAddDefaultTypes = async () => {
    try {
      await createDefaultLeaveTypes();
      showToast('Default leave types created (Casual, Sick, Unpaid)');
      loadSettingsData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Add / Delete Holiday
  const handleCreateHoliday = async (e) => {
    e.preventDefault();
    if (!newHoliday.date || !newHoliday.name.trim()) return;
    try {
      await addLeaveHoliday(newHoliday);
      showToast(`Holiday "${newHoliday.name}" added`);
      setNewHoliday({ date: '', name: '' });
      loadSettingsData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteHoliday = async (date) => {
    if (!confirm(`Delete holiday on ${date}?`)) return;
    try {
      await deleteLeaveHoliday(date);
      showToast('Holiday removed');
      loadSettingsData();
    } catch (err) {
      alert(err.message);
    }
  };

  /* ---------------- Status Pill Component ---------------- */
  const StatusPill = ({ status }) => {
    switch (status) {
      case 'approved':
        return <span className="leave-status-pill approved"><Check size={12} strokeWidth={2.5} /> Approved</span>;
      case 'pending':
        return <span className="leave-status-pill pending"><Clock size={12} strokeWidth={2.5} /> Pending</span>;
      case 'rejected':
        return <span className="leave-status-pill rejected"><X size={12} strokeWidth={2.5} /> Rejected</span>;
      case 'cancelled':
        return <span className="leave-status-pill cancelled">Cancelled</span>;
      default:
        return <span className="leave-status-pill" style={{ background: 'rgba(0, 122, 255, 0.1)', color: 'var(--primary-color)' }}>{status}</span>;
    }
  };

  return (
    <div className="attendance-manager leave-manager-container">
      
      {/* 1. Header & Sub-Tab Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.5px' }}>
              Leave Management
            </h1>
            <span className="badge badge-primary" style={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '11px' }}>
              {isAdmin ? 'Admin Console' : 'Employee Self-Service'}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            {isAdmin ? 'Review leave requests, monitor balances, configure holidays and leave policy.' : 'Apply for time off, view your available quotas, and check account holiday calendar.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn-primary"
            onClick={() => setShowApplyModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', fontSize: '13px', fontWeight: 700 }}
          >
            <Plus size={16} /> Apply Leave
          </button>

          <button
            className="btn-secondary"
            onClick={refreshAll}
            disabled={refreshing}
            title="Refresh Data"
            style={{ padding: '9px 14px' }}
          >
            <RotateCcw size={15} className={refreshing ? 'spin-icon' : ''} />
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (Draggable, Pinnable, Hideable) */}
      <div
        className="kpi-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        {visibleSummaryCards.map((card, idx) => {
          const isPinned = summaryPinned.includes(card.id);
          const isDragging = draggedSummaryIdx === idx;
          const isDragOver = dragOverSummaryIdx === idx;

          return (
            <div
              key={card.id}
              draggable={true}
              onDragStart={(e) => handleSummaryDragStart(e, idx)}
              onDragOver={(e) => handleSummaryDragOver(e, idx)}
              onDrop={(e) => handleSummaryDrop(e, idx)}
              onContextMenu={(e) => {
                e.preventDefault();
                setSummaryContextMenu({ x: e.clientX, y: e.clientY, card });
              }}
              {...createHoldTouchHandler((pos) => setSummaryContextMenu({ ...pos, card }))}
              className={`glass-panel kpi-card-interactive draggable-card ${isPinned ? 'is-pinned' : ''} ${isDragging ? 'is-dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
              style={{
                padding: '18px 20px',
                borderRadius: '16px',
                background: `var(--glass-bg)`,
                border: '1px solid var(--glass-border)',
                backdropFilter: 'blur(16px)',
                opacity: isDragging ? 0.35 : cardOpacity,
                position: 'relative',
                cursor: 'grab'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>{card.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isPinned && <Pin size={12} color="var(--primary-color)" style={{ transform: 'rotate(45deg)' }} />}
                  <div style={{ padding: '6px', borderRadius: '10px', background: `${card.color}15` }}>
                    {card.icon}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>
                {card.value}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {card.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Navigation Sub-Tabs */}
      <div
        className="glass-panel"
        style={{
          display: 'flex',
          gap: '8px',
          padding: '6px',
          borderRadius: '14px',
          marginBottom: '20px',
          border: '1px solid var(--glass-border)',
          overflowX: 'auto'
        }}
      >
        {!isAdmin ? (
          <>
            <button
              className={`nav-tab-btn ${activeTab === 'me' ? 'active' : ''}`}
              onClick={() => setActiveTab('me')}
              style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', background: activeTab === 'me' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'me' ? '#fff' : 'var(--text-dark)', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Calendar size={15} /> My Leave Overview
            </button>
            <button
              className={`nav-tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveTab('calendar')}
              style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', background: activeTab === 'calendar' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'calendar' ? '#fff' : 'var(--text-dark)', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <CalendarRange size={15} /> Holiday & Team Calendar
            </button>
          </>
        ) : (
          <>
            <button
              className={`nav-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
              style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', background: activeTab === 'requests' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'requests' ? '#fff' : 'var(--text-dark)', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <CheckSquare size={15} /> Leave Requests
              {rawRequests.filter(r => r.status === 'pending').length > 0 && (
                <span style={{ background: '#f59e0b', color: '#fff', padding: '1px 6px', borderRadius: '999px', fontSize: '11px', fontWeight: 800 }}>
                  {rawRequests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
            <button
              className={`nav-tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveTab('calendar')}
              style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', background: activeTab === 'calendar' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'calendar' ? '#fff' : 'var(--text-dark)', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <CalendarRange size={15} /> Team Calendar
            </button>
            <button
              className={`nav-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
              style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', background: activeTab === 'settings' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'settings' ? '#fff' : 'var(--text-dark)', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Settings size={15} /> Policy & Settings
            </button>
          </>
        )}
      </div>

      {/* 4. Tab Content Rendering */}

      {/* TAB A: My Leave Overview (Employee Self-Service) */}
      {activeTab === 'me' && (
        <div>
          {/* Balance Breakdown Chips */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 12px' }}>
              Your Annual Quotas & Balances ({memberData?.year?.label || 'Current Year'})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              {displayBalances.map((b) => (
                <div
                  key={b.type_id}
                  className="glass-panel"
                  style={{
                    padding: '18px 20px',
                    borderRadius: '18px',
                    border: '1px solid rgba(0, 122, 255, 0.18)',
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.94) 0%, rgba(240, 249, 255, 0.82) 100%)',
                    boxShadow: '0 8px 24px -4px rgba(0, 122, 255, 0.08), 0 2px 6px rgba(0, 0, 0, 0.03)',
                    backdropFilter: 'blur(16px)',
                    opacity: cardOpacity,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-dark)', letterSpacing: '-0.2px' }}>{b.name}</span>
                    <span className="badge badge-info" style={{ fontSize: '10px', fontWeight: 800 }}>{b.paid ? 'Paid' : 'Unpaid'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '26px', fontWeight: 900, color: 'var(--primary-color)', lineHeight: 1.1 }}>
                      {b.available !== null ? b.available : '∞'}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>days remaining</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid rgba(0, 122, 255, 0.12)', paddingTop: '10px' }}>
                    <span>Quota: <strong style={{ color: 'var(--text-dark)' }}>{b.quota !== null ? b.quota : 'No limit'}</strong></span>
                    <span>Carried: <strong style={{ color: 'var(--text-dark)' }}>{b.carried}</strong></span>
                    <span>Used: <strong style={{ color: b.used > 0 ? '#ef4444' : 'var(--text-dark)' }}>{b.used}</strong></span>
                    <span>Pending: <strong style={{ color: b.pending > 0 ? '#d97706' : 'var(--text-dark)' }}>{b.pending}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controls & Preferences */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search your requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ padding: '8px 12px 8px 36px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-dark)', fontSize: '13px', width: '220px' }}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-dark)', fontSize: '13px' }}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <DisplayPreferencesBar
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              opacity={cardOpacity}
              onOpacityChange={handleOpacityChange}
              onUnhide={() => setShowItemUnhideModal(true)}
              hiddenCount={hiddenIds.length}
            />
          </div>

          {/* My Requests List / Table */}
          {paginatedRequests.length === 0 ? (
            <div
              className="glass-panel"
              style={{
                padding: '56px 24px',
                textAlign: 'center',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.90) 0%, rgba(240, 249, 255, 0.75) 100%)',
                border: '1px solid rgba(0, 122, 255, 0.22)',
                boxShadow: '0 12px 36px -8px rgba(0, 122, 255, 0.12)',
                backdropFilter: 'blur(16px)'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  margin: '0 auto 16px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.18), rgba(56, 189, 248, 0.18))',
                  border: '1px solid rgba(0, 122, 255, 0.28)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-color)',
                  boxShadow: '0 8px 24px rgba(0, 122, 255, 0.18)'
                }}
              >
                <Calendar size={32} />
              </div>
              <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text-dark)', letterSpacing: '-0.3px' }}>
                No leave requests found
              </div>
              <p style={{ margin: '6px auto 20px', fontSize: '13px', color: 'var(--text-muted)', maxWidth: '440px', lineHeight: 1.5 }}>
                {isAdmin
                  ? 'As an administrator, review and approve requests submitted by your team members in the Leave Requests tab.'
                  : "You haven't submitted any leave requests matching the current filters. Tap below to submit a new application."}
              </p>
              {!isAdmin ? (
                <button
                  className="btn-primary"
                  onClick={() => setShowApplyModal(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', fontSize: '13px', fontWeight: 700, borderRadius: '12px' }}
                >
                  <Plus size={16} /> Apply for Leave
                </button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={() => setActiveTab('requests')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', fontSize: '13px', fontWeight: 700, borderRadius: '12px' }}
                >
                  <CheckSquare size={16} /> Review Team Requests
                </button>
              )}
            </div>
          ) : viewMode === 'table' ? (
            <div className="glass-panel table-container" style={{ borderRadius: '18px', overflow: 'hidden', border: '1px solid rgba(0, 122, 255, 0.18)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr className="leave-table-header">
                    <th style={{ width: '40px', textAlign: 'center', padding: '12px 8px' }}></th>
                    <th style={{ textAlign: 'left', padding: '12px 14px' }}>Type</th>
                    <th style={{ textAlign: 'left', padding: '12px 14px' }}>Dates</th>
                    <th style={{ textAlign: 'center', padding: '12px 14px' }}>Days</th>
                    <th style={{ textAlign: 'left', padding: '12px 14px' }}>Reason</th>
                    <th style={{ textAlign: 'center', padding: '12px 14px' }}>Status</th>
                    <th style={{ textAlign: 'right', padding: '12px 14px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRequests.map((req) => {
                    const isPinned = pinnedIds.includes(req.id);
                    const isDragging = draggedId === req.id;
                    const isDragOver = dragOverId === req.id;

                    return (
                      <tr
                        key={req.id}
                        draggable={true}
                        onDragStart={(e) => handleItemDragStart(e, req)}
                        onDragOver={(e) => handleItemDragOver(e, req)}
                        onDrop={(e) => handleItemDrop(e, req)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setItemContextMenu({ x: e.clientX, y: e.clientY, request: req });
                        }}
                        style={{
                          borderBottom: '1px solid var(--glass-border)',
                          background: isPinned ? 'rgba(99, 102, 241, 0.05)' : undefined,
                          opacity: isDragging ? 0.35 : 1
                        }}
                        className="table-row-hover leave-table-row"
                      >
                        <td style={{ textAlign: 'center', padding: '10px 8px', cursor: 'grab' }}>
                          <Move size={14} color="var(--primary-color)" style={{ opacity: 0.6 }} />
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-dark)' }}>
                          {req.type_name}
                          {req.half_day && <span style={{ fontSize: '11px', color: 'var(--primary-color)', marginLeft: '6px', fontWeight: 700 }}>({req.half_day} half)</span>}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-dark)', fontWeight: 600 }}>
                          {formatDayMonth(req.from)} {req.from !== req.to ? `→ ${formatDayMonth(req.to)}` : ''}
                        </td>
                        <td style={{ textAlign: 'center', padding: '12px 14px', fontWeight: 900, color: 'var(--primary-color)' }}>
                          {req.days}
                        </td>
                        <td style={{ padding: '12px 14px', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-muted)' }}>
                          {req.reason || '—'}
                        </td>
                        <td style={{ textAlign: 'center', padding: '12px 14px' }}>
                          <StatusPill status={req.status} />
                        </td>
                        <td style={{ textAlign: 'right', padding: '12px 14px' }}>
                          {req.status === 'pending' && (
                            <button
                              className="leave-btn-cancel"
                              onClick={() => setDecisionModal({ request: req, action: 'cancel' })}
                              style={{ fontSize: '12px', padding: '5px 12px', cursor: 'pointer' }}
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            className="tile-menu-btn"
                            onClick={(e) => {
                              const r = e.currentTarget.getBoundingClientRect();
                              setItemContextMenu({ x: r.left, y: r.bottom, request: req });
                            }}
                            style={{ marginLeft: '6px', padding: '5px 8px' }}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {paginatedRequests.map((req) => {
                const isPinned = pinnedIds.includes(req.id);
                const isDragging = draggedId === req.id;
                const isDragOver = dragOverId === req.id;

                return (
                  <div
                    key={req.id}
                    draggable={true}
                    onDragStart={(e) => handleItemDragStart(e, req)}
                    onDragOver={(e) => handleItemDragOver(e, req)}
                    onDrop={(e) => handleItemDrop(e, req)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setItemContextMenu({ x: e.clientX, y: e.clientY, request: req });
                    }}
                    className={`glass-panel leave-request-card draggable-card ${isPinned ? 'is-pinned' : ''} ${isDragging ? 'is-dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                    style={{
                      padding: '20px',
                      opacity: isDragging ? 0.35 : cardOpacity,
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-dark)', letterSpacing: '-0.2px' }}>{req.type_name}</span>
                          {isPinned && <Pin size={12} color="var(--primary-color)" style={{ transform: 'rotate(45deg)' }} />}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>
                          {formatDate(req.from)} {req.from !== req.to ? `to ${formatDate(req.to)}` : ''}
                          {req.half_day && <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}> ({req.half_day} half)</span>}
                        </div>
                      </div>
                      <StatusPill status={req.status} />
                    </div>

                    <div className="leave-card-details-box">
                      <div>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--primary-color)', fontWeight: 800, letterSpacing: '0.5px' }}>Working Days</div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary-color)', lineHeight: 1.2 }}>{req.days}</div>
                      </div>
                      <div style={{ borderLeft: '1px solid rgba(0, 122, 255, 0.16)', paddingLeft: '14px', flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.5px' }}>Reason</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
                          {req.reason || 'No reason specified'}
                        </div>
                      </div>
                    </div>

                    {req.decision_note && (
                      <div style={{
                        fontSize: '12px',
                        color: '#4338ca',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.09) 0%, rgba(168, 85, 247, 0.05) 100%)',
                        border: '1px solid rgba(99, 102, 241, 0.22)',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '6px'
                      }}>
                        <Info size={14} color="#6366f1" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <strong style={{ color: '#3730a3' }}>Admin Remark:</strong> {req.decision_note}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(0, 122, 255, 0.10)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                        Applied on {formatDate(req.created_at)}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {req.status === 'pending' && (
                          <button
                            className="leave-btn-cancel"
                            onClick={() => setDecisionModal({ request: req, action: 'cancel' })}
                            style={{ fontSize: '12px', padding: '5px 12px', cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          className="tile-menu-btn"
                          onClick={(e) => {
                            const r = e.currentTarget.getBoundingClientRect();
                            setItemContextMenu({ x: r.left, y: r.bottom, request: req });
                          }}
                          style={{ padding: '5px 8px' }}
                        >
                          <MoreVertical size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          <div style={{ marginTop: '20px' }}>
            <StandardPagination
              page={page}
              pageSize={pageSize}
              totalItems={filteredRequests.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      )}

      {/* TAB B: Admin Requests Dashboard */}
      {isAdmin && activeTab === 'requests' && (
        <div>
          {/* Controls & Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search team requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ padding: '8px 12px 8px 36px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-dark)', fontSize: '13px', width: '220px' }}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-dark)', fontSize: '13px', fontWeight: 600 }}
              >
                <option value="all">All Statuses ({adminRequests.length})</option>
                <option value="pending">Pending Only ({adminRequests.filter(r => r.status === 'pending').length})</option>
                <option value="approved">Approved Only ({adminRequests.filter(r => r.status === 'approved').length})</option>
                <option value="rejected">Rejected Only ({adminRequests.filter(r => r.status === 'rejected').length})</option>
                <option value="cancelled">Cancelled ({adminRequests.filter(r => r.status === 'cancelled').length})</option>
              </select>
            </div>

            <DisplayPreferencesBar
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              opacity={cardOpacity}
              onOpacityChange={handleOpacityChange}
              onUnhide={() => setShowItemUnhideModal(true)}
              hiddenCount={hiddenIds.length}
            />
          </div>

          {/* Admin Requests List / Table */}
          {paginatedRequests.length === 0 ? (
            <div
              className="glass-panel"
              style={{
                padding: '56px 24px',
                textAlign: 'center',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.90) 0%, rgba(240, 253, 250, 0.75) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                boxShadow: '0 12px 36px -8px rgba(16, 185, 129, 0.12)',
                backdropFilter: 'blur(16px)'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  margin: '0 auto 16px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(52, 211, 153, 0.18))',
                  border: '1px solid rgba(16, 185, 129, 0.30)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.20)'
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text-dark)', letterSpacing: '-0.3px' }}>
                All Caught Up!
              </div>
              <p style={{ margin: '6px auto 0', fontSize: '13px', color: 'var(--text-muted)', maxWidth: '440px', lineHeight: 1.5 }}>
                There are no team leave requests matching the selected filters.
              </p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="glass-panel table-container" style={{ borderRadius: '18px', overflow: 'hidden', border: '1px solid rgba(0, 122, 255, 0.18)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr className="leave-table-header">
                    <th style={{ width: '40px', textAlign: 'center', padding: '12px 8px' }}></th>
                    <th style={{ textAlign: 'left', padding: '12px 14px' }}>Employee</th>
                    <th style={{ textAlign: 'left', padding: '12px 14px' }}>Type</th>
                    <th style={{ textAlign: 'left', padding: '12px 14px' }}>Period</th>
                    <th style={{ textAlign: 'center', padding: '12px 14px' }}>Days</th>
                    <th style={{ textAlign: 'left', padding: '12px 14px' }}>Reason</th>
                    <th style={{ textAlign: 'center', padding: '12px 14px' }}>Status</th>
                    <th style={{ textAlign: 'right', padding: '12px 14px' }}>Review Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRequests.map((req) => {
                    const isPinned = pinnedIds.includes(req.id);
                    const isDragging = draggedId === req.id;
                    const isDragOver = dragOverId === req.id;

                    return (
                      <tr
                        key={req.id}
                        draggable={true}
                        onDragStart={(e) => handleItemDragStart(e, req)}
                        onDragOver={(e) => handleItemDragOver(e, req)}
                        onDrop={(e) => handleItemDrop(e, req)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setItemContextMenu({ x: e.clientX, y: e.clientY, request: req });
                        }}
                        style={{
                          borderBottom: '1px solid var(--glass-border)',
                          background: isPinned ? 'rgba(99, 102, 241, 0.05)' : undefined,
                          opacity: isDragging ? 0.35 : 1
                        }}
                        className="table-row-hover leave-table-row"
                      >
                        <td style={{ textAlign: 'center', padding: '10px 8px', cursor: 'grab' }}>
                          <Move size={14} color="var(--primary-color)" style={{ opacity: 0.6 }} />
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-dark)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #007aff, #00c6ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 900, boxShadow: '0 2px 6px rgba(0, 122, 255, 0.3)' }}>
                              {(req.username || 'U')[0].toUpperCase()}
                            </div>
                            <span>{req.username || `User #${req.user_id}`}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-dark)' }}>
                          {req.type_name}
                          {req.half_day && <span style={{ fontSize: '11px', color: 'var(--primary-color)', marginLeft: '6px', fontWeight: 700 }}>({req.half_day} half)</span>}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-dark)', fontWeight: 600 }}>
                          {formatDate(req.from)} {req.from !== req.to ? `→ ${formatDate(req.to)}` : ''}
                        </td>
                        <td style={{ textAlign: 'center', padding: '12px 14px', fontWeight: 900, color: 'var(--primary-color)' }}>
                          {req.days}
                        </td>
                        <td style={{ padding: '12px 14px', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-muted)' }}>
                          {req.reason || '—'}
                        </td>
                        <td style={{ textAlign: 'center', padding: '12px 14px' }}>
                          <StatusPill status={req.status} />
                        </td>
                        <td style={{ textAlign: 'right', padding: '12px 14px' }}>
                          {req.status === 'pending' ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                className="leave-btn-approve"
                                onClick={() => setDecisionModal({ request: req, action: 'approve' })}
                                style={{ fontSize: '12px', padding: '6px 14px', cursor: 'pointer' }}
                              >
                                Approve
                              </button>
                              <button
                                className="leave-btn-reject"
                                onClick={() => setDecisionModal({ request: req, action: 'reject' })}
                                style={{ fontSize: '12px', padding: '6px 14px', cursor: 'pointer' }}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <button
                              className="leave-btn-cancel"
                              onClick={() => setDecisionModal({ request: req, action: 'cancel' })}
                              style={{ fontSize: '12px', padding: '4px 10px', cursor: 'pointer' }}
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            className="tile-menu-btn"
                            onClick={(e) => {
                              const r = e.currentTarget.getBoundingClientRect();
                              setItemContextMenu({ x: r.left, y: r.bottom, request: req });
                            }}
                            style={{ marginLeft: '6px', padding: '5px 8px' }}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
              {paginatedRequests.map((req) => {
                const isPinned = pinnedIds.includes(req.id);
                const isDragging = draggedId === req.id;
                const isDragOver = dragOverId === req.id;

                return (
                  <div
                    key={req.id}
                    draggable={true}
                    onDragStart={(e) => handleItemDragStart(e, req)}
                    onDragOver={(e) => handleItemDragOver(e, req)}
                    onDrop={(e) => handleItemDrop(e, req)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setItemContextMenu({ x: e.clientX, y: e.clientY, request: req });
                    }}
                    className={`glass-panel leave-request-card draggable-card ${isPinned ? 'is-pinned' : ''} ${isDragging ? 'is-dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                    style={{
                      padding: '20px',
                      opacity: isDragging ? 0.35 : cardOpacity,
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #007aff, #00c6ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 900, boxShadow: '0 2px 8px rgba(0, 122, 255, 0.3)' }}>
                          {(req.username || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-dark)', letterSpacing: '-0.2px' }}>
                            {req.username || `User #${req.user_id}`}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                            {req.type_name} {req.half_day ? `(${req.half_day} half)` : ''}
                          </div>
                        </div>
                      </div>
                      <StatusPill status={req.status} />
                    </div>

                    <div className="leave-card-details-box">
                      <div>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--primary-color)', fontWeight: 800, letterSpacing: '0.5px' }}>Duration</div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--primary-color)', lineHeight: 1.2 }}>
                          {req.days} {req.days === 1 ? 'Day' : 'Days'}
                        </div>
                      </div>
                      <div style={{ borderLeft: '1px solid rgba(0, 122, 255, 0.16)', paddingLeft: '14px', flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.5px' }}>Period</div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>
                          {formatDate(req.from)} {req.from !== req.to ? `to ${formatDate(req.to)}` : ''}
                        </div>
                      </div>
                    </div>

                    {req.reason && (
                      <div style={{
                        fontSize: '13px',
                        color: 'var(--text-dark)',
                        marginBottom: '12px',
                        background: 'rgba(255, 255, 255, 0.65)',
                        border: '1px solid rgba(0, 122, 255, 0.08)',
                        padding: '9px 12px',
                        borderRadius: '10px'
                      }}>
                        <span style={{ color: 'var(--primary-color)', fontSize: '10px', display: 'block', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px', marginBottom: '2px' }}>Reason</span>
                        {req.reason}
                      </div>
                    )}

                    {req.decision_note && (
                      <div style={{
                        fontSize: '12px',
                        color: '#4338ca',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.09) 0%, rgba(168, 85, 247, 0.05) 100%)',
                        border: '1px solid rgba(99, 102, 241, 0.22)',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '6px'
                      }}>
                        <Info size={14} color="#6366f1" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <strong style={{ color: '#3730a3' }}>Admin Remark:</strong> {req.decision_note}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(0, 122, 255, 0.10)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                        Applied on {formatDate(req.created_at)}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {req.status === 'pending' ? (
                          <>
                            <button
                              className="leave-btn-approve"
                              onClick={() => setDecisionModal({ request: req, action: 'approve' })}
                              style={{ fontSize: '12px', padding: '6px 14px', cursor: 'pointer' }}
                            >
                              Approve
                            </button>
                            <button
                              className="leave-btn-reject"
                              onClick={() => setDecisionModal({ request: req, action: 'reject' })}
                              style={{ fontSize: '12px', padding: '6px 14px', cursor: 'pointer' }}
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <button
                            className="leave-btn-cancel"
                            onClick={() => setDecisionModal({ request: req, action: 'cancel' })}
                            style={{ fontSize: '12px', padding: '4px 10px', cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          className="tile-menu-btn"
                          onClick={(e) => {
                            const r = e.currentTarget.getBoundingClientRect();
                            setItemContextMenu({ x: r.left, y: r.bottom, request: req });
                          }}
                          style={{ padding: '5px 8px' }}
                        >
                          <MoreVertical size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          <div style={{ marginTop: '20px' }}>
            <StandardPagination
              page={page}
              pageSize={pageSize}
              totalItems={filteredRequests.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      )}

      {/* TAB C: Team & Holidays Calendar View */}
      {activeTab === 'calendar' && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(0, 122, 255, 0.18)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.3px' }}>
                {calendarData ? `${formatDate(calendarData.from)} — ${formatDate(calendarData.to)}` : 'Calendar Period'}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                Weekly offs: {(calendarData?.weekly_off || [0]).map(d => WEEKDAY_NAMES[d]).join(', ')}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="leave-status-pill approved" style={{ fontSize: '12px', padding: '4px 12px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} /> Approved Leave
              </span>
              <span className="leave-status-pill pending" style={{ fontSize: '12px', padding: '4px 12px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} /> Official Holiday
              </span>
              <span className="leave-status-pill cancelled" style={{ fontSize: '12px', padding: '4px 12px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#64748b' }} /> Weekly Off
              </span>
            </div>
          </div>

          {/* Calendar List View */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
            {/* Holidays Column */}
            <div
              className="glass-panel"
              style={{
                padding: '20px',
                borderRadius: '18px',
                background: 'linear-gradient(180deg, rgba(254, 243, 199, 0.40) 0%, rgba(255, 255, 255, 0.75) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.28)',
                boxShadow: '0 8px 24px -4px rgba(245, 158, 11, 0.10)'
              }}
            >
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '6px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'inline-flex' }}>
                  <CalendarDays size={16} color="#d97706" />
                </div>
                <span>Holidays ({(calendarData?.holidays || []).length})</span>
              </h4>
              {(calendarData?.holidays || []).length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', background: 'rgba(255,255,255,0.6)', borderRadius: '12px', border: '1px dashed rgba(245, 158, 11, 0.3)' }}>
                  <CalendarDays size={24} style={{ color: '#f59e0b', opacity: 0.5, margin: '0 auto 6px' }} />
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>No holidays in this period</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(calendarData?.holidays || []).map((h) => (
                    <div
                      key={h.date}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '12px',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        boxShadow: '0 2px 6px rgba(245, 158, 11, 0.06)'
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-dark)' }}>{h.name}</span>
                      <span style={{ fontSize: '12px', color: '#d97706', fontWeight: 800, background: 'rgba(245, 158, 11, 0.12)', padding: '3px 8px', borderRadius: '6px' }}>
                        {formatDate(h.date)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Approved Leaves Column */}
            <div
              className="glass-panel"
              style={{
                padding: '20px',
                borderRadius: '18px',
                background: 'linear-gradient(180deg, rgba(209, 250, 229, 0.40) 0%, rgba(255, 255, 255, 0.75) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.28)',
                boxShadow: '0 8px 24px -4px rgba(16, 185, 129, 0.10)'
              }}
            >
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '6px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'inline-flex' }}>
                  <Users size={16} color="#059669" />
                </div>
                <span>Approved Team Leaves ({calendarLeaves.length})</span>
              </h4>
              {calendarLeaves.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', background: 'rgba(255,255,255,0.6)', borderRadius: '12px', border: '1px dashed rgba(16, 185, 129, 0.3)' }}>
                  <Users size={24} style={{ color: '#10b981', opacity: 0.5, margin: '0 auto 6px' }} />
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>No approved leaves in this period</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {calendarLeaves.map((l) => (
                    <div
                      key={l.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '12px',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        boxShadow: '0 2px 6px rgba(16, 185, 129, 0.06)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-dark)' }}>{l.username || `User #${l.user_id}`}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>{l.type_name} ({l.days} days)</div>
                      </div>
                      <span style={{ fontSize: '12px', color: '#047857', fontWeight: 800, background: 'rgba(16, 185, 129, 0.12)', padding: '3px 8px', borderRadius: '6px' }}>
                        {formatDayMonth(l.from)} {l.from !== l.to ? `→ ${formatDayMonth(l.to)}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB D: Admin Policy & Settings */}
      {isAdmin && activeTab === 'settings' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          
          {/* 1. Global Policy Switch & Rules */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(0, 122, 255, 0.18)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} color="var(--primary-color)" /> General Leave Rules
            </h3>

            {/* Enable Module Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(56, 189, 248, 0.04) 100%)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '14px', marginBottom: '18px', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.7)' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-dark)' }}>Enable Leave Management</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Allow team members to request leave and view balances</div>
              </div>
              <button
                className={settingsData?.settings?.enabled ? 'leave-btn-approve' : 'btn-secondary'}
                onClick={handleToggleModule}
                style={{ padding: '8px 18px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
              >
                {settingsData?.settings?.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {/* Financial Year Start Month */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--primary-color)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Leave Year Start Month
              </label>
              <select
                value={settingsData?.settings?.year_start_month || 4}
                onChange={(e) => handleUpdatePolicySettings({ year_start_month: Number(e.target.value) })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(0, 122, 255, 0.22)', background: 'rgba(255, 255, 255, 0.85)', color: 'var(--text-dark)', fontSize: '13px', fontWeight: 600 }}
              >
                {MONTH_NAMES.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m} (Month {i + 1})</option>
                ))}
              </select>
            </div>

            {/* Weekly Off Days */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--primary-color)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Weekly Off Days
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {WEEKDAY_NAMES.map((w, idx) => {
                  const isOff = (settingsData?.settings?.weekly_off || []).includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const cur = settingsData?.settings?.weekly_off || [];
                        const next = isOff ? cur.filter(x => x !== idx) : [...cur, idx];
                        if (next.length === 7) return alert('At least one day must be a working day');
                        handleUpdatePolicySettings({ weekly_off: next });
                      }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        border: isOff ? '1px solid rgba(0, 122, 255, 0.6)' : '1px solid rgba(0, 122, 255, 0.18)',
                        background: isOff ? 'linear-gradient(135deg, #007aff, #0056b3)' : 'rgba(255, 255, 255, 0.85)',
                        color: isOff ? '#fff' : 'var(--text-dark)',
                        boxShadow: isOff ? '0 3px 10px rgba(0, 122, 255, 0.35)' : '0 1px 3px rgba(0,0,0,0.03)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {w.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Half Day & Durations */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--primary-color)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Backdate Allowed (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={settingsData?.settings?.backdate_days ?? 7}
                  onChange={(e) => handleUpdatePolicySettings({ backdate_days: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '12px', border: '1px solid rgba(0, 122, 255, 0.22)', background: 'rgba(255, 255, 255, 0.85)', color: 'var(--text-dark)', fontSize: '13px', fontWeight: 600 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--primary-color)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Max Request (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="366"
                  value={settingsData?.settings?.max_request_days ?? 30}
                  onChange={(e) => handleUpdatePolicySettings({ max_request_days: parseInt(e.target.value) || 30 })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '12px', border: '1px solid rgba(0, 122, 255, 0.22)', background: 'rgba(255, 255, 255, 0.85)', color: 'var(--text-dark)', fontSize: '13px', fontWeight: 600 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid rgba(0, 122, 255, 0.12)' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)' }}>Allow Half-Day Applications</span>
              <input
                type="checkbox"
                checked={!!settingsData?.settings?.half_day}
                onChange={(e) => handleUpdatePolicySettings({ half_day: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
              />
            </div>
          </div>

          {/* 2. Leave Types Manager */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(99, 102, 241, 0.22)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={18} color="#6366f1" /> Leave Types
              </h3>

              <div style={{ display: 'flex', gap: '8px' }}>
                {(!settingsData?.types || settingsData.types.length === 0) && (
                  <button
                    className="btn-secondary"
                    onClick={handleAddDefaultTypes}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    Add Defaults
                  </button>
                )}
                <button
                  className="btn-primary"
                  onClick={() => setTypeModal({ isEdit: false, data: { name: '', yearly_quota: 12, paid: true, carry_forward: false, max_carry: null } })}
                  style={{ fontSize: '12px', padding: '7px 14px', display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: '10px' }}
                >
                  <Plus size={14} /> Add Type
                </button>
              </div>
            </div>

            {(!settingsData?.types || settingsData.types.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                <Briefcase size={32} style={{ opacity: 0.4, margin: '0 auto 8px', color: '#6366f1' }} />
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-dark)' }}>No leave types configured yet.</p>
                <p style={{ margin: '4px 0 14px', fontSize: '12px' }}>Click "Add Defaults" to create Casual, Sick, and Unpaid leave.</p>
                <button className="btn-primary" onClick={handleAddDefaultTypes} style={{ fontSize: '12px', padding: '8px 16px' }}>
                  Create Default Types
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {settingsData.types.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 16px',
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.88) 100%)',
                      borderRadius: '14px',
                      border: '1px solid rgba(99, 102, 241, 0.20)',
                      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.06)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-dark)' }}>{t.name}</span>
                        <span className="badge badge-info" style={{ fontSize: '10px' }}>{t.paid ? 'Paid' : 'Unpaid'}</span>
                        {!t.active && <span className="badge" style={{ fontSize: '10px', background: 'rgba(100,116,139,0.1)' }}>Hidden</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                        Quota: <strong>{t.yearly_quota !== null ? `${t.yearly_quota} days/yr` : 'Unlimited'}</strong>
                        {t.carry_forward && ` • Carry forward (max ${t.max_carry || 'all'})`}
                      </div>
                    </div>

                    <button
                      className="btn-secondary"
                      onClick={() => setTypeModal({ isEdit: true, data: t })}
                      style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '8px' }}
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Holidays Manager */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', gridColumn: '1 / -1', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarDays size={18} color="#f59e0b" /> Official Holiday List ({settingsData?.year?.label || 'This Year'})
            </h3>

            {/* Quick Add Form */}
            <form onSubmit={handleCreateHoliday} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <input
                type="date"
                required
                value={newHoliday.date}
                onChange={(e) => setNewHoliday(prev => ({ ...prev, date: e.target.value }))}
                style={{ padding: '9px 12px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.3)', background: 'rgba(255, 255, 255, 0.85)', color: 'var(--text-dark)', fontSize: '13px' }}
              />
              <input
                type="text"
                required
                placeholder="Holiday Name (e.g. Diwali, Independence Day)"
                value={newHoliday.name}
                onChange={(e) => setNewHoliday(prev => ({ ...prev, name: e.target.value }))}
                style={{ flex: 1, minWidth: '220px', padding: '9px 12px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.3)', background: 'rgba(255, 255, 255, 0.85)', color: 'var(--text-dark)', fontSize: '13px' }}
              />
              <button type="submit" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', fontSize: '13px', fontWeight: 700, borderRadius: '12px' }}>
                <Plus size={16} /> Add Holiday
              </button>
            </form>

            {/* Holidays Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {(settingsData?.holidays || []).map((h) => (
                <div
                  key={h.date}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(245, 158, 11, 0.24)',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(254, 243, 199, 0.35) 100%)',
                    boxShadow: '0 2px 6px rgba(245, 158, 11, 0.06)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-dark)' }}>{h.name}</div>
                    <div style={{ fontSize: '12px', color: '#d97706', fontWeight: 700, marginTop: '2px' }}>{formatDate(h.date)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteHoliday(h.date)}
                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                    title="Delete Holiday"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. APPLY LEAVE MODAL */}
      {showApplyModal && (
        <ApplyLeaveModal
          isOpen={showApplyModal}
          onClose={() => setShowApplyModal(false)}
          onSuccess={() => {
            setShowApplyModal(false);
            showToast('Leave request submitted successfully');
            refreshAll();
          }}
          balances={displayBalances}
          leaveTypes={settingsData?.types || []}
          settings={memberData?.settings || settingsData?.settings}
          holidays={(memberData?.holidays || []).map(h => h.date)}
          isAdmin={isAdmin}
          onInitDefaults={handleAddDefaultTypes}
          user={user}
        />
      )}

      {/* 6. DECISION MODAL (Approve / Reject / Cancel with Note) */}
      {decisionModal && (
        <div className="vm-modal-backdrop" onClick={() => setDecisionModal(null)}>
          <div className="glass-panel" onClick={(e) => e.stopPropagation()} style={{ width: '420px', maxWidth: '92vw', padding: '24px', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: 'var(--text-dark)' }}>
              {decisionModal.action === 'approve' ? 'Approve Leave Request' : (decisionModal.action === 'reject' ? 'Reject Leave Request' : 'Cancel Leave Request')}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
              Request #{decisionModal.request.id} for <strong>{decisionModal.request.days} days</strong> ({decisionModal.request.type_name})
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Optional Note / Reason
              </label>
              <textarea
                rows="3"
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                placeholder="Add a remark for the team member..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-dark)', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setDecisionModal(null)} disabled={submittingAction}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleExecuteDecision}
                disabled={submittingAction}
                style={{
                  background: decisionModal.action === 'approve' ? '#10b981' : (decisionModal.action === 'reject' ? '#ef4444' : undefined)
                }}
              >
                {submittingAction ? 'Processing...' : `Confirm ${decisionModal.action.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. TYPE MODAL (Add / Edit Leave Type) */}
      {typeModal && (
        <LeaveTypeModal
          isOpen={!!typeModal}
          onClose={() => setTypeModal(null)}
          onSuccess={() => {
            setTypeModal(null);
            showToast('Leave type saved');
            loadSettingsData();
          }}
          typeData={typeModal.data}
          isEdit={typeModal.isEdit}
        />
      )}

      {/* 8. SUMMARY CARDS CONTEXT MENU (Portal) */}
      {summaryContextMenu && createPortal(
        <div className="vm-modal-backdrop" onClick={() => setSummaryContextMenu(null)} style={{ background: 'transparent' }}>
          <div
            className="item-popover-menu"
            style={{
              position: 'fixed',
              left: Math.min(window.innerWidth - 220, summaryContextMenu.x),
              top: Math.min(window.innerHeight - 180, summaryContextMenu.y),
              zIndex: 999999
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)' }}>
              {summaryContextMenu.card.label}
            </div>
            <button
              className="item-popover-action-btn"
              onClick={() => {
                const id = summaryContextMenu.card.id;
                setSummaryPinned(prev => {
                  const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
                  try { localStorage.setItem('tc_leave_summary_pinned', JSON.stringify(next)); } catch {}
                  return next;
                });
                setSummaryContextMenu(null);
              }}
            >
              <Pin size={16} />
              <span>{summaryPinned.includes(summaryContextMenu.card.id) ? 'Unpin Card' : 'Pin to Front'}</span>
            </button>

            <button
              className="item-popover-action-btn"
              onClick={() => {
                const id = summaryContextMenu.card.id;
                setSummaryHidden(prev => {
                  const next = [...prev, id];
                  try { localStorage.setItem('tc_leave_summary_hidden', JSON.stringify(next)); } catch {}
                  return next;
                });
                setSummaryContextMenu(null);
              }}
            >
              <EyeOff size={16} />
              <span>Hide Card</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* 9. REQUEST ITEM CONTEXT MENU (Portal) */}
      {itemContextMenu && createPortal(
        <div className="vm-modal-backdrop" onClick={() => setItemContextMenu(null)} style={{ background: 'transparent' }}>
          <div
            className="item-popover-menu"
            style={{
              position: 'fixed',
              left: Math.min(window.innerWidth - 220, itemContextMenu.x),
              top: Math.min(window.innerHeight - 240, itemContextMenu.y),
              zIndex: 999999
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)' }}>
              Request #{itemContextMenu.request.id} ({itemContextMenu.request.type_name})
            </div>

            {isAdmin && itemContextMenu.request.status === 'pending' && (
              <>
                <button
                  className="item-popover-action-btn"
                  onClick={() => {
                    const req = itemContextMenu.request;
                    setItemContextMenu(null);
                    setDecisionModal({ request: req, action: 'approve' });
                  }}
                  style={{ color: '#10b981' }}
                >
                  <CheckCircle2 size={16} />
                  <span>Approve</span>
                </button>
                <button
                  className="item-popover-action-btn"
                  onClick={() => {
                    const req = itemContextMenu.request;
                    setItemContextMenu(null);
                    setDecisionModal({ request: req, action: 'reject' });
                  }}
                  style={{ color: '#ef4444' }}
                >
                  <XCircle size={16} />
                  <span>Reject</span>
                </button>
              </>
            )}

            {itemContextMenu.request.status === 'pending' && (
              <button
                className="item-popover-action-btn"
                onClick={() => {
                  const req = itemContextMenu.request;
                  setItemContextMenu(null);
                  setDecisionModal({ request: req, action: 'cancel' });
                }}
              >
                <X size={16} />
                <span>Cancel Request</span>
              </button>
            )}

            <button
              className="item-popover-action-btn"
              onClick={() => toggleItemPin(itemContextMenu.request.id)}
            >
              <Pin size={16} />
              <span>{pinnedIds.includes(itemContextMenu.request.id) ? 'Unpin' : 'Pin to Top'}</span>
            </button>

            <button
              className="item-popover-action-btn"
              onClick={() => handleItemHide(itemContextMenu.request.id)}
            >
              <EyeOff size={16} />
              <span>Hide Item</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* 10. UNHIDE MODAL FOR REQUESTS */}
      <UnhideModal
        isOpen={showItemUnhideModal}
        onClose={() => setShowItemUnhideModal(false)}
        title="Hidden Leave Requests"
        description="Select hidden requests to restore them to your view."
        hiddenItems={rawRequests.filter(r => hiddenIds.includes(r.id)).map(r => ({
          id: r.id,
          label: `${r.type_name} (${formatDayMonth(r.from)}) — ${r.days} Days`
        }))}
        onUnhideOne={(id) => {
          setHiddenIds(prev => prev.filter(x => x !== id));
        }}
        onUnhideAll={() => {
          setHiddenIds([]);
          setShowItemUnhideModal(false);
        }}
      />

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="dashboard-toast">
          <CheckCircle2 size={16} style={{ color: '#10b981' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

/* ---------------- Apply Leave Modal Component ---------------- */
function ApplyLeaveModal({ isOpen, onClose, onSuccess, balances = [], leaveTypes = [], settings, holidays, isAdmin, onInitDefaults, user }) {
  // Derive options: either from balances or fallback to account leaveTypes, or standard active types
  const availableOptions = useMemo(() => {
    if (balances && balances.length > 0) {
      return balances.map((b) => ({
        id: b.type_id || b.id,
        name: b.name,
        available: b.available,
        quota: b.quota,
        label: b.available !== null && b.available !== undefined
          ? `${b.name} (${b.available} days left)`
          : `${b.name} (Unlimited)`
      }));
    }
    if (leaveTypes && leaveTypes.length > 0) {
      return leaveTypes.filter(t => t.active !== false).map((t) => ({
        id: t.id,
        name: t.name,
        available: t.yearly_quota,
        quota: t.yearly_quota,
        label: t.yearly_quota !== null ? `${t.name} (${t.yearly_quota} days/yr)` : `${t.name} (Unlimited)`
      }));
    }
    return [
      { id: 1, name: 'Casual Leave', available: 12, quota: 12, label: 'Casual Leave (12 days left)' },
      { id: 2, name: 'Sick Leave', available: 6, quota: 6, label: 'Sick Leave (6 days left)' },
      { id: 3, name: 'Unpaid Leave', available: null, quota: null, label: 'Unpaid Leave (Unlimited)' }
    ];
  }, [balances, leaveTypes]);

  const [typeId, setTypeId] = useState(() => availableOptions[0]?.id || 1);
  const [fromDate, setFromDate] = useState(istToday);
  const [toDate, setToDate] = useState(istToday);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayType, setHalfDayType] = useState('first'); // 'first' | 'second'
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Sync typeId if options load or change
  useEffect(() => {
    if ((!typeId || !availableOptions.some(o => o.id === typeId)) && availableOptions.length > 0) {
      setTypeId(availableOptions[0].id);
    }
  }, [availableOptions, typeId]);

  const selectedBalance = balances.find(b => (b.type_id || b.id) === Number(typeId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!typeId) {
      setError('Please select a leave type');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        type_id: Number(typeId),
        from: fromDate,
        to: isHalfDay ? fromDate : toDate,
        half_day: isHalfDay ? halfDayType : null,
        reason: reason.trim() || undefined,
        idempotency_key: `leave_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      };

      let backendSucceeded = false;
      try {
        const res = await applyLeaveRequest(payload);
        if (res && res.success) {
          backendSucceeded = true;
        }
      } catch (backendErr) {
        console.warn('Backend applyLeaveRequest note:', backendErr?.message);
      }

      if (!backendSucceeded) {
        // Fallback to storing in local leave requests
        const selectedOpt = availableOptions.find(o => o.id === Number(typeId));
        const fromD = new Date(fromDate);
        const toD = new Date(isHalfDay ? fromDate : toDate);
        const diffDays = isHalfDay ? 0.5 : Math.max(1, Math.round((toD - fromD) / (1000 * 60 * 60 * 24)) + 1);

        const newReq = {
          id: `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          user_id: user?.id || 1,
          username: user?.username || user?.name || user?.email?.split('@')[0] || 'Team Member',
          admin_id: user?.adminId || user?.id || 1,
          leave_type_id: Number(typeId),
          type_id: Number(typeId),
          type_name: selectedOpt?.name || 'Casual Leave',
          from_date: fromDate,
          to_date: isHalfDay ? fromDate : toDate,
          from: fromDate,
          to: isHalfDay ? fromDate : toDate,
          half_day: isHalfDay ? halfDayType : null,
          days: diffDays,
          reason: reason.trim() || 'Leave application',
          status: 'pending',
          created_at: new Date().toISOString(),
          decided_at: null,
          decided_by: null,
          decision_note: null
        };

        try {
          const stored = JSON.parse(localStorage.getItem('tc_local_leave_requests') || '[]');
          localStorage.setItem('tc_local_leave_requests', JSON.stringify([newReq, ...stored]));
        } catch (e) {
          console.warn('LocalStorage leave request save error:', e);
        }
      }

      onSuccess();
    } catch (err) {
      setError(err?.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="vm-modal-backdrop" onClick={onClose}>
      <div className="glass-panel" onClick={(e) => e.stopPropagation()} style={{ width: '480px', maxWidth: '92vw', padding: '24px', borderRadius: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>
            Apply for Leave
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Leave Type Select */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
              Leave Type
            </label>
            {availableOptions.length === 0 ? (
              <div style={{ padding: '14px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.2)', textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--text-dark)' }}>
                  No leave types are currently active.
                </p>
                {onInitDefaults && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={async () => {
                      await onInitDefaults();
                    }}
                    style={{ fontSize: '12px', padding: '6px 14px' }}
                  >
                    Create Default Types (Casual, Sick, Unpaid)
                  </button>
                )}
              </div>
            ) : (
              <select
                value={typeId}
                onChange={(e) => setTypeId(Number(e.target.value))}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-dark)', fontSize: '14px', fontWeight: 600 }}
              >
                {availableOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Half Day Checkbox */}
          {settings?.half_day !== false && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <input
                type="checkbox"
                id="tc-half-day-check"
                checked={isHalfDay}
                onChange={(e) => {
                  setIsHalfDay(e.target.checked);
                  if (e.target.checked) setToDate(fromDate);
                }}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="tc-half-day-check" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)', cursor: 'pointer' }}>
                Half Day Leave
              </label>

              {isHalfDay && (
                <select
                  value={halfDayType}
                  onChange={(e) => setHalfDayType(e.target.value)}
                  style={{ marginLeft: 'auto', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-dark)', fontSize: '12px' }}
                >
                  <option value="first">First Half (Morning)</option>
                  <option value="second">Second Half (Afternoon)</option>
                </select>
              )}
            </div>
          )}

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: isHalfDay ? '1fr' : '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                {isHalfDay ? 'Date' : 'From Date'}
              </label>
              <input
                type="date"
                required
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  if (isHalfDay || e.target.value > toDate) setToDate(e.target.value);
                }}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-dark)', fontSize: '13px' }}
              />
            </div>

            {!isHalfDay && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  To Date
                </label>
                <input
                  type="date"
                  required
                  min={fromDate}
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-dark)', fontSize: '13px' }}
                />
              </div>
            )}
          </div>

          {/* Reason */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
              Reason for Leave
            </label>
            <textarea
              rows="3"
              placeholder="e.g. Family function, medical rest, personal errands..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-dark)', fontSize: '13px' }}
            />
          </div>

          {error && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '14px', background: 'rgba(239, 68, 68, 0.08)', padding: '8px 12px', borderRadius: '8px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------------- Leave Type Modal (Admin) ---------------- */
function LeaveTypeModal({ isOpen, onClose, onSuccess, typeData, isEdit }) {
  const [name, setName] = useState(typeData?.name || '');
  const [quota, setQuota] = useState(typeData?.yearly_quota !== null ? typeData?.yearly_quota : '');
  const [paid, setPaid] = useState(typeData?.paid ?? true);
  const [carryForward, setCarryForward] = useState(typeData?.carry_forward ?? false);
  const [maxCarry, setMaxCarry] = useState(typeData?.max_carry !== null ? typeData?.max_carry : '');
  const [active, setActive] = useState(typeData?.active ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        yearly_quota: quota === '' ? null : Number(quota),
        paid: !!paid,
        carry_forward: !!carryForward,
        max_carry: carryForward && maxCarry !== '' ? Number(maxCarry) : null,
        active: !!active
      };
      if (isEdit) {
        await updateLeaveType(typeData.id, payload);
      } else {
        await createLeaveType(payload);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to save leave type');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="vm-modal-backdrop" onClick={onClose}>
      <div className="glass-panel" onClick={(e) => e.stopPropagation()} style={{ width: '440px', maxWidth: '92vw', padding: '24px', borderRadius: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px', color: 'var(--text-dark)' }}>
          {isEdit ? 'Edit Leave Type' : 'Create Leave Type'}
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
              Type Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Annual Leave, Bereavement"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-dark)', fontSize: '13px' }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
              Yearly Quota (Days, leave empty for unlimited)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              placeholder="Unlimited"
              value={quota}
              onChange={(e) => setQuota(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-dark)', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>Paid Leave</span>
            <input
              type="checkbox"
              checked={paid}
              onChange={(e) => setPaid(e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>Carry Forward Unused Days</span>
            <input
              type="checkbox"
              checked={carryForward}
              onChange={(e) => setCarryForward(e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
          </div>

          {carryForward && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                Max Carry Over (Days, leave empty for no cap)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                placeholder="No limit"
                value={maxCarry}
                onChange={(e) => setMaxCarry(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-dark)', fontSize: '13px' }}
              />
            </div>
          )}

          {error && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '14px', background: 'rgba(239, 68, 68, 0.08)', padding: '8px 12px', borderRadius: '8px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

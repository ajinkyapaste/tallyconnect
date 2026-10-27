import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Clock, CheckCircle2, AlertCircle, Play, Square, MoreVertical, Pin, Users,
  ChevronRight, LogIn, LogOut, Search, Filter, RotateCcw, Calendar, History,
  ArrowRight, User, Shield, Briefcase, Eye, EyeOff, Move, ChevronDown, Check,
  Settings2, CalendarRange, ShieldCheck, Save, X, Plus, AlertTriangle, Info
} from 'lucide-react';
import {
  getAttendanceMe,
  attendanceCheckIn,
  attendanceCheckOut,
  attendancePing,
  getAttendanceTeam,
  getAttendanceTeamMemberHistory,
  getAttendanceMyHistory,
  getAttendanceSettings,
  saveAttendanceSettings,
  saveAttendanceMember,
  getAttendanceSummary
} from './api';
import DisplayPreferencesBar from './DisplayPreferencesBar';
import StandardPagination from './StandardPagination';
import { UnhideModal, createHoldTouchHandler } from './uiUtils';
import BitrixFilterBar from './BitrixFilterBar';

const formatDuration = (totalSeconds) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) {
    return `${hrs}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  }
  return `${mins}m ${String(secs).padStart(2, '0')}s`;
};

const formatTime12 = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
};

const formatDateReadable = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return String(iso);
  }
};

const istToday = () => {
  const IST_MS = 330 * 60 * 1000;
  return new Date(Date.now() + IST_MS).toISOString().slice(0, 10);
};

const istDaysAgo = (days) => {
  const IST_MS = 330 * 60 * 1000;
  return new Date(Date.now() + IST_MS - Math.max(0, days) * 86400000).toISOString().slice(0, 10);
};

const formatMinutes = (mins) => {
  const total = Math.max(0, Number(mins) || 0);
  return `${Math.floor(total / 60)}h ${total % 60}m`;
};

export default function AttendanceManager({ user, companyGuid }) {
  const isAdmin = user?.role === 'ADMIN';

  // Sub-tabs
  const [activeTab, setActiveTab] = useState(isAdmin ? 'team' : 'punch'); // 'team' | 'history' | 'punch'
  const [selectedDate, setSelectedDate] = useState(istToday);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Preferences & Pagination
  const [viewMode, setViewMode] = useState('card');
  const [cardOpacity, setCardOpacity] = useState(() => {
    try {
      const v = parseFloat(localStorage.getItem('tc_attendance_card_opacity'));
      return Number.isFinite(v) ? Math.min(1, Math.max(0.1, v)) : 0.85;
    } catch {
      return 0.85;
    }
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Data states
  const [teamRoster, setTeamRoster] = useState(null);
  const [myAttendance, setMyAttendance] = useState(null);
  const [myHistory, setMyHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Punch clock action states
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Admin member history drilldown modal
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberHistoryLoading, setMemberHistoryLoading] = useState(false);
  const [memberHistoryDays, setMemberHistoryDays] = useState([]);

  // Check-in rules / exempt positions (Admin)
  const [rulesOpen, setRulesOpen] = useState(false);
  const [rulesData, setRulesData] = useState(null);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesError, setRulesError] = useState('');
  const [exemptDraft, setExemptDraft] = useState([]);
  const [newExemptPosition, setNewExemptPosition] = useState('');
  const [savingExempt, setSavingExempt] = useState(false);
  const [memberDrafts, setMemberDrafts] = useState({});
  const [savingMemberId, setSavingMemberId] = useState(null);
  const [rulesNotice, setRulesNotice] = useState('');

  // Range summary (Admin)
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [summaryFrom, setSummaryFrom] = useState(() => istDaysAgo(29));
  const [summaryTo, setSummaryTo] = useState(istToday);

  // Top summary KPI cards reordering & hiding
  const [summaryOrder, setSummaryOrder] = useState(() => {
    try {
      const s = localStorage.getItem('tc_attendance_summary_order');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [summaryHidden, setSummaryHidden] = useState(() => {
    try {
      const s = localStorage.getItem('tc_attendance_summary_hidden');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const [summaryPinned, setSummaryPinned] = useState(() => {
    try {
      const s = localStorage.getItem('tc_attendance_summary_pinned');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const [draggedSummaryIdx, setDraggedSummaryIdx] = useState(null);
  const [dragOverSummaryIdx, setDragOverSummaryIdx] = useState(null);
  const [summaryContextMenu, setSummaryContextMenu] = useState(null);
  const [showSummaryUnhideModal, setShowSummaryUnhideModal] = useState(false);

  // Fetch Team Attendance (Admin)
  const fetchTeamData = async (date) => {
    setLoading(true);
    try {
      const res = await getAttendanceTeam({ date: date || selectedDate });
      if (res?.success) {
        setTeamRoster(res);
      }
    } catch (err) {
      console.warn('Failed to fetch team attendance:', err?.message || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch My Attendance (Member)
  const fetchMyData = async () => {
    setLoading(true);
    try {
      const res = await getAttendanceMe();
      if (res?.success) {
        setMyAttendance(res);
        if (res.open?.check_in_at) {
          const start = new Date(res.open.check_in_at).getTime();
          setElapsedSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
        }
      }
    } catch (err) {
      console.warn('Failed to fetch member attendance:', err?.message || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch My History (Member)
  const fetchMyHistoryData = async () => {
    try {
      const res = await getAttendanceMyHistory();
      if (res?.success && Array.isArray(res.days)) {
        setMyHistory(res.days);
      }
    } catch (err) {
      console.warn('Failed to fetch member attendance history:', err);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchTeamData(selectedDate);
    } else {
      fetchMyData();
      fetchMyHistoryData();
    }
  }, [isAdmin, selectedDate]);

  // Live timer for active check-in
  useEffect(() => {
    if (isAdmin || !myAttendance?.open?.check_in_at) return;
    const interval = setInterval(() => {
      const start = new Date(myAttendance.open.check_in_at).getTime();
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [isAdmin, myAttendance?.open?.check_in_at]);

  // Heartbeat ping
  useEffect(() => {
    if (isAdmin || !myAttendance?.open) return;
    const pingId = setInterval(() => {
      attendancePing().catch(() => {});
    }, 90000);
    return () => clearInterval(pingId);
  }, [isAdmin, myAttendance?.open]);

  // Member drilldown drawer opener
  const handleOpenMemberHistory = async (member) => {
    setSelectedMember(member);
    setMemberHistoryLoading(true);
    try {
      const res = await getAttendanceTeamMemberHistory(member.user_id);
      if (res?.success && Array.isArray(res.days)) {
        setMemberHistoryDays(res.days);
      } else {
        setMemberHistoryDays([]);
      }
    } catch (err) {
      console.error('Failed to load member history:', err);
      setMemberHistoryDays([]);
    } finally {
      setMemberHistoryLoading(false);
    }
  };

  // Load / save check-in rules (Admin)
  const applyRulesData = (res, { resetDrafts = false, syncUserId = null } = {}) => {
    const members = Array.isArray(res?.members) ? res.members : [];
    setRulesData(res);
    setExemptDraft(Array.isArray(res?.exempt_positions) ? res.exempt_positions : []);
    setMemberDrafts((prev) => {
      const next = resetDrafts ? {} : { ...prev };
      members.forEach((m) => {
        const isSaved = syncUserId !== null && Number(syncUserId) === Number(m.user_id);
        if (resetDrafts || next[m.user_id] === undefined || isSaved) {
          next[m.user_id] = { position: m.position || '', rule: m.rule || 'auto' };
        }
      });
      return next;
    });
  };

  const loadRules = async () => {
    setRulesLoading(true);
    setRulesError('');
    setRulesNotice('');
    try {
      const res = await getAttendanceSettings();
      if (res?.success) applyRulesData(res, { resetDrafts: true });
      else throw new Error('Could not load check-in settings.');
    } catch (err) {
      setRulesError(err?.message || 'Could not load check-in settings.');
    } finally {
      setRulesLoading(false);
    }
  };

  const openRules = () => {
    setRulesOpen(true);
    loadRules();
  };

  const addExemptPosition = (value) => {
    const position = String(value ?? '').trim().replace(/\s+/g, ' ');
    if (!position) return;
    setExemptDraft((prev) => {
      if (prev.length >= 20) {
        alert('At most 20 exempt positions are allowed.');
        return prev;
      }
      if (prev.some((p) => p.toLowerCase() === position.toLowerCase())) return prev;
      return [...prev, position.slice(0, 40)];
    });
    setNewExemptPosition('');
  };

  const handleSaveExempt = async () => {
    setSavingExempt(true);
    setRulesError('');
    setRulesNotice('');
    try {
      const res = await saveAttendanceSettings(exemptDraft);
      if (res?.success) {
        applyRulesData(res);
        setRulesNotice('Exempt positions saved.');
      }
    } catch (err) {
      setRulesError(err?.message || 'Could not save exempt positions.');
    } finally {
      setSavingExempt(false);
    }
  };

  const handleSaveMemberRules = async (member) => {
    const draft = memberDrafts[member.user_id] || { position: member.position || '', rule: member.rule || 'auto' };
    setSavingMemberId(member.user_id);
    setRulesError('');
    setRulesNotice('');
    try {
      const res = await saveAttendanceMember(member.user_id, {
        position: String(draft.position || '').trim() || null,
        rule: draft.rule || 'auto'
      });
      if (res?.success) {
        applyRulesData(res, { syncUserId: member.user_id });
        setRulesNotice(`${member.username} updated.`);
      }
    } catch (err) {
      setRulesError(err?.message || `Could not update ${member.username}.`);
    } finally {
      setSavingMemberId(null);
    }
  };

  const loadSummary = async (from = summaryFrom, to = summaryTo) => {
    setSummaryLoading(true);
    setSummaryError('');
    try {
      const res = await getAttendanceSummary({ from, to });
      if (res?.success) setSummaryData(res);
      else throw new Error('Could not load the attendance summary.');
    } catch (err) {
      setSummaryError(err?.message || 'Could not load the attendance summary.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const openSummary = () => {
    setSummaryOpen(true);
    loadSummary(summaryFrom, summaryTo);
  };

  // Check In action
  const handleCheckIn = async () => {
    setSubmitting(true);
    try {
      const idempotency_key = `chk_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const res = await attendanceCheckIn({ note: note.trim() || undefined, idempotency_key });
      if (res?.success) {
        setNote('');
        await fetchMyData();
      }
    } catch (err) {
      alert(err?.message || 'Check-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Check Out action
  const handleCheckOut = async () => {
    if (!window.confirm('Check out of your active attendance session?')) return;
    setSubmitting(true);
    try {
      const res = await attendanceCheckOut({ note: note.trim() || undefined });
      if (res?.success) {
        setNote('');
        await fetchMyData();
        await fetchMyHistoryData();
      }
    } catch (err) {
      alert(err?.message || 'Check-out failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Status definitions
  const statusConfig = {
    active: { label: 'Active', bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
    idle: { label: 'Idle', bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
    checked_out: { label: 'Checked Out', bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
    absent: { label: 'Absent', bg: 'rgba(148, 163, 184, 0.15)', color: 'var(--text-muted)', border: 'rgba(148, 163, 184, 0.25)' },
    exempt: { label: 'Exempt', bg: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', border: 'rgba(99, 102, 241, 0.3)' },
  };

  const memberStatusKey = myAttendance?.exempt ? 'exempt' : (myAttendance?.status || 'absent');

  // Top KPI Overview Cards
  const ADMIN_SUMMARY_DEFS = useMemo(() => [
    {
      id: 'kpi-total-team',
      name: 'Total Team',
      value: teamRoster?.counts?.total ?? 0,
      sub: `${teamRoster?.company || 'All'} workspace members`,
      icon: <Users size={20} />,
      iconBg: 'rgba(99, 102, 241, 0.12)',
      iconColor: '#6366f1',
    },
    {
      id: 'kpi-active-now',
      name: 'Present / Active',
      value: teamRoster?.counts?.active ?? 0,
      sub: `${teamRoster?.counts?.idle ?? 0} currently idle`,
      icon: <CheckCircle2 size={20} />,
      iconBg: 'rgba(16, 185, 129, 0.12)',
      iconColor: '#10b981',
    },
    {
      id: 'kpi-checked-out',
      name: 'Checked Out',
      value: teamRoster?.counts?.checked_out ?? 0,
      sub: 'Completed shift today',
      icon: <LogOut size={20} />,
      iconBg: 'rgba(59, 130, 246, 0.12)',
      iconColor: '#3b82f6',
    },
    {
      id: 'kpi-absent',
      name: 'Absent',
      value: teamRoster?.counts?.absent ?? 0,
      sub: 'No check-in logged today',
      icon: <Clock size={20} />,
      iconBg: 'rgba(148, 163, 184, 0.12)',
      iconColor: '#94a3b8',
    },
  ], [teamRoster]);

  const MEMBER_SUMMARY_DEFS = useMemo(() => [
    {
      id: 'kpi-my-status',
      name: 'Today Status',
      value: statusConfig[memberStatusKey].label,
      sub: myAttendance?.exempt
        ? `Position${myAttendance?.position ? `: ${myAttendance.position}` : ''} doesn't require check-in`
        : myAttendance?.open
          ? `Checked in at ${formatTime12(myAttendance.open.check_in_at)}`
          : 'Ready for shift',
      icon: <Clock size={20} />,
      iconBg: statusConfig[memberStatusKey].bg,
      iconColor: statusConfig[memberStatusKey].color,
    },
    {
      id: 'kpi-total-hours',
      name: 'Total Hours Today',
      value: `${Math.floor((myAttendance?.total_minutes || 0) / 60)}h ${(myAttendance?.total_minutes || 0) % 60}m`,
      sub: `${myAttendance?.sessions?.length || 0} logged session${myAttendance?.sessions?.length === 1 ? '' : 's'}`,
      icon: <Briefcase size={20} />,
      iconBg: 'rgba(16, 185, 129, 0.12)',
      iconColor: '#10b981',
    },
    {
      id: 'kpi-first-in',
      name: 'First Check-In',
      value: formatTime12(myAttendance?.sessions?.[0]?.check_in_at),
      sub: myAttendance?.sessions?.[0]?.in_note ? `Note: ${myAttendance.sessions[0].in_note}` : 'Recorded on arrival',
      icon: <LogIn size={20} />,
      iconBg: 'rgba(99, 102, 241, 0.12)',
      iconColor: '#6366f1',
    },
    {
      id: 'kpi-session-state',
      name: 'Current Session',
      value: myAttendance?.open ? formatDuration(elapsedSeconds) : 'Closed',
      sub: myAttendance?.open ? 'Live tracking in progress' : 'Check in to start session',
      icon: <Play size={20} />,
      iconBg: 'rgba(245, 158, 11, 0.12)',
      iconColor: '#f59e0b',
    },
  ], [myAttendance, elapsedSeconds]);

  const adminSummaryDefs = useMemo(() => {
    const defs = [...ADMIN_SUMMARY_DEFS];
    if (teamRoster?.counts?.exempt !== undefined) {
      defs.push({
        id: 'kpi-exempt',
        name: 'Exempt',
        value: teamRoster?.counts?.exempt ?? 0,
        sub: 'Position/rule exempt from check-in',
        icon: <ShieldCheck size={20} />,
        iconBg: 'rgba(99, 102, 241, 0.12)',
        iconColor: '#6366f1',
      });
    }
    return defs;
  }, [teamRoster]);

  const rawSummaryDefs = isAdmin ? adminSummaryDefs : MEMBER_SUMMARY_DEFS;

  const orderedSummaryCards = useMemo(() => {
    let list = [...rawSummaryDefs];
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
    list.sort((a, b) => {
      const pa = summaryPinned.includes(a.id) ? 1 : 0;
      const pb = summaryPinned.includes(b.id) ? 1 : 0;
      return pb - pa;
    });
    return list.filter((c) => !summaryHidden.includes(c.id));
  }, [rawSummaryDefs, summaryOrder, summaryPinned, summaryHidden]);

  // Drag and drop for summary cards
  const handleSummaryDragStart = (e, index) => {
    setDraggedSummaryIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', String(index)); } catch {}
  };

  const handleSummaryDragOver = (e, index) => {
    e.preventDefault();
    try { e.dataTransfer.dropEffect = 'move'; } catch {}
    if (dragOverSummaryIdx !== index) setDragOverSummaryIdx(index);
  };

  const handleSummaryDrop = (e, targetIdx) => {
    e.preventDefault();
    let sourceIdx = draggedSummaryIdx;
    if (sourceIdx === null || sourceIdx === undefined) {
      try {
        const text = e.dataTransfer?.getData('text/plain');
        if (text) sourceIdx = parseInt(text, 10);
      } catch {}
    }
    if (sourceIdx === null || sourceIdx === undefined || isNaN(sourceIdx) || sourceIdx === targetIdx) {
      setDraggedSummaryIdx(null);
      setDragOverSummaryIdx(null);
      return;
    }
    const currentList = [...orderedSummaryCards];
    const [moved] = currentList.splice(sourceIdx, 1);
    currentList.splice(targetIdx, 0, moved);
    const newOrder = currentList.map((c) => c.id);
    setSummaryOrder(newOrder);
    try { localStorage.setItem('tc_attendance_summary_order', JSON.stringify(newOrder)); } catch {}
    setDraggedSummaryIdx(null);
    setDragOverSummaryIdx(null);
  };

  const toggleSummaryPin = (id) => {
    setSummaryContextMenu(null);
    setSummaryPinned((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem('tc_attendance_summary_pinned', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleSummaryHide = (card) => {
    setSummaryContextMenu(null);
    setSummaryHidden((prev) => {
      const next = [...new Set([...prev, card.id])];
      try { localStorage.setItem('tc_attendance_summary_hidden', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // Filter team members (Admin view)
  const filteredMembers = useMemo(() => {
    if (!teamRoster?.members) return [];
    return teamRoster.members.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const u = (m.username || '').toLowerCase();
        const em = (m.email || '').toLowerCase();
        const pos = (m.position || '').toLowerCase();
        if (!u.includes(q) && !em.includes(q) && !pos.includes(q)) return false;
      }
      return true;
    });
  }, [teamRoster?.members, statusFilter, searchQuery]);

  // Paged members
  const pagedMembers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, page, pageSize]);

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="page-eyebrow">WORKFORCE OPERATIONS</span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              fontSize: '11px',
              fontWeight: 700
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              Live IST
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>
            Team Attendance &amp; Shifts
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
            {isAdmin
              ? 'Real-time daily presence, shift durations, idle status detection, and attendance history.'
              : 'Punch clock, live work duration, daily session log, and past work history.'}
          </p>
        </div>

          {/* Header Right Actions */}
          <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Date Selector */}
            {isAdmin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                      setPage(1);
                    }
                  }}
                  className="input"
                  style={{
                    padding: '7px 12px',
                    borderRadius: '10px',
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-dark)',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => { setSelectedDate(istToday()); setPage(1); }}
                  style={{ padding: '7px 12px', fontSize: '12px', borderRadius: '10px', fontWeight: 700 }}
                >
                  Today
                </button>
              </div>
            )}

            {isAdmin && (
              <>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={openSummary}
                  style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}
                >
                  <CalendarRange size={14} />
                  <span>Range Summary</span>
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={openRules}
                  style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}
                >
                  <Settings2 size={14} />
                  <span>Check-in Rules</span>
                </button>
              </>
            )}

            {/* <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setRefreshing(true);
                if (isAdmin) {
                  fetchTeamData(selectedDate);
                } else {
                  fetchMyData();
                  fetchMyHistoryData();
                }
              }}
              disabled={refreshing}
              style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}
            >
              <RotateCcw size={14} className={refreshing ? 'spinning' : ''} />
              <span>Refresh</span>
            </button> */}
          </div>
      </div>

      {/* Top Overview KPI Cards (Draggable, Touch-Hold, Pin, Hide/Show) */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        {orderedSummaryCards.map((card, index) => {
          const isPinned = summaryPinned.includes(card.id);
          const isDragging = draggedSummaryIdx === index;
          const isDragOver = dragOverSummaryIdx === index;
          return (
            <div
              key={card.id}
              className={`glass-panel summary-card draggable-card ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
              draggable
              onDragStart={(e) => handleSummaryDragStart(e, index)}
              onDragOver={(e) => handleSummaryDragOver(e, index)}
              onDrop={(e) => handleSummaryDrop(e, index)}
              onDragEnd={() => {
                setDraggedSummaryIdx(null);
                setDragOverSummaryIdx(null);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                setSummaryContextMenu({ x: e.clientX, y: e.clientY, card });
              }}
              {...createHoldTouchHandler((pos) => setSummaryContextMenu({ x: pos.x, y: pos.y, card }))}
              style={{
                position: 'relative',
                cursor: 'pointer',
                opacity: cardOpacity,
                transition: 'all 0.2s ease'
              }}
              title={`${card.name} · Drag to reorder, hold for options`}
            >
              {isPinned && (
                <span className="pinned-badge" title="Pinned metric">
                  <Pin size={11} />
                </span>
              )}

              <div className="summary-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h3>{card.name}</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    className="tile-menu-btn"
                    title="Options"
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      setSummaryContextMenu({ x: rect.left, y: rect.bottom + 4, card });
                    }}
                    style={{ background: 'transparent', border: 'none', padding: '2px', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <MoreVertical size={14} />
                  </button>
                  <div className="summary-card-icon" style={{ background: card.iconBg, color: card.iconColor }}>
                    {card.icon}
                  </div>
                </div>
              </div>

              <div className="amount" style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-dark)' }}>
                {card.value}
              </div>
              <div className="trend" style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                {card.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unhide Pill for Summary Cards */}
      {summaryHidden.length > 0 && (
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowSummaryUnhideModal(true)}
            style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '8px' }}
          >
            <Eye size={13} style={{ color: '#10b981' }} />
            <span>Unhide {summaryHidden.length} hidden card{summaryHidden.length > 1 ? 's' : ''}</span>
          </button>
        </div>
      )}

      {/* ADMIN VIEW */}
      {isAdmin && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', opacity: cardOpacity }}>
          {/* Roster Controls Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            {/* Left: Search & Filter Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <BitrixFilterBar
                storageKey="tc_attendance_filter"
                id="attendance-search-input"
                name="attendance_search"
                searchQuery={searchQuery}
                onSearchChange={(val) => {
                  setSearchQuery(val);
                  setPage(1);
                }}
                placeholder="Search team members..."
                availableFields={[
                  { id: 'search', label: 'Team Member', type: 'text', category: 'General' },
                  { id: 'status', label: 'Status', type: 'select', category: 'Status', options: ['Active', 'Idle', 'Checked Out', 'Absent', 'Exempt'] }
                ]}
                defaultVisibleFieldIds={['search', 'status']}
                presets={[
                  { id: 'all_attendance', label: 'All members', filters: {} },
                  { id: 'active_attendance', label: 'Active', filters: { status: 'Active' } },
                  { id: 'absent_attendance', label: 'Absent', filters: { status: 'Absent' } }
                ]}
                onReset={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
              />

              <div style={{ display: 'flex', gap: '6px', background: 'var(--glass-bg)', padding: '3px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                {['all', 'active', 'idle', 'checked_out', 'absent', 'exempt'].map((filterKey) => {
                  const count = filterKey === 'all'
                    ? (teamRoster?.counts?.total || 0)
                    : (teamRoster?.counts?.[filterKey] || 0);
                  const active = statusFilter === filterKey;
                  return (
                    <button
                      key={filterKey}
                      type="button"
                      onClick={() => { setStatusFilter(filterKey); setPage(1); }}
                      style={{
                        background: active ? 'var(--primary-color)' : 'transparent',
                        color: active ? '#ffffff' : 'var(--text-muted)',
                        border: 'none',
                        padding: '5px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ textTransform: 'capitalize' }}>{filterKey.replace('_', ' ')}</span>
                      <span style={{
                        padding: '1px 6px',
                        borderRadius: '10px',
                        background: active ? 'rgba(255,255,255,0.25)' : 'var(--glass-border)',
                        fontSize: '10px'
                      }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Display Preferences Bar (Cards vs Table, Opacity, RowsDropdown) */}
            <DisplayPreferencesBar
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              cardOpacity={cardOpacity}
              onCardOpacityChange={(val) => {
                setCardOpacity(val);
                try { localStorage.setItem('tc_attendance_card_opacity', String(val)); } catch {}
              }}
              pageSize={pageSize}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(1);
              }}
              totalRecords={filteredMembers.length}
            />
          </div>

          {/* Members Content: Cards View */}
          {viewMode === 'card' || viewMode === 'cards' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px',
              marginBottom: '20px'
            }}>
              {pagedMembers.map((m) => {
                const s = statusConfig[m.status] || statusConfig.absent;
                return (
                  <div
                    key={m.user_id}
                    className="glass-panel"
                    style={{
                      padding: '18px',
                      borderRadius: '16px',
                      border: `1px solid ${s.border}`,
                      background: 'var(--glass-bg)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <div>
                      {/* Top: Member Info & Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            background: 'var(--primary-light)',
                            color: 'var(--primary-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '15px'
                          }}>
                            {String(m.username || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-dark)' }}>
                              {m.username}
                            </h4>
                            <p style={{ margin: '1px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                              {m.email}
                            </p>
                            {m.position && (
                              <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                                {m.position}{m.required === false ? ' · Exempt' : ''}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status Chip */}
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 10px',
                          borderRadius: '16px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: s.bg,
                          color: s.color,
                          border: `1px solid ${s.border}`
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: s.color,
                            boxShadow: m.status === 'active' ? `0 0 6px ${s.color}` : 'none',
                            animation: m.status === 'active' ? 'pulse 1.4s infinite ease-in-out' : 'none'
                          }} />
                          {s.label}
                        </span>
                      </div>

                      {/* Middle: Stats Row */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '8px',
                        background: 'var(--glass-card-bg)',
                        padding: '10px',
                        borderRadius: '12px',
                        border: '1px solid var(--glass-border)',
                        marginBottom: '14px',
                        textAlign: 'center'
                      }}>
                        <div>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>First In</span>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)', marginTop: '2px' }}>
                            {formatTime12(m.first_in)}
                          </div>
                        </div>
                        <div>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Last Out</span>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)', marginTop: '2px' }}>
                            {formatTime12(m.last_out)}
                          </div>
                        </div>
                        <div>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Work Time</span>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
                            {Math.floor(m.total_minutes / 60)}h {m.total_minutes % 60}m
                          </div>
                        </div>
                      </div>

                      {/* Notes / Auto Closed */}
                      {m.auto_closed && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          color: '#f59e0b',
                          background: 'rgba(245, 158, 11, 0.1)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          marginBottom: '10px'
                        }}>
                          <AlertCircle size={12} />
                          <span>Session auto-closed at midnight (IST)</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom: Drilldown button */}
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleOpenMemberHistory(m)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <History size={14} />
                      <span>View Session History</span>
                    </button>
                  </div>
                );
              })}

              {pagedMembers.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                  <Users size={36} style={{ opacity: 0.4, marginBottom: '8px' }} />
                  <p style={{ fontWeight: 600 }}>No team members match this status or search filter</p>
                </div>
              )}
            </div>
          ) : (
            /* Table View */
            <div className="table-responsive" style={{ marginBottom: '20px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Position / Rule</th>
                    <th>Status</th>
                    <th>First Check-In</th>
                    <th>Last Check-Out</th>
                    <th>Total Work Time</th>
                    <th>Sessions</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedMembers.map((m) => {
                    const s = statusConfig[m.status] || statusConfig.absent;
                    return (
                      <tr key={m.user_id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              background: 'var(--primary-light)',
                              color: 'var(--primary-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '12px'
                            }}>
                              {String(m.username || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong style={{ color: 'var(--text-dark)' }}>{m.username}</strong>
                              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>{m.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>
                            {m.position || 'Not set'}
                          </span>
                          <span style={{
                            display: 'inline-block',
                            marginTop: '3px',
                            padding: '1px 7px',
                            borderRadius: '10px',
                            fontSize: '10px',
                            fontWeight: 700,
                            background: m.required === false ? 'rgba(99, 102, 241, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            color: m.required === false ? '#6366f1' : '#10b981'
                          }}>
                            {m.required === false ? 'Exempt' : 'Checks in'}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '14px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: s.bg,
                            color: s.color,
                            border: `1px solid ${s.border}`
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color }} />
                            {s.label}
                          </span>
                        </td>
                        <td>{formatTime12(m.first_in)}</td>
                        <td>{formatTime12(m.last_out)}</td>
                        <td style={{ fontWeight: 700, color: '#10b981' }}>
                          {Math.floor(m.total_minutes / 60)}h {m.total_minutes % 60}m
                        </td>
                        <td>{m.sessions?.length || 0}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => handleOpenMemberHistory(m)}
                            style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {pagedMembers.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No team members found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Standard Pagination Bar with RowsDropdown */}
          <StandardPagination
            currentPage={page}
            pageSize={pageSize}
            totalItems={filteredMembers.length}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
          />
        </div>
      )}

      {/* MEMBER VIEW */}
      {!isAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Punch Clock Interactive Panel */}
          <div className="glass-panel" style={{ padding: '32px 24px', borderRadius: '24px', opacity: cardOpacity }}>
            <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 14px',
                borderRadius: '20px',
                background: statusConfig[memberStatusKey].bg,
                color: statusConfig[memberStatusKey].color,
                fontWeight: 700,
                fontSize: '12px',
                marginBottom: '16px'
              }}>
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: statusConfig[memberStatusKey].color,
                  boxShadow: myAttendance?.open ? `0 0 8px ${statusConfig[memberStatusKey].color}` : 'none'
                }} />
                {myAttendance?.exempt
                  ? 'EXEMPT FROM CHECK-IN'
                  : myAttendance?.open
                    ? 'LIVE WORK SESSION IN PROGRESS'
                    : 'READY TO CHECK IN'}
              </span>

              {/* Running Clock */}
              <div style={{
                fontSize: '48px',
                fontWeight: 900,
                color: myAttendance?.open ? '#10b981' : 'var(--text-dark)',
                letterSpacing: '-1px',
                fontVariantNumeric: 'tabular-nums',
                marginBottom: '8px'
              }}>
                {myAttendance?.open ? formatDuration(elapsedSeconds) : '00h 00m 00s'}
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 24px' }}>
                {myAttendance?.exempt
                  ? `Your position${myAttendance?.position ? ` (${myAttendance.position})` : ''} is not required to check in. Any sessions you log will still appear below.`
                  : myAttendance?.open
                    ? `Checked in at ${formatTime12(myAttendance.open.check_in_at)} �?� India IST`
                    : 'Start your shift by checking in below. Sessions auto-close at 23:59 IST.'}
              </p>

              {/* Work Note Input */}
              <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Work Note / Objective (Optional):
                </label>
                <input
                  type="text"
                  placeholder={myAttendance?.open ? "e.g., Client demo completed, preparing summary" : "e.g., Starting client calls & account review"}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={300}
                  className="input"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    fontSize: '13px'
                  }}
                />
              </div>

              {/* Big Action Button */}
              {myAttendance?.exempt ? (
                <div style={{
                  width: '100%',
                  padding: '14px 24px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(99, 102, 241, 0.12) 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  color: '#6366f1',
                  fontSize: '16px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  textAlign: 'center'
                }}>
                  <ShieldCheck size={20} />
                  <span>Check-in not required{myAttendance?.position ? ` for ${myAttendance.position}` : ''}</span>
                </div>
              ) : !myAttendance?.open ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleCheckIn}
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                    fontSize: '16px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                >
                  <LogIn size={20} />
                  <span>{submitting ? 'Checking In...' : 'Start Work Session (Check In)'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCheckOut}
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(239, 68, 68, 0.4)',
                    fontSize: '16px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                >
                  <LogOut size={20} />
                  <span>{submitting ? 'Checking Out...' : 'Complete Shift (Check Out)'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Today's Sessions List */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', opacity: cardOpacity }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '17px', fontWeight: 800, color: 'var(--text-dark)' }}>
              Today’s Logged Sessions ({myAttendance?.sessions?.length || 0})
            </h3>

            {myAttendance?.sessions && myAttendance.sessions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myAttendance.sessions.map((ses, i) => (
                  <div
                    key={ses.id || i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 18px',
                      borderRadius: '14px',
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: ses.open ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: ses.open ? '#10b981' : '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {ses.open ? <Play size={16} /> : <CheckCircle2 size={16} />}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '14px', color: 'var(--text-dark)' }}>
                            {formatTime12(ses.check_in_at)} – {ses.open ? 'Present' : formatTime12(ses.check_out_at)}
                          </strong>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '10px',
                            background: ses.open ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                            color: ses.open ? '#10b981' : 'var(--text-muted)'
                          }}>
                            {ses.open ? 'Active' : `${ses.minutes} min`}
                          </span>
                        </div>
                        {ses.in_note && (
                          <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                            In: <em>{ses.in_note}</em>
                          </p>
                        )}
                        {ses.out_note && (
                          <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                            Out: <em>{ses.out_note}</em>
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Closed by: {ses.closed_by || (ses.open ? 'In Progress' : 'System')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', margin: '20px 0' }}>
                No sessions logged yet today. Click Check In above when you begin your tasks.
              </p>
            )}
          </div>

          {/* Past Attendance History */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', opacity: cardOpacity }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '17px', fontWeight: 800, color: 'var(--text-dark)' }}>
              Past 30 Days History
            </h3>

            {myHistory.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {myHistory.map((day) => (
                  <div
                    key={day.date}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '14px', color: 'var(--text-dark)' }}>
                        {formatDateReadable(day.date)}
                      </strong>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {formatTime12(day.first_in)} – {formatTime12(day.last_out)} ({day.sessions?.length || 0} session{day.sessions?.length === 1 ? '' : 's'})
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#10b981' }}>
                        {Math.floor(day.total_minutes / 60)}h {day.total_minutes % 60}m
                      </span>
                      {day.auto_closed && (
                        <span style={{ display: 'block', fontSize: '10px', color: '#f59e0b', fontWeight: 600 }}>
                          Auto closed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', margin: '16px 0' }}>
                No past sessions recorded in this period.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Member Drilldown History Modal (Admin) */}
      {selectedMember && createPortal(
        <div
          className="fade-in modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.48)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '85vh',
              overflowY: 'auto',
              borderRadius: '24px',
              padding: '28px',
              background: 'var(--modal-bg, rgba(255, 255, 255, 0.95))',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'var(--primary-light)',
                  color: 'var(--primary-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '18px'
                }}>
                  {String(selectedMember.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-dark)' }}>
                    {selectedMember.username} – Session Log
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    {selectedMember.email} • Past 30 Days History
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedMember(null)}
                style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '13px' }}
              >
                Close
              </button>
            </div>

            {/* Modal Body */}
            {memberHistoryLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <RotateCcw size={24} className="spinning" style={{ color: 'var(--primary-color)', marginBottom: '8px' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading session records...</p>
              </div>
            ) : memberHistoryDays.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {memberHistoryDays.map((d) => (
                  <div
                    key={d.date}
                    style={{
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '14px',
                      padding: '14px 18px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '14px', color: 'var(--text-dark)' }}>
                          {formatDateReadable(d.date)}
                        </strong>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                          First: {formatTime12(d.first_in)} | Last: {formatTime12(d.last_out)}
                        </span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#10b981' }}>
                        {Math.floor(d.total_minutes / 60)}h {d.total_minutes % 60}m
                      </span>
                    </div>

                    {/* Sessions details */}
                    {d.sessions && d.sessions.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                        {d.sessions.map((s, idx) => (
                          <div
                            key={s.id || idx}
                            style={{
                              fontSize: '12px',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              background: 'var(--glass-card-bg)',
                              border: '1px solid var(--glass-border)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <span>{formatTime12(s.check_in_at)} – {s.open ? 'Active' : formatTime12(s.check_out_at)} ({s.minutes}m)</span>
                              {s.in_note && <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>• Note: {s.in_note}</span>}
                            </div>
                            {s.closed_by && (
                              <span style={{ fontSize: '10px', color: s.closed_by === 'auto' ? '#f59e0b' : 'var(--text-muted)' }}>
                                {s.closed_by === 'auto' ? 'Auto closed' : 'User closed'}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                No attendance sessions recorded for this member in the past 30 days.
              </p>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Check-in Rules Modal (Admin) */}
      {rulesOpen && createPortal(
        <div
          className="fade-in modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.48)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setRulesOpen(false)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '920px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '24px',
              padding: '28px',
              background: 'var(--modal-bg, rgba(255, 255, 255, 0.95))',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '14px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  color: '#6366f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Settings2 size={21} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: 'var(--text-dark)' }}>
                    Check-in Rules
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    Choose who must check in. Exempt members are never marked absent.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setRulesOpen(false)}
                style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <X size={14} /> Close
              </button>
            </div>

            {rulesError && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#dc2626',
                fontSize: '12.5px',
                fontWeight: 600,
                marginBottom: '14px'
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{rulesError}</span>
              </div>
            )}

            {rulesNotice && !rulesError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#059669',
                fontSize: '12.5px',
                fontWeight: 600,
                marginBottom: '14px'
              }}>
                <CheckCircle2 size={16} />
                <span>{rulesNotice}</span>
              </div>
            )}

            {rulesLoading ? (
              <div style={{ textAlign: 'center', padding: '44px 0' }}>
                <RotateCcw size={24} className="spinning" style={{ color: 'var(--primary-color)', marginBottom: '8px' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading check-in settings...</p>
              </div>
            ) : rulesData?.ready === false ? (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '16px',
                borderRadius: '14px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#b45309',
                fontSize: '13px',
                fontWeight: 600
              }}>
                <Info size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Check-in settings are not available on the server yet. Please try again after the server update.</span>
              </div>
            ) : (
              <>
                <div style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '16px',
                  padding: '18px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <ShieldCheck size={16} style={{ color: '#6366f1' }} />
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: 'var(--text-dark)' }}>
                      Positions exempt from check-in
                    </h4>
                  </div>
                  <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Everyone in these positions is exempt unless their personal rule is set to Required.
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    {exemptDraft.length === 0 ? (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No exempt positions. Every team member checks in.
                      </span>
                    ) : exemptDraft.map((position) => (
                      <span
                        key={position}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '14px',
                          background: 'rgba(99, 102, 241, 0.12)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          color: '#6366f1',
                          fontSize: '12px',
                          fontWeight: 700
                        }}
                      >
                        {position}
                        <button
                          type="button"
                          onClick={() => setExemptDraft((prev) => prev.filter((p) => p !== position))}
                          title={`Remove ${position}`}
                          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: '#6366f1', display: 'inline-flex' }}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    <input
                      type="text"
                      value={newExemptPosition}
                      maxLength={40}
                      list="tc-attendance-positions"
                      onChange={(e) => setNewExemptPosition(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addExemptPosition(newExemptPosition);
                        }
                      }}
                      placeholder="Type a position, e.g. Manager"
                      className="input"
                      style={{
                        flex: '1 1 220px',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        background: 'var(--glass-card-bg)',
                        border: '1px solid var(--glass-border)',
                        fontSize: '13px'
                      }}
                    />
                    <datalist id="tc-attendance-positions">
                      {(rulesData?.positions || []).map((p) => <option key={p} value={p} />)}
                    </datalist>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => addExemptPosition(newExemptPosition)}
                      style={{ padding: '9px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <Plus size={14} /> Add
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleSaveExempt}
                      disabled={savingExempt}
                      style={{ padding: '9px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Save size={14} /> {savingExempt ? 'Saving...' : 'Save Positions'}
                    </button>
                  </div>

                  {(rulesData?.positions || []).filter((p) => !exemptDraft.some((e) => e.toLowerCase() === p.toLowerCase())).length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Suggestions:</span>
                      {(rulesData?.positions || [])
                        .filter((p) => !exemptDraft.some((e) => e.toLowerCase() === p.toLowerCase()))
                        .map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => addExemptPosition(p)}
                            style={{
                              padding: '3px 9px',
                              borderRadius: '10px',
                              border: '1px solid var(--glass-border)',
                              background: 'var(--glass-card-bg)',
                              color: 'var(--text-muted)',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            + {p}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: 'var(--text-dark)' }}>
                      Team members
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                      Auto follows the exempt list. Required overrides an exempt position.
                    </p>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {(rulesData?.members || []).length} member{(rulesData?.members || []).length === 1 ? '' : 's'}
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '640px' }}>
                    {(rulesData?.members || []).map((m) => {
                      const draft = memberDrafts[m.user_id] || { position: m.position || '', rule: m.rule || 'auto' };
                      const effectiveRequired = draft.rule === 'required' || (
                        draft.rule !== 'exempt' &&
                        !exemptDraft.some((p) => p.toLowerCase() === String(draft.position || '').trim().toLowerCase())
                      );
                      return (
                        <div
                          key={m.user_id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(170px, 1fr) minmax(150px, 0.9fr) 132px 96px',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            borderRadius: '12px',
                            background: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)'
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {m.username}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {m.email}
                            </div>
                          </div>
                          <input
                            type="text"
                            value={draft.position || ''}
                            maxLength={40}
                            list="tc-attendance-positions"
                            placeholder="Position"
                            onChange={(e) => {
                              const value = e.target.value;
                              setMemberDrafts((prev) => ({
                                ...prev,
                                [m.user_id]: { ...(prev[m.user_id] || { rule: 'auto' }), position: value }
                              }));
                            }}
                            className="input"
                            style={{
                              padding: '7px 10px',
                              borderRadius: '8px',
                              background: 'var(--glass-card-bg)',
                              border: '1px solid var(--glass-border)',
                              fontSize: '12px',
                              minWidth: 0
                            }}
                          />
                          <select
                            value={draft.rule || 'auto'}
                            onChange={(e) => {
                              const value = e.target.value;
                              setMemberDrafts((prev) => ({
                                ...prev,
                                [m.user_id]: { ...(prev[m.user_id] || { position: '' }), rule: value }
                              }));
                            }}
                            className="input"
                            style={{
                              padding: '7px 8px',
                              borderRadius: '8px',
                              background: 'var(--glass-card-bg)',
                              border: '1px solid var(--glass-border)',
                              fontSize: '12px',
                              fontWeight: 600
                            }}
                          >
                            <option value="auto">Auto</option>
                            <option value="required">Required</option>
                            <option value="exempt">Exempt</option>
                          </select>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => handleSaveMemberRules(m)}
                            disabled={savingMemberId === m.user_id}
                            title={effectiveRequired ? 'This member must check in' : 'This member is exempt'}
                            style={{
                              padding: '7px 8px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: effectiveRequired ? '#059669' : '#6366f1',
                              borderColor: effectiveRequired ? 'rgba(16, 185, 129, 0.35)' : 'rgba(99, 102, 241, 0.35)'
                            }}
                          >
                            {savingMemberId === m.user_id ? 'Saving...' : effectiveRequired ? 'Checks in' : 'Exempt'}
                          </button>
                        </div>
                      );
                    })}
                    {(rulesData?.members || []).length === 0 && (
                      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                        No team members found.
                      </div>
                    )}
                  </div>
                </div>

                <p style={{ margin: '14px 0 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  The button on each row saves that member's position and rule. The status shown previews the effective rule.
                </p>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Range Summary Modal (Admin) */}
      {summaryOpen && createPortal(
        <div
          className="fade-in modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.48)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setSummaryOpen(false)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '1080px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '24px',
              padding: '28px',
              background: 'var(--modal-bg, rgba(255, 255, 255, 0.95))',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '14px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CalendarRange size={21} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: 'var(--text-dark)' }}>
                    Attendance Range Summary
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    Present days, hours, approved leave and absences for every team member.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSummaryOpen(false)}
                style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <X size={14} /> Close
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                From
                <input
                  type="date"
                  value={summaryFrom}
                  max={summaryTo}
                  onChange={(e) => setSummaryFrom(e.target.value)}
                  className="input"
                  style={{ padding: '7px 10px', borderRadius: '9px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', fontSize: '12px', fontWeight: 600 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                To
                <input
                  type="date"
                  value={summaryTo}
                  min={summaryFrom}
                  max={istToday()}
                  onChange={(e) => setSummaryTo(e.target.value)}
                  className="input"
                  style={{ padding: '7px 10px', borderRadius: '9px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', fontSize: '12px', fontWeight: 600 }}
                />
              </label>
              <button
                type="button"
                className="btn-primary"
                onClick={() => loadSummary(summaryFrom, summaryTo)}
                disabled={summaryLoading || !summaryFrom || !summaryTo}
                style={{ padding: '8px 16px', borderRadius: '9px', fontSize: '12px', fontWeight: 700 }}
              >
                {summaryLoading ? 'Loading...' : 'Apply Range'}
              </button>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[7, 30, 90].map((days) => (
                  <button
                    key={days}
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      const from = istDaysAgo(days - 1);
                      const to = istToday();
                      setSummaryFrom(from);
                      setSummaryTo(to);
                      loadSummary(from, to);
                    }}
                    style={{ padding: '8px 10px', borderRadius: '9px', fontSize: '11px', fontWeight: 600 }}
                  >
                    {days}d
                  </button>
                ))}
              </div>
            </div>

            {summaryError && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#dc2626',
                fontSize: '12.5px',
                fontWeight: 600,
                marginBottom: '14px'
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{summaryError}</span>
              </div>
            )}

            {summaryLoading ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <RotateCcw size={24} className="spinning" style={{ color: 'var(--primary-color)', marginBottom: '8px' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Building range summary...</p>
              </div>
            ) : summaryData ? (() => {
              const members = summaryData.members || [];
              const totalMinutes = members.reduce((a, m) => a + (m.total_minutes || 0), 0);
              const totalPresent = members.reduce((a, m) => a + (m.present_days || 0), 0);
              const totalLeave = members.reduce((a, m) => a + (m.leave_days || 0), 0);
              const totalAbsent = members.reduce((a, m) => a + (m.absent_days || 0), 0);
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                      {summaryData.from} to {summaryData.to}{summaryData.company ? ` · ${summaryData.company}` : ''}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Today: {summaryData.today}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                    {[
                      { label: 'Total Hours', value: formatMinutes(totalMinutes), color: '#10b981' },
                      { label: 'Present Days', value: totalPresent, color: 'var(--text-dark)' },
                      { label: 'Leave Days', value: Math.round(totalLeave * 10) / 10, color: '#6366f1' },
                      { label: 'Absent Days', value: totalAbsent, color: '#f59e0b' },
                    ].map((stat) => (
                      <div key={stat.label} style={{
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '12px',
                        padding: '12px 14px'
                      }}>
                        <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.3px' }}>{stat.label}</div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: stat.color, marginTop: '2px' }}>{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="table-responsive" style={{ borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
                    <table className="data-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th>Member</th>
                          <th>Position</th>
                          <th>Rule</th>
                          <th style={{ textAlign: 'right' }}>Present</th>
                          <th style={{ textAlign: 'right' }}>Leave</th>
                          <th style={{ textAlign: 'right' }}>Absent</th>
                          <th style={{ textAlign: 'right' }}>Hours</th>
                          <th style={{ textAlign: 'right' }}>Avg / Day</th>
                          <th style={{ textAlign: 'right' }}>Avg In</th>
                          <th style={{ textAlign: 'right' }}>Avg Out</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((m) => (
                          <tr key={m.user_id} style={{ background: m.required === false ? 'rgba(99, 102, 241, 0.04)' : undefined }}>
                            <td>
                              <strong style={{ color: 'var(--text-dark)', fontSize: '13px' }}>{m.username}</strong>
                              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>{m.email}</span>
                            </td>
                            <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.position || '—'}</td>
                            <td>
                              <span style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '10px',
                                fontWeight: 700,
                                background: m.required === false ? 'rgba(99, 102, 241, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                                color: m.required === false ? '#6366f1' : '#059669'
                              }}>
                                {m.required === false ? 'Exempt' : 'Required'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{m.present_days || 0}<span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>/{m.working_days || 0}</span></td>
                            <td style={{ textAlign: 'right', color: '#6366f1', fontWeight: 600 }}>{m.leave_days || 0}</td>
                            <td style={{ textAlign: 'right', color: m.absent_days ? '#f59e0b' : 'var(--text-muted)', fontWeight: 600 }}>{m.required === false ? '—' : (m.absent_days || 0)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 800, color: '#10b981' }}>{formatMinutes(m.total_minutes)}</td>
                            <td style={{ textAlign: 'right' }}>{formatMinutes(m.avg_minutes)}</td>
                            <td style={{ textAlign: 'right' }}>{m.avg_in || '—'}</td>
                            <td style={{ textAlign: 'right' }}>{m.avg_out || '—'}</td>
                          </tr>
                        ))}
                        {members.length === 0 && (
                          <tr>
                            <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                              No team members found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <p style={{ margin: '12px 0 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    Present shows checked-in days out of working days. Approved leave is counted on working days only; exempt members are never marked absent.
                  </p>
                </>
              );
            })() : (
              <p style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                Choose a date range and apply it to see attendance totals.
              </p>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Summary Cards Context Menu */}
      {summaryContextMenu && createPortal(
        <div
          className="dashboard-context-menu-scrim"
          onClick={() => setSummaryContextMenu(null)}
          onContextMenu={(e) => { e.preventDefault(); setSummaryContextMenu(null); }}
        >
          <div
            className="dashboard-context-menu glass-panel"
            style={{
              position: 'fixed',
              left: `${Math.min(summaryContextMenu.x, window.innerWidth - 180)}px`,
              top: `${Math.min(summaryContextMenu.y, window.innerHeight - 200)}px`,
              zIndex: 99999
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '6px 12px 4px', borderBottom: '1px solid var(--glass-border)', fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>
              {summaryContextMenu.card.name}
            </div>
            <button type="button" onClick={() => toggleSummaryPin(summaryContextMenu.card.id)}>
              <Pin size={14} />
              <span>{summaryPinned.includes(summaryContextMenu.card.id) ? 'Unpin' : 'Pin to Top'}</span>
            </button>
            <button type="button" onClick={() => handleSummaryHide(summaryContextMenu.card)}>
              <EyeOff size={14} />
              <span>Hide Card</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Unhide Modal for Summary Cards */}
      <UnhideModal
        isOpen={showSummaryUnhideModal}
        onClose={() => setShowSummaryUnhideModal(false)}
        hiddenItems={rawSummaryDefs.filter((c) => summaryHidden.includes(c.id))}
        onUnhideOne={(id) => {
          setSummaryHidden((prev) => {
            const next = prev.filter((x) => x !== id);
            try { localStorage.setItem('tc_attendance_summary_hidden', JSON.stringify(next)); } catch {}
            return next;
          });
        }}
        onUnhideAll={() => {
          setSummaryHidden([]);
          try { localStorage.removeItem('tc_attendance_summary_hidden'); } catch {}
        }}
        title="Hidden Attendance Metrics"
      />
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle2, AlertCircle, Play, Square, MoreVertical, Pin, Users, ChevronRight, LogIn, LogOut, ArrowRight, ShieldCheck } from 'lucide-react';
import { getAttendanceMe, attendanceCheckIn, attendanceCheckOut, attendancePing, getAttendanceTeam } from './api';

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

export default function DashboardAttendanceCard({
  user,
  onOpenAttendance,
  draggable,
  isDragging,
  isDragOver,
  isPinned,
  onOptionsClick,
  className = '',
  style = {},
  ...props
}) {
  const isAdmin = user?.role === 'ADMIN';

  // Member state
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Admin state
  const [teamData, setTeamData] = useState(null);

  // Load attendance data
  const loadData = async () => {
    try {
      if (isAdmin) {
        const res = await getAttendanceTeam();
        if (res?.success) setTeamData(res);
      } else {
        const res = await getAttendanceMe();
        if (res?.success) {
          setMemberData(res);
          if (res.open?.check_in_at) {
            const start = new Date(res.open.check_in_at).getTime();
            setElapsedSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
          }
        }
      }
    } catch (err) {
      console.warn('Dashboard attendance fetch notice:', err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin]);

  // Live timer for active check-in
  useEffect(() => {
    if (isAdmin || !memberData?.open?.check_in_at) return;
    const interval = setInterval(() => {
      const start = new Date(memberData.open.check_in_at).getTime();
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [isAdmin, memberData?.open?.check_in_at]);

  // Periodic heartbeat / ping when checked in
  useEffect(() => {
    if (isAdmin || !memberData?.open) return;
    const pingInterval = setInterval(() => {
      attendancePing().catch(() => {});
    }, 90000); // every 90s
    return () => clearInterval(pingInterval);
  }, [isAdmin, memberData?.open]);

  const handleCheckIn = async (e) => {
    e?.stopPropagation();
    setSubmitting(true);
    try {
      const idempotency_key = `chk_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const res = await attendanceCheckIn({ note: note.trim() || undefined, idempotency_key });
      if (res?.success) {
        setNote('');
        setShowNoteInput(false);
        await loadData();
      }
    } catch (err) {
      alert(err?.message || 'Check-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async (e) => {
    e?.stopPropagation();
    if (!window.confirm('Check out from today’s work session?')) return;
    setSubmitting(true);
    try {
      const res = await attendanceCheckOut({ note: note.trim() || undefined });
      if (res?.success) {
        setNote('');
        setShowNoteInput(false);
        await loadData();
      }
    } catch (err) {
      alert(err?.message || 'Check-out failed');
    } finally {
      setSubmitting(false);
    }
  };

  const memberStatus = memberData?.exempt ? 'exempt' : (memberData?.status || 'absent');
  const isOpen = !!memberData?.open;

  const statusConfig = {
    active: { label: 'Active', bg: 'rgba(16, 185, 129, 0.14)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
    idle: { label: 'Idle', bg: 'rgba(245, 158, 11, 0.14)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
    checked_out: { label: 'Checked Out', bg: 'rgba(59, 130, 246, 0.14)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
    absent: { label: 'Not Checked In', bg: 'rgba(148, 163, 184, 0.14)', color: 'var(--text-muted)', border: 'rgba(148, 163, 184, 0.25)' },
    exempt: { label: 'Exempt', bg: 'rgba(99, 102, 241, 0.14)', color: '#6366f1', border: 'rgba(99, 102, 241, 0.3)' },
  };

  const currentCfg = statusConfig[memberStatus] || statusConfig.absent;

  return (
    <div
      className={`glass-panel draggable-card ${className}`}
      draggable={draggable}
      style={{
        position: 'relative',
        padding: '24px',
        borderRadius: '20px',
        marginBottom: '28px',
        transition: 'all 0.2s ease',
        ...style
      }}
      {...props}
    >
      {isPinned && (
        <span className="pinned-badge" title="Pinned Attendance Card">
          <Pin size={11} />
        </span>
      )}

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-dark)' }}>
                {isAdmin ? 'Team Attendance Roster' : 'My Work Attendance'}
              </h3>
              {!isAdmin && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 9px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: currentCfg.bg,
                  color: currentCfg.color,
                  border: `1px solid ${currentCfg.border}`
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: currentCfg.color,
                    boxShadow: memberStatus === 'active' ? `0 0 6px ${currentCfg.color}` : 'none',
                    animation: memberStatus === 'active' ? 'pulse 1.4s infinite ease-in-out' : 'none'
                  }} />
                  {currentCfg.label}
                </span>
              )}
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
              {isAdmin
                ? `${teamData?.counts?.total || 0} team members registered • India IST`
                : memberData?.exempt
                  ? `${memberData?.date || 'Today'} • Check-in not required${memberData?.position ? ` (${memberData.position})` : ''}`
                  : `${memberData?.date || 'Today'} • Track daily work hours and check-ins`}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onOptionsClick && (
            <button
              type="button"
              className="tile-menu-btn"
              title="Attendance Card Options"
              onClick={(e) => {
                e.stopPropagation();
                onOptionsClick(e);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                borderRadius: '6px'
              }}
            >
              <MoreVertical size={16} />
            </button>
          )}

          <button
            type="button"
            className="btn-secondary"
            onClick={onOpenAttendance}
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700
            }}
          >
            <span>{isAdmin ? 'Team Details' : 'Full History'}</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Member Exempt Notice */}
      {!isAdmin && memberData?.exempt && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          background: 'rgba(99, 102, 241, 0.1)',
          padding: '18px',
          borderRadius: '16px',
          border: '1px solid rgba(99, 102, 241, 0.3)'
        }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'rgba(99, 102, 241, 0.15)',
            color: '#6366f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-dark)' }}>
              Check-in not required
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {memberData?.position ? `Your position (${memberData.position}) is exempt.` : 'Your attendance rule is exempt.'} You can still view your history below.
            </div>
          </div>
        </div>
      )}

      {/* Member Punch Clock View */}
      {!isAdmin && !memberData?.exempt && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          alignItems: 'center',
          background: 'var(--glass-bg)',
          padding: '18px',
          borderRadius: '16px',
          border: '1px solid var(--glass-border)'
        }}>
          {/* Status & Timer */}
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700, color: 'var(--text-muted)' }}>
              {isOpen ? 'Current Session Duration' : 'Total Work Time Today'}
            </span>
            <div style={{
              fontSize: '28px',
              fontWeight: 900,
              color: isOpen ? '#10b981' : 'var(--text-dark)',
              letterSpacing: '-0.5px',
              fontVariantNumeric: 'tabular-nums',
              margin: '4px 0'
            }}>
              {isOpen ? formatDuration(elapsedSeconds) : `${Math.floor((memberData?.total_minutes || 0) / 60)}h ${(memberData?.total_minutes || 0) % 60}m`}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {isOpen ? (
                <span>Checked in at <strong>{formatTime12(memberData?.open?.check_in_at)}</strong></span>
              ) : memberData?.sessions?.length > 0 ? (
                <span>{memberData.sessions.length} session{memberData.sessions.length > 1 ? 's' : ''} logged today</span>
              ) : (
                <span>Ready to start work</span>
              )}
            </div>
          </div>

          {/* Action Button & Note Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {showNoteInput && (
              <input
                type="text"
                placeholder={isOpen ? "Session closing note (optional)..." : "Work note / task (optional)..."}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={300}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass-card-bg)',
                  color: 'var(--text-dark)',
                  fontSize: '13px'
                }}
              />
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              {!isOpen ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleCheckIn}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontWeight: 700,
                    fontSize: '14px'
                  }}
                >
                  <LogIn size={16} />
                  <span>{submitting ? 'Checking In...' : 'Check In'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCheckOut}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontWeight: 700,
                    fontSize: '14px'
                  }}
                >
                  <LogOut size={16} />
                  <span>{submitting ? 'Checking Out...' : 'Check Out'}</span>
                </button>
              )}

              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowNoteInput(!showNoteInput)}
                title="Add work note"
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                {showNoteInput ? 'Cancel Note' : 'Add Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Team Roster Summary */}
      {isAdmin && (
        <div>
          {/* Quick Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              background: 'var(--glass-bg)',
              padding: '12px 14px',
              borderRadius: '14px',
              border: '1px solid var(--glass-border)'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Present / Active</span>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#10b981', margin: '2px 0' }}>
                {teamData?.counts?.active || 0}
              </div>
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>Working right now</span>
            </div>

            <div style={{
              background: 'var(--glass-bg)',
              padding: '12px 14px',
              borderRadius: '14px',
              border: '1px solid var(--glass-border)'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Idle</span>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#f59e0b', margin: '2px 0' }}>
                {teamData?.counts?.idle || 0}
              </div>
              <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>&gt;15m inactive</span>
            </div>

            <div style={{
              background: 'var(--glass-bg)',
              padding: '12px 14px',
              borderRadius: '14px',
              border: '1px solid var(--glass-border)'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Checked Out</span>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#3b82f6', margin: '2px 0' }}>
                {teamData?.counts?.checked_out || 0}
              </div>
              <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 600 }}>Finished shift</span>
            </div>

            <div style={{
              background: 'var(--glass-bg)',
              padding: '12px 14px',
              borderRadius: '14px',
              border: '1px solid var(--glass-border)'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Absent</span>
              <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-muted)', margin: '2px 0' }}>
                {teamData?.counts?.absent || 0}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>No check-in today</span>
            </div>

            <div style={{
              background: 'var(--glass-bg)',
              padding: '12px 14px',
              borderRadius: '14px',
              border: '1px solid var(--glass-border)'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Exempt</span>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#6366f1', margin: '2px 0' }}>
                {teamData?.counts?.exempt || 0}
              </div>
              <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: 600 }}>No check-in required</span>
            </div>
          </div>

          {/* Member chips preview */}
          {teamData?.members && teamData.members.length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginRight: '4px' }}>
                Active Members:
              </span>
              {teamData.members.slice(0, 8).map((m) => {
                const s = statusConfig[m.status] || statusConfig.absent;
                return (
                  <div
                    key={m.user_id}
                    onClick={onOpenAttendance}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '16px',
                      background: 'var(--glass-bg)',
                      border: `1px solid ${s.border}`,
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-dark)',
                      cursor: 'pointer'
                    }}
                    title={`${m.username} (${m.email}): ${s.label}`}
                  >
                    <span style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: s.color
                    }} />
                    <span>{m.username}</span>
                  </div>
                );
              })}
              {teamData.members.length > 8 && (
                <span style={{ fontSize: '12px', color: 'var(--primary-color)', fontWeight: 600, cursor: 'pointer' }} onClick={onOpenAttendance}>
                  +{teamData.members.length - 8} more
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

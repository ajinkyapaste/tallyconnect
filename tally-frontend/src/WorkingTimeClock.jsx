import React, { useState, useEffect } from 'react';
import { Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { resolveAvatarUrl } from './api';

/**
 * WorkingTimeClock
 * A live, precision working-time clock component styled with liquid glassmorphic UI/UX.
 * Ticks synchronously every 1,000ms.
 *
 * Supported modes:
 * - 'pill': Unified Account & Clock capsule pill matching user screenshot: [ 🕒 17:55 (User Avatar Image) ]
 * - 'compact': Mini sub-pill for placement directly under account trigger
 * - 'banner': Full working session card placed inside Account Menu dropdown
 */
export default function WorkingTimeClock({ mode = 'pill', user, onClick, onNavigate }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Synchronize to the start of the next second
    const msUntilNextSecond = 1000 - (Date.now() % 1000);
    let intervalId;

    const timeoutId = setTimeout(() => {
      setNow(new Date());
      intervalId = setInterval(() => {
        setNow(new Date());
      }, 1000);
    }, msUntilNextSecond);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const hours24 = now.getHours();
  const hours24Str = String(hours24).padStart(2, '0');
  const hours12 = String(hours24 % 12 || 12).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ampm = hours24 >= 12 ? 'PM' : 'AM';

  const dayShort = now.toLocaleDateString('en-US', { weekday: 'short' });
  const dayFull = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateNum = now.getDate();
  const monthShort = now.toLocaleDateString('en-US', { month: 'short' });
  const monthFull = now.toLocaleDateString('en-US', { month: 'long' });
  const year = now.getFullYear();

  // Mode: Pill — Unified Account Pill with Clock + Avatar (matches user screenshot)
  if (mode === 'pill') {
    return (
      <div
        className="account-clock-pill user-menu-trigger"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (onClick) onClick();
          }
        }}
        title={`Working Time: ${hours24Str}:${minutes}:${seconds} (${dayFull}, ${dateNum} ${monthFull})\nAccount: ${user?.name || user?.username || 'User'} (${user?.role || 'User'})\nClick to open Account Menu`}
      >
        {/* Left: Clock section */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Clock
            size={14}
            style={{
              color: 'var(--primary-color, #6366f1)',
              opacity: 0.95,
              flexShrink: 0
            }}
          />
          <span
            style={{
              fontSize: '13.5px',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--text-dark, #0f172a)',
              letterSpacing: '-0.2px',
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            {hours24Str}:{minutes}
          </span>
        </div>

        {/* Right: Avatar section */}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          {user?.avatar_url ? (
            <img
              src={resolveAvatarUrl(user.avatar_url)}
              alt={user.username || 'User'}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1.5px solid rgba(255, 255, 255, 0.9)',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)'
              }}
            />
          ) : (
            <span
              className="user-avatar"
              style={{
                width: '30px',
                height: '30px',
                fontSize: '13px',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)'
              }}
            >
              {String(user?.username || 'T').charAt(0).toUpperCase()}
            </span>
          )}
          {user?.role === 'ADMIN' && (
            <span
              className="admin-dot"
              title="Administrator"
              style={{
                width: '9px',
                height: '9px',
                bottom: '-1px',
                right: '-1px'
              }}
            />
          )}
        </div>
      </div>
    );
  }

  // Mode: Compact — Sub-pill
  if (mode === 'compact') {
    return (
      <div
        className="working-time-clock-compact"
        onClick={() => onNavigate && onNavigate('attendance')}
        title={`Working Time: ${hours12}:${minutes}:${seconds} ${ampm} (${dayFull}, ${dateNum} ${monthFull} ${year})\nClick to open Attendance & Timesheet`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '2px 8px',
          borderRadius: '12px',
          background: 'var(--glass-bg, rgba(255, 255, 255, 0.75))',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.08))',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
          cursor: onNavigate ? 'pointer' : 'default',
          userSelect: 'none',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          whiteSpace: 'nowrap'
        }}
      >
        <span
          className="clock-live-dot"
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 6px rgba(16, 185, 129, 0.8)',
            display: 'inline-block',
            flexShrink: 0,
            animation: 'liveDotPulse 2s infinite ease-in-out'
          }}
        />
        <Clock size={11} style={{ color: 'var(--text-muted, #64748b)', flexShrink: 0 }} />
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--text-dark, #0f172a)',
            letterSpacing: '0.2px'
          }}
        >
          {hours12}:{minutes}
          <span style={{ opacity: 0.65, fontSize: '10px', marginLeft: '1px' }}>:{seconds}</span>
          <span style={{ fontSize: '9.5px', fontWeight: 800, color: 'var(--primary-color, #2563eb)', marginLeft: '3px' }}>
            {ampm}
          </span>
        </span>
        <span
          className="clock-date-tag"
          style={{
            fontSize: '10px',
            fontWeight: 600,
            color: 'var(--text-muted, #64748b)',
            borderLeft: '1px solid var(--glass-border, rgba(0,0,0,0.1))',
            paddingLeft: '5px',
            marginLeft: '1px'
          }}
        >
          {dayShort}, {dateNum} {monthShort}
        </span>
      </div>
    );
  }

  // Mode: Banner — Expanded card inside Account Menu dropdown
  return (
    <div
      className="working-time-clock-banner"
      style={{
        padding: '10px 14px',
        margin: '6px 10px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)',
        border: '1px solid rgba(37, 99, 235, 0.12)',
        boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 6px #10b981',
              animation: 'liveDotPulse 2s infinite ease-in-out'
            }}
          />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Live Work Session
          </span>
        </div>
        <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>
          IST (UTC+5:30)
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
        <span
          style={{
            fontSize: '18px',
            fontWeight: 800,
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--text-dark, #0f172a)',
            letterSpacing: '-0.3px'
          }}
        >
          {hours24Str}:{minutes}:{seconds}
        </span>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--primary-color, #2563eb)'
          }}
        >
          ({ampm})
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted, #64748b)', marginTop: '1px' }}>
        <Calendar size={12} style={{ opacity: 0.8 }} />
        <span>{dayFull}, {dateNum} {monthFull} {year}</span>
      </div>
    </div>
  );
}

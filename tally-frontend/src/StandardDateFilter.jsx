import React, { useState, useEffect } from 'react';
import { Calendar, X, AlertCircle } from 'lucide-react';

/**
 * Standard Date Filter Options:
 * 1. All Time
 * 2. Last 1 Year
 * 3. Last 3 Months
 * 4. Last 1 Month
 * 5. Last 7 Days
 * 6. 1 Day (Today)
 * 7. Custom Date Range
 */
export const DATE_FILTER_OPTIONS = [
  { id: 'all', label: 'All Time' },
  { id: '1year', label: 'Last 1 Year' },
  { id: '3months', label: 'Last 3 Months' },
  { id: '1month', label: 'Last 1 Month' },
  { id: '7days', label: 'Last 7 Days' },
  { id: '1day', label: '1 Day' },
  { id: 'custom', label: 'Custom Range' }
];

/**
 * Helper to check if a date string falls within the selected date range.
 * Consistently handles boundaries, timezones, and custom date range validation.
 */
export const isWithinStandardDateRange = (dateStr, filterId, customStart = '', customEnd = '') => {
  if (!dateStr || !filterId) return true;
  if (filterId === 'all' || filterId === 'all_time') return true;

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return true;

  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (filterId === '1day' || filterId === 'today') {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return d >= startOfToday && d <= endOfToday;
  }

  if (filterId === '7days' || filterId === 'week') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0, 0);
    return d >= start && d <= endOfToday;
  }

  if (filterId === '1month' || filterId === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate(), 0, 0, 0, 0);
    return d >= start && d <= endOfToday;
  }

  if (filterId === '3months') {
    const start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate(), 0, 0, 0, 0);
    return d >= start && d <= endOfToday;
  }

  if (filterId === '1year' || filterId === 'year') {
    const start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return d >= start && d <= endOfToday;
  }

  if (filterId === 'custom') {
    const start = customStart ? new Date(customStart + 'T00:00:00') : new Date(0);
    const end = customEnd ? new Date(customEnd + 'T23:59:59.999') : new Date(8640000000000000);
    return d >= start && d <= end;
  }

  return true;
};

/**
 * Get human-readable description of active filter
 */
export const getStandardDateRangeLabel = (filterId, customStart = '', customEnd = '') => {
  if (filterId === 'all' || filterId === 'all_time') return 'All Time';
  if (filterId === '1day' || filterId === 'today') return 'Today (1 Day)';
  if (filterId === 'custom') {
    if (customStart && customEnd) return `${customStart} to ${customEnd}`;
    if (customStart) return `From ${customStart}`;
    if (customEnd) return `Until ${customEnd}`;
    return 'Custom Range';
  }
  const opt = DATE_FILTER_OPTIONS.find(o => o.id === filterId);
  return opt ? opt.label : 'All Dates';
};

/**
 * StandardDateFilter Component
 * Renders consistent date-filter pill controls across all relevant pages.
 * Supports both value/onChange and activeFilter/onFilterChange props.
 */
export const StandardDateFilter = ({
  value,
  activeFilter,
  onChange,
  onFilterChange,
  customStart = '',
  customEnd = '',
  onCustomStartChange,
  onCustomEndChange,
  onCustomChange,
  className = '',
  style = {}
}) => {
  // Support either value or activeFilter prop seamlessly
  const currentFilter = value !== undefined ? value : (activeFilter || '1year');

  const triggerFilterChange = (filterId) => {
    if (typeof onChange === 'function') onChange(filterId);
    if (typeof onFilterChange === 'function') onFilterChange(filterId);
  };

  const [localStart, setLocalStart] = useState(customStart);
  const [localEnd, setLocalEnd] = useState(customEnd);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    setLocalStart(customStart);
  }, [customStart]);

  useEffect(() => {
    setLocalEnd(customEnd);
  }, [customEnd]);

  const handleStartChange = (val) => {
    setLocalStart(val);
    if (localEnd && val && new Date(val) > new Date(localEnd)) {
      setValidationError('Start date cannot be after end date');
      return;
    }
    setValidationError('');
    if (typeof onCustomStartChange === 'function') onCustomStartChange(val);
    if (typeof onCustomChange === 'function') onCustomChange(val, localEnd);
  };

  const handleEndChange = (val) => {
    setLocalEnd(val);
    if (localStart && val && new Date(localStart) > new Date(val)) {
      setValidationError('End date cannot precede start date');
      return;
    }
    setValidationError('');
    if (typeof onCustomEndChange === 'function') onCustomEndChange(val);
    if (typeof onCustomChange === 'function') onCustomChange(localStart, val);
  };

  return (
    <div className={`standard-date-filter-container ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', maxWidth: '100%', minWidth: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginRight: '4px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>
          <Calendar size={14} style={{ color: 'var(--primary-color)' }} />
          <span>Period:</span>
        </div>

        <div className="seg-control date-filter-pills" style={{ display: 'inline-flex', maxWidth: '100%', overflowX: 'auto', background: 'var(--glass-bg, rgba(255,255,255,0.75))', padding: '3px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          {DATE_FILTER_OPTIONS.map((opt) => {
            const isActive = currentFilter === opt.id ||
              (opt.id === '1day' && currentFilter === 'today') ||
              (opt.id === '1month' && currentFilter === 'month') ||
              (opt.id === '1year' && currentFilter === 'year');
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => triggerFilterChange(opt.id)}
                className={`seg-btn date-pill-btn ${isActive ? 'active' : ''}`}
                style={{
                  padding: '6px 12px',
                  borderRadius: '9px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: isActive ? 700 : 600,
                  cursor: 'pointer',
                  background: isActive ? 'var(--primary-color)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  boxShadow: isActive ? '0 2px 8px var(--primary-border)' : 'none',
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  whiteSpace: 'nowrap'
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Date Range Pickers (shown when 'custom' is active) */}
      {currentFilter === 'custom' && (
        <div className="custom-date-inputs-card fade-in" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          background: 'var(--glass-bg, rgba(255,255,255,0.85))',
          padding: '8px 14px',
          borderRadius: '12px',
          border: '1px solid var(--glass-border)',
          marginTop: '2px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="custom-date-start" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>From:</label>
            <input
              id="custom-date-start"
              type="date"
              value={localStart}
              onChange={(e) => handleStartChange(e.target.value)}
              style={{
                padding: '5px 8px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                background: 'var(--glass-card-bg, rgba(255,255,255,0.9))',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-dark)',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="custom-date-end" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>To:</label>
            <input
              id="custom-date-end"
              type="date"
              value={localEnd}
              min={localStart || undefined}
              onChange={(e) => handleEndChange(e.target.value)}
              style={{
                padding: '5px 8px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                background: 'var(--glass-card-bg, rgba(255,255,255,0.9))',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-dark)',
                outline: 'none'
              }}
            />
          </div>

          {(localStart || localEnd) && (
            <button
              type="button"
              onClick={() => {
                setLocalStart('');
                setLocalEnd('');
                setValidationError('');
                if (typeof onCustomStartChange === 'function') onCustomStartChange('');
                if (typeof onCustomEndChange === 'function') onCustomEndChange('');
                if (typeof onCustomChange === 'function') onCustomChange('', '');
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '12px',
                padding: '4px'
              }}
              title="Reset custom range"
            >
              <X size={14} /> Clear
            </button>
          )}

          {validationError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--danger, #ef4444)', fontSize: '12px', fontWeight: 600 }}>
              <AlertCircle size={13} />
              <span>{validationError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StandardDateFilter;

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search, X } from 'lucide-react';

/**
 * GlassSelect
 * A luxurious, liquid glassmorphic dropdown selector component.
 * Replaces harsh native browser selects with an Apple/Bitrix-inspired glass popover.
 * Features:
 * - Full light & dark theme compatibility
 * - Built-in instant search for long lists
 * - Floating portal rendering to prevent clipping inside cards/modals
 * - Clean glass scrollbars and smooth hover transitions
 */
export default function GlassSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  disabled = false,
  searchable = true,
  icon = null,
  className = '',
  style = {},
  triggerStyle = {},
  menuWidth = null,
  maxHeight = 300,
  zIndex = 100050,
  id = undefined
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  // Normalize options array into [{ value, label, icon, subtitle, group }]
  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          value: opt.value !== undefined ? opt.value : (opt.name || opt.ledger_name || ''),
          label: opt.label || opt.name || opt.ledger_name || String(opt.value || ''),
          subtitle: opt.subtitle || opt.parent_group || opt.parent || '',
          icon: opt.icon || null
        };
      }
      return {
        value: String(opt),
        label: String(opt),
        subtitle: '',
        icon: null
      };
    });
  }, [options]);

  const selectedOption = useMemo(() => {
    return normalizedOptions.find((o) => String(o.value) === String(value));
  }, [normalizedOptions, value]);

  // Update floating popover coordinates relative to trigger button
  const updateCoords = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const popHeight = Math.min(maxHeight, 360);
    const placeAbove = spaceBelow < popHeight && r.top > popHeight;

    setCoords({
      top: placeAbove ? r.top - 6 : r.bottom + 6,
      left: r.left,
      width: menuWidth || r.width,
      placeAbove
    });
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      const onResizeScroll = () => updateCoords();
      window.addEventListener('resize', onResizeScroll);
      window.addEventListener('scroll', onResizeScroll, true);
      return () => {
        window.removeEventListener('resize', onResizeScroll);
        window.removeEventListener('scroll', onResizeScroll, true);
      };
    }
  }, [isOpen, menuWidth, maxHeight]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return normalizedOptions;
    const q = search.toLowerCase();
    return normalizedOptions.filter((o) =>
      o.label.toLowerCase().includes(q) ||
      (o.subtitle && o.subtitle.toLowerCase().includes(q))
    );
  }, [normalizedOptions, search]);

  const handleSelect = (val) => {
    if (disabled) return;
    if (onChange) {
      onChange(val, val);
    }
    setIsOpen(false);
    setSearch('');
  };

  const isDarkMode = typeof document !== 'undefined' && (
    document.documentElement.getAttribute('data-theme') === 'dark' ||
    document.documentElement.getAttribute('data-dark-bg') === '1' ||
    document.documentElement.classList.contains('dark') ||
    document.body.classList.contains('dark')
  );

  return (
    <div
      className={`tc-glass-select-wrapper ${className}`}
      style={{ position: 'relative', width: '100%', ...style }}
      id={id}
    >
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setIsOpen(!isOpen);
          if (!isOpen) setSearch('');
        }}
        className="tc-glass-select-trigger"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '10px 14px',
          borderRadius: '14px',
          border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.1))',
          background: isDarkMode
            ? 'rgba(15, 23, 42, 0.72)'
            : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: isDarkMode
            ? '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.08)'
            : '0 2px 8px rgba(15, 23, 42, 0.04), inset 0 1px 1px rgba(255,255,255,0.9)',
          fontSize: '13.5px',
          fontWeight: 600,
          color: selectedOption
            ? (isDarkMode ? '#ffffff' : '#0f172a')
            : (isDarkMode ? '#94a3b8' : '#64748b'),
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          outline: 'none',
          transition: 'all 0.18s ease',
          textAlign: 'left',
          ...triggerStyle
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          {icon && <span style={{ flexShrink: 0, opacity: 0.85 }}>{icon}</span>}
          {selectedOption?.icon && <span style={{ flexShrink: 0 }}>{selectedOption.icon}</span>}
          <span style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1
          }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          size={14}
          style={{
            flexShrink: 0,
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
            opacity: 0.75,
            color: isDarkMode ? '#cbd5e1' : '#475569'
          }}
        />
      </button>

      {/* Floating Liquid Glass Dropdown Menu */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          className="tc-glass-select-popover slide-down"
          style={{
            position: 'fixed',
            top: coords.placeAbove ? 'auto' : `${coords.top}px`,
            bottom: coords.placeAbove ? `${window.innerHeight - coords.top}px` : 'auto',
            left: `${Math.max(8, coords.left)}px`,
            width: `${Math.min(window.innerWidth - 16, Math.max(180, coords.width))}px`,
            maxHeight: `${maxHeight}px`,
            zIndex: zIndex,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '16px',
            border: isDarkMode
              ? '1px solid rgba(255, 255, 255, 0.15)'
              : '1px solid rgba(255, 255, 255, 0.85)',
            background: isDarkMode
              ? 'rgba(15, 23, 42, 0.94)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(28px) saturate(200%)',
            WebkitBackdropFilter: 'blur(28px) saturate(200%)',
            boxShadow: isDarkMode
              ? '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)'
              : '0 16px 40px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            padding: '6px',
            overflow: 'hidden',
            boxSizing: 'border-box'
          }}
        >
          {/* Quick Search Bar if list has 5+ items */}
          {searchable && normalizedOptions.length > 5 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              marginBottom: '4px',
              borderRadius: '10px',
              background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.06)'
            }}>
              <Search size={13} style={{ color: isDarkMode ? '#94a3b8' : '#64748b', flexShrink: 0 }} />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: isDarkMode ? '#f8fafc' : '#0f172a'
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    border: 'none',
                    background: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: isDarkMode ? '#94a3b8' : '#64748b',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}

          {/* Options Scrollable List */}
          <div
            className="tc-glass-scroll"
            style={{
              overflowY: 'auto',
              maxHeight: `${maxHeight - 50}px`,
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              paddingRight: '2px'
            }}
          >
            {filteredOptions.length === 0 ? (
              <div style={{
                padding: '12px 8px',
                textAlign: 'center',
                fontSize: '12.5px',
                color: isDarkMode ? '#94a3b8' : '#64748b',
                fontWeight: 500
              }}>
                No matches found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`tc-glass-select-option ${isSelected ? 'selected' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: 'none',
                      background: isSelected
                        ? (isDarkMode ? 'rgba(59, 130, 246, 0.22)' : 'rgba(0, 122, 255, 0.12)')
                        : 'transparent',
                      color: isSelected
                        ? (isDarkMode ? '#60a5fa' : '#007aff')
                        : (isDarkMode ? '#e2e8f0' : '#1e293b'),
                      fontSize: '13px',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                      outline: 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = isDarkMode
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, paddingRight: '8px' }}>
                      <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: isSelected ? 700 : 600
                      }}>
                        {opt.label}
                      </span>
                      {opt.subtitle && (
                        <span style={{
                          fontSize: '11px',
                          color: isDarkMode ? '#94a3b8' : '#64748b',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {opt.subtitle}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check
                        size={14}
                        style={{
                          color: isDarkMode ? '#60a5fa' : '#007aff',
                          flexShrink: 0
                        }}
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

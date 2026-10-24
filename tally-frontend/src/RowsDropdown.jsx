import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * RowsDropdown Component
 * Matches the exact UI/UX design provided in the user's screenshots:
 * - Rounded pill input with crisp border and smooth blue focus ring
 * - Custom floating options popup with thin clean border and shadow
 * - Selected item highlighted in dark slate-grey with white text
 * - Unselected items with subtle hover highlights
 * - Supports automatic top/bottom positioning and outside-click dismiss
 */
export const RowsDropdown = ({
  value = 10,
  onChange,
  options = [10, 25, 50, 100],
  formatLabel = (v) => `${v} rows`,
  placement = 'auto', // 'auto' | 'top' | 'bottom'
  className = '',
  style = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const [calculatedPlacement, setCalculatedPlacement] = useState('bottom');

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);

      // Determine placement based on viewport if 'auto'
      if (placement === 'auto' && dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        if (spaceBelow < 180) {
          setCalculatedPlacement('top');
        } else {
          setCalculatedPlacement('bottom');
        }
      } else {
        setCalculatedPlacement(placement);
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, placement]);

  const effectivePlacement = placement === 'auto' ? calculatedPlacement : placement;

  return (
    <div
      ref={dropdownRef}
      className={`rows-dropdown-wrapper ${className}`}
      style={{
        position: 'relative',
        display: 'inline-block',
        ...style
      }}
    >
      {/* Trigger Pill Button matching Screenshot */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '4px 10px',
          minWidth: '70px',
          borderRadius: '10px',
          border: isOpen ? '1.5px solid #007aff' : '1.5px solid #93c5fd',
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          fontSize: '13px',
          fontWeight: 700,
          color: '#0f172a',
          cursor: 'pointer',
          boxShadow: isOpen
            ? '0 0 0 3px rgba(0, 122, 255, 0.22), 0 2px 6px rgba(0, 122, 255, 0.12)'
            : '0 1px 3px rgba(0, 0, 0, 0.06)',
          outline: 'none',
          transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{formatLabel ? formatLabel(value) : value}</span>
        <ChevronDown
          size={14}
          style={{
            color: '#0f172a',
            strokeWidth: 2.5,
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.18s ease',
            flexShrink: 0
          }}
        />
      </button>

      {/* Popover Floating Options List matching Screenshot 1 & Screenshot 2 */}
      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          style={{
            position: 'absolute',
            ...(effectivePlacement === 'top'
              ? { bottom: '100%', marginBottom: '4px' }
              : { top: '100%', marginTop: '4px' }),
            left: 0,
            minWidth: '100%',
            width: 'max-content',
            background: '#ffffff',
            border: '1px solid #71717a',
            borderRadius: '2px',
            boxShadow: '0 6px 18px rgba(0, 0, 0, 0.16)',
            zIndex: 99999,
            overflow: 'hidden',
            padding: '0',
            animation: 'fadeIn 0.12s ease-out'
          }}
        >
          {options.map((opt) => {
            const isSelected = Number(opt) === Number(value);
            return (
              <div
                key={opt}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange && onChange(Number(opt));
                  setIsOpen(false);
                }}
                style={{
                  padding: '7px 14px',
                  fontSize: '13px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  background: isSelected ? '#71717a' : 'transparent',
                  color: isSelected ? '#ffffff' : '#0f172a',
                  lineHeight: '1.3',
                  transition: 'background 0.12s ease, color 0.12s ease',
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = '#f1f5f9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {formatLabel ? formatLabel(opt) : opt}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RowsDropdown;

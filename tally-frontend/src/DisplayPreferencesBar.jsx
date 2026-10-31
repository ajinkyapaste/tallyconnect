import React, { useState } from 'react';
import { Sliders, LayoutGrid, Table, Eye, Check, ChevronDown } from 'lucide-react';
import { RowsDropdown } from './RowsDropdown';

/**
 * DisplayPreferencesBar Component
 * Renders user-controlled display preferences at the bottom of data list pages.
 * Supports:
 * - View mode toggle: Table View vs. Card View
 * - Card opacity control for card layouts
 * - Rows per page selection: 10, 25, 50, 100 matching screenshot UX
 * - Column visibility customization for tables
 * - Sorting preferences
 * - LocalStorage persistence per page
 */
export const DisplayPreferencesBar = ({
  storageKey = 'tc_display_prefs',
  viewMode = 'cards', // cards view standard
  onViewModeChange,
  pageSize = 10,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  sortBy = '',
  onSortByChange,
  sortOptions = [],
  availableColumns = [], // [{ id: 'col1', label: 'Column 1' }]
  hiddenColumns = [],
  onToggleColumn,
  cardOpacity,
  onCardOpacityChange,
  className = '',
  style = {}
}) => {
  const [showColMenu, setShowColMenu] = useState(false);

  // Eliminate table mode across the app in favor of modern Liquid Glass Cards
  React.useEffect(() => {
    if (viewMode === 'table' && onViewModeChange) {
      onViewModeChange('cards');
    }
  }, [viewMode, onViewModeChange]);

  const isCardMode = true;
  const isTableMode = false;

  return (
    <div
      className={`display-preferences-bar glass-panel ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '10px 16px',
        borderRadius: '16px',
        background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.75))',
        border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.08))',
        marginBottom: '10px',
        marginTop: '16px',
        ...style
      }}
    >
      {/* Left side: Section Label & View Mode (Cards vs Table) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-dark)' }}>
          <Sliders size={14} style={{ color: 'var(--primary-color)' }} />
          <span>Display Mode:</span>
        </div>

        {/* View Mode Toggle Switch */}
        {onViewModeChange && (
          <div
            className="seg-control"
            style={{
              display: 'inline-flex',
              background: 'rgba(0, 0, 0, 0.04)',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid var(--glass-border)'
            }}
          >
            <button
              type="button"
              onClick={() => onViewModeChange(viewMode === 'cards' ? 'cards' : 'card')}
              className={`seg-btn ${isCardMode ? 'active' : ''}`}
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12px',
                fontWeight: isCardMode ? 700 : 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: isCardMode ? 'var(--primary-color)' : 'transparent',
                color: isCardMode ? '#ffffff' : 'var(--text-muted)',
                boxShadow: isCardMode ? '0 2px 6px var(--primary-border)' : 'none',
                transition: 'all 0.16s ease'
              }}
              title="Card layout"
            >
              <LayoutGrid size={13} />
              <span>Cards</span>
            </button>
          </div>
        )}
      </div>

      {/* Right side: Sorting, Columns visibility, Rows per page */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Optional Sorting selector */}
        {sortOptions.length > 0 && onSortByChange && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                background: 'var(--glass-bg, rgba(255,255,255,0.85))',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-dark)',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Optional Column Visibility Dropdown for Table mode */}
        {viewMode === 'table' && availableColumns.length > 0 && onToggleColumn && (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowColMenu(!showColMenu)}
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Customize visible columns"
            >
              <Eye size={13} />
              <span>Columns</span>
              <ChevronDown size={12} />
            </button>

            {showColMenu && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
                  onClick={() => setShowColMenu(false)}
                />
                <div
                  className="glass-panel fade-in"
                  style={{
                    position: 'absolute',
                    right: 0,
                    bottom: '100%',
                    marginBottom: '8px',
                    width: '210px',
                    background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.95))',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    padding: '8px',
                    zIndex: 9999
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', padding: '4px 8px 6px', borderBottom: '1px solid var(--glass-border)' }}>
                    Visible Columns
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                    {availableColumns.map((col) => {
                      const isHidden = hiddenColumns.includes(col.id);
                      return (
                        <div
                          key={col.id}
                          onClick={() => onToggleColumn(col.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: isHidden ? 'var(--text-muted)' : 'var(--text-dark)',
                            background: isHidden ? 'transparent' : 'rgba(0, 122, 255, 0.06)'
                          }}
                        >
                          <span>{col.label}</span>
                          {!isHidden && <Check size={13} style={{ color: 'var(--primary-color)' }} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}


        {/* Rows per page selector matching Screenshot */}
        {onPageSizeChange && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 700 }}>Rows:</span>
            <RowsDropdown
              value={pageSize}
              onChange={onPageSizeChange}
              options={pageSizeOptions}
              formatLabel={(sz) => `${sz} rows`}
              placement="auto"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DisplayPreferencesBar;

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, X, Pin, Settings, Plus, MoreHorizontal, Check,
  ChevronDown, RotateCcw, SlidersHorizontal, CheckSquare, Square
} from 'lucide-react';
import './BitrixFilterBar.css';

/**
 * BitrixFilterBar
 * A unified, Bitrix24-inspired search and filter component matching Screenshots 2 & 3.
 * Supports:
 * - Search bar with filter tag pills
 * - Left pane with saved filter presets
 * - Right pane with configurable filter fields & kebab menus
 * - "Filter field settings" modal with category tabs & 4-column checkbox grid
 * - Right-click context menu customization
 * - Persistence to localStorage
 */
export default function BitrixFilterBar({
  storageKey = 'tc_default_filter',
  searchQuery = '',
  onSearchChange = () => {},
  placeholder = 'search',
  availableFields = [],
  defaultVisibleFieldIds = [],
  presets = [],
  activePresetId = null,
  onPresetSelect = () => {},
  filters = {},
  onFilterChange = () => {},
  onApply = () => {},
  onReset = () => {},
  categoryTabs = [],
  style = {}
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [saveFilterModalOpen, setSaveFilterModalOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [contextMenu, setContextMenu] = useState(null);

  // Field Settings Modal State
  const [fieldSearch, setFieldSearch] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('ALL');

  // Load visible fields from localStorage or use defaults
  const [visibleFieldIds, setVisibleFieldIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}_visible_fields`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultVisibleFieldIds.length > 0 ? defaultVisibleFieldIds : availableFields.slice(0, 6).map(f => f.id);
  });

  // Local copy of active filters while inside dropdown
  const [draftFilters, setDraftFilters] = useState(filters);
  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

  // Persist visibleFieldIds
  const updateVisibleFieldIds = (nextIds) => {
    setVisibleFieldIds(nextIds);
    try {
      localStorage.setItem(`${storageKey}_visible_fields`, JSON.stringify(nextIds));
      window.dispatchEvent(new Event('tc-unhide-sync'));
    } catch {}
  };

  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        !e.target.closest('.tc-bitrix-settings-modal-scrim') &&
        !e.target.closest('.dashboard-context-menu-scrim')
      ) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [dropdownOpen]);

  // Current active preset object
  const activePreset = useMemo(() => {
    return presets.find(p => p.id === activePresetId);
  }, [presets, activePresetId]);

  // Filter fields currently visible in right pane
  const renderedFields = useMemo(() => {
    return availableFields.filter(f => visibleFieldIds.includes(f.id));
  }, [availableFields, visibleFieldIds]);

  // Fields inside the settings modal, filtered by category tab and search query
  const modalFields = useMemo(() => {
    return availableFields.filter(f => {
      const matchCat = selectedCategoryTab === 'ALL' || f.category === selectedCategoryTab;
      const matchSearch = !fieldSearch.trim() || f.label.toLowerCase().includes(fieldSearch.trim().toLowerCase());
      return matchCat && matchSearch;
    });
  }, [availableFields, selectedCategoryTab, fieldSearch]);

  const handleFieldToggle = (id) => {
    if (visibleFieldIds.includes(id)) {
      updateVisibleFieldIds(visibleFieldIds.filter(x => x !== id));
    } else {
      updateVisibleFieldIds([...visibleFieldIds, id]);
    }
  };

  const handleSelectAllFields = () => {
    if (visibleFieldIds.length === availableFields.length) {
      updateVisibleFieldIds([]);
    } else {
      updateVisibleFieldIds(availableFields.map(f => f.id));
    }
  };

  const handleRestoreDefaultFields = () => {
    const def = defaultVisibleFieldIds.length > 0 ? defaultVisibleFieldIds : availableFields.slice(0, 6).map(f => f.id);
    updateVisibleFieldIds(def);
  };

  const handleDraftChange = (fieldId, val) => {
    setDraftFilters(prev => ({ ...prev, [fieldId]: val }));
  };

  const handleApplyClick = () => {
    onFilterChange(draftFilters);
    onApply(draftFilters);
    setDropdownOpen(false);
  };

  const handleResetClick = () => {
    const emptyFilters = {};
    setDraftFilters(emptyFilters);
    onFilterChange(emptyFilters);
    onReset();
    if (activePresetId) {
      onPresetSelect(null);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY
    });
  };

  return (
    <div
      className="tc-bitrix-filter-wrapper"
      ref={containerRef}
      style={style}
      onContextMenu={handleContextMenu}
    >
      {/* Search Input Bar with Filter Tag Pill (Screenshot 2 Header) */}
      <div
        className={`tc-bitrix-search-bar ${dropdownOpen ? 'focused' : ''}`}
        onClick={() => setDropdownOpen(true)}
      >
        {activePreset && (
          <span className="tc-bitrix-preset-tag">
            <span className="tc-bitrix-preset-tag-text">{activePreset.label}</span>
            <button
              type="button"
              className="tc-bitrix-preset-tag-close"
              onClick={(e) => {
                e.stopPropagation();
                onPresetSelect(null);
              }}
              title="Remove filter preset"
            >
              <X size={12} />
            </button>
          </span>
        )}

        <input
          type="text"
          className="tc-bitrix-search-input"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setDropdownOpen(true)}
          onContextMenu={handleContextMenu}
        />

        <div className="tc-bitrix-search-actions">
          {searchQuery && (
            <button
              type="button"
              className="tc-bitrix-action-icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                onSearchChange('');
              }}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            className="tc-bitrix-action-icon-btn search-trigger"
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen(prev => !prev);
            }}
            title="Open Bitrix24 filters"
          >
            <Search size={15} />
          </button>
        </div>
      </div>

      {/* Bitrix24 Filter Dropdown Popup (Screenshot 2) */}
      {dropdownOpen && (
        <div className="tc-bitrix-dropdown-panel glass-panel">
          {/* Left Column: Saved Filters & Presets */}
          <div className="tc-bitrix-dropdown-left">
            <div className="tc-bitrix-presets-list">
              {presets.map(p => {
                const isActive = p.id === activePresetId;
                return (
                  <div
                    key={p.id}
                    className={`tc-bitrix-preset-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      onPresetSelect(p.id);
                      if (p.filters) {
                        setDraftFilters(p.filters);
                        onFilterChange(p.filters);
                      }
                    }}
                  >
                    <span className="tc-bitrix-preset-name">{p.label}</span>
                    {isActive && <Pin size={12} className="tc-bitrix-preset-pin" />}
                  </div>
                );
              })}
            </div>

            <div className="tc-bitrix-left-footer">
              <button
                type="button"
                className="tc-bitrix-save-filter-btn"
                onClick={() => setSaveFilterModalOpen(true)}
              >
                <Plus size={14} /> Save filter
              </button>
              <button
                type="button"
                className="tc-bitrix-settings-gear-btn"
                onClick={() => setSettingsModalOpen(true)}
                title="Configure filter fields"
              >
                <Settings size={14} />
              </button>
            </div>
          </div>

          {/* Right Column: Active Filter Fields */}
          <div className="tc-bitrix-dropdown-right">
            <div className="tc-bitrix-fields-container">
              {renderedFields.map(field => {
                const val = draftFilters[field.id] ?? '';
                return (
                  <div key={field.id} className="tc-bitrix-field-row">
                    <label className="tc-bitrix-field-label">{field.label}</label>
                    <div className="tc-bitrix-field-input-wrap">
                      {field.type === 'select' ? (
                        <select
                          className="tc-bitrix-input tc-bitrix-select"
                          value={val}
                          onChange={(e) => handleDraftChange(field.id, e.target.value)}
                        >
                          <option value="">Any {field.label.toLowerCase()}</option>
                          {(field.options || []).map(opt => (
                            <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                              {typeof opt === 'string' ? opt : opt.label}
                            </option>
                          ))}
                        </select>
                      ) : field.type === 'number' || field.type === 'range' ? (
                        <div className="tc-bitrix-number-row">
                          <select className="tc-bitrix-operator-select" defaultValue="exact">
                            <option value="exact">Exact value</option>
                            <option value="gte">Greater than</option>
                            <option value="lte">Less than</option>
                          </select>
                          <input
                            type="number"
                            className="tc-bitrix-input tc-bitrix-number-input"
                            placeholder="0.00"
                            value={val}
                            onChange={(e) => handleDraftChange(field.id, e.target.value)}
                          />
                        </div>
                      ) : field.type === 'date' ? (
                        <select
                          className="tc-bitrix-input tc-bitrix-select"
                          value={val}
                          onChange={(e) => handleDraftChange(field.id, e.target.value)}
                        >
                          <option value="">Any date</option>
                          <option value="today">Today</option>
                          <option value="yesterday">Yesterday</option>
                          <option value="week">This week</option>
                          <option value="month">This month</option>
                          <option value="quarter">This quarter</option>
                          <option value="year">This year</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="tc-bitrix-input"
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          value={val}
                          onChange={(e) => handleDraftChange(field.id, e.target.value)}
                        />
                      )}

                      <button
                        type="button"
                        className="tc-bitrix-field-kebab"
                        title="Remove field from view"
                        onClick={() => handleFieldToggle(field.id)}
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {renderedFields.length === 0 && (
                <div className="tc-bitrix-no-fields">
                  No filter fields selected. Click <strong>Add field</strong> below to choose fields.
                </div>
              )}
            </div>

            {/* Field Actions */}
            <div className="tc-bitrix-field-links">
              <button
                type="button"
                className="tc-bitrix-add-field-link"
                onClick={() => setSettingsModalOpen(true)}
              >
                + Add field
              </button>
              <button
                type="button"
                className="tc-bitrix-restore-link"
                onClick={handleRestoreDefaultFields}
              >
                Restore default fields
              </button>
            </div>

            {/* Footer Buttons */}
            <div className="tc-bitrix-right-footer">
              <button
                type="button"
                className="tc-bitrix-search-btn"
                onClick={handleApplyClick}
              >
                <Search size={14} /> Search
              </button>
              <button
                type="button"
                className="tc-bitrix-reset-btn"
                onClick={handleResetClick}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Field Settings Modal (Screenshot 3) */}
      {settingsModalOpen && createPortal(
        <div
          className="tc-bitrix-settings-modal-scrim"
          onClick={() => setSettingsModalOpen(false)}
        >
          <div
            className="tc-bitrix-settings-modal glass-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="tc-bitrix-modal-header">
              <h3>Filter field settings</h3>
              <button
                type="button"
                className="tc-bitrix-modal-close"
                onClick={() => setSettingsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Subheader: Search + Category Tabs */}
            <div className="tc-bitrix-modal-subnav">
              <div className="tc-bitrix-modal-search">
                <Search size={15} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Find field"
                  value={fieldSearch}
                  onChange={(e) => setFieldSearch(e.target.value)}
                />
              </div>

              {categoryTabs.length > 0 && (
                <div className="tc-bitrix-category-pills">
                  <button
                    type="button"
                    className={`tc-bitrix-cat-pill ${selectedCategoryTab === 'ALL' ? 'active' : ''}`}
                    onClick={() => setSelectedCategoryTab('ALL')}
                  >
                    All {selectedCategoryTab === 'ALL' && <Check size={12} className="check-dot" />}
                  </button>
                  {categoryTabs.map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`tc-bitrix-cat-pill ${selectedCategoryTab === tab.id ? 'active' : ''}`}
                      onClick={() => setSelectedCategoryTab(tab.id)}
                    >
                      {tab.label} {selectedCategoryTab === tab.id && <Check size={12} className="check-dot" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4-Column Checkbox Grid of Fields (Screenshot 3) */}
            <div className="tc-bitrix-fields-grid-section">
              <div className="tc-bitrix-grid-heading">
                {selectedCategoryTab === 'ALL' ? 'Available Fields' : (categoryTabs.find(t => t.id === selectedCategoryTab)?.label || 'Fields')}
              </div>
              <div className="tc-bitrix-4col-grid">
                {modalFields.map(field => {
                  const isChecked = visibleFieldIds.includes(field.id);
                  return (
                    <label
                      key={field.id}
                      className={`tc-bitrix-checkbox-cell ${isChecked ? 'checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleFieldToggle(field.id)}
                      />
                      <span className="tc-bitrix-cell-label">{field.label}</span>
                    </label>
                  );
                })}
              </div>
              {modalFields.length === 0 && (
                <div className="tc-bitrix-empty-grid">No matching fields found.</div>
              )}
            </div>

            {/* Modal Footer (Screenshot 3) */}
            <div className="tc-bitrix-modal-footer">
              <label className="tc-bitrix-select-all-label">
                <input
                  type="checkbox"
                  checked={visibleFieldIds.length === availableFields.length && availableFields.length > 0}
                  onChange={handleSelectAllFields}
                />
                <span>select all</span>
              </label>

              <div className="tc-bitrix-footer-buttons">
                <button
                  type="button"
                  className="tc-bitrix-apply-btn"
                  onClick={() => setSettingsModalOpen(false)}
                >
                  APPLY
                </button>
                <button
                  type="button"
                  className="tc-bitrix-cancel-btn"
                  onClick={() => setSettingsModalOpen(false)}
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  className="tc-bitrix-default-link"
                  onClick={handleRestoreDefaultFields}
                >
                  <RotateCcw size={12} /> default
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Save Filter Modal */}
      {saveFilterModalOpen && createPortal(
        <div
          className="tc-bitrix-settings-modal-scrim"
          onClick={() => setSaveFilterModalOpen(false)}
        >
          <div
            className="tc-bitrix-save-modal glass-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tc-bitrix-modal-header">
              <h3>Save Current Filter</h3>
              <button
                type="button"
                className="tc-bitrix-modal-close"
                onClick={() => setSaveFilterModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Filter Name
              </label>
              <input
                type="text"
                className="tc-bitrix-input"
                placeholder="e.g. High Value Deals"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '12px 20px', borderTop: '1px solid var(--glass-border)' }}>
              <button
                type="button"
                className="tc-bitrix-cancel-btn"
                onClick={() => setSaveFilterModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="tc-bitrix-apply-btn"
                onClick={() => {
                  if (newPresetName.trim()) {
                    try {
                      const savedPresets = JSON.parse(localStorage.getItem(`${storageKey}_custom_presets`) || '[]');
                      savedPresets.push({
                        id: `custom_${Date.now()}`,
                        label: newPresetName.trim(),
                        filters: { ...draftFilters }
                      });
                      localStorage.setItem(`${storageKey}_custom_presets`, JSON.stringify(savedPresets));
                      window.dispatchEvent(new Event('tc-unhide-sync'));
                    } catch {}
                    setNewPresetName('');
                    setSaveFilterModalOpen(false);
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Right-click Context Menu on Search Bar */}
      {contextMenu && createPortal(
        <div
          className="dashboard-context-menu-scrim"
          onClick={() => setContextMenu(null)}
          onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
        >
          <div
            className="dashboard-context-menu glass-panel"
            style={{
              position: 'fixed',
              left: `${Math.min(contextMenu.x, window.innerWidth - 220)}px`,
              top: `${Math.min(contextMenu.y, window.innerHeight - 200)}px`,
              zIndex: 99999
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dashboard-context-menu-header">
              <SlidersHorizontal size={14} color="var(--primary-color)" />
              <span>Search &amp; Filter Options</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setContextMenu(null);
                setSettingsModalOpen(true);
              }}
            >
              <Settings size={14} />
              <span>Customize Filters...</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setContextMenu(null);
                setDropdownOpen(true);
              }}
            >
              <CheckSquare size={14} />
              <span>Add / Remove Filter Fields</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setContextMenu(null);
                handleRestoreDefaultFields();
                handleResetClick();
              }}
            >
              <RotateCcw size={14} />
              <span>Reset Filters to Default</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

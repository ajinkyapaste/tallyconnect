import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, X, Pin, Settings, Plus, MoreHorizontal, Check,
  ChevronDown, RotateCcw, SlidersHorizontal, CheckSquare, Trash2,
  Calendar, ArrowRight
} from 'lucide-react';
import './BitrixFilterBar.css';

/**
 * Smart defaults when no custom availableFields or presets are passed
 */
const getDefaultFieldsForStorage = (key) => {
  const k = (key || '').toLowerCase();
  if (k.includes('ledger') || k.includes('customer')) {
    return [
      { id: 'search', label: 'Customer / Party Name', type: 'text', category: 'General' },
      { id: 'parent_group', label: 'Parent Group', type: 'select', category: 'General', options: ['Sundry Debtors', 'Sundry Creditors', 'Bank Accounts', 'Cash-in-hand', 'Direct Expenses', 'Indirect Expenses'] },
      { id: 'location', label: 'Location / State', type: 'text', category: 'General' },
      { id: 'email', label: 'Email', type: 'text', category: 'Contact' },
      { id: 'closing_balance', label: 'Closing Balance', type: 'number', category: 'Financial' },
      { id: 'status', label: 'Status', type: 'select', category: 'Status', options: ['Active', 'Inactive', 'Overdue'] }
    ];
  }
  if (k.includes('voucher')) {
    return [
      { id: 'search', label: 'Party / Voucher #', type: 'text', category: 'General' },
      { id: 'voucher_type', label: 'Voucher Type', type: 'select', category: 'General', options: ['Sales', 'Purchase', 'Payment', 'Receipt', 'Journal', 'Contra', 'Debit Note', 'Credit Note'] },
      { id: 'amount', label: 'Total', type: 'number', category: 'Financial' },
      { id: 'date', label: 'Created on', type: 'date', category: 'Date' },
      { id: 'status', label: 'Status', type: 'select', category: 'Status', options: ['Active', 'Cancelled'] },
      { id: 'narration', label: 'Narration', type: 'text', category: 'General' }
    ];
  }
  if (k.includes('order')) {
    return [
      { id: 'search', label: 'Order # or Party', type: 'text', category: 'General' },
      { id: 'party_name', label: 'Customer Name', type: 'text', category: 'General' },
      { id: 'order_type', label: 'Order Type', type: 'select', category: 'General', options: ['Sales Order', 'Purchase Order'] },
      { id: 'total_amount', label: 'Total Amount', type: 'number', category: 'Financial' },
      { id: 'status', label: 'Status', type: 'select', category: 'Status', options: ['Pending', 'Completed', 'Cancelled'] },
      { id: 'date', label: 'Order Date', type: 'date', category: 'Date' }
    ];
  }
  if (k.includes('invoice')) {
    return [
      { id: 'search', label: 'Invoice # or Party', type: 'text', category: 'General' },
      { id: 'party_name', label: 'Party Name', type: 'text', category: 'General' },
      { id: 'status', label: 'Status', type: 'select', category: 'Status', options: ['Paid', 'Unpaid', 'Overdue'] },
      { id: 'amount', label: 'Total', type: 'number', category: 'Financial' },
      { id: 'due_date', label: 'Due Date', type: 'date', category: 'Date' }
    ];
  }
  if (k.includes('bill')) {
    return [
      { id: 'search', label: 'Bill # or Party', type: 'text', category: 'General' },
      { id: 'party_name', label: 'Supplier Name', type: 'text', category: 'General' },
      { id: 'status', label: 'Status', type: 'select', category: 'Status', options: ['Pending', 'Paid'] },
      { id: 'amount', label: 'Total', type: 'number', category: 'Financial' },
      { id: 'date', label: 'Bill Date', type: 'date', category: 'Date' }
    ];
  }
  if (k.includes('einvoice')) {
    return [
      { id: 'search', label: 'Party, GSTIN, Voucher, IRN', type: 'text', category: 'General' },
      { id: 'party_name', label: 'Party Name', type: 'text', category: 'General' },
      { id: 'gstin', label: 'GSTIN', type: 'text', category: 'General' },
      { id: 'voucher_no', label: 'Voucher Number', type: 'text', category: 'General' },
      { id: 'status', label: 'Status', type: 'select', category: 'Status', options: ['Generated', 'Pending', 'Failed', 'Cancelled'] },
      { id: 'amount', label: 'Total', type: 'number', category: 'Financial' },
      { id: 'date', label: 'Date', type: 'date', category: 'Date' }
    ];
  }
  if (k.includes('user') || k.includes('member') || k.includes('team')) {
    return [
      { id: 'search', label: 'Name / Email', type: 'text', category: 'General' },
      { id: 'role', label: 'Role', type: 'select', category: 'General', options: ['Admin', 'Staff'] },
      { id: 'email', label: 'Email', type: 'text', category: 'General' }
    ];
  }
  if (k.includes('attendance')) {
    return [
      { id: 'search', label: 'Team Member', type: 'text', category: 'General' },
      { id: 'status', label: 'Status', type: 'select', category: 'Status', options: ['Active', 'Idle', 'Checked Out', 'Absent', 'Exempt'] },
      { id: 'date', label: 'Date', type: 'date', category: 'Date' }
    ];
  }
  if (k.includes('leave')) {
    return [
      { id: 'search', label: 'Request / Name', type: 'text', category: 'General' },
      { id: 'status', label: 'Status', type: 'select', category: 'Status', options: ['Pending', 'Approved', 'Rejected', 'Cancelled'] },
      { id: 'leave_type', label: 'Type', type: 'select', category: 'General', options: ['Casual Leave', 'Sick Leave', 'Earned Leave'] }
    ];
  }
  if (k.includes('activity')) {
    return [
      { id: 'search', label: 'Party / Voucher #', type: 'text', category: 'General' },
      { id: 'action', label: 'Action', type: 'select', category: 'General', options: ['Created', 'Updated', 'Deleted', 'Downloaded'] },
      { id: 'module', label: 'Module', type: 'select', category: 'General', options: ['Vouchers', 'Ledgers', 'Orders', 'Users', 'Reports'] }
    ];
  }
  return [
    { id: 'search', label: 'Keyword', type: 'text', category: 'General' },
    { id: 'total', label: 'Total', type: 'number', category: 'Financial' },
    { id: 'date', label: 'Created on', type: 'date', category: 'Date' },
    { id: 'status', label: 'Status', type: 'select', category: 'Status', options: ['Active', 'Pending', 'Completed', 'Cancelled'] }
  ];
};

const getDefaultPresetsForStorage = (key) => {
  const k = (key || '').toLowerCase();
  if (k.includes('ledger') || k.includes('customer')) {
    return [
      { id: 'all_ledgers', label: 'All accounts', filters: {} },
      { id: 'sundry_debtors', label: 'Sundry Debtors', filters: { parent_group: 'Sundry Debtors' } },
      { id: 'sundry_creditors', label: 'Sundry Creditors', filters: { parent_group: 'Sundry Creditors' } }
    ];
  }
  if (k.includes('voucher')) {
    return [
      { id: 'all_vouchers', label: 'All vouchers', filters: {} },
      { id: 'sales_vouchers', label: 'Sales vouchers', filters: { voucher_type: 'Sales' } },
      { id: 'purchase_vouchers', label: 'Purchase vouchers', filters: { voucher_type: 'Purchase' } },
      { id: 'receipt_vouchers', label: 'Receipts & Payments', filters: { voucher_type: 'Receipt' } }
    ];
  }
  if (k.includes('order')) {
    return [
      { id: 'all_orders', label: 'All orders', filters: {} },
      { id: 'pending_orders', label: 'Pending orders', filters: { status: 'Pending' } },
      { id: 'completed_orders', label: 'Completed orders', filters: { status: 'Completed' } }
    ];
  }
  if (k.includes('invoice')) {
    return [
      { id: 'all_invoices', label: 'All invoices', filters: {} },
      { id: 'unpaid_invoices', label: 'Unpaid invoices', filters: { status: 'Unpaid' } },
      { id: 'overdue_invoices', label: 'Overdue invoices', filters: { status: 'Overdue' } }
    ];
  }
  if (k.includes('bill')) {
    return [
      { id: 'all_bills', label: 'All bills', filters: {} },
      { id: 'pending_bills', label: 'Pending bills', filters: { status: 'Pending' } }
    ];
  }
  if (k.includes('einvoice')) {
    return [
      { id: 'all_einvoices', label: 'All e-invoices', filters: {} },
      { id: 'generated_einvoices', label: 'Generated', filters: { status: 'Generated' } },
      { id: 'pending_einvoices', label: 'Pending IRN', filters: { status: 'Pending' } }
    ];
  }
  if (k.includes('user') || k.includes('member') || k.includes('team')) {
    return [
      { id: 'all_users', label: 'All users', filters: {} },
      { id: 'admin_users', label: 'Admins', filters: { role: 'Admin' } },
      { id: 'staff_users', label: 'Staff members', filters: { role: 'Staff' } }
    ];
  }
  if (k.includes('attendance')) {
    return [
      { id: 'all_attendance', label: 'All members', filters: {} },
      { id: 'active_attendance', label: 'Active', filters: { status: 'Active' } },
      { id: 'absent_attendance', label: 'Absent', filters: { status: 'Absent' } }
    ];
  }
  if (k.includes('leave')) {
    return [
      { id: 'all_requests', label: 'All requests', filters: {} },
      { id: 'pending_requests', label: 'Pending', filters: { status: 'Pending' } },
      { id: 'approved_requests', label: 'Approved', filters: { status: 'Approved' } }
    ];
  }
  if (k.includes('activity')) {
    return [
      { id: 'all_activity', label: 'All activities', filters: {} },
      { id: 'voucher_activity', label: 'Vouchers', filters: { module: 'Vouchers' } },
      { id: 'ledger_activity', label: 'Ledgers', filters: { module: 'Ledgers' } }
    ];
  }
  return [
    { id: 'all_items', label: 'All items', filters: {} },
    { id: 'active_items', label: 'Active only', filters: { status: 'Active' } }
  ];
};

/**
 * BitrixFilterBar
 * A unified, Bitrix24-inspired search and filter component matching user screenshot.
 * Features:
 * - Direct access to filter panel on clicking the search button or search bar
 * - Right-click context-menu with advanced filter actions & presets
 * - Presets list on left with pin icon, "+ Save filter", and gear settings
 * - Configurable fields on right with operators (exact, gte, lte, range), dates, selects
 * - Field kebab menu (...) to hide/configure fields
 * - "Add field" and "Restore default fields" links
 * - "Search" and "Reset" buttons
 * - "Filter field settings" modal with 4-column checkbox grid & category pills
 * - LocalStorage persistence for visible fields, pinned preset, and custom presets
 * - Smart screen boundary alignment and responsive mobile behavior
 */
export default function BitrixFilterBar({
  storageKey = 'tc_default_filter',
  searchQuery = '',
  onSearchChange = () => {},
  placeholder = 'Filter and search',
  availableFields: passedFields = [],
  defaultVisibleFieldIds = [],
  presets: passedPresets = [],
  activePresetId = null,
  onPresetSelect = () => {},
  filters = {},
  onFilterChange = () => {},
  onApply = () => {},
  onReset = () => {},
  categoryTabs: passedCategoryTabs = [],
  id = undefined,
  name = undefined,
  className = '',
  style = {},
  inputStyle = {},
  searchButtonTitle = 'Open Bitrix24 filters'
}) {
  // Resolve effective fields and presets (with smart fallbacks if not provided)
  const availableFields = useMemo(() => {
    if (passedFields && passedFields.length > 0) return passedFields;
    return getDefaultFieldsForStorage(storageKey);
  }, [passedFields, storageKey]);

  const basePresets = useMemo(() => {
    if (passedPresets && passedPresets.length > 0) return passedPresets;
    return getDefaultPresetsForStorage(storageKey);
  }, [passedPresets, storageKey]);

  const categoryTabs = useMemo(() => {
    if (passedCategoryTabs && passedCategoryTabs.length > 0) return passedCategoryTabs;
    const cats = new Set(availableFields.map(f => f.category || 'General'));
    return Array.from(cats).map(c => ({ id: c, label: c }));
  }, [passedCategoryTabs, availableFields]);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [saveFilterModalOpen, setSaveFilterModalOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [fieldActionMenu, setFieldActionMenu] = useState(null);
  const [alignRight, setAlignRight] = useState(false);

  // Field Settings Modal State
  const [fieldSearch, setFieldSearch] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('ALL');

  // Custom presets saved by user in localStorage
  const [customPresets, setCustomPresets] = useState(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}_custom_presets`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Pinned preset for default loading
  const [pinnedPresetId, setPinnedPresetId] = useState(() => {
    try {
      return localStorage.getItem(`${storageKey}_pinned_preset`) || null;
    } catch {
      return null;
    }
  });

  // All presets combined
  const allPresets = useMemo(() => {
    return [...basePresets, ...customPresets];
  }, [basePresets, customPresets]);

  // Load visible fields from localStorage or use defaults
  const [visibleFieldIds, setVisibleFieldIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}_visible_fields`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultVisibleFieldIds.length > 0
      ? defaultVisibleFieldIds
      : availableFields.slice(0, 6).map(f => f.id);
  });

  // Local draft of active filters inside dropdown
  const [draftFilters, setDraftFilters] = useState(filters);
  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

  // Auto-apply pinned preset on initial mount if none selected
  useEffect(() => {
    if (pinnedPresetId && !activePresetId) {
      const match = allPresets.find(p => p.id === pinnedPresetId);
      if (match) {
        onPresetSelect(match.id);
        if (match.filters) {
          setDraftFilters(match.filters);
          onFilterChange(match.filters);
        }
      }
    }
  }, []); // Run once on mount

  // Persist visibleFieldIds
  const updateVisibleFieldIds = (nextIds) => {
    setVisibleFieldIds(nextIds);
    try {
      localStorage.setItem(`${storageKey}_visible_fields`, JSON.stringify(nextIds));
      window.dispatchEvent(new Event('tc-unhide-sync'));
    } catch {}
  };

  const containerRef = useRef(null);

  // Smart viewport alignment: ensure dropdown panel doesn't overflow screen right edge
  useEffect(() => {
    if (dropdownOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const neededWidth = 620;
      if (rect.left + neededWidth > window.innerWidth && rect.right >= neededWidth) {
        setAlignRight(true);
      } else {
        setAlignRight(false);
      }
    }
  }, [dropdownOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        !e.target.closest('.tc-bitrix-settings-modal-scrim') &&
        !e.target.closest('.dashboard-context-menu-scrim') &&
        !e.target.closest('.tc-bitrix-field-action-popover')
      ) {
        setDropdownOpen(false);
        setFieldActionMenu(null);
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
    return allPresets.find(p => p.id === activePresetId);
  }, [allPresets, activePresetId]);

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
    setFieldActionMenu(null);
  };

  const handleSelectAllFields = () => {
    if (visibleFieldIds.length === availableFields.length) {
      updateVisibleFieldIds([]);
    } else {
      updateVisibleFieldIds(availableFields.map(f => f.id));
    }
  };

  const handleRestoreDefaultFields = () => {
    const def = defaultVisibleFieldIds.length > 0
      ? defaultVisibleFieldIds
      : availableFields.slice(0, 6).map(f => f.id);
    updateVisibleFieldIds(def);
    setFieldActionMenu(null);
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

  const handleTogglePinPreset = (presetId, e) => {
    if (e) e.stopPropagation();
    const nextPin = pinnedPresetId === presetId ? null : presetId;
    setPinnedPresetId(nextPin);
    try {
      if (nextPin) {
        localStorage.setItem(`${storageKey}_pinned_preset`, nextPin);
      } else {
        localStorage.removeItem(`${storageKey}_pinned_preset`);
      }
    } catch {}
  };

  const handleDeleteCustomPreset = (presetId, e) => {
    if (e) e.stopPropagation();
    const nextCustom = customPresets.filter(p => p.id !== presetId);
    setCustomPresets(nextCustom);
    try {
      localStorage.setItem(`${storageKey}_custom_presets`, JSON.stringify(nextCustom));
    } catch {}
    if (activePresetId === presetId) {
      onPresetSelect(null);
    }
    if (pinnedPresetId === presetId) {
      setPinnedPresetId(null);
      localStorage.removeItem(`${storageKey}_pinned_preset`);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleApplyClick();
    }
  };

  return (
    <div
      className={`tc-bitrix-filter-wrapper ${className}`}
      ref={containerRef}
      style={style}
      onContextMenu={handleContextMenu}
    >
      {/* Search Input Bar with Filter Tag Pill & Action Icons */}
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
                setDraftFilters({});
                onFilterChange({});
              }}
              title="Remove filter preset"
            >
              <X size={12} />
            </button>
          </span>
        )}

        <input
          id={id}
          name={name}
          type="text"
          className="tc-bitrix-search-input"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setDropdownOpen(true)}
          onContextMenu={handleContextMenu}
          onKeyDown={handleKeyDown}
          style={inputStyle}
        />

        <div className="tc-bitrix-search-actions">
          {searchQuery && (
            <button
              type="button"
              className="tc-bitrix-action-icon-btn clear-trigger"
              onClick={(e) => {
                e.stopPropagation();
                onSearchChange('');
              }}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}

          {/* Search Button in Search Bar: clicking opens/toggles the Bitrix24 filter dropdown */}
          <button
            type="button"
            className="tc-bitrix-action-icon-btn search-trigger"
            id={id ? `${id}-search-btn` : 'bitrix-search-button'}
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen(prev => !prev);
            }}
            title={searchButtonTitle}
            aria-label="Open filter and search options"
          >
            <Search size={16} />
          </button>
        </div>
      </div>

      {/* Bitrix24 Filter Dropdown Popup (Matches Screenshot 2) */}
      {dropdownOpen && (
        <div className={`tc-bitrix-dropdown-panel ${alignRight ? 'align-right' : ''}`}>
          {/* Left Column: Saved Filters & Presets */}
          <div className="tc-bitrix-dropdown-left">
            <div className="tc-bitrix-presets-list">
              {allPresets.map(p => {
                const isActive = p.id === activePresetId;
                const isPinned = p.id === pinnedPresetId;
                const isCustom = String(p.id).startsWith('custom_');
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
                    <div className="tc-bitrix-preset-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={`tc-bitrix-pin-btn ${isPinned ? 'pinned' : ''}`}
                        title={isPinned ? 'Unpin default preset' : 'Pin as default preset'}
                        onClick={(e) => handleTogglePinPreset(p.id, e)}
                      >
                        <Pin size={12} className="tc-bitrix-preset-pin" />
                      </button>
                      {isCustom && (
                        <button
                          type="button"
                          className="tc-bitrix-delete-preset-btn"
                          title="Delete custom preset"
                          onClick={(e) => handleDeleteCustomPreset(p.id, e)}
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
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
                const opVal = draftFilters[`${field.id}_op`] || 'exact';

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
                            <option
                              key={typeof opt === 'string' ? opt : opt.value}
                              value={typeof opt === 'string' ? opt : opt.value}
                            >
                              {typeof opt === 'string' ? opt : opt.label}
                            </option>
                          ))}
                        </select>
                      ) : field.type === 'number' || field.type === 'range' ? (
                        <div className="tc-bitrix-number-row">
                          <select
                            className="tc-bitrix-operator-select"
                            value={opVal}
                            onChange={(e) => handleDraftChange(`${field.id}_op`, e.target.value)}
                          >
                            <option value="exact">Exact value</option>
                            <option value="gte">Greater than</option>
                            <option value="lte">Less than</option>
                            <option value="range">Range</option>
                          </select>
                          {opVal === 'range' ? (
                            <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                              <input
                                type="number"
                                className="tc-bitrix-input tc-bitrix-number-input"
                                placeholder="From"
                                value={draftFilters[`${field.id}_from`] ?? ''}
                                onChange={(e) => handleDraftChange(`${field.id}_from`, e.target.value)}
                                onKeyDown={handleKeyDown}
                              />
                              <input
                                type="number"
                                className="tc-bitrix-input tc-bitrix-number-input"
                                placeholder="To"
                                value={draftFilters[`${field.id}_to`] ?? ''}
                                onChange={(e) => handleDraftChange(`${field.id}_to`, e.target.value)}
                                onKeyDown={handleKeyDown}
                              />
                            </div>
                          ) : (
                            <input
                              type="number"
                              className="tc-bitrix-input tc-bitrix-number-input"
                              placeholder="0.00"
                              value={val}
                              onChange={(e) => handleDraftChange(field.id, e.target.value)}
                              onKeyDown={handleKeyDown}
                            />
                          )}
                        </div>
                      ) : field.type === 'date' ? (
                        <div style={{ display: 'flex', gap: '6px', flex: 1, flexDirection: 'column' }}>
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
                            <option value="exact">Exact date...</option>
                            <option value="range">Date range...</option>
                          </select>
                          {val === 'exact' && (
                            <input
                              type="date"
                              className="tc-bitrix-input"
                              value={draftFilters[`${field.id}_date`] ?? ''}
                              onChange={(e) => handleDraftChange(`${field.id}_date`, e.target.value)}
                            />
                          )}
                          {val === 'range' && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <input
                                type="date"
                                className="tc-bitrix-input"
                                value={draftFilters[`${field.id}_start`] ?? ''}
                                onChange={(e) => handleDraftChange(`${field.id}_start`, e.target.value)}
                              />
                              <input
                                type="date"
                                className="tc-bitrix-input"
                                value={draftFilters[`${field.id}_end`] ?? ''}
                                onChange={(e) => handleDraftChange(`${field.id}_end`, e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          className="tc-bitrix-input"
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          value={val}
                          onChange={(e) => handleDraftChange(field.id, e.target.value)}
                          onKeyDown={handleKeyDown}
                        />
                      )}

                      {/* Kebab 3-dots button on right of field */}
                      <button
                        type="button"
                        className="tc-bitrix-field-kebab"
                        title="Field options (click to hide)"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setFieldActionMenu({
                            fieldId: field.id,
                            fieldLabel: field.label,
                            x: rect.left,
                            y: rect.bottom + 4
                          });
                        }}
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

            {/* Field Actions Links (Matches Screenshot 2: 'Add field' in blue, 'Restore default fields' in grey) */}
            <div className="tc-bitrix-field-links">
              <button
                type="button"
                className="tc-bitrix-add-field-link"
                onClick={() => setSettingsModalOpen(true)}
              >
                Add field
              </button>
              <button
                type="button"
                className="tc-bitrix-restore-link"
                onClick={handleRestoreDefaultFields}
              >
                Restore default fields
              </button>
            </div>

            {/* Footer Buttons (Matches Screenshot 2: blue Search button + subtle Reset button) */}
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

      {/* Field Kebab Action Menu Popover */}
      {fieldActionMenu && createPortal(
        <div
          className="tc-bitrix-field-action-scrim"
          onClick={() => setFieldActionMenu(null)}
        >
          <div
            className="tc-bitrix-field-action-popover"
            style={{
              position: 'fixed',
              left: `${Math.min(fieldActionMenu.x, window.innerWidth - 180)}px`,
              top: `${Math.min(fieldActionMenu.y, window.innerHeight - 100)}px`,
              zIndex: 99999
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => handleFieldToggle(fieldActionMenu.fieldId)}
            >
              <span>Hide &ldquo;{fieldActionMenu.fieldLabel}&rdquo;</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFieldActionMenu(null);
                setSettingsModalOpen(true);
              }}
            >
              <span>Configure all fields...</span>
            </button>
            <button
              type="button"
              onClick={() => handleRestoreDefaultFields()}
            >
              <span>Restore default fields</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Filter Field Settings Modal (Matches Screenshot 3) */}
      {settingsModalOpen && createPortal(
        <div
          className="tc-bitrix-settings-modal-scrim"
          onClick={() => setSettingsModalOpen(false)}
        >
          <div
            className="tc-bitrix-settings-modal"
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

            {/* 4-Column Checkbox Grid of Fields (Matches Screenshot 3) */}
            <div className="tc-bitrix-fields-grid-section">
              <div className="tc-bitrix-grid-heading">
                {selectedCategoryTab === 'ALL'
                  ? 'Available Fields'
                  : (categoryTabs.find(t => t.id === selectedCategoryTab)?.label || 'Fields')}
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

            {/* Modal Footer (Matches Screenshot 3) */}
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
            className="tc-bitrix-save-modal"
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
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px', color: '#334155' }}>
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '12px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
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
                    const newPreset = {
                      id: `custom_${Date.now()}`,
                      label: newPresetName.trim(),
                      filters: { ...draftFilters }
                    };
                    const nextList = [...customPresets, newPreset];
                    setCustomPresets(nextCustom => [...nextCustom, newPreset]);
                    try {
                      localStorage.setItem(`${storageKey}_custom_presets`, JSON.stringify(nextList));
                      window.dispatchEvent(new Event('tc-unhide-sync'));
                    } catch {}
                    onPresetSelect(newPreset.id);
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
            className="dashboard-context-menu"
            style={{
              position: 'fixed',
              left: `${Math.min(contextMenu.x, window.innerWidth - 230)}px`,
              top: `${Math.min(contextMenu.y, window.innerHeight - 240)}px`,
              zIndex: 99999
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dashboard-context-menu-header">
              <SlidersHorizontal size={14} color="var(--primary-color, #0080ff)" />
              <span>Search &amp; Filter Options</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setContextMenu(null);
                setDropdownOpen(true);
              }}
            >
              <Search size={14} />
              <span>Advanced Filters...</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setContextMenu(null);
                setSettingsModalOpen(true);
              }}
            >
              <Settings size={14} />
              <span>Customize Filter Fields...</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setContextMenu(null);
                setSaveFilterModalOpen(true);
              }}
            >
              <Plus size={14} />
              <span>Save Current Filter Preset...</span>
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

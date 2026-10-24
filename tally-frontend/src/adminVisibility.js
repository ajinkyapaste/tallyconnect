/**
 * adminVisibility.js
 * Centralized manager for Administrator-controlled frontend visibility and display rules.
 *
 * NOTE: This controls frontend view presentation and module visibility for standard users.
 * Backend security and API authorization remain strictly enforced on the server.
 */

const STORAGE_KEY = 'tc_admin_visibility_config';

export const DEFAULT_ADMIN_VISIBILITY = {
  // Navigation tabs visible to standard users
  navTabs: {
    dashboard: true,
    ledger: true,
    inventory: true,
    vouchers: true,
    orders: true,
    bills: true,
    reports: true,
    activity: true,
    attendance: true,
    einvoice: true,
    deleted: true,
    companies: true,
    notifications: true,
    users: false // Users/team management is admin only by default
  },
  // Dashboard widgets visible to standard users
  dashboardCards: {
    sales_analytics: true,
    attendance: true,
    cash_flow: true,
    recent_activity: true,
    quick_actions: true,
    stat_cards: true
  },
  // Reports sections visible to standard users
  reportSections: {
    sales_analytics: true,
    top_customers: true,
    expense_analytics: true,
    financial_statements: true,
    day_book: true,
    quiet_customers: true,
    registers: true
  }
};

/**
 * Get current admin visibility configuration
 */
export const getAdminVisibilityConfig = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ADMIN_VISIBILITY;
    const parsed = JSON.parse(raw);
    return {
      navTabs: { ...DEFAULT_ADMIN_VISIBILITY.navTabs, ...(parsed.navTabs || {}) },
      dashboardCards: { ...DEFAULT_ADMIN_VISIBILITY.dashboardCards, ...(parsed.dashboardCards || {}) },
      reportSections: { ...DEFAULT_ADMIN_VISIBILITY.reportSections, ...(parsed.reportSections || {}) }
    };
  } catch (err) {
    console.warn('Could not read admin visibility config:', err);
    return DEFAULT_ADMIN_VISIBILITY;
  }
};

/**
 * Save updated admin visibility configuration (Admin role only)
 */
export const saveAdminVisibilityConfig = (newConfig) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    window.dispatchEvent(new CustomEvent('tc-admin-visibility-sync', { detail: newConfig }));
    return true;
  } catch (err) {
    console.error('Failed to save admin visibility config:', err);
    return false;
  }
};

/**
 * Reset admin visibility configuration to defaults
 */
export const resetAdminVisibilityConfig = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('tc-admin-visibility-sync', { detail: DEFAULT_ADMIN_VISIBILITY }));
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Check whether a specific item or section is visible to the current user
 * - If user is ADMIN, everything is visible so admin can inspect and manage everything.
 * - If user is standard USER, visibility follows the admin configuration.
 */
export const isVisibleToUser = (user, section, itemId) => {
  if (!user) return true;
  // Administrators always have full view access
  if (user.role === 'ADMIN' || user.isAdmin === true) return true;

  const config = getAdminVisibilityConfig();
  if (section === 'navTabs') {
    // Map variations like 'ledgers' -> 'ledger', 'items' -> 'inventory'
    const key = itemId === 'ledgers' ? 'ledger' : itemId === 'items' ? 'inventory' : itemId === 'monthly' ? 'reports' : itemId;

    // Management modules are strictly Administrator only
    if (key === 'users' || key === 'companies' || key === 'deleted') {
      return false;
    }

    // Check specific user role permissions
    if (key === 'dashboard' && (user.dashboard_permissions?.can_view === false || user.dashboardPermissions?.can_view === false)) {
      return false;
    }
    if ((key === 'vouchers' || key === 'voucher') && (user.vouchers_permissions?.can_view === false || user.vouchersPermissions?.can_view === false)) {
      return false;
    }
    if ((key === 'ledger' || key === 'history') && (user.ledger_permissions?.can_view === false || user.ledgerPermissions?.can_view === false)) {
      return false;
    }
    if (key === 'orders' && (user.orders_permissions?.can_view === false || user.ordersPermissions?.can_view === false)) {
      return false;
    }
    if ((key === 'inventory' || key === 'items') && (user.inventory_permissions?.can_view === false || user.inventoryPermissions?.can_view === false)) {
      return false;
    }
    if ((key === 'reports' || key === 'monthly') && (user.reports_permissions?.can_view === false || user.reportsPermissions?.can_view === false)) {
      return false;
    }

    return config.navTabs?.[key] !== false;
  }

  if (section === 'dashboardCards') {
    const userWidgets = user.dashboard_permissions?.widgets || user.dashboardPermissions?.widgets;
    if (userWidgets && userWidgets[itemId] === false) {
      return false;
    }
    return config.dashboardCards?.[itemId] !== false;
  }

  if (section === 'reportSections') {
    const key = String(itemId).replace(/-/g, '_');
    if (config.reportSections?.[key] !== undefined) {
      return config.reportSections[key] !== false;
    }
    if (key.includes('sales')) return config.reportSections?.sales_analytics !== false;
    if (key.includes('expense')) return config.reportSections?.expense_analytics !== false;
    if (key.includes('balance') || key.includes('profit') || key.includes('trial')) return config.reportSections?.financial_statements !== false;
    if (key.includes('quiet')) return config.reportSections?.quiet_customers !== false;
    if (key.includes('customer') || key.includes('party')) return config.reportSections?.top_customers !== false;
    if (key.includes('register') || key.startsWith('summary_') || key.includes('_list')) return config.reportSections?.registers !== false;
    if (key.includes('day_book') || key.includes('daybook')) return config.reportSections?.day_book !== false;
    return config.reportSections?.[itemId] !== false;
  }

  return true;
};

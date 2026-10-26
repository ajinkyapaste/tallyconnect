/**
 * api.js — single place where the frontend talks to the backend.
 *
 * - Base URL comes from VITE_API_URL (never hardcode secrets here).
 * - JWT is stored in localStorage and attached to every request.
 * - 401 responses clear the session so the app returns to the login screen.
 */

const RAW_BASE = (import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'https://tallymobile.utkarshmishra.online')).replace(/\/+$/, '');
// Two supported backend layouts:
//   * hosted / production: every route lives under `<origin>/api`
//     (e.g. https://dashboard.tally-connect.com/api/company)
//   * local dev: most routes live at the root and a few under `<origin>/api`
//     (e.g. http://localhost:4000/company, http://localhost:4000/api/reports/...)
// Normalise the configured base (with or without a trailing `/api`) so the same
// call sites keep working in every environment.
const API_ORIGIN = RAW_BASE.replace(/\/api$/, '');
const API_UNDER_ROOT =
  /\/api$/.test(RAW_BASE) ||
  /^(https?:\/\/)?(www\.)?dashboard\.tally-connect\.com$/i.test(API_ORIGIN);
const resolvePath = (path) => {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (API_UNDER_ROOT) {
    return p.startsWith('/api/') ? p : `/api${p}`;
  }
  return p;
};
const BASE_URL = API_ORIGIN;

// True when we're talking to the hosted deployment. The hosted backend mounts
// every route under `<origin>/api` and does not expose a few prototype-only
// routes, so a couple of call sites pick an environment-appropriate endpoint.
export const IS_HOSTED = /(^|\.)tally-connect\.com$/i.test(API_ORIGIN.replace(/^https?:\/\//, ''));

const TOKEN_KEY = 'tc_token';
const USER_KEY = 'tc_user';
const TOKEN_ORIGIN_KEY = 'tc_token_origin';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
};

/* A token is only valid for the backend that issued it. Always clear a session
   whose recorded origin is missing or different from the configured backend
   (e.g. a local token left over after switching VITE_API_URL to production) so
   we don't render the app shell and fire a burst of 401s with a foreign token. */
try {
  const token = localStorage.getItem(TOKEN_KEY);
  const origin = localStorage.getItem(TOKEN_ORIGIN_KEY);
  if (token && origin && API_ORIGIN && origin !== API_ORIGIN) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_ORIGIN_KEY);
  }
} catch {
  /* ignore storage errors */
}

export const setSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_ORIGIN_KEY, API_ORIGIN || 'https://tallymobile.utkarshmishra.online');
  resetRequestState();
  window.dispatchEvent(new Event('tc-auth'));
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_ORIGIN_KEY);
  resetRequestState();
  window.dispatchEvent(new Event('tc-auth'));
};

/* ------------------------------------------------------------------
   Request layer optimisations
   ------------------------------------------------------------------
   * `_inflight`  — de-duplicates identical GETs fired from several
                   components at once (Dashboard + Monthly + Voucher
                   Explore all read /voucher-entry, /ledger, ...).
   * `_getCache`  — very short-lived (default 12s) GET cache so switching
                   tabs / re-rendering does not refetch unchanged data.
   * `_missing`   — circuit breaker: once an endpoint answers 404 we stop
                   calling it for the rest of the session. This is what
                   stops the repeated `/voucher-entry/paged` 404s without
                   infinite retries.
   * Network failures on idempotent GETs retry once with backoff.
   All mutations (POST/PUT/DELETE) invalidate the GET cache so lists stay
   fresh after create/delete/restore.
------------------------------------------------------------------ */
const GET_CACHE_TTL = 12000;
const MAX_GET_RETRIES = 2;
const _inflight = new Map();
const _getCache = new Map();
const _missing = new Set();

function resetRequestState() {
  _inflight.clear();
  _getCache.clear();
  _missing.clear();
}

function resolvedPath(path) {
  return resolvePath(path).split('?')[0];
}

function buildUrl(path, params) {
  let url = `${BASE_URL}${resolvePath(path)}`;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    if (qs) url += `?${qs}`;
  }
  return url;
}

function cacheKey(path, params) {
  const q = params
    ? JSON.stringify(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '').sort())
    : '';
  return `${resolvedPath(path)}?${q}`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function makeHttpError(status, data, fallback) {
  const err = new Error((data && (data.message || data.error)) || fallback);
  err.status = status;
  if (data) err.data = data;
  return err;
}

async function request(path, { method = 'GET', body, params, cache, ttl, force } = {}) {
  const url = buildUrl(path, params);

  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const isGet = method === 'GET';
  const pathOnly = resolvedPath(path);
  const useCache = isGet && cache !== false;
  const key = useCache ? cacheKey(path, params) : null;

  /* Resident 404 circuit breaker — endpoint does not exist, do not call it
     again this session (prevents the infinite 404 retry loop). */
  if (useCache && !force && _missing.has(pathOnly)) {
    throw makeHttpError(404, null, `Endpoint not available (${pathOnly})`);
  }

  if (useCache && !force) {
    const hit = _getCache.get(key);
    if (hit && Date.now() - hit.at < (ttl ?? GET_CACHE_TTL)) return hit.data;
  }

  if (isGet && key && _inflight.has(key)) return _inflight.get(key);

  const run = (async () => {
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let res;
      try {
        res = await fetch(url, {
          method,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });
      } catch (err) {
        if (isGet && attempt < MAX_GET_RETRIES) {
          attempt += 1;
          await sleep(200 * attempt);
          continue;
        }
        throw new Error(`Cannot reach server at ${BASE_URL} (${err.message})`);
      }

      if (res.status === 401) {
        clearSession();
        const message = await res.json().catch(() => ({}));
        throw makeHttpError(401, message, 'Session expired, please login again');
      }

      // Retry transient gateway/server hiccups on idempotent GETs only.
      if (isGet && (res.status === 502 || res.status === 503 || res.status === 504) && attempt < MAX_GET_RETRIES) {
        attempt += 1;
        await sleep(300 * attempt);
        continue;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 404 && useCache) _missing.add(pathOnly);
        throw makeHttpError(res.status, data, `Request failed (${res.status})`);
      }

      if (useCache && key) {
        _getCache.set(key, { at: Date.now(), data });
        // Bound the cache so a long-lived tab cannot grow unbounded.
        if (_getCache.size > 200) {
          const oldest = _getCache.keys().next().value;
          _getCache.delete(oldest);
        }
      }
      return data;
    }
  })();

  if (isGet) {
    if (key) {
      _inflight.set(key, run);
      run.finally(() => {
        if (_inflight.get(key) === run) _inflight.delete(key);
      }).catch(() => { });
    }
  } else {
    // Any write invalidates cached reads so lists reflect the mutation.
    run.then(() => {
      _getCache.clear();
    }).catch(() => { });
  }

  return run;
}

export const api = {
  get: (path, params) => request(path, { params }),
  post: (path, body, params) => request(path, { method: 'POST', body, params }),
  put: (path, body, params) => request(path, { method: 'PUT', body, params }),
  patch: (path, body, params) => request(path, { method: 'PATCH', body, params }),
  del: (path) => request(path, { method: 'DELETE' }),
  delete: (path, body, params) => request(path, { method: 'DELETE', body, params }),
  /* Helpers used by callers that need to bypass or drop the short GET cache. */
  getFresh: (path, params) => request(path, { params, force: true }),
  invalidate: (prefix) => {
    for (const k of [..._getCache.keys()]) {
      if (!prefix || k.startsWith(prefix)) _getCache.delete(k);
    }
  },
  clearCache: () => resetRequestState(),
};

/* ---------------- Auth ---------------- */

export const login = async ({ username, password, loginType }) => {
  const data = await api.post('/auth/login', { username, password, loginType });
  setSession(data.token, data.user);
  return data;
};

export const register = async ({ username, email, password, isAdmin = false }) => {
  const data = await api.post('/auth/register', { username, email, password, isAdmin });
  return data;
};

export const fetchMe = () => api.get('/users/me').catch(() => api.get('/auth/me'));

export const sendResetOtp = async (email) => {
  return await api.post('/api/auth/send-otp', { email });
};

export const verifyResetOtp = async ({ email, otp, newPassword }) => {
  return await api.post('/api/auth/verify-otp', { email, otp, newPassword });
};

export const sendUserInvite = async ({ email, username, role = 'USER', company_guid = '' }) => {
  return await api.post('/send-invite', {
    email,
    username: username || (email ? email.split('@')[0] : ''),
    role,
    company_guid
  });
};

/* ---------------- Monthly Report Schedule ---------------- */
export const getMonthlyReportSchedule = () => api.get('/users/me/monthly-report-schedule');
export const updateMonthlyReportSchedule = ({ report_day, report_time, enabled }) =>
  api.put('/users/me/monthly-report-schedule', { report_day, report_time, enabled });

/* ---------------- User Profile & Avatar ---------------- */
export const updateUserProfile = ({ username, email, company, role }) =>
  api.put('/users/me', { username, email, company, role });

export const uploadUserAvatar = async (file, endpoint = '/users/me/avatar') => {
  const formData = new FormData();
  formData.append('avatar', file);
  const token = getToken();
  const url = buildUrl(endpoint || '/api/users/me/avatar');
  const res = await fetch(url, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Avatar upload failed');
  }
  return await res.json();
};

/* ---------------- Staff Permissions & Bulk Operations ---------------- */
export const updateUserVoucherPermissions = (userId, permissions) =>
  api.put(`/users/${userId}/voucher-permissions`, permissions);
export const updateUserLedgerPermissions = (userId, permissions) =>
  api.put(`/users/${userId}/ledger-permissions`, permissions);
export const updateUserOrdersPermissions = (userId, permissions) =>
  api.put(`/users/${userId}/orders-permissions`, permissions);
export const updateUserInventoryPermissions = (userId, permissions) =>
  api.put(`/users/${userId}/inventory-permissions`, permissions);
export const updateUserDashboardPermissions = (userId, permissions) =>
  api.put(`/users/${userId}/dashboard-permissions`, permissions);
export const notifyPermissionUpdate = ({ userIds, modules }) =>
  api.post('/notify-permission-update', { userIds, modules });

export const getUserLedgers = (userId) => api.get(`/users/${userId}/ledgers`);
export const bulkAssignLedgers = ({ userIds, ledgerIds }) =>
  api.post('/users/bulk-ledger-assign', { userIds, ledgerIds });

export const bulkUpdateVoucherPermissions = ({ userIds, permissions }) =>
  api.put('/users/bulk-voucher-permissions', { userIds, permissions });
export const bulkUpdateOrdersPermissions = ({ userIds, permissions }) =>
  api.put('/users/bulk-orders-permissions', { userIds, permissions });
export const bulkUpdateLedgerPermissions = ({ userIds, permissions }) =>
  api.put('/users/bulk-ledger-permissions', { userIds, permissions });
export const bulkUpdateInventoryPermissions = ({ userIds, permissions }) =>
  api.put('/users/bulk-inventory-permissions', { userIds, permissions });
export const bulkUpdateDashboardPermissions = ({ userIds, permissions }) =>
  api.put('/users/bulk-dashboard-permissions', { userIds, permissions });

export const getUserInviteInfo = (userId) => api.get(`/users/${userId}/invite-info`);

/* ---------------- Orders Permissions ---------------- */
export const getUserOrders = (userId) => api.get(`/orders/user-orders/${userId}`);
export const saveUserOrders = (userId, orders) =>
  api.post('/orders/user-orders', { userId, orders });
export const saveBulkUserOrders = (userIds, orders) =>
  api.post('/orders/bulk-user-orders', { userIds, orders });

/* ---------------- Inventory Permissions & Mobile Catalog ---------------- */
export const getUserInventory = (userId) => api.get(`/inventory/user-inventory/${userId}`);
export const saveUserInventory = (userId, items) =>
  api.post('/inventory/user-inventory', { userId, items });
export const saveBulkUserInventory = (userIds, items) =>
  api.post('/inventory/bulk-user-inventory', { userIds, items });
export const getMobileInventory = () => api.get('/inventory/mobile');

/* ---------------- Voucher Entry Field Settings & Custom Fields ---------------- */
export const getEntryFieldSettings = (voucherType) =>
  api.get(`/entry-field-settings/${voucherType.toUpperCase()}`);
export const updateEntryFieldSettings = (voucherType, fields) =>
  api.put(`/entry-field-settings/${voucherType.toUpperCase()}`, { fields });

export const createCustomEntryField = (voucherType, { fieldKey, fieldName, fieldType, options = [] }) =>
  api.post(`/entry-field-settings/${voucherType.toUpperCase()}/custom`, {
    fieldKey,
    fieldName,
    fieldType,
    options
  });

export const updateCustomEntryField = (voucherType, fieldKey, { enabled }) =>
  api.patch(`/entry-field-settings/${voucherType.toUpperCase()}/custom/${encodeURIComponent(fieldKey)}`, {
    enabled
  });

export const deleteCustomEntryField = (voucherType, fieldKey) =>
  api.del(`/entry-field-settings/${voucherType.toUpperCase()}/custom/${encodeURIComponent(fieldKey)}`);

/* ---------------- User Vouchers & Restore ---------------- */
export const getUserVouchers = (userId) => api.get(`/voucher-entry/user-vouchers/${userId}`);
export const saveUserVouchers = (userId, vouchers) =>
  api.post('/voucher-entry/user-vouchers', { userId, vouchers });
export const saveBulkUserVouchers = (userIds, vouchers) =>
  api.post('/voucher-entry/bulk-user-vouchers', { userIds, vouchers });
export const restoreDeletedVoucher = (id) =>
  api.post(`/voucher-entry/deleted/restore-voucher/${id}`);

/* ---------------- Invoices & Line Items ---------------- */
export const getInvoices = () => api.get('/invoice');
export const getInvoiceItems = (invoiceGuid) =>
  api.get(`/invoice-item/${encodeURIComponent(invoiceGuid)}`);
export const getLedgerInvoices = (ledgerGuid) =>
  api.get(`/invoice/ledger/${encodeURIComponent(ledgerGuid)}`);

/* ---------------- Feedback & Dashboard Order ---------------- */

export const submitFeedback = async ({ type, rating, message, appVersion, platform }) => {
  // Normalize type to match backend enum: 'feedback' | 'bug' | 'idea'
  const rawType = String(type || '').trim().toLowerCase();
  let normalizedType = 'feedback';
  if (rawType === 'report a bug' || rawType === 'bug') {
    normalizedType = 'bug';
  } else if (rawType === 'suggestion' || rawType === 'idea') {
    normalizedType = 'idea';
  }

  // Parse rating: 1-5 integer, or null if bug report
  let cleanRating = null;
  if (normalizedType !== 'bug' && rating !== undefined && rating !== null && rating !== '') {
    const r = Number(rating);
    if (Number.isInteger(r) && r >= 1 && r <= 5) {
      cleanRating = r;
    }
  }

  const payload = {
    type: normalizedType,
    rating: cleanRating,
    message: String(message || '').trim(),
    app_version: appVersion || '1.0.0',
    platform: platform || (typeof navigator !== 'undefined' ? (navigator.userAgentData?.platform || navigator.platform || 'Web') : 'Web'),
  };

  try {
    const res = await api.post('/api/feedback', payload);
    return res;
  } catch (err) {
    try {
      const history = JSON.parse(localStorage.getItem('tc_feedback_history') || '[]');
      history.unshift({ ...payload, submitted_at: new Date().toISOString(), local: true });
      localStorage.setItem('tc_feedback_history', JSON.stringify(history.slice(0, 50)));
    } catch { }
    throw err;
  }
};

/* Admin Feedback APIs */
export const getAdminFeedback = (params) => api.get('/api/admin/feedback', params);
export const getAdminFeedbackById = (id) => api.get(`/api/admin/feedback/${id}`);
export const updateAdminFeedback = (id, data) => api.patch(`/api/admin/feedback/${id}`, data);
export const resendAdminFeedbackEmail = (id) => api.post(`/api/admin/feedback/${id}/resend-email`);

export const updateDashboardOrder = async (order) => {
  try {
    localStorage.setItem('tc_dashboard_order', JSON.stringify(order));
    const res = await api.put('/dashboard/order', { order });
    return res;
  } catch (err) {
    return { success: true, local: true, order };
  }
};

export const getDashboardOrder = async () => {
  try {
    const res = await api.get('/dashboard/order');
    if (res?.order && Array.isArray(res.order)) {
      localStorage.setItem('tc_dashboard_order', JSON.stringify(res.order));
      return res.order;
    }
  } catch { }
  try {
    const saved = localStorage.getItem('tc_dashboard_order');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

/* ---------------- Notification Preferences (Mobile + Web) ---------------- */
export const getNotificationPreferences = async () => {
  try {
    const res = await api.get('/api/mobile/notifications/config');
    return res?.config || res || {};
  } catch {
    try {
      return await api.get('/users/me/notifications');
    } catch {
      return {};
    }
  }
};

export const updateNotificationPreferences = async (config) => {
  const webPrefs = {
    user_created: true,
    user_deleted: true,
    new_voucher: true,
    payment_due: true,
    low_stock: true,
    monthly_reports: true,
    bill_created: true,
    ...config
  };
  try {
    await api.put('/users/me/notifications', webPrefs);
  } catch { }
  return await api.put('/api/mobile/notifications/config', config);
};

/* ---------------- Unified Notifications Service ---------------- */
export const getAllNotifications = async () => {
  const [adminRes, mobileRes] = await Promise.allSettled([
    api.get('/admin/notifications').catch(() => []),
    api.get('/api/mobile/notifications').catch(() => ({ notifications: [] }))
  ]);

  const items = [];

  // 1. Process Admin notifications (/admin/notifications)
  if (adminRes.status === 'fulfilled') {
    const list = Array.isArray(adminRes.value)
      ? adminRes.value
      : (Array.isArray(adminRes.value?.data) ? adminRes.value.data : []);
    list.forEach(n => {
      items.push({
        id: `admin-${n.id}`,
        rawId: n.id,
        source: 'admin',
        type: n.type || 'System',
        title: n.title || n.type || 'System Alert',
        message: n.message || '',
        is_read: Boolean(n.is_read),
        created_at: n.created_at,
        file: n.file || null,
        meta: n.meta || null,
        deep_link: n.meta?.voucher_guid ? `activity?voucher_guid=${encodeURIComponent(n.meta.voucher_guid)}` : null
      });
    });
  }

  // 2. Process Mobile notifications (/api/mobile/notifications)
  if (mobileRes.status === 'fulfilled') {
    const list = Array.isArray(mobileRes.value?.notifications)
      ? mobileRes.value.notifications
      : (Array.isArray(mobileRes.value) ? mobileRes.value : []);
    list.forEach(n => {
      items.push({
        id: `mobile-${n.id}`,
        rawId: n.id,
        source: 'mobile',
        type: n.type || 'Mobile',
        title: n.title || 'Notification',
        message: n.message || '',
        is_read: Boolean(n.is_read),
        created_at: n.created_at,
        file: n.file || null,
        meta: n.meta || null,
        deep_link: n.deep_link || null
      });
    });
  }

  // 3. Deduplicate
  const seen = new Set();
  const deduped = [];
  for (const item of items) {
    const key = `${item.type}-${item.message}-${(item.created_at || '').slice(0, 19)}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  }

  // 4. Sort newest first
  deduped.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  return deduped;
};

export const markNotificationRead = async (itemOrId, source = null) => {
  const isObj = typeof itemOrId === 'object' && itemOrId !== null;
  const rawId = isObj ? itemOrId.rawId || itemOrId.id : itemOrId;
  const itemSource = isObj ? (itemOrId.source || source) : source;

  if (itemSource === 'mobile') {
    try {
      return await api.post(`/api/mobile/notifications/${rawId}/read`, {});
    } catch {
      return await api.post(`/admin/notifications/${rawId}/read`, {});
    }
  } else {
    try {
      return await api.post(`/admin/notifications/${rawId}/read`, {});
    } catch {
      return await api.post(`/api/mobile/notifications/${rawId}/read`, {});
    }
  }
};

export const clearAllNotifications = async () => {
  const results = await Promise.allSettled([
    api.del('/api/mobile/notifications/clear-all'),
    api.del('/admin/notifications/clear-all')
  ]);
  return results.some(r => r.status === 'fulfilled');
};

/* ---------------- User Access Requests (Mobile + Web) ---------------- */
export const requestAccessToAdmin = (message) =>
  api.post('/request-to-admin', { message });

export const getAdminAccessRequests = () =>
  api.get('/admin/requests');

/* ---------------- Bill Dashboard Summary ---------------- */
export const getBillDashboardSummary = async (companyGuid) => {
  try {
    return await api.get('/bill/dashboard-summary', {
      params: { company_guid: companyGuid }
    });
  } catch {
    return null;
  }
};

/* ---------------- Monthly Report Summary (Turnover & Expense) ---------------- */
export const getMonthlyReportSummary = async (companyGuid, year) => {
  try {
    return await api.get('/api/reports/monthly-summary', {
      params: { company_guid: companyGuid, year: year || new Date().getFullYear() }
    });
  } catch {
    return null;
  }
};

/* ---------------- Company By GUID ---------------- */
export const getCompanyByGuid = (guid) => api.get(`/company/by-guid/${encodeURIComponent(guid)}`);

/* ---------------- Party Ledger Vouchers ---------------- */
export const getLedgerVouchers = (ledgerGuid) => api.get(`/voucher-entry/ledger/${encodeURIComponent(ledgerGuid)}`);

/* ---------------- User Ledger Direct Assignment ---------------- */
export const getUserAssignedLedgers = (userId) => api.get(`/ledger/users/${encodeURIComponent(userId)}/ledgers`);
export const assignUserLedgers = (userId, ledgers) => api.post('/ledger/user-ledgers', { userId, ledgers });

/* ---------------- Voucher Active State Reset ---------------- */
export const resetActiveVouchers = (company_guid) => api.post('/voucher-entry/reset-active', { company_guid });

/* ---------------- Attendance System ---------------- */
export const getAttendanceMe = () => api.get('/api/attendance/me');
export const attendanceCheckIn = ({ note, idempotency_key } = {}) =>
  api.post('/api/attendance/check-in', { note, idempotency_key });
export const attendanceCheckOut = ({ note } = {}) =>
  api.post('/api/attendance/check-out', { note });
export const attendancePing = () => api.post('/api/attendance/ping');
export const getAttendanceMyHistory = (params) =>
  api.get('/api/attendance/me/history', params);
export const getAttendanceTeam = (params) =>
  api.get('/api/attendance/team', params);
export const getAttendanceTeamMemberHistory = (userId, params) =>
  api.get(`/api/attendance/team/${encodeURIComponent(userId)}/history`, params);
export const getAttendanceSettings = () => api.get('/api/attendance/settings');
export const saveAttendanceSettings = (exempt_positions) =>
  api.put('/api/attendance/settings', { exempt_positions });
export const saveAttendanceMember = (userId, data) =>
  api.put(`/api/attendance/members/${encodeURIComponent(userId)}`, data);
export const getAttendanceSummary = (params) => api.get('/api/attendance/summary', params);

/* ---------------- E-Invoice (Basic) ---------------- */
export const getEinvoiceList = (params = {}) => api.get('/api/einvoice/list', params);
export const getEinvoiceVoucher = (guid) => api.get(`/api/einvoice/voucher/${encodeURIComponent(guid)}`);

/* ---------------- Leave Management System ---------------- */
// Member & Shared
export const getLeaveMe = (params) => api.get('/api/leave/me', params);
export const applyLeaveRequest = (data) => api.post('/api/leave/requests', data);
export const cancelLeaveRequest = (id, note) => api.post(`/api/leave/requests/${id}/cancel`, { note });
export const getLeaveCalendar = (params) => api.get('/api/leave/calendar', params);

// Admin
export const getLeaveSettings = (params) => api.get('/api/leave/settings', params);
export const updateLeaveSettings = (data) => api.put('/api/leave/settings', data);
export const createLeaveType = (data) => api.post('/api/leave/types', data);
export const createDefaultLeaveTypes = () => api.post('/api/leave/types/defaults');
export const updateLeaveType = (id, data) => api.put(`/api/leave/types/${id}`, data);
export const addLeaveHoliday = (data) => api.post('/api/leave/holidays', data);
export const deleteLeaveHoliday = (date) => api.del(`/api/leave/holidays/${encodeURIComponent(date)}`);
export const getLeaveRequests = (params) => api.get('/api/leave/requests', params);
export const approveLeaveRequest = (id, note) => api.post(`/api/leave/requests/${id}/approve`, { note });
export const rejectLeaveRequest = (id, note) => api.post(`/api/leave/requests/${id}/reject`, { note });
export const getLeaveTeamMember = (userId, params) => api.get(`/api/leave/team/${encodeURIComponent(userId)}`, params);

/* ---------------- Mobile Sync Queue & Ingestion Helpers ---------------- */
export const getMobilePendingQueue = (company_guid) => api.get('/api/mobile-sync-queue/pending', { company_guid });
export const getMobileQueueActivity = (company_guid) => api.get('/api/mobile-sync-queue/activity', { company_guid });
export const retryMobileSyncEntry = (id) => api.post(`/api/mobile-sync-queue/${encodeURIComponent(id)}/retry`);
export const editMobileVoucher = (payload) => api.post('/api/mobile-voucher-command/edit', payload);
export const syncInventoryItem = (itemData) => api.post('/inventory/full-sync', itemData);

/* ---------------- API User Route Alias Mapping (/api/users/*) ---------------- */
export const apiUsers = {
  getMe: () => api.get('/api/users/me'),
  updateMe: (data) => api.put('/api/users/me', data),
  getNotifications: () => api.get('/api/users/me/notifications'),
  updateNotifications: (data) => api.put('/api/users/me/notifications', data),
  uploadAvatar: (file) => uploadUserAvatar(file),
  listUsers: () => api.get('/api/users'),
  createUser: (data) => api.post('/api/users', data),
  deleteUser: (id) => api.del(`/api/users/${id}`),
  getLedgers: (id) => api.get(`/api/users/${id}/ledgers`),
  getInviteInfo: (id) => api.get(`/api/users/${id}/invite-info`),
  updateVoucherPermissions: (id, p) => api.put(`/api/users/${id}/voucher-permissions`, p),
  updateLedgerPermissions: (id, p) => api.put(`/api/users/${id}/ledger-permissions`, p),
  updateOrdersPermissions: (id, p) => api.put(`/api/users/${id}/orders-permissions`, p),
  updateInventoryPermissions: (id, p) => api.put(`/api/users/${id}/inventory-permissions`, p),
  updateDashboardPermissions: (id, p) => api.put(`/api/users/${id}/dashboard-permissions`, p),
  bulkAssignLedgers: (data) => api.post('/api/users/bulk-ledger-assign', data),
  bulkVoucherPermissions: (data) => api.put('/api/users/bulk-voucher-permissions', data),
  bulkOrdersPermissions: (data) => api.put('/api/users/bulk-orders-permissions', data),
  bulkLedgerPermissions: (data) => api.put('/api/users/bulk-ledger-permissions', data),
  bulkInventoryPermissions: (data) => api.put('/api/users/bulk-inventory-permissions', data),
  bulkDashboardPermissions: (data) => api.put('/api/users/bulk-dashboard-permissions', data),
  getMonthlyReportSchedule: () => api.get('/api/users/me/monthly-report-schedule'),
  updateMonthlyReportSchedule: (data) => api.put('/api/users/me/monthly-report-schedule', data)
};

/* ---------------- Outstanding Email Reminders ---------------- */
export const getReminderTemplates = () => api.get('/api/reminders/templates');
export const createReminderTemplate = (data) => api.post('/api/reminders/templates', data);
export const updateReminderTemplate = (id, data) => api.put(`/api/reminders/templates/${id}`, data);
export const deleteReminderTemplate = (id) => api.del(`/api/reminders/templates/${id}`);
export const previewEmailReminder = (payload) => api.post('/api/reminders/preview', payload);
export const sendEmailReminder = (payload) => api.post('/api/reminders/send', payload);
export const getReminderHistory = (ledgerGuid) =>
  api.get(`/api/reminders/history${ledgerGuid ? `?ledger_guid=${encodeURIComponent(ledgerGuid)}` : ''}`);
export const retryEmailReminder = (id) => api.post(`/api/reminders/${id}/retry`);

/* ---------------- AI Financial Assistant ---------------- */
export const getAiProviders = () => api.get('/api/assistant/providers');
export const getAiModels = (provider, key, fresh = false) => {
  const headers = {};
  if (key) headers['X-AI-Key'] = key;
  return api.post('/api/assistant/models', { provider, fresh }, { headers });
};
export const verifyAiKey = ({ provider, model, key }) => {
  const headers = {};
  if (key) headers['X-AI-Key'] = key;
  return api.post('/api/assistant/verify', { provider, model }, { headers });
};
export const askAiAssistant = ({ question, history, provider, model, key }) => {
  const headers = {};
  if (key) {
    headers['X-AI-Key'] = key;
    headers['X-Gemini-Key'] = key; // for backward compatibility
  }
  return api.post('/api/assistant/ask', { question, history, provider, model }, { headers });
};

/* ---------------- Financial Reports ---------------- */
export const getFinancialMe = () => api.get('/api/financial/me');
export const getFinancialPeriods = () => api.get('/api/financial/periods');
export const getTrialBalance = (to, from) => {
  const params = new URLSearchParams();
  if (to) {
    params.append('to', to);
    params.append('as_on', to);
  }
  if (from) params.append('from', from);
  return api.get(`/api/financial/trial-balance?${params.toString()}`);
};
export const getProfitLoss = (from, to) =>
  api.get(`/api/financial/profit-loss?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
export const getBalanceSheet = (to, from) => {
  const params = new URLSearchParams();
  if (to) {
    params.append('to', to);
    params.append('as_on', to);
  }
  if (from) params.append('from', from);
  return api.get(`/api/financial/balance-sheet?${params.toString()}`);
};
export const getExpenseReport = (from, to, purchases = false) =>
  api.get(`/api/financial/expenses?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${purchases ? '&purchases=1' : ''}`);
export const getFinancialAccess = () => api.get('/api/financial/access');
export const setFinancialAccess = (userId, enabled) => api.put(`/api/financial/access/${userId}`, { enabled });
export const getFinancialCashFlow = (from, to) =>
  api.get(`/api/financial/cash-flow?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
export const getFinancialLedgerVouchers = ({ guid, name, from, to }) => {
  const params = new URLSearchParams();
  if (guid) params.append('guid', guid);
  if (name) params.append('name', name);
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  return api.get(`/api/financial/ledger-vouchers?${params.toString()}`);
};
export const saveFinancialStockValue = ({ as_on, value }) =>
  api.put('/api/financial/stock-values', { as_on, value });

/* ---------------- Sales Analytics ---------------- */
export const getSalesAnalytics = (from, to) =>
  api.get(`/api/analytics/sales?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);

/* ---------------- Cash Flow Forecast (13 Weeks) ---------------- */
export const getCashflowForecast = ({ weeks = 13, mode = 'adjusted', doubtful = 0, refresh = 0 } = {}) =>
  api.get(`/api/cashflow/forecast?weeks=${weeks}&mode=${mode}&doubtful=${doubtful ? 1 : 0}&refresh=${refresh ? 1 : 0}`);
export const getCashflowWeek = ({ start, mode = 'adjusted', doubtful = 0 } = {}) =>
  api.get(`/api/cashflow/week?start=${encodeURIComponent(start)}&mode=${mode}&doubtful=${doubtful ? 1 : 0}`);

/* ---------------- Official Tally Reports ---------------- */
export const getTallyReportsPeriods = () => api.get('/api/tally-reports/periods');
export const getTallyReport = (report, { from = '', to = '' } = {}) =>
  api.get(`/api/tally-reports/${report}${from && to ? `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` : ''}`);

/* ---------------- Mobile Contra Voucher Command ---------------- */
export const createMobileContra = (payload) =>
  api.post('/api/mobile-voucher-command/contra/create', payload);

/* ---------------- Multi-Company Sync ---------------- */
export const getCompanyAgentConfig = (limit = 1) =>
  api.get(`/company/agent-config${limit ? '?limit=1' : ''}`);
export const updateCompanySelection = (companies) =>
  api.put('/company/selection', { companies });
export const getCompanySyncStatus = () => api.get('/company/sync-status');

/* ---------------- AI Assistant Status & Server Key ---------------- */
export const getAiAssistantStatus = () => api.get('/api/assistant/status');


const fs = require('fs');
const path = require('path');

const backendDir = 'd:/Prototype/tally-backend';
const frontendDir = 'd:/Prototype/tally-frontend/src';

// Mounts from server.js
const mounts = [
  { prefix: '/auth', file: 'routes/auth.js' },
  { prefix: '/company', file: 'routes/companies.js' },
  { prefix: '', file: 'routes/feedback.js' },
  { prefix: '/ledger', file: 'routes/ledgers.js' },
  { prefix: '/voucher-entry', file: 'routes/voucherEntry.js' },
  { prefix: '/voucher-entry', file: 'routes/voucherEntry.bulk.js' },
  { prefix: '/orders', file: 'routes/orders.js' },
  { prefix: '/bill', file: 'routes/bills.js' },
  { prefix: '/ageing', file: 'routes/ageing.js' },
  { prefix: '/sales-order', file: 'routes/salesOrder.js' },
  { prefix: '/sales-order-item', file: 'routes/salesOrderItem.js' },
  { prefix: '/stock-item', file: 'routes/stockItem.js' },
  { prefix: '/stock-summary', file: 'routes/stockSummary.js' },
  { prefix: '/invoice', file: 'routes/invoice.routes.js' },
  { prefix: '/invoice-item', file: 'routes/invoiceItem.routes.js' },
  { prefix: '/sync', file: 'routes/sync.routes.js' },
  { prefix: '/inventory', file: 'routes/inventory.js' },
  { prefix: '/users', file: 'routes/users.js' },
  { prefix: '/api/users', file: 'routes/users.js' },
  { prefix: '/dashboard', file: 'routes/dashboard.js' },
  { prefix: '/api/reports', file: 'routes/reports.js' },
  { prefix: '/api/auth', file: 'routes/forgotPassword.js' },
  { prefix: '/send-invite', file: 'routes/sendInvite.js' },
  { prefix: '/agent', file: 'routes/agent.routes.js' },
  { prefix: '/invoice', file: 'routes/invoice.bulk.js' },
  { prefix: '/invoice-item', file: 'routes/invoiceItem.bulk.js' },
  { prefix: '/agent-status', file: 'routes/agentStatus.js' },
  { prefix: '/voucher-command', file: 'routes/UniversalUpdate/voucherCommand.js' },
  { prefix: '/sync-queue', file: 'routes/syncQueueRoutes.js' },
  { prefix: '/admin/notifications', file: 'routes/adminNotifications.js' },
  { prefix: '/notify-permission-update', file: 'routes/notifypermissionupdate.js' },
  { prefix: '', file: 'routes/userRequestsforAccess.js' },
  { prefix: '/api/mobile-voucher-command', file: 'routes/UniversalUpdate/mobileVoucherCommand.js' },
  { prefix: '/api/mobile-sync-queue', file: 'routes/mobileSyncQueueRoutes.js' },
  { prefix: '/api/mobile/notifications', file: 'routes/mobileNotifications.js' },
  { prefix: '/ledger-items', file: 'routes/ledgerItems.js' },
  { prefix: '/entry-field-settings', file: 'routes/entryFieldSettings.js' }
];

// Read all frontend code
const frontendFiles = [];
function readFrontend(dir) {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) readFrontend(full);
    else if (/\.(jsx?|tsx?)$/.test(item) && !item.includes('.backup.')) {
      frontendFiles.push({ name: item, code: fs.readFileSync(full, 'utf8') });
    }
  }
}
readFrontend(frontendDir);

const endpoints = [];

mounts.forEach(({ prefix, file }) => {
  const filePath = path.join(backendDir, file);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, lineNum) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
    const match = line.match(/router\.(get|post|put|delete|patch)\(\s*['"`]([^'"`]+)/);
    if (match) {
      const method = match[1].toUpperCase();
      let subPath = match[2];
      if (!subPath.startsWith('/')) subPath = '/' + subPath;
      const fullPath = (prefix + subPath).replace(/\/+/g, '/').replace(/\/$/, '') || '/';
      
      endpoints.push({
        method,
        fullPath,
        prefix,
        subPath: match[2],
        file,
        line: lineNum + 1
      });
    }
  });
});

// Deduplicate endpoints with same method & fullPath & file
const uniqueEndpoints = [];
const seen = new Set();
endpoints.forEach(ep => {
  const key = `${ep.method} ${ep.fullPath} in ${ep.file}`;
  if (!seen.has(key)) {
    seen.add(key);
    uniqueEndpoints.push(ep);
  }
});

// Check usage in frontend
const results = uniqueEndpoints.map(ep => {
  const baseSegment = ep.fullPath.split('/:')[0];
  const withoutApi = ep.fullPath.replace(/^\/api/, '');
  const baseWithoutApi = baseSegment.replace(/^\/api/, '');

  const matches = [];
  frontendFiles.forEach(fc => {
    // Check direct mention
    const hasFull = fc.code.includes(ep.fullPath);
    const hasBase = baseSegment.length > 3 && fc.code.includes(baseSegment);
    const hasWithoutApi = withoutApi.length > 3 && fc.code.includes(withoutApi);
    const hasBaseWithoutApi = baseWithoutApi.length > 3 && fc.code.includes(baseWithoutApi);

    if (hasFull || hasBase || hasWithoutApi || hasBaseWithoutApi) {
      matches.push(fc.name);
    }
  });

  // Categorize purpose
  let category = 'Other';
  const fp = ep.fullPath.toLowerCase();
  const file = ep.file.toLowerCase();

  if (fp.includes('sync') || file.includes('sync') || fp.includes('agent') || file.includes('agent') || fp.includes('bulk-sync')) {
    category = 'Desktop Sync Agent (Tally Prime Background Sync)';
  } else if (fp.includes('mobile') || file.includes('mobile')) {
    category = 'Mobile Application API (Android / iOS Dedicated)';
  } else if (file.includes('entryfieldsettings')) {
    category = 'Voucher Field Customization Settings (Unimplemented UI)';
  } else if (file.includes('invite') || file.includes('userrequests') || file.includes('notifypermission')) {
    category = 'User Invite & Access Request System (Unimplemented UI)';
  } else if (file.includes('forgotpassword')) {
    category = 'Password Recovery / Reset Auth Flow (Unimplemented UI)';
  } else if (file.includes('users') && (fp.includes('permission') || fp.includes('schedule') || fp.includes('notifications'))) {
    category = 'Granular Permissions & Scheduling (Unimplemented UI)';
  } else {
    category = 'General Web API (Unused or Alternative Endpoint)';
  }

  const isConnected = matches.length > 0;
  return {
    ...ep,
    connected: isConnected,
    usedIn: [...new Set(matches)],
    category
  };
});

const used = results.filter(r => r.connected);
const unused = results.filter(r => !r.connected);

// Group unused by category
const groupedUnused = {};
unused.forEach(u => {
  if (!groupedUnused[u.category]) groupedUnused[u.category] = [];
  groupedUnused[u.category].push(u);
});

console.log(JSON.stringify({
  total: results.length,
  usedCount: used.length,
  unusedCount: unused.length,
  groupedUnused
}, null, 2));

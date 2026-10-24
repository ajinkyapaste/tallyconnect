const fs = require('fs');
const path = require('path');

const backendDir = 'd:/Prototype/tally-backend';
const frontendDir = 'd:/Prototype/tally-frontend/src';

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

// Read all frontend files
const frontendCode = [];
function readDir(d) {
  for (const item of fs.readdirSync(d)) {
    const full = path.join(d, item);
    if (fs.statSync(full).isDirectory()) readDir(full);
    else if (/\.(jsx?|tsx?)$/.test(item)) {
      frontendCode.push({ file: item, code: fs.readFileSync(full, 'utf8') });
    }
  }
}
readDir(frontendDir);

const allEndpoints = [];

mounts.forEach(({ prefix, file }) => {
  const filePath = path.join(backendDir, file);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, lineNum) => {
    const match = line.match(/router\.(get|post|put|delete|patch)\(\s*['"`]([^'"`]+)/);
    if (match) {
      const method = match[1].toUpperCase();
      let subPath = match[2];
      if (subPath.startsWith('/')) subPath = subPath;
      else subPath = '/' + subPath;
      
      const fullPath = (prefix + subPath).replace(/\/+/g, '/');
      allEndpoints.push({
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

// Check usage in frontend
const results = allEndpoints.map(ep => {
  // Pattern search: test fullPath or parts
  // e.g., '/company/active', or '/company', or `:id`
  const baseSegment = ep.fullPath.split('/:')[0];
  const withoutApi = ep.fullPath.replace(/^\/api/, '');
  const baseWithoutApi = baseSegment.replace(/^\/api/, '');

  const matches = [];
  frontendCode.forEach(fc => {
    // Check if fullPath or baseSegment appears
    const hasFull = fc.code.includes(ep.fullPath);
    const hasBase = baseSegment.length > 2 && fc.code.includes(baseSegment);
    const hasWithoutApi = withoutApi.length > 2 && fc.code.includes(withoutApi);
    const hasBaseWithoutApi = baseWithoutApi.length > 2 && fc.code.includes(baseWithoutApi);

    if (hasFull || hasBase || hasWithoutApi || hasBaseWithoutApi) {
      matches.push(fc.file);
    }
  });

  return {
    ...ep,
    connected: matches.length > 0,
    usedIn: [...new Set(matches)]
  };
});

console.log(JSON.stringify(results, null, 2));

import fs from 'fs';
import path from 'path';

const routesDir = 'd:/Prototype/tally-backend/routes';

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (file.endsWith('.js')) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = getFiles(routesDir);

const serverJs = fs.readFileSync('d:/Prototype/tally-backend/server.js', 'utf8');

// Map server mount points
const mounts = [
  { prefix: '/auth', file: 'auth.js' },
  { prefix: '/company', file: 'companies.js' },
  { prefix: '', file: 'feedback.js' },
  { prefix: '', file: 'attendance.js' },
  { prefix: '/ledger', file: 'ledgers.js' },
  { prefix: '/voucher-entry', file: 'voucherEntry.js' },
  { prefix: '/voucher-entry', file: 'voucherEntry.bulk.js' },
  { prefix: '/orders', file: 'orders.js' },
  { prefix: '/bill', file: 'bills.js' },
  { prefix: '/ageing', file: 'ageing.js' },
  { prefix: '/sales-order', file: 'salesOrder.js' },
  { prefix: '/sales-order-item', file: 'salesOrderItem.js' },
  { prefix: '/stock-item', file: 'stockItem.js' },
  { prefix: '/stock-summary', file: 'stockSummary.js' },
  { prefix: '/invoice', file: 'invoice.routes.js' },
  { prefix: '/invoice-item', file: 'invoiceItem.routes.js' },
  { prefix: '/sync', file: 'sync.routes.js' },
  { prefix: '/inventory', file: 'inventory.js' },
  { prefix: '/users', file: 'users.js' },
  { prefix: '/api/users', file: 'users.js' },
  { prefix: '/dashboard', file: 'dashboard.js' },
  { prefix: '/api/reports', file: 'reports.js' },
  { prefix: '/api/auth', file: 'forgotPassword.js' },
  { prefix: '/send-invite', file: 'sendInvite.js' },
  { prefix: '/agent', file: 'agent.routes.js' },
  { prefix: '/invoice', file: 'invoice.bulk.js' },
  { prefix: '/invoice-item', file: 'invoiceItem.bulk.js' },
  { prefix: '/agent-status', file: 'agentStatus.js' },
  { prefix: '/voucher-command', file: 'UniversalUpdate/voucherCommand.js' },
  { prefix: '/sync-queue', file: 'syncQueueRoutes.js' },
  { prefix: '/admin/notifications', file: 'adminNotifications.js' },
  { prefix: '/notify-permission-update', file: 'notifypermissionupdate.js' },
  { prefix: '', file: 'userRequestsforAccess.js' },
  { prefix: '/api/mobile-voucher-command', file: 'UniversalUpdate/mobileVoucherCommand.js' },
  { prefix: '/api/mobile-sync-queue', file: 'mobileSyncQueueRoutes.js' },
  { prefix: '/api/mobile/notifications', file: 'mobileNotifications.js' },
  { prefix: '/ledger-items', file: 'ledgerItems.js' },
  { prefix: '/entry-field-settings', file: 'entryFieldSettings.js' },
];

const exactEndpoints = [];

for (const m of mounts) {
  const filePath = path.join(routesDir, m.file);
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf8');

  // Match router.METHOD("PATH", ...)
  const regex = /router\.(get|post|put|delete|patch)\(\s*["']([^"']+)["']/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const route = match[2];
    let full = (m.prefix + (route === '/' ? '' : route)) || '/';
    if (!full.startsWith('/')) full = '/' + full;
    exactEndpoints.push({
      method,
      path: full,
      file: m.file,
      route
    });
  }
}

// Add direct routes in server.js
const serverRegex = /app\.(get|post|put|delete|patch)\(\s*["']([^"']+)["']/g;
let sMatch;
while ((sMatch = serverRegex.exec(serverJs)) !== null) {
  exactEndpoints.push({
    method: sMatch[1].toUpperCase(),
    path: sMatch[2],
    file: 'server.js',
    route: sMatch[2]
  });
}

// Also add attendanceRoutes mounted inside attendance.js or server.js
// Check utils/attendanceRouter.js
if (fs.existsSync('d:/Prototype/tally-backend/utils/attendanceRouter.js')) {
  const attContent = fs.readFileSync('d:/Prototype/tally-backend/utils/attendanceRouter.js', 'utf8');
  const attRegex = /router\.(get|post|put|delete|patch)\(\s*["']([^"']+)["']/g;
  let aMatch;
  while ((aMatch = attRegex.exec(attContent)) !== null) {
    let full = aMatch[2];
    if (!full.startsWith('/')) full = '/' + full;
    exactEndpoints.push({
      method: aMatch[1].toUpperCase(),
      path: full,
      file: 'utils/attendanceRouter.js',
      route: aMatch[2]
    });
  }
}

// Check feedbackRouter
if (fs.existsSync('d:/Prototype/tally-backend/utils/feedbackRouter.js')) {
  const fbContent = fs.readFileSync('d:/Prototype/tally-backend/utils/feedbackRouter.js', 'utf8');
  const fbRegex = /router\.(get|post|put|delete|patch)\(\s*["']([^"']+)["']/g;
  let fMatch;
  while ((fMatch = fbRegex.exec(fbContent)) !== null) {
    let full = fMatch[2];
    if (!full.startsWith('/')) full = '/' + full;
    exactEndpoints.push({
      method: fMatch[1].toUpperCase(),
      path: full,
      file: 'utils/feedbackRouter.js',
      route: fMatch[2]
    });
  }
}

// Deduplicate exact endpoints
const unique = new Map();
for (const ep of exactEndpoints) {
  const key = `${ep.method} ${ep.path}`;
  if (!unique.has(key)) {
    unique.set(key, ep);
  }
}

console.log(`Total exact distinct endpoints found: ${unique.size}`);

// Scan frontend
const frontendFiles = [];
function scan(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) scan(p);
    else if (f.endsWith('.jsx') || f.endsWith('.js')) frontendFiles.push(p);
  }
}
scan('d:/Prototype/tally-frontend/src');

const frontendContents = frontendFiles.map(f => ({
  file: path.relative('d:/Prototype/tally-frontend/src', f).replace(/\\/g, '/'),
  content: fs.readFileSync(f, 'utf8')
}));

const report = [];
for (const [key, ep] of unique.entries()) {
  let isConnected = false;
  let foundIn = [];

  // Search for path patterns
  const pathParts = ep.path.split('/').filter(Boolean);
  const staticPrefix = '/' + pathParts.filter(p => !p.startsWith(':')).join('/');
  const basePrefix = ep.path.split('/:')[0];

  for (const fc of frontendContents) {
    if (fc.content.includes(ep.path)) {
      isConnected = true;
      foundIn.push(fc.file);
    } else if (ep.path.includes(':') && basePrefix && fc.content.includes(basePrefix)) {
      isConnected = true;
      foundIn.push(fc.file);
    }
  }

  // Also check if it's in TallyConnectorModal
  if (fcIncludesModal(ep.path)) {
    isConnected = true;
    foundIn.push('TallyConnectorModal.jsx');
  }

  function fcIncludesModal(p) {
    const modalContent = fs.readFileSync('d:/Prototype/tally-frontend/src/TallyConnectorModal.jsx', 'utf8');
    return modalContent.includes(p);
  }

  foundIn = [...new Set(foundIn)];

  report.push({
    key,
    method: ep.method,
    path: ep.path,
    file: ep.file,
    isConnected,
    foundIn
  });
}

const connectedList = report.filter(r => r.isConnected);
const remainingList = report.filter(r => !r.isConnected);

console.log(`\nCONNECTED: ${connectedList.length}`);
console.log(`REMAINING: ${remainingList.length}`);

console.log('\n--- ALL REMAINING ENDPOINTS ---');
remainingList.forEach(r => {
  console.log(`${r.method} ${r.path} (${r.file})`);
});

fs.writeFileSync('scripts/exact_audit.json', JSON.stringify({
  total: report.length,
  connectedCount: connectedList.length,
  remainingCount: remainingList.length,
  remaining: remainingList,
  connected: connectedList
}, null, 2));

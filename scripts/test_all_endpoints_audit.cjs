const fs = require('fs');

async function testAllEndpoints() {
  console.log('=== Comprehensive Backend API Data Ingestion & Retrieval Audit ===');
  const baseUrl = 'http://localhost:4000';

  // 1. Authenticate as Admin to test authenticated routes
  console.log('\n--- 1. Testing Auth & Admin Token ---');
  let adminToken = '';
  try {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'sudhirtally@gmail.com', password: '12345678', loginType: 'ADMIN' })
    });
    const data = await res.json();
    adminToken = data.token;
    console.log(`✅ POST /auth/login: Status ${res.status}, user: ${data.user?.email}, token length: ${adminToken?.length}`);
  } catch (err) {
    console.error(`❌ POST /auth/login failed:`, err.message);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  };

  // 2. Test User-facing Entities Data
  console.log('\n--- 2. Testing Core Entities Data Coming From Backend ---');
  const coreEndpoints = [
    { name: 'Companies', method: 'GET', path: '/company' },
    { name: 'Active Company', method: 'GET', path: '/company/active' },
    { name: 'Ledgers', method: 'GET', path: '/ledger' },
    { name: 'Voucher Entries', method: 'GET', path: '/voucher-entry' },
    { name: 'Bills (Receivables/Payables)', method: 'GET', path: '/bill' },
    { name: 'Orders', method: 'GET', path: '/orders' },
    { name: 'Inventory Items', method: 'GET', path: '/inventory' },
    { name: 'Stock Summary', method: 'GET', path: '/stock-summary' },
    { name: 'Dashboard Stats', method: 'GET', path: '/dashboard/stats' },
    { name: 'Users List', method: 'GET', path: '/users' },
    { name: 'Attendance Me', method: 'GET', path: '/api/attendance/me' },
    { name: 'Attendance Team', method: 'GET', path: '/api/attendance/team' },
  ];

  for (const ep of coreEndpoints) {
    try {
      const res = await fetch(`${baseUrl}${ep.path}`, {
        method: ep.method,
        headers: authHeaders
      });
      const data = await res.json();
      const count = Array.isArray(data) ? data.length : Array.isArray(data?.data) ? data.data.length : (data?.success ? 'success' : 'object');
      console.log(`✅ ${ep.method} ${ep.path} [${ep.name}]: Status ${res.status}, Records: ${count}`);
    } catch (err) {
      console.error(`❌ ${ep.method} ${ep.path} [${ep.name}] failed:`, err.message);
    }
  }

  // 3. Test Agent & Tally Connector Background Endpoints
  console.log('\n--- 3. Testing Agent & Tally Connector Background Endpoints ---');
  const agentEndpoints = [
    { name: 'Sync Active Admin', method: 'GET', path: '/sync/active-admin', auth: false },
    { name: 'Sync Trigger', method: 'POST', path: '/sync/trigger', body: {}, auth: false },
    { name: 'Agent Status (GET)', method: 'GET', path: '/agent-status/sync-status?company_guid=DEMO-COMPANY-001', auth: true },
    { name: 'Agent Status Update (POST)', method: 'POST', path: '/agent-status/sync-status', body: { company_guid: 'DEMO-COMPANY-001' }, auth: true },
    { name: 'Agent Sync Started (POST)', method: 'POST', path: '/agent-status/sync-started', body: { company_guid: 'DEMO-COMPANY-001' }, auth: true },
    { name: 'Sync Queue Pending Vouchers (GET)', method: 'GET', path: '/sync-queue/pending?company_guid=DEMO-COMPANY-001', auth: true },
    { name: 'Sync Queue Pending Bills (GET)', method: 'GET', path: '/sync-queue/pending-bills?company_guid=DEMO-COMPANY-001', auth: true },
    { name: 'Sync Queue Pending Ledgers (GET)', method: 'GET', path: '/sync-queue/pending-ledgers?company_guid=DEMO-COMPANY-001', auth: true },
    { name: 'Mobile Sync Queue Pending (GET)', method: 'GET', path: '/api/mobile-sync-queue/pending?company_guid=DEMO-COMPANY-001', auth: true },
    { name: 'Mobile Sync Queue Activity (GET)', method: 'GET', path: '/api/mobile-sync-queue/activity?company_guid=DEMO-COMPANY-001', auth: true },
    { name: 'Voucher Entry Bulk Sync (POST)', method: 'POST', path: '/voucher-entry/bulk-sync', body: { vouchers: [] }, auth: false },
    { name: 'Ledger Ingestion Sync (POST)', method: 'POST', path: '/ledger/sync', body: { ledgers: [] }, auth: false },
  ];

  for (const ep of agentEndpoints) {
    try {
      const headers = ep.auth ? authHeaders : { 'Content-Type': 'application/json' };
      const res = await fetch(`${baseUrl}${ep.path}`, {
        method: ep.method,
        headers,
        body: ep.body ? JSON.stringify(ep.body) : undefined
      });
      const data = await res.json().catch(() => ({}));
      const info = Array.isArray(data) ? `${data.length} items` : JSON.stringify(data).slice(0, 80);
      console.log(`✅ ${ep.method} ${ep.path} [${ep.name}]: Status ${res.status}, Response: ${info}`);
    } catch (err) {
      console.error(`❌ ${ep.method} ${ep.path} [${ep.name}] failed:`, err.message);
    }
  }

  // 4. Test Remaining Category Endpoints
  console.log('\n--- 4. Testing Remaining Category Endpoints ---');
  const remainingEndpoints = [
    { name: 'Entry Field Settings', method: 'GET', path: '/entry-field-settings?voucher_type=Sales', auth: true },
    { name: 'Admin Notifications', method: 'GET', path: '/admin/notifications', auth: true },
    { name: 'User Requests For Access', method: 'GET', path: '/user-requests', auth: true },
    { name: 'Forgot Password Request', method: 'POST', path: '/api/auth/forgot-password', body: { email: 'nonexistent@test.com' }, auth: false }
  ];

  for (const ep of remainingEndpoints) {
    try {
      const headers = ep.auth ? authHeaders : { 'Content-Type': 'application/json' };
      const res = await fetch(`${baseUrl}${ep.path}`, {
        method: ep.method,
        headers,
        body: ep.body ? JSON.stringify(ep.body) : undefined
      });
      const data = await res.json().catch(() => ({}));
      console.log(`✅ ${ep.method} ${ep.path} [${ep.name}]: Status ${res.status}, Response: ${JSON.stringify(data).slice(0, 80)}`);
    } catch (err) {
      console.error(`❌ ${ep.method} ${ep.path} [${ep.name}] failed:`, err.message);
    }
  }

  console.log('\n=== Endpoint Audit Completed! ===');
  process.exit(0);
}

testAllEndpoints().catch(e => {
  console.error(e);
  process.exit(1);
});

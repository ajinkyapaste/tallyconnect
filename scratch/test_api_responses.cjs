const http = require('http');

async function testLogin(username, password, loginType) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ username, password, loginType });
    const req = http.request({
      hostname: 'localhost',
      port: 4000,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function testGet(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 4000,
      path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('--- Logging in as USER (demo-ui@test.local) ---');
  const userLogin = await testLogin('demo-ui@test.local', 'Demo@1234', 'USER');
  console.log('User login status:', userLogin.status, 'token exists:', !!userLogin.body?.token);
  const userToken = userLogin.body?.token;

  if (userToken) {
    const comps = await testGet('/company/list', userToken);
    console.log('\n[GET /company/list]:', comps.body);

    const compGuid = 'DEMO-COMPANY-001';
    
    const syncStatus = await testGet(`/agent-status/sync-status?company_guid=${compGuid}`, userToken);
    console.log('\n[GET /agent-status/sync-status]:', syncStatus.body);

    const dashSummary = await testGet(`/dashboard/summary?company_guid=${compGuid}`, userToken);
    console.log('\n[GET /dashboard/summary]:', dashSummary.body);

    const incomeExp = await testGet(`/dashboard/income-expense?company_guid=${compGuid}`, userToken);
    console.log('\n[GET /dashboard/income-expense]:', incomeExp.body);

    const bills = await testGet(`/dashboard/bills?company_guid=${compGuid}`, userToken);
    console.log('\n[GET /dashboard/bills]: count =', Array.isArray(bills.body) ? bills.body.length : bills.body);

    const ledgers = await testGet(`/ledger?company_guid=${compGuid}`, userToken);
    console.log('\n[GET /ledger]: count =', Array.isArray(ledgers.body) ? ledgers.body.length : ledgers.body);

    const vouchers = await testGet(`/voucher-entry/paged?company_guid=${compGuid}&page=1&limit=5`, userToken);
    console.log('\n[GET /voucher-entry/paged]:', {
      total: vouchers.body?.meta?.total,
      rowsCount: vouchers.body?.rows?.length,
      sample: vouchers.body?.rows?.[0]
    });

    const inventory = await testGet(`/inventory?company_guid=${compGuid}`, userToken);
    console.log('\n[GET /inventory]: count =', Array.isArray(inventory.body) ? inventory.body.length : inventory.body);

    const orders = await testGet(`/orders?company_guid=${compGuid}`, userToken);
    console.log('\n[GET /orders]: count =', Array.isArray(orders.body) ? orders.body.length : orders.body);

    const pendingLedgers = await testGet(`/sync-queue/pending-ledgers?company_guid=${compGuid}`, userToken);
    console.log('\n[GET /sync-queue/pending-ledgers]: count =', Array.isArray(pendingLedgers.body) ? pendingLedgers.body.length : pendingLedgers.body);

    const pendingVouchers = await testGet(`/sync-queue/pending?company_guid=${compGuid}`, userToken);
    console.log('\n[GET /sync-queue/pending]: count =', Array.isArray(pendingVouchers.body) ? pendingVouchers.body.length : pendingVouchers.body);

    const pendingBills = await testGet(`/sync-queue/pending-bills?company_guid=${compGuid}`, userToken);
    console.log('\n[GET /sync-queue/pending-bills]: count =', Array.isArray(pendingBills.body) ? pendingBills.body.length : pendingBills.body);

    const mobileActivity = await testGet(`/api/mobile-sync-queue/activity?company_guid=${compGuid}`, userToken);
    console.log('\n[GET /api/mobile-sync-queue/activity]:', mobileActivity.body);

    const reportsMonthly = await testGet(`/api/reports/monthly-summary?company_guid=${compGuid}&year=2026`, userToken);
    console.log('\n[GET /api/reports/monthly-summary]:', Array.isArray(reportsMonthly.body) ? `Array(${reportsMonthly.body.length} months)` : reportsMonthly.body);
  }

  console.log('\n--- Logging in as ADMIN (tallyconnect@gmail.com) ---');
  const adminLogin = await testLogin('tallyconnect@gmail.com', 'abcd@123', 'ADMIN');
  console.log('Admin login status:', adminLogin.status, 'token exists:', !!adminLogin.body?.token);
  const adminToken = adminLogin.body?.token;
  if (adminToken) {
    const adminComps = await testGet('/company/list', adminToken);
    console.log('[ADMIN GET /company/list]:', adminComps.body);
    const adminActive = await testGet('/company/active', adminToken);
    console.log('[ADMIN GET /company/active]:', adminActive.body);
  }
}

run().catch(console.error);

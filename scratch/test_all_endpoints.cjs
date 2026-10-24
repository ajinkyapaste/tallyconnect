const fs = require('fs');
const path = require('path');

async function testAll() {
  const prodBase = 'https://tallymobile.utkarshmishra.online';
  
  // 1. Login
  const loginRes = await fetch(`${prodBase}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'sudhirtally@gmail.com', password: '12345678', loginType: 'ADMIN' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('Logged in. Token acquired.');

  const endpoints = JSON.parse(fs.readFileSync(path.join(__dirname, 'frontend_endpoints.json'), 'utf8'));

  const results = {
    working: [],
    param_required: [], // 400/422 but route exists
    forbidden: [],      // 403 route exists
    missing_404: [],    // 404 Route does NOT exist in backend
    method_not_allowed: [], // 405 route exists
    error_500: []
  };

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  for (let ep of endpoints) {
    let cleanEp = ep;
    if (cleanEp.endsWith('/')) {
      // test with a dummy id or test as is
      cleanEp = cleanEp + 'test-id';
    }

    try {
      // Test GET
      let res = await fetch(`${prodBase}${cleanEp}`, { headers });
      
      // If 404, also test without trailing subpath if it was modified
      if (res.status === 404 && ep !== cleanEp) {
        let resBase = await fetch(`${prodBase}${ep.replace(/\/$/, '')}`, { headers });
        if (resBase.status !== 404) {
          res = resBase;
          cleanEp = ep.replace(/\/$/, '');
        }
      }

      // If 404 and it's a known POST-only route (like /sync, /auth/login, etc), try POST
      if (res.status === 404 || res.status === 405) {
        let postRes = await fetch(`${prodBase}${cleanEp}`, { method: 'POST', headers, body: JSON.stringify({}) });
        if (postRes.status !== 404) {
          res = postRes;
        }
      }

      if (res.status === 200 || res.status === 201) {
        results.working.push({ ep, status: res.status });
      } else if (res.status === 400 || res.status === 422) {
        results.param_required.push({ ep, status: res.status });
      } else if (res.status === 403 || res.status === 401) {
        results.forbidden.push({ ep, status: res.status });
      } else if (res.status === 404) {
        results.missing_404.push({ ep, status: 404 });
      } else if (res.status === 405) {
        results.method_not_allowed.push({ ep, status: 405 });
      } else {
        results.error_500.push({ ep, status: res.status });
      }
    } catch (e) {
      results.missing_404.push({ ep, error: e.message });
    }
  }

  console.log('\n=========================================');
  console.log(`TOTAL ENDPOINTS TESTED: ${endpoints.length}`);
  console.log(`✅ WORKING (200/201): ${results.working.length}`);
  console.log(`⚠️ ROUTE EXISTS, PARAMS NEEDED (400/422): ${results.param_required.length}`);
  console.log(`🔒 ROUTE EXISTS, FORBIDDEN (403): ${results.forbidden.length}`);
  console.log(`🔁 METHOD SPECIFIC (405): ${results.method_not_allowed.length}`);
  console.log(`❌ NOT FOUND / MISSING IN BACKEND (404): ${results.missing_404.length}`);
  console.log('=========================================\n');

  console.log('--- MISSING / 404 ENDPOINTS (Present in frontend, NOT in backend) ---');
  results.missing_404.forEach(r => console.log('❌ ' + r.ep));

  fs.writeFileSync(path.join(__dirname, 'endpoint_audit_results.json'), JSON.stringify(results, null, 2));
}

testAll();

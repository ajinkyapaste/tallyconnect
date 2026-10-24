const puppeteer = require('../tally-frontend/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 1000));
  await page.type('#tc-username', 'tallyconnect@gmail.com');
  await page.type('#tc-password', 'abcd@123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2500));

  const state = await page.evaluate(async () => {
    const tc_token = localStorage.getItem('tc_token');
    const tc_active = localStorage.getItem('tc_active_company');
    const tc_cache = localStorage.getItem('tc_companies_cache');
    let compRes = null;
    let ledgersRes = null;
    try {
      const cr = await fetch('https://tallymobile.utkarshmishra.online/company', {
        headers: { Authorization: 'Bearer ' + tc_token }
      });
      compRes = await cr.json();
    } catch (e) {
      compRes = e.message;
    }

    const targetGuid = tc_active || compRes?.data?.[0]?.company_guid;
    if (targetGuid) {
      try {
        const lr = await fetch('https://tallymobile.utkarshmishra.online/ledger?company_guid=' + targetGuid, {
          headers: { Authorization: 'Bearer ' + tc_token }
        });
        ledgersRes = await lr.json();
      } catch (e) {
        ledgersRes = e.message;
      }
    }

    return { tc_active, tc_cache, compRes, targetGuid, ledgersCount: Array.isArray(ledgersRes) ? ledgersRes.length : (Array.isArray(ledgersRes?.data) ? ledgersRes.data.length : ledgersRes) };
  });

  console.log('Browser State:', JSON.stringify(state, null, 2));
  await browser.close();
})();

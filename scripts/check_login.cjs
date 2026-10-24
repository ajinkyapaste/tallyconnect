const puppeteer = require('../tally-frontend/node_modules/puppeteer');

const fs = require('fs');

(async () => {
  const chromePath = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ].find(p => fs.existsSync(p));

  const browser = await puppeteer.launch({
    headless: 'new',
    ...(chromePath ? { executablePath: chromePath } : {}),
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 1000));

  // Toggle Admin login button
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text && text.trim() === 'Admin') { await b.click(); break; }
  }

  await page.type('#tc-username', 'tallyconnect@gmail.com');
  await page.type('#tc-password', 'abcd@123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2500));

  const state = await page.evaluate(async () => {
    const tc_token = localStorage.getItem('tc_token');
    const tc_active = localStorage.getItem('tc_active_company');
    const tc_cache = localStorage.getItem('tc_companies_cache');

    let compRes = null;
    let activeRes = null;
    let ledgers = null;
    try {
      const cr = await fetch('/company', {
        headers: { Authorization: 'Bearer ' + tc_token }
      });
      compRes = await cr.json();
    } catch (e) {
      compRes = e.message;
    }

    try {
      const ar = await fetch('/company/active', {
        headers: { Authorization: 'Bearer ' + tc_token }
      });
      activeRes = await ar.json();
    } catch (e) {
      activeRes = e.message;
    }

    const cGuid = tc_active || activeRes?.company_guid || compRes?.data?.[0]?.company_guid;
    if (cGuid) {
      try {
        const lr = await fetch('/ledger?company_guid=' + cGuid, {
          headers: { Authorization: 'Bearer ' + tc_token }
        });
        ledgers = await lr.json();
      } catch (e) {
        ledgers = e.message;
      }
    }

    return {
      tc_token: !!tc_token,
      tc_active,
      compRes,
      activeRes,
      cGuid,
      ledgersCount: Array.isArray(ledgers) ? ledgers.length : (Array.isArray(ledgers?.data) ? ledgers.data.length : ledgers)
    };
  });

  console.log('App state after Admin login:', JSON.stringify(state, null, 2));
  await browser.close();
})();

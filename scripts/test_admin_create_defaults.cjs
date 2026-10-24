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
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 1200));

  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text && text.trim() === 'Admin') { await b.click(); break; }
  }
  await page.type('#tc-username', 'tallyconnect@gmail.com');
  await page.type('#tc-password', 'abcd@123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  const result = await page.evaluate(async () => {
    const tc_token = localStorage.getItem('tc_token');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + tc_token
    };

    let defRes = null;
    let enableRes = null;
    let getRes = null;

    try {
      const res = await fetch('/api/leave/types/defaults', { method: 'POST', headers });
      defRes = { status: res.status, body: await res.json() };
    } catch (e) {
      defRes = { error: e.message };
    }

    try {
      const res = await fetch('/api/leave/settings', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ enabled: true })
      });
      enableRes = { status: res.status, body: await res.json() };
    } catch (e) {
      enableRes = { error: e.message };
    }

    try {
      const res = await fetch('/api/leave/settings', { headers });
      getRes = { status: res.status, body: await res.json() };
    } catch (e) {
      getRes = { error: e.message };
    }

    return { defRes, enableRes, getRes };
  });

  console.log('Result:', JSON.stringify(result, null, 2));

  // Navigate to leave and check
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.nav-item'));
    const leaveItem = items.find(it => it.innerText && it.innerText.includes('Leave Management'));
    if (leaveItem) leaveItem.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  await new Promise(r => setTimeout(r, 1500));

  // Switch to Policy & Settings
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.nav-tab-btn, button'));
    const sBtn = btns.find(b => b.innerText && b.innerText.includes('Policy & Settings'));
    if (sBtn) sBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'scripts/verify_6_settings_with_types.png' });
  console.log('Saved scripts/verify_6_settings_with_types.png');

  await browser.close();
})();

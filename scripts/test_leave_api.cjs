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
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 1000));

  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text && text.trim() === 'Admin') { await b.click(); break; }
  }

  await page.type('#tc-username', 'tallyconnect@gmail.com');
  await page.type('#tc-password', 'abcd@123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  const leaveTest = await page.evaluate(async () => {
    const tc_token = localStorage.getItem('tc_token');
    console.log('Got tc_token:', tc_token);
    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + tc_token
    };

    let settings = null;
    let me = null;
    let team = null;
    let calendar = null;

    try {
      const res = await fetch('/api/leave/settings', { headers });
      settings = { status: res.status, data: await res.json() };
    } catch (e) {
      settings = { error: e.message };
    }

    try {
      const res = await fetch('/api/leave/me', { headers });
      me = { status: res.status, data: await res.json() };
    } catch (e) {
      me = { error: e.message };
    }

    try {
      const res = await fetch('/api/leave/calendar', { headers });
      calendar = { status: res.status, data: await res.json() };
    } catch (e) {
      calendar = { error: e.message };
    }

    return { settings, me, calendar };
  });

  console.log('Leave API responses:', JSON.stringify(leaveTest, null, 2));
  await browser.close();
})();

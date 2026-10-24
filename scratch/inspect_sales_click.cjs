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

  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER PAGEERROR:', err.message, err.stack));

  const authRes = await fetch('http://127.0.0.1:4000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'demo-ui@test.local', password: 'Demo@1234', loginType: 'USER' })
  });
  const auth = await authRes.json();
  await page.evaluateOnNewDocument((auth) => {
    localStorage.setItem('tc_token', auth.token);
    localStorage.setItem('tc_user', JSON.stringify(auth.user));
    localStorage.setItem('tc_token_origin', 'http://127.0.0.1:4000');
    localStorage.setItem('tc_active_company', 'DEMO-COMPANY-001');
    sessionStorage.setItem('tc_app_initialized', '1');
  }, auth);

  await page.goto('http://127.0.0.1:5173');
  await new Promise(r => setTimeout(r, 2000));

  // Click Reports nav item
  const repClicked = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.nav-item'));
    const rep = items.find(it => it.innerText && it.innerText.includes('Reports'));
    if (rep) { rep.click(); return true; }
    return false;
  });
  console.log('Navigated to Reports tab:', repClicked);
  await new Promise(r => setTimeout(r, 2500));

  // Check what cards are visible on Reports
  const cardsInfo = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.glass-panel, .report-item-card, div[id]'));
    return cards.map(c => ({
      id: c.id,
      className: c.className,
      text: c.innerText ? c.innerText.slice(0, 50).replace(/\n/g, ' ') : ''
    })).filter(c => c.id || c.text.toLowerCase().includes('sales'));
  });
  console.log('Cards found with sales or ID:', JSON.stringify(cardsInfo.slice(0, 15), null, 2));

  // Now trigger setActiveReport('sales-analytics') directly or click the card!
  console.log('Clicking the Sales Analytics card...');
  const clickResult = await page.evaluate(() => {
    const spotlight = document.querySelector('#tc-sales-analytics-spotlight-card');
    if (spotlight) {
      spotlight.click();
      return 'clicked #tc-sales-analytics-spotlight-card';
    }
    // Try finding by text
    const all = Array.from(document.querySelectorAll('*'));
    const el = all.find(e => e.innerText && e.innerText.trim() === 'Sales analytics');
    if (el) {
      el.click();
      return 'clicked text Sales analytics';
    }
    return 'not found';
  });
  console.log('Click result:', clickResult);

  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: 'scripts/sales_analytics_inspected.png' });
  console.log('Saved scripts/sales_analytics_inspected.png');

  const afterState = await page.evaluate(() => {
    return {
      title: document.querySelector('h1')?.innerText,
      bodyTextSnippet: document.body.innerText.slice(0, 300),
      rootChildren: document.getElementById('root')?.childElementCount,
      hasContent: document.body.innerText.includes('Sales') && document.body.innerText.includes('Invoices')
    };
  });
  console.log('State after click:', JSON.stringify(afterState, null, 2));

  await browser.close();
})();

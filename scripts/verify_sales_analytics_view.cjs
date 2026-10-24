const puppeteer = require('../tally-frontend/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

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

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('PAGE ERROR:', msg.text());
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    console.log('UNCAUGHT PAGE ERROR:', err.message);
    errors.push(err.message);
  });

  // Login as admin
  const authRes = await fetch('http://127.0.0.1:4000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'tallyconnect@gmail.com', password: 'abcd@123', loginType: 'ADMIN' })
  });
  const auth = await authRes.json();
  await page.evaluateOnNewDocument((auth) => {
    localStorage.setItem('tc_token', auth.token);
    localStorage.setItem('tc_user', JSON.stringify(auth.user));
    localStorage.setItem('tc_token_origin', 'http://127.0.0.1:4000');
    sessionStorage.setItem('tc_app_initialized', '1');
  }, auth);

  console.log('Navigating to http://127.0.0.1:5173...');
  await page.goto('http://127.0.0.1:5173');
  await page.waitForSelector('.nav-item', { timeout: 10000 });

  // Navigate to Reports tab
  console.log('Navigating to Reports tab...');
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.nav-item'));
    const rep = items.find(it => it.innerText && it.innerText.includes('Reports'));
    if (rep) rep.click();
  });

  await page.waitForFunction(() => document.body.innerText.includes('Reports'), { timeout: 8000 });
  await new Promise(r => setTimeout(r, 1500));

  // Click on "Sales analytics" spotlight card or grid card
  console.log('Clicking on Sales analytics card...');
  const clicked = await page.evaluate(() => {
    const spotlight = document.querySelector('#tc-sales-analytics-spotlight-card');
    if (spotlight) {
      spotlight.click();
      return 'spotlight-card';
    }
    const all = Array.from(document.querySelectorAll('*'));
    const target = all.find(el => el.innerText && el.innerText.trim() === 'Sales analytics');
    if (target) {
      target.click();
      return 'text-match';
    }
    return null;
  });
  console.log('Click result:', clicked);

  await new Promise(r => setTimeout(r, 1500));

  // Verify that the view rendered and did NOT go blank
  const viewState = await page.evaluate(() => {
    const headerTitle = document.querySelector('h1')?.innerText;
    const isBlank = !document.getElementById('root') || document.getElementById('root').innerHTML.trim() === '';
    const hasSalesText = document.body.innerText.includes('Sales analytics');
    const hasApiBadge = document.body.innerText.includes('API Connected') || document.body.innerText.includes('Offline Mode');
    const hasKpis = document.body.innerText.includes('Invoices') && document.body.innerText.includes('Average invoice');
    const hasChart = !!document.querySelector('svg');
    return {
      headerTitle,
      isBlank,
      hasSalesText,
      hasApiBadge,
      hasKpis,
      hasChart,
      bodyPreview: document.body.innerText.slice(0, 200)
    };
  });
  console.log('View State Result:', JSON.stringify(viewState, null, 2));

  // Capture screenshot of the working Sales Analytics report view
  const shotPath = path.resolve(__dirname, 'verify_sales_analytics_working.png');
  await page.screenshot({ path: shotPath });
  console.log('Saved screenshot to:', shotPath);

  // Test "Back to Reports" button
  console.log('Testing Back button...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const backBtn = btns.find(b => b.innerText && b.innerText.includes('Reports'));
    if (backBtn) backBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  const afterBackState = await page.evaluate(() => {
    return {
      hasReportsTitle: document.body.innerText.includes('Reports'),
      hasFinancialKpis: document.body.innerText.includes('Sales') && document.body.innerText.includes('Purchases')
    };
  });
  console.log('After Back State:', JSON.stringify(afterBackState, null, 2));

  // Now test navigating directly from Dashboard via sessionStorage
  console.log('Testing open from Dashboard Sales Analytics card...');
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.nav-item'));
    const dash = items.find(it => it.innerText && it.innerText.includes('Dashboard'));
    if (dash) dash.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  // Click Dashboard Sales Analytics card
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.glass-panel, div'));
    const salesCard = cards.find(c => c.getAttribute('title')?.includes('Sales Analytics') || c.innerText?.includes('Sales analytics'));
    if (salesCard) salesCard.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const dashOpenState = await page.evaluate(() => {
    return {
      title: document.querySelector('h1')?.innerText,
      hasSalesText: document.body.innerText.includes('Sales analytics'),
      hasChart: !!document.querySelector('svg')
    };
  });
  console.log('Dashboard navigation to Sales Analytics result:', JSON.stringify(dashOpenState, null, 2));

  await browser.close();
  console.log('All verification steps completed. Uncaught errors:', errors);
})();

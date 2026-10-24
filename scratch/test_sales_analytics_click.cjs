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

  const errors = [];
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => {
    console.log('PAGE ERROR (UNCAUGHT):', err.message, '\nStack:', err.stack);
    errors.push(err.message);
  });

  const authRes = await fetch('http://localhost:4000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'demo-ui@test.local', password: 'Demo@1234', loginType: 'USER' })
  });
  const auth = await authRes.json();
  await page.evaluateOnNewDocument((auth) => {
    localStorage.setItem('tc_token', auth.token);
    localStorage.setItem('tc_user', JSON.stringify(auth.user));
    localStorage.setItem('tc_token_origin', 'http://localhost:4000');
    localStorage.setItem('tc_active_company', 'DEMO-COMPANY-001');
    sessionStorage.setItem('tc_app_initialized', '1');
  }, auth);

  await page.goto('http://localhost:5173');
  await page.waitForSelector('.nav-item', { timeout: 10000 });

  console.log('Navigating to Reports...');
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.nav-item'));
    const repItem = items.find(it => it.innerText && it.innerText.includes('Reports'));
    if (repItem) repItem.click();
  });

  await new Promise(r => setTimeout(r, 2000));
  console.log('Reports page loaded.');

  // Find Sales analytics card / button
  console.log('Clicking on Sales Analytics spotlight card...');
  const clicked = await page.evaluate(() => {
    const spotlight = document.querySelector('#tc-sales-analytics-spotlight-card');
    if (spotlight) {
      spotlight.click();
      return 'spotlight-card';
    }
    const cards = Array.from(document.querySelectorAll('*'));
    const target = cards.find(c => c.innerText && c.innerText.trim() === 'Sales analytics');
    if (target) {
      target.click();
      return 'text-match';
    }
    return null;
  });
  console.log('Clicked element:', clicked);

  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: 'scripts/sales_analytics_demo_clicked.png' });
  console.log('Screenshot saved to scripts/sales_analytics_demo_clicked.png');

  const bodyState = await page.evaluate(() => {
    return {
      bodyTextSnippet: document.body.innerText.slice(0, 400),
      rootChildren: document.getElementById('root')?.childElementCount,
      hasError: !!document.querySelector('.error-boundary, [role="alert"]')
    };
  });
  console.log('Body State after click:', JSON.stringify(bodyState, null, 2));
  console.log('Uncaught Errors:', errors);

  await browser.close();
})();

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

  const pageErrors = [];
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' || text.includes('Error') || text.includes('Exception')) {
      console.log('PAGE LOG ERROR:', text);
    }
  });
  page.on('pageerror', err => {
    console.log('PAGE ERROR (UNCAUGHT):', err.message);
    pageErrors.push(err);
  });

  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 1500));

  // Toggle Admin login button
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text && text.trim() === 'Admin') { await b.click(); break; }
  }

  await page.type('#tc-username', 'tallyconnect@gmail.com');
  await page.type('#tc-password', 'abcd@123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 3000));

  console.log('Navigating to Reports tab...');
  const navSuccess = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.nav-item, button, [role="tab"]'));
    const rep = items.find(it => it.innerText && it.innerText.includes('Reports'));
    if (rep) {
      rep.click();
      return true;
    }
    return false;
  });
  console.log('Reports nav item found & clicked:', navSuccess);
  await new Promise(r => setTimeout(r, 2000));

  // Click Sales Analytics
  console.log('Clicking Sales Analytics...');
  const clicked = await page.evaluate(() => {
    const spotlight = document.querySelector('#tc-sales-analytics-spotlight-card');
    if (spotlight) {
      spotlight.click();
      return 'clicked #tc-sales-analytics-spotlight-card';
    }
    const allCards = Array.from(document.querySelectorAll('*'));
    const target = allCards.find(c => c.innerText && c.innerText.trim() === 'Sales analytics');
    if (target) {
      target.click();
      return 'clicked text Sales analytics';
    }
    return 'none found';
  });
  console.log('Click result:', clicked);
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: 'scripts/sales_analytics_debug.png' });
  console.log('Screenshot saved to scripts/sales_analytics_debug.png');

  const afterClick = await page.evaluate(() => {
    return {
      bodyText: document.body.innerText.slice(0, 300),
      hasContent: document.body.innerText.includes('Sales') || document.body.innerText.includes('Invoices'),
      hasError: !!document.querySelector('.error-boundary'),
      childCount: document.getElementById('root')?.children.length
    };
  });
  console.log('State after click:', afterClick);
  console.log('Page Errors:', pageErrors.map(e => e.message));

  await browser.close();
})();

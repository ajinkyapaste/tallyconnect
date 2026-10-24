const puppeteer = require('puppeteer');

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-gpu'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const problems = [];
  const consoleErrors = [];
  const networkErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + err.toString()));
  page.on('requestfailed', (req) => networkErrors.push('FAILED ' + req.url() + ' :: ' + (req.failure() || {}).errorText));
  page.on('response', async (res) => {
    const u = res.url();
    if (u.includes('localhost:4000') && res.status() >= 400) {
      networkErrors.push('HTTP ' + res.status() + ' ' + u);
    }
  });
  await page.evaluateOnNewDocument(() => {
    window.addEventListener('unhandledrejection', (event) => {
      console.log('UNHANDLED-REJECTION: ' + (event.reason && event.reason.stack ? event.reason.stack : event.reason));
    });
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 60000 });

  // Login
  await page.waitForSelector('input[type="text"]', { timeout: 20000 });
  await page.waitForSelector('input[type="password"]', { timeout: 20000 });
  await page.type('input[type="text"]', 'demo-ui@test.local');
  await page.type('input[type="password"]', 'Demo@1234');
  // default login type is USER (the "User" toggle is pre-selected)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.textContent.trim() === 'User');
    if (b && b.click) b.click();
  });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.textContent.includes('Sign In'));
    if (b) b.click();
  });
  await wait(5000);

  const bodyText = () => page.evaluate(() => document.body.innerText);

  const clickNav = async (name) => {
    const ok = await page.evaluate((nm) => {
      const items = Array.from(document.querySelectorAll('.nav-item'));
      const it = items.find((el) => el.textContent.trim().includes(nm));
      if (!it) return false;
      it.click();
      return true;
    }, name);
    await wait(1800);
    return ok;
  };

  const clickFirst = async (selector) => {
    const ok = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      el.click();
      return true;
    }, selector);
    await wait(1500);
    return ok;
  };

  const report = async (label) => {
    const txt = (await bodyText()).replace(/\n+/g, ' | ').substring(0, 600);
    console.log(`\n===== ${label} =====\n` + txt);
  };

  // Dashboard (default view)
  await report('DASHBOARD');

  // Voucher Explore main check
  await clickNav('Voucher Explore');
  await report('VOUCHER EXPLORE');
  const voucherRow = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.ios-list .list-item'));
    return items.length;
  });
  console.log('\n[VOUCHER ROWS]', voucherRow);
  await clickFirst('.ios-list .list-item');
  await report('VOUCHER DETAIL (clicked first row)');
  // close detail
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.textContent.includes('Close'));
    if (b) b.click();
  });
  await wait(800);

  // Ledger List + detail
  await clickNav('Ledger List');
  await report('LEDGER LIST');
  await clickFirst('.ios-list .list-item');
  await report('LEDGER DETAIL (clicked first row)');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.textContent.includes('Close'));
    if (b) b.click();
  });
  await wait(800);

  // Bills + detail
  await clickNav('Bills');
  await report('BILLS');
  await clickFirst('tbody tr');
  await report('BILL DETAIL (clicked first row)');

  // Invoices
  await clickNav('Invoices');
  await report('INVOICES');

  // Orders
  await clickNav('Order Book');
  await report('ORDERS');

  // Monthly Summary
  await clickNav('Monthly Summary');
  await report('MONTHLY SUMMARY');

  // Inventory
  await clickNav('Inventory');
  await report('INVENTORY');

  // Delete History
  await clickNav('Delete History');
  await report('DELETE HISTORY');
  // View History button -> history tab (LedgerList)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.textContent.includes('View History'));
    if (b) b.click();
  });
  await wait(1800);
  await report('HISTORY TAB (via View History)');

  // Companies
  await clickNav('Ledger List');
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div'));
    const d = divs.find((x) => x.textContent.trim() === '+ Add / Manage Companies');
    if (d) d.click();
  });
  await wait(1800);
  await report('COMPANIES (via dropdown)');

  console.log('\n\n=========== PROBLEMS ===========');
  console.log('CONSOLE ERRORS (' + consoleErrors.length + '):');
  consoleErrors.forEach((e) => console.log('  - ' + e));
  console.log('NETWORK ERRORS (' + networkErrors.length + '):');
  networkErrors.forEach((e) => console.log('  - ' + e));

  // Capture the current page's localStorage session for reference
  console.log('\nactive company:', await page.evaluate(() => localStorage.getItem('tc_active_company')));

  await browser.close();
})();
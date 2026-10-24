const puppeteer = require('d:/Prototype/tally-frontend/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });

  // Navigate to login
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });

  // Inject session
  await page.evaluate(() => {
    localStorage.setItem('tc_token', 'mock_token');
    localStorage.setItem('tc_token_origin', 'https://tallymobile.utkarshmishra.online');
    localStorage.setItem('tc_user', JSON.stringify({
      id: 'usr_admin',
      name: 'Admin Demo',
      email: 'admin@tallyconnect.com',
      isAdmin: true
    }));
  });

  // Intercept 401s so session stays logged in
  await page.setRequestInterception(true);
  page.on('request', req => {
    if (req.url().includes('/auth/login') || req.url().includes('/company')) {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'usr_admin', name: 'Admin Demo', email: 'admin@tallyconnect.com', isAdmin: true },
          companies: [{ guid: 'comp_demo', name: 'Pro Health Scientific Pvt Ltd' }]
        })
      });
    } else if (req.url().includes('/voucher-entry') || req.url().includes('/ledger') || req.url().includes('/inventory') || req.url().includes('/dashboard')) {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] })
      });
    } else {
      req.continue();
    }
  });

  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Navigate to Reports tab
  console.log('Switching to Reports tab...');
  const reportsTabClicked = await page.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll('.nav-item, button'));
    const repBtn = navItems.find(el => el.textContent.includes('Reports'));
    if (repBtn) {
      repBtn.click();
      return true;
    }
    return false;
  });
  console.log('Reports button clicked:', reportsTabClicked);

  await new Promise(r => setTimeout(r, 2000));

  // Screenshot 1: Main Reports Dashboard
  const p1 = 'C:/Users/User/.gemini/antigravity-ide/brain/7a0de719-6d44-4b49-8f8c-7777ec156ad1/reports_main_financial_statements.png';
  await page.screenshot({ path: p1 });
  console.log('Saved main reports screenshot to:', p1);

  // Click Profit & Loss
  console.log('Opening Profit & Loss report...');
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('h3, h2, div'));
    const pnl = cards.find(el => el.textContent.trim() === 'Profit & Loss');
    if (pnl) pnl.closest('.glass-panel').click();
  });
  await new Promise(r => setTimeout(r, 1500));
  const p2 = 'C:/Users/User/.gemini/antigravity-ide/brain/7a0de719-6d44-4b49-8f8c-7777ec156ad1/report_profit_and_loss.png';
  await page.screenshot({ path: p2 });
  console.log('Saved Profit & Loss screenshot to:', p2);

  // Back to reports
  await page.evaluate(() => {
    const backBtn = document.querySelector('button[title="Back to Reports"], .icon-btn');
    if (backBtn) backBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Click Balance Sheet
  console.log('Opening Balance Sheet report...');
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('h3, h2, div'));
    const bs = cards.find(el => el.textContent.trim() === 'Balance Sheet');
    if (bs) bs.closest('.glass-panel').click();
  });
  await new Promise(r => setTimeout(r, 1500));
  const p3 = 'C:/Users/User/.gemini/antigravity-ide/brain/7a0de719-6d44-4b49-8f8c-7777ec156ad1/report_balance_sheet.png';
  await page.screenshot({ path: p3 });
  console.log('Saved Balance Sheet screenshot to:', p3);

  // Back to reports
  await page.evaluate(() => {
    const backBtn = document.querySelector('button[title="Back to Reports"], .icon-btn');
    if (backBtn) backBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Click Trial Balance
  console.log('Opening Trial Balance report...');
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('h3, h2, div'));
    const tb = cards.find(el => el.textContent.trim() === 'Trial Balance');
    if (tb) tb.closest('.glass-panel').click();
  });
  await new Promise(r => setTimeout(r, 1500));
  const p4 = 'C:/Users/User/.gemini/antigravity-ide/brain/7a0de719-6d44-4b49-8f8c-7777ec156ad1/report_trial_balance.png';
  await page.screenshot({ path: p4 });
  console.log('Saved Trial Balance screenshot to:', p4);

  console.log('Console errors encountered:', consoleErrors.filter(e => !e.includes('401')));

  await browser.close();
})();

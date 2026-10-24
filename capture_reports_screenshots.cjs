const puppeteer = require('d:/Prototype/tally-frontend/node_modules/puppeteer');
const path = require('path');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const artifactDir = 'C:/Users/User/.gemini/antigravity-ide/brain/7a0de719-6d44-4b49-8f8c-7777ec156ad1';
  console.log('Launching browser to capture verified screenshots...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 960 }
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

  console.log('Navigating to http://localhost:5173/...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);

  // Check if on login page
  const usernameInput = await page.$('#tc-username, input[type="email"], input[placeholder*="email" i]');
  if (usernameInput) {
    console.log('On login page, logging in as Admin...');
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.innerText, b);
      if (text && text.trim() === 'Admin') {
        await b.click();
        await delay(500);
        break;
      }
    }
    
    // Type credentials
    const emailField = await page.$('input[type="email"], input[placeholder*="email" i], #tc-username');
    if (emailField) {
      await emailField.click({ clickCount: 3 });
      await emailField.type('tallyconnect@gmail.com');
    }
    const passField = await page.$('input[type="password"], #tc-password');
    if (passField) {
      await passField.click({ clickCount: 3 });
      await passField.type('abcd@123');
    }
    
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
    }
    await delay(4000);
  }

  // Ensure we are logged in and looking for Reports tab
  console.log('Looking for Reports tab...');
  const clickedReports = await page.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll('.nav-item, button, span, a'));
    const rep = navItems.find(el => el.innerText && el.innerText.trim().toLowerCase() === 'reports');
    if (rep) {
      rep.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Reports:', clickedReports);
  await delay(3000);

  // Scroll down to the Spotlight & Financial Statements section
  await page.evaluate(() => {
    const el = document.getElementById('tc-sales-analytics-spotlight-card');
    if (el) {
      el.scrollIntoView({ behavior: 'instant', block: 'start' });
    } else {
      window.scrollBy(0, 480);
    }
  });
  await delay(1000);

  // Capture Main Reports screen
  const shot1 = path.join(artifactDir, 'reports_main_financial_statements.png');
  await page.screenshot({ path: shot1, fullPage: false });
  console.log('Saved:', shot1);

  // 1. Click Profit & Loss
  console.log('Clicking Profit & Loss card...');
  const clickedPnl = await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll('h3, h4, div, span'));
    const target = headers.find(el => el.innerText && el.innerText.trim() === 'Profit & Loss');
    if (target) {
      const card = target.closest('.glass-panel, [role="button"], button') || target;
      card.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Profit & Loss:', clickedPnl);
  await delay(2500);
  const shotPnl = path.join(artifactDir, 'report_profit_and_loss.png');
  await page.screenshot({ path: shotPnl, fullPage: false });
  console.log('Saved:', shotPnl);

  // Back
  await page.evaluate(() => {
    const back = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Back') || b.title?.includes('Back'));
    if (back) back.click();
  });
  await delay(1500);

  // 2. Click Balance Sheet
  console.log('Clicking Balance Sheet card...');
  const clickedBs = await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll('h3, h4, div, span'));
    const target = headers.find(el => el.innerText && el.innerText.trim() === 'Balance Sheet');
    if (target) {
      const card = target.closest('.glass-panel, [role="button"], button') || target;
      card.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Balance Sheet:', clickedBs);
  await delay(2500);
  const shotBs = path.join(artifactDir, 'report_balance_sheet.png');
  await page.screenshot({ path: shotBs, fullPage: false });
  console.log('Saved:', shotBs);

  // Back
  await page.evaluate(() => {
    const back = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Back') || b.title?.includes('Back'));
    if (back) back.click();
  });
  await delay(1500);

  // 3. Click Trial Balance
  console.log('Clicking Trial Balance card...');
  const clickedTb = await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll('h3, h4, div, span'));
    const target = headers.find(el => el.innerText && el.innerText.trim() === 'Trial Balance');
    if (target) {
      const card = target.closest('.glass-panel, [role="button"], button') || target;
      card.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Trial Balance:', clickedTb);
  await delay(2500);
  const shotTb = path.join(artifactDir, 'report_trial_balance.png');
  await page.screenshot({ path: shotTb, fullPage: false });
  console.log('Saved:', shotTb);

  // Back
  await page.evaluate(() => {
    const back = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Back') || b.title?.includes('Back'));
    if (back) back.click();
  });
  await delay(1500);

  // 4. Click Expenses card
  console.log('Clicking Expenses card...');
  const clickedExp = await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll('h3, h4'));
    const target = headers.find(el => el.innerText && el.innerText.trim() === 'Expenses');
    if (target) {
      const card = target.closest('.glass-panel, [role="button"], button') || target;
      card.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Expenses:', clickedExp);
  await delay(2500);
  const shotExp = path.join(artifactDir, 'report_expenses_analysis.png');
  await page.screenshot({ path: shotExp, fullPage: false });
  console.log('Saved:', shotExp);

  await browser.close();
  console.log('All screenshots captured successfully!');
})();

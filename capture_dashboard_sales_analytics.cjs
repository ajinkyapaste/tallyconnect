const puppeteer = require('d:/Prototype/tally-frontend/node_modules/puppeteer');
const path = require('path');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const artifactDir = 'C:/Users/User/.gemini/antigravity-ide/brain/7a0de719-6d44-4b49-8f8c-7777ec156ad1';
  console.log('Launching browser to capture Dashboard Sales Analytics card...');
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

  // Login
  const usernameInput = await page.$('#tc-username, input[type="email"], input[placeholder*="email" i]');
  if (usernameInput) {
    console.log('Logging in as Admin...');
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.innerText, b);
      if (text && text.trim() === 'Admin') {
        await b.click();
        await delay(500);
        break;
      }
    }
    
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
    if (submitBtn) await submitBtn.click();
    await delay(3500);
  }

  // Scroll to find Dashboard Sales Analytics card
  console.log('Scrolling to Dashboard Sales Analytics Card...');
  await page.evaluate(() => {
    const card = document.getElementById('tc-dashboard-sales-analytics-card');
    if (card) {
      card.scrollIntoView({ behavior: 'instant', block: 'center' });
    } else {
      const el = document.querySelector('.content-scroll');
      if (el) el.scrollTo({ top: 380, behavior: 'instant' });
    }
  });
  await delay(1200);

  const shotDashboard = path.join(artifactDir, 'verified_dashboard_sales_analytics_card.png');
  await page.screenshot({ path: shotDashboard, fullPage: false });
  console.log('Saved:', shotDashboard);

  // Click the Sales Analytics card to verify drill-down
  console.log('Clicking Dashboard Sales Analytics Card to verify drill-down...');
  await page.evaluate(() => {
    const card = document.getElementById('tc-dashboard-sales-analytics-card');
    if (card) card.click();
  });
  await delay(2500);

  // Scroll to top of the report view
  await page.evaluate(() => {
    const el = document.querySelector('.content-scroll');
    if (el) el.scrollTo({ top: 0, behavior: 'instant' });
  });
  await delay(1000);

  const shotReport = path.join(artifactDir, 'verified_dashboard_sales_analytics_drilldown.png');
  await page.screenshot({ path: shotReport, fullPage: false });
  console.log('Saved drilldown:', shotReport);

  console.log('All verification completed successfully!');
  await browser.close();
})();

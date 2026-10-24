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
    await delay(3500);
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

  // Helper to scroll .content-scroll container
  const scrollTo = async (y) => {
    await page.evaluate((top) => {
      const el = document.querySelector('.content-scroll');
      if (el) el.scrollTo({ top, behavior: 'instant' });
      else window.scrollTo({ top, behavior: 'instant' });
    }, y);
    await delay(600);
  };

  // Scroll down to the Spotlight section
  await scrollTo(320);

  // Screenshot 0: Reports spotlight row with both Sales Analytics and Cash Flow Forecast
  const shot0 = path.join(artifactDir, 'verified_reports_spotlight_cards.png');
  await page.screenshot({ path: shot0, fullPage: false });
  console.log('Saved:', shot0);

  // ==========================================
  // PART 1: SALES ANALYTICS (Screenshots 3 & 4)
  // ==========================================
  console.log('Navigating into Sales Analytics...');
  await page.evaluate(() => {
    const el = document.getElementById('tc-sales-analytics-spotlight-card');
    if (el) el.click();
  });
  await delay(2500);

  // Scroll to top of Sales Analytics
  await scrollTo(0);

  const shotSalesTop = path.join(artifactDir, 'verified_sales_analytics_top.png');
  await page.screenshot({ path: shotSalesTop, fullPage: false });
  console.log('Saved:', shotSalesTop);

  // Scroll down to Sales by Day and Top Customers charts
  await scrollTo(550);

  const shotSalesBottom = path.join(artifactDir, 'verified_sales_analytics_charts.png');
  await page.screenshot({ path: shotSalesBottom, fullPage: false });
  console.log('Saved:', shotSalesBottom);

  // Go Back to Reports
  console.log('Clicking Back to return to Reports...');
  await page.evaluate(() => {
    const backBtn = document.querySelector('button[aria-label="Back to Reports"]') ||
      Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Reports'));
    if (backBtn) backBtn.click();
  });
  await delay(2000);

  // ==========================================
  // PART 2: CASH FLOW FORECAST (Screenshots 1, 2, 5)
  // ==========================================
  console.log('Navigating into Cash Flow Forecast...');
  await page.evaluate(() => {
    const el = document.getElementById('tc-cash-flow-forecast-spotlight-card') ||
      Array.from(document.querySelectorAll('.glass-panel')).find(p => p.innerText && p.innerText.includes('Cash flow forecast'));
    if (el) el.click();
  });
  await delay(2500);

  // Scroll to top of Cash Flow Forecast (Due dates active)
  await scrollTo(0);

  // Screenshot Due Dates view (Matching Screenshot 1)
  const shotCashDueDates = path.join(artifactDir, 'verified_cash_flow_due_dates.png');
  await page.screenshot({ path: shotCashDueDates, fullPage: false });
  console.log('Saved:', shotCashDueDates);

  // Scroll down to Week By Week list
  await scrollTo(580);

  const shotCashWeekByWeek = path.join(artifactDir, 'verified_cash_flow_week_by_week.png');
  await page.screenshot({ path: shotCashWeekByWeek, fullPage: false });
  console.log('Saved:', shotCashWeekByWeek);

  // Scroll to top and switch to "Payment habits" toggle (Matching Screenshots 2 & 5)
  console.log('Switching to Payment habits toggle...');
  await scrollTo(0);

  await page.evaluate(() => {
    const btn = document.getElementById('tc-forecast-toggle-habits') ||
      Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Payment habits'));
    if (btn) btn.click();
  });
  await delay(1200);

  const shotCashHabits = path.join(artifactDir, 'verified_cash_flow_payment_habits.png');
  await page.screenshot({ path: shotCashHabits, fullPage: false });
  console.log('Saved:', shotCashHabits);

  console.log('All verification screenshots captured successfully!');
  await browser.close();
})();

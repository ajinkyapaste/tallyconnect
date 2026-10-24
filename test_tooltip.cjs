const puppeteer = require('d:/Prototype/tally-frontend/node_modules/puppeteer');
const path = require('path');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const artifactDir = 'C:/Users/User/.gemini/antigravity-ide/brain/7a0de719-6d44-4b49-8f8c-7777ec156ad1';
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 960 }
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);

  // Login as admin
  const usernameInput = await page.$('#tc-username, input[type="email"], input[placeholder*="email" i]');
  if (usernameInput) {
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

  // Scroll to dashboard sales card
  await page.evaluate(() => {
    const card = document.getElementById('tc-dashboard-sales-analytics-card');
    if (card) card.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await delay(1000);

  // Click on the 7th data point (Oct - peak point) to trigger tooltip
  await page.evaluate(() => {
    const card = document.getElementById('tc-dashboard-sales-analytics-card');
    if (!card) return;
    const circles = card.querySelectorAll('svg circle[r="16"]');
    if (circles && circles[6]) {
      circles[6].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }
  });
  await delay(800);

  const shotTooltip = path.join(artifactDir, 'verified_dashboard_sales_analytics_tooltip.png');
  await page.screenshot({ path: shotTooltip, fullPage: false });
  console.log('Saved tooltip screenshot:', shotTooltip);

  await browser.close();
})();

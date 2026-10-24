const puppeteer = require('../tally-frontend/node_modules/puppeteer');
const path = require('path');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ARTIFACT_DIR = 'C:/Users/User/.gemini/antigravity-ide/brain/fb7ccd0c-527a-47c6-90f6-d1a922ef1db5';

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Set Mountain Lake background and company
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('tc_active_company', 'DEMO-COMPANY-001');
    localStorage.setItem('tc_bg', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2800&q=80');
  });

  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForSelector('#tc-username', { timeout: 10000 });

  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text && text.trim() === 'Admin') { await b.click(); break; }
  }
  await page.type('#tc-username', 'tallyconnect@gmail.com');
  await page.type('#tc-password', 'abcd@123');
  await page.click('button[type="submit"]');

  await page.waitForSelector('.nav-item', { timeout: 10000 });
  await delay(2000);

  // Right click the second KPI card (Payable) or options button to open the context menu just like user's screenshot
  const kpiOptionsBtn = await page.$('.kpi-card .tile-menu-btn');
  if (kpiOptionsBtn) {
    await kpiOptionsBtn.click();
    await delay(500);
  }

  const shotPath = path.join(ARTIFACT_DIR, 'current_dashboard_inspect.png');
  await page.screenshot({ path: shotPath, fullPage: false });
  console.log('Saved current dashboard screenshot to', shotPath);

  // Check what elements have backdrop-filter in DOM
  const bdfElements = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    return all
      .map(el => {
        const style = window.getComputedStyle(el);
        return {
          tag: el.tagName,
          className: el.className,
          backdropFilter: style.backdropFilter || style.webkitBackdropFilter,
          transform: style.transform,
          background: style.background,
          position: style.position,
          rect: el.getBoundingClientRect()
        };
      })
      .filter(x => x.backdropFilter && x.backdropFilter !== 'none');
  });

  console.log('Elements with backdrop-filter:', JSON.stringify(bdfElements, null, 2));

  await browser.close();
})();

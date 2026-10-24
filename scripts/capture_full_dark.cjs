const puppeteer = require('../tally-frontend/node_modules/puppeteer');
const path = require('path');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('tc_dark', '1');
  });

  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#tc-username', { timeout: 10000 });

  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text && text.trim() === 'Admin') { await b.click(); break; }
  }
  await page.type('#tc-username', 'tallyconnect@gmail.com');
  await page.type('#tc-password', 'abcd@123');
  await page.click('button[type="submit"]');

  await page.waitForSelector('.brand', { timeout: 10000 });
  await delay(2000);

  const artifactDir = 'C:/Users/User/.gemini/antigravity-ide/brain/4b949fca-6e69-4d16-9183-b723e4940aeb';
  await page.screenshot({ path: path.join(artifactDir, 'full_dashboard_dark_mode.png') });
  console.log('Captured full_dashboard_dark_mode.png');

  await browser.close();
})();

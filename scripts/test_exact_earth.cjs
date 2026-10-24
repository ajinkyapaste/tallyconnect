const puppeteer = require('../tally-frontend/node_modules/puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--ignore-gpu-blocklist']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 900 });

  await page.goto('http://localhost:5173/earth_preview.html');
  await page.waitForFunction(() => window.isReady === true, { timeout: 15000 });

  // Angle 0.08 places North America and South America in the perfect twilight sector
  await page.evaluate(() => { window.setAngle(0.08); });
  await new Promise(r => setTimeout(r, 400));

  const outPath = path.resolve(__dirname, 'earth_exact_match.png');
  await page.screenshot({ path: outPath });
  console.log('Saved exact match to', outPath);

  await browser.close();
})();

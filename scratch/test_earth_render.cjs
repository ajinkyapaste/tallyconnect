const puppeteer = require('../tally-frontend/node_modules/puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  const out = path.join(__dirname, 'earth_preview_after_update.png');
  await page.screenshot({ path: out });
  console.log('Saved screenshot:', out);

  await browser.close();
})();

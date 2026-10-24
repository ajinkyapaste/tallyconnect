const puppeteer = require('../tally-frontend/node_modules/puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--ignore-gpu-blocklist']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 768 });

  await page.evaluateOnNewDocument(() => {
    sessionStorage.clear();
  });

  await page.goto('http://localhost:5173');
  // Wait for textures to load
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({ path: 'scripts/earth_test_current.png' });
  console.log('Saved scripts/earth_test_current.png');

  await browser.close();
})();

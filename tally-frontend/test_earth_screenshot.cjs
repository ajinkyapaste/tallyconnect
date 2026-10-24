const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle'
    ]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  console.log('Navigating to http://127.0.0.1:5173/ ...');
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });

  // Take immediate screenshot of Earth loader
  await new Promise(r => setTimeout(r, 800));
  const shot1 = path.join(__dirname, 'earth_loader_preview_initial.png');
  await page.screenshot({ path: shot1 });
  console.log('Captured shot 1:', shot1);

  // Take screenshot mid-loading
  await new Promise(r => setTimeout(r, 1000));
  const shot2 = path.join(__dirname, 'earth_loader_preview_mid.png');
  await page.screenshot({ path: shot2 });
  console.log('Captured shot 2:', shot2);

  // Wait for fade out to complete (after 3.5s total)
  await new Promise(r => setTimeout(r, 2000));
  const shot3 = path.join(__dirname, 'earth_loader_preview_revealed.png');
  await page.screenshot({ path: shot3 });
  console.log('Captured shot 3 (revealed site):', shot3);

  await browser.close();
  console.log('Done.');
})();

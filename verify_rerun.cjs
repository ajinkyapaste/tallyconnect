const puppeteer = require('d:/Prototype/tally-frontend/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  const title = await page.title();
  console.log('Page Title:', title);

  const textContent = await page.evaluate(() => document.body.innerText.slice(0, 500));
  console.log('Snippet of rendered text:\n', textContent);

  const screenshotPath = 'C:/Users/User/.gemini/antigravity-ide/brain/7a0de719-6d44-4b49-8f8c-7777ec156ad1/rerun_verified_dashboard.png';
  await page.screenshot({ path: screenshotPath });
  console.log('Screenshot saved to:', screenshotPath);

  if (consoleErrors.length > 0) {
    console.log('Console errors encountered:', consoleErrors.slice(0, 5));
  } else {
    console.log('Zero console errors encountered on load!');
  }

  await browser.close();
})();

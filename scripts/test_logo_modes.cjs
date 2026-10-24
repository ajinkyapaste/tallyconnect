const puppeteer = require('../tally-frontend/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Set before load
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
  await delay(1500);

  const artifactDir = 'C:/Users/User/.gemini/antigravity-ide/brain/4b949fca-6e69-4d16-9183-b723e4940aeb';

  const brandEl = await page.$('.brand');
  await brandEl.screenshot({ path: path.join(artifactDir, 'brand_dark_mode_true.png') });
  console.log('Captured brand_dark_mode_true.png');

  const sidebarEl = await page.$('.glass-sidebar');
  if (sidebarEl) {
    await sidebarEl.screenshot({ path: path.join(artifactDir, 'sidebar_dark_mode_true.png') });
    console.log('Captured sidebar_dark_mode_true.png');
  }

  const brandInfo = await page.evaluate(() => {
    const brand = document.querySelector('.brand');
    const img = brand ? brand.querySelector('img') : null;
    return {
      imgSrc: img ? img.src : null,
      naturalWidth: img ? img.naturalWidth : null,
      naturalHeight: img ? img.naturalHeight : null,
    };
  });
  console.log('Brand Info:', JSON.stringify(brandInfo, null, 2));

  await browser.close();
})();

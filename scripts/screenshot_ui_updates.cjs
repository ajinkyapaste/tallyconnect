const puppeteer = require('../tally-frontend/node_modules/puppeteer');
const path = require('path');
const fs = require('fs');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  console.log('--- Capturing UI Verification Screenshots ---');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const artifactDir = 'C:/Users/User/.gemini/antigravity-ide/brain/fb7ccd0c-527a-47c6-90f6-d1a922ef1db5';

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

  // 1. Capture Header
  const header = await page.$('.header');
  if (header) {
    await header.screenshot({ path: path.join(artifactDir, 'header_breadcrumb_feedback_small.png') });
    console.log('✅ Captured header_breadcrumb_feedback_small.png');
  }

  // 2. Navigate to Reports page
  console.log('Navigating to Reports page...');
  await page.evaluate(() => {
    const reportsNav = Array.from(document.querySelectorAll('.nav-item')).find(el => el.textContent.includes('Reports'));
    if (reportsNav) reportsNav.click();
  });
  await delay(2000);

  await page.screenshot({ path: path.join(artifactDir, 'reports_page_small_cards.png') });
  console.log('✅ Captured reports_page_small_cards.png');

  // Also capture just the summary cards area of Reports
  const reportsCards = await page.$('.reports-summary-2x2');
  if (reportsCards) {
    await reportsCards.screenshot({ path: path.join(artifactDir, 'reports_summary_cards_closeup.png') });
    console.log('✅ Captured reports_summary_cards_closeup.png');
  }

  // 3. Navigate to Bills page
  console.log('Navigating to Bills page...');
  await page.evaluate(() => {
    const billsNav = Array.from(document.querySelectorAll('.nav-item')).find(el => el.textContent.includes('Bills'));
    if (billsNav) billsNav.click();
  });
  await delay(2000);

  await page.screenshot({ path: path.join(artifactDir, 'bills_page_small_cards.png') });
  console.log('✅ Captured bills_page_small_cards.png');

  // Also capture just the summary cards area of Bills
  const billsCards = await page.$('.grid-3');
  if (billsCards) {
    await billsCards.screenshot({ path: path.join(artifactDir, 'bills_summary_cards_closeup.png') });
    console.log('✅ Captured bills_summary_cards_closeup.png');
  }

  await browser.close();
  console.log('🎉 All verification screenshots captured successfully!');
})();

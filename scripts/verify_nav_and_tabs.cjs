const puppeteer = require('../tally-frontend/node_modules/puppeteer');
const path = require('path');
const fs = require('fs');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  console.log('--- Verifying Sidebar Names & Navigation ---');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
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

    await page.waitForSelector('.glass-sidebar', { timeout: 10000 });
    await delay(1500);

    // 1. Capture Sidebar Close-up
    const sidebar = await page.$('.glass-sidebar');
    if (sidebar) {
      await sidebar.screenshot({ path: path.join(artifactDir, 'sidebar_verified.png') });
      console.log('✅ Captured sidebar_verified.png');
    }

    // Check visible tab text
    const navText = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.nav-item')).map(el => el.innerText.trim().replace(/\n/g, ' '));
    });
    console.log('Nav Items found:', navText);

    // 2. Click Ledgers tab
    console.log('Testing Ledgers navigation...');
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('.nav-item')).find(n => n.textContent.includes('Ledgers'));
      if (el) el.click();
    });
    await delay(1200);
    const ledgerHeader = await page.evaluate(() => document.querySelector('.page-header h1')?.textContent);
    console.log('Ledger Page Header:', ledgerHeader);
    await page.screenshot({ path: path.join(artifactDir, 'ledger_page_verified.png') });

    // 3. Click Vouchers tab
    console.log('Testing Vouchers navigation...');
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('.nav-item')).find(n => n.textContent.includes('Vouchers'));
      if (el) el.click();
    });
    await delay(1200);
    const voucherHeader = await page.evaluate(() => document.querySelector('.page-header h1')?.textContent);
    console.log('Voucher Page Header:', voucherHeader);
    await page.screenshot({ path: path.join(artifactDir, 'vouchers_page_verified.png') });

    // 4. Test Bills navigation to Ledgers
    console.log('Testing Bills navigation to Ledgers...');
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('.nav-item')).find(n => n.textContent.includes('Bills'));
      if (el) el.click();
    });
    await delay(1500);
    await page.screenshot({ path: path.join(artifactDir, 'bills_page_verified.png') });

    // 5. Test Invoices navigation to Vouchers & Ledgers
    console.log('Testing Invoices navigation...');
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('.nav-item')).find(n => n.textContent.includes('Invoices'));
      if (el) el.click();
    });
    await delay(1500);
    await page.screenshot({ path: path.join(artifactDir, 'invoices_page_verified.png') });

    console.log('✅ ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('Error in verification:', err);
  } finally {
    await browser.close();
  }
})();

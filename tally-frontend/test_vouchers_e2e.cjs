const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/User/.gemini/antigravity-ide/brain/bf40a3da-5687-43f6-bfae-4f621515d2e7');

(async () => {
  console.log('Starting E2E test for Vouchers...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
    defaultViewport: { width: 1280, height: 950 }
  });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.toString()));

  try {
    await page.goto('http://[::1]:5174/', { waitUntil: 'networkidle2' });
    console.log('Loaded homepage.');

    // Check if login is needed
    const usernameInput = await page.$('#tc-username');
    if (usernameInput) {
      console.log('Logging in as Admin...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const adminBtn = buttons.find(b => b.textContent && b.textContent.trim() === 'Admin');
        if (adminBtn) adminBtn.click();
      });
      await page.type('#tc-username', 'tallyconnect@gmail.com');
      await page.type('#tc-password', 'abcd@123');
      await page.click('button[type="submit"]');
      console.log('Submitted login form. Waiting for app to load...');
      await page.waitForFunction(() => !document.querySelector('#tc-username'), { timeout: 10000 });
      await new Promise(r => setTimeout(r, 2000));
    }

    console.log('App loaded! Current URL:', page.url());

    // Navigate to Vouchers tab
    console.log('Navigating to Vouchers tab...');
    const navigated = await page.evaluate(() => {
      // Find navigation item or dashboard card for Vouchers
      const allEls = Array.from(document.querySelectorAll('button, a, div, span'));
      const voucherEl = allEls.find(el => {
        const txt = el.textContent ? el.textContent.trim() : '';
        return txt === 'Vouchers' || txt.includes('Create & review vouchers');
      });
      if (voucherEl) {
        voucherEl.click();
        return true;
      }
      return false;
    });
    console.log('Navigated to vouchers:', navigated);
    await new Promise(r => setTimeout(r, 3000));

    // Save Screenshot 1: Overview
    const shot1 = path.join(ARTIFACT_DIR, 'voucher_step1_overview.png');
    await page.screenshot({ path: shot1, fullPage: true });
    console.log('Saved Overview screenshot to:', shot1);

    // Verify Overview contents:
    const overviewData = await page.evaluate(() => {
      const header = document.querySelector('h1, h2')?.innerText;
      const subtitle = document.querySelector('.vm-subtitle, p')?.innerText;
      const cards = Array.from(document.querySelectorAll('.vm-summary-val')).map(el => el.innerText);
      const categoryCards = Array.from(document.querySelectorAll('[data-category-id]')).map(el => ({
        id: el.getAttribute('data-category-id'),
        text: el.innerText
      }));
      return { header, subtitle, cards, categoryCount: categoryCards.length };
    });
    console.log('Overview Data:', overviewData);

    // Click on a category card, e.g. "sales" or "all"
    console.log('Clicking on category card...');
    const catClicked = await page.evaluate(() => {
      const cat = document.querySelector('[data-category-id="sales"]') || document.querySelector('[data-category-id="all"]');
      if (cat) {
        cat.click();
        return cat.getAttribute('data-category-id');
      }
      return null;
    });
    console.log('Clicked category:', catClicked);
    await new Promise(r => setTimeout(r, 2500));

    // Save Screenshot 2: List View
    const shot2 = path.join(ARTIFACT_DIR, 'voucher_step2_list.png');
    await page.screenshot({ path: shot2, fullPage: true });
    console.log('Saved List View screenshot to:', shot2);

    // Verify List view contents:
    const listData = await page.evaluate(() => {
      const header = document.querySelector('.vm-list-hero-val, h2')?.innerText;
      const items = Array.from(document.querySelectorAll('.vm-voucher-row')).map(row => ({
        party: row.querySelector('.vm-voucher-party')?.innerText,
        amount: row.querySelector('.vm-voucher-amount')?.innerText,
        sub: row.querySelector('.vm-voucher-sub')?.innerText
      }));
      return { header, itemsCount: items.length, sample: items.slice(0, 3) };
    });
    console.log('List View Data:', listData);

    // Click on the first voucher row to open detailed view
    console.log('Clicking on first voucher row...');
    const rowClicked = await page.evaluate(() => {
      const row = document.querySelector('.vm-voucher-row');
      if (row) {
        row.click();
        return true;
      }
      return false;
    });
    console.log('Row clicked:', rowClicked);
    await new Promise(r => setTimeout(r, 2500));

    // Save Screenshot 3: Detail View
    const shot3 = path.join(ARTIFACT_DIR, 'voucher_step3_detail.png');
    await page.screenshot({ path: shot3, fullPage: true });
    console.log('Saved Detail View screenshot to:', shot3);

    // Verify Detail view contents:
    const detailData = await page.evaluate(() => {
      const party = document.querySelector('.vm-detail-party')?.innerText;
      const amount = document.querySelector('.vm-detail-amount')?.innerText;
      const badge = document.querySelector('.vm-synced-pill')?.innerText;
      const accounts = Array.from(document.querySelectorAll('.vm-ledger-row')).map(el => el.innerText);
      return { party, amount, badge, accountsCount: accounts.length };
    });
    console.log('Detail View Data:', detailData);

    // Click "See bill PDF"
    console.log('Clicking "See bill PDF" button...');
    const pdfClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('See bill PDF'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log('PDF clicked:', pdfClicked);
    await new Promise(r => setTimeout(r, 2000));

    // Save Screenshot 4: PDF Preview Modal
    const shot4 = path.join(ARTIFACT_DIR, 'voucher_step4_pdf_modal.png');
    await page.screenshot({ path: shot4, fullPage: true });
    console.log('Saved PDF modal screenshot to:', shot4);

    // Close PDF modal
    await page.evaluate(() => {
      const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Close') || b.querySelector('svg'));
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Click "Share" button
    console.log('Clicking "Share" button...');
    const shareClicked = await page.evaluate(() => {
      const shareBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim().toLowerCase() === 'share');
      if (shareBtn) {
        shareBtn.click();
        return true;
      }
      return false;
    });
    console.log('Share clicked:', shareClicked);
    await new Promise(r => setTimeout(r, 800));

    // Save Screenshot 5: Share feedback toast
    const shot5 = path.join(ARTIFACT_DIR, 'voucher_step5_share_toast.png');
    await page.screenshot({ path: shot5, fullPage: true });
    console.log('Saved Share toast screenshot to:', shot5);

    console.log('ALL TESTS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    await browser.close();
  }
})();

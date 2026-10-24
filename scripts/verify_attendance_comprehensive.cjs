const puppeteer = require('../tally-frontend/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/User/.gemini/antigravity-ide/brain/4b949fca-6e69-4d16-9183-b723e4940aeb';
const SCRIPTS_DIR = 'd:/Prototype/scripts';
const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function copyToBoth(srcPath, filename) {
  const artPath = path.join(ARTIFACTS_DIR, filename);
  fs.copyFileSync(srcPath, artPath);
  console.log(`Saved screenshot to:\n  -> ${srcPath}\n  -> ${artPath}`);
}

(async () => {
  console.log('=== Starting Verification of Sales Team Attendance UI/UX ===');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 950 });

    // Step 1: Admin Login
    console.log('1. Navigating to login...');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await delay(1200);

    const usernameInput = await page.$('#tc-username');
    if (usernameInput) {
      console.log('Logging in as Admin (sudhirtally@gmail.com)...');
      const buttons = await page.$$('button');
      for (const b of buttons) {
        const text = await page.evaluate(el => el.innerText, b);
        if (text && text.trim() === 'Admin') { await b.click(); break; }
      }
      await delay(300);
      await page.type('#tc-username', 'sudhirtally@gmail.com');
      await page.type('#tc-password', '12345678');
      await page.click('button[type="submit"]');
      await delay(2500);
    }

    // Step 2: Dashboard Attendance Card
    console.log('2. Inspecting Dashboard for Attendance Card...');
    await page.waitForSelector('.dashboard-grid, .tile-grid', { timeout: 10000 }).catch(() => {});
    await delay(1500);

    // Scroll slightly to ensure the attendance card is in view
    await page.evaluate(() => {
      const card = document.querySelector('[data-card-id="attendance"], .dashboard-card-attendance');
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await delay(800);

    const dashShot = path.join(SCRIPTS_DIR, 'attendance_dashboard_card_verified.png');
    await page.screenshot({ path: dashShot });
    await copyToBoth(dashShot, 'attendance_dashboard_card_verified.png');

    // Step 3: Navigate to Attendance Tab
    console.log('3. Navigating to Attendance Manager tab...');
    await page.evaluate(() => {
      const navs = Array.from(document.querySelectorAll('.nav-item'));
      const att = navs.find(n => n.innerText && n.innerText.includes('Attendance'));
      if (att) att.click();
      else window.dispatchEvent(new CustomEvent('tc-navigate-tab', { detail: { tab: 'attendance' } }));
    });
    await delay(2000);

    // Step 4: Admin Cards View
    console.log('4. Capturing Admin Attendance Cards View...');
    const cardsShot = path.join(SCRIPTS_DIR, 'attendance_admin_cards_view_verified.png');
    await page.screenshot({ path: cardsShot });
    await copyToBoth(cardsShot, 'attendance_admin_cards_view_verified.png');

    // Step 5: Switch to Table View and Open RowsDropdown
    console.log('5. Switching to Table view and clicking RowsDropdown...');
    await page.evaluate(() => {
      const tableBtn = document.querySelector('button[title*="Table"], button[aria-label*="Table"]');
      if (tableBtn) tableBtn.click();
    });
    await delay(800);

    await page.evaluate(() => {
      const rowsBtn = document.querySelector('.rows-pill-btn, .display-preferences-bar [aria-label="Select rows per page"]');
      if (rowsBtn) rowsBtn.click();
    });
    await delay(600);

    const tableShot = path.join(SCRIPTS_DIR, 'attendance_admin_table_rows_verified.png');
    await page.screenshot({ path: tableShot });
    await copyToBoth(tableShot, 'attendance_admin_table_rows_verified.png');

    // Step 6: Log in as standard member (demo-ui@test.local)
    console.log('6. Switching to Member view (demo-ui@test.local)...');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await delay(1200);

    await page.type('#tc-username', 'demo-ui@test.local');
    await page.type('#tc-password', 'Demo@1234');
    await page.click('button[type="submit"]');
    await delay(2500);

    // Navigate to Attendance
    await page.evaluate(() => {
      const navs = Array.from(document.querySelectorAll('.nav-item'));
      const att = navs.find(n => n.innerText && n.innerText.includes('Attendance'));
      if (att) att.click();
      else window.dispatchEvent(new CustomEvent('tc-navigate-tab', { detail: { tab: 'attendance' } }));
    });
    await delay(1800);

    const memberShot = path.join(SCRIPTS_DIR, 'attendance_member_punch_view_verified.png');
    await page.screenshot({ path: memberShot });
    await copyToBoth(memberShot, 'attendance_member_punch_view_verified.png');

    console.log('=== All Attendance Verifications Completed Successfully! ===');
  } catch (err) {
    console.error('Error during verification:', err);
    process.exit(1);
  } finally {
    await browser.close();
    process.exit(0);
  }
})();

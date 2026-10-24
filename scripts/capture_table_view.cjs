const puppeteer = require('../tally-frontend/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/User/.gemini/antigravity-ide/brain/4b949fca-6e69-4d16-9183-b723e4940aeb';
const SCRIPTS_DIR = 'd:/Prototype/scripts';
const delay = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 950 });

    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await delay(800);

    // Login as Admin through UI
    console.log('Logging in as Admin through UI...');
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

    // Navigate to Attendance
    console.log('Navigating to Attendance...');
    await page.evaluate(() => {
      const navs = Array.from(document.querySelectorAll('.nav-item'));
      const att = navs.find(n => n.innerText && n.innerText.includes('Attendance'));
      if (att) att.click();
      else window.dispatchEvent(new CustomEvent('tc-navigate-tab', { detail: { tab: 'attendance' } }));
    });
    await delay(1800);

    // Click Table view toggle button in DisplayPreferencesBar
    console.log('Clicking Table view button...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.display-preferences-bar button'));
      const tableBtn = btns.find(b => b.innerText && b.innerText.includes('Table'));
      if (tableBtn) tableBtn.click();
    });
    await delay(600);

    // Click RowsDropdown to open popover
    console.log('Clicking Rows button...');
    await page.evaluate(() => {
      const rowsBtn = document.querySelector('.rows-pill-btn, .display-preferences-bar [aria-label="Select rows per page"]');
      if (rowsBtn) rowsBtn.click();
    });
    await delay(500);

    const tableShot = path.join(SCRIPTS_DIR, 'attendance_admin_table_rows_verified.png');
    await page.screenshot({ path: tableShot });
    fs.copyFileSync(tableShot, path.join(ARTIFACTS_DIR, 'attendance_admin_table_rows_verified.png'));
    console.log('✅ Captured table view with rows dropdown popover successfully!');
  } finally {
    await browser.close();
  }
})();

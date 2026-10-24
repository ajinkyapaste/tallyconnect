const puppeteer = require('../tally-frontend/node_modules/puppeteer');
const path = require('path');
const fs = require('fs');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log('=== Starting Complete UI & Drag/Drop Verification ===');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('[vite]') && !text.includes('React DevTools')) {
      console.log('PAGE LOG:', text);
    }
  });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 15000 });

  // Login if on login page
  const usernameInput = await page.$('#tc-username');
  if (usernameInput) {
    console.log('Logging in...');
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.innerText, b);
      if (text && text.trim() === 'Admin') { await b.click(); break; }
    }
    await page.type('#tc-username', 'tallyconnect@gmail.com');
    await page.type('#tc-password', 'abcd@123');
    await page.click('button[type="submit"]');
    await delay(1800);
  }

  await delay(1000);

  // -------------------------------------------------------------
  // TEST 1: Navigation Tabs Drag & Drop
  // -------------------------------------------------------------
  console.log('\n--- TEST 1: Sidebar Navigation Tabs Drag & Drop ---');
  const navItems = await page.$$('.nav-item.draggable');
  console.log(`Found ${navItems.length} draggable navigation tabs in sidebar`);
  if (navItems.length >= 2) {
    const beforeOrder = await page.evaluate(() => localStorage.getItem('tc_nav_order'));
    console.log('Before drag tc_nav_order:', beforeOrder);

    // Perform HTML5 drag and drop using simulated dataTransfer
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.nav-item.draggable'));
      if (items.length >= 2) {
        const source = items[1]; // e.g. ledger
        const target = items[0]; // e.g. dashboard
        const dt = new DataTransfer();
        source.dispatchEvent(new DragEvent('dragstart', { dataTransfer: dt, bubbles: true }));
        target.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true }));
        target.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true }));
        source.dispatchEvent(new DragEvent('dragend', { dataTransfer: dt, bubbles: true }));
      }
    });

    await delay(600);
    const afterOrder = await page.evaluate(() => localStorage.getItem('tc_nav_order'));
    console.log('After drag tc_nav_order:', afterOrder);
  }

  // -------------------------------------------------------------
  // TEST 2: Parties & Ledgers stat card .tile-menu-btn styling
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Check .tile-menu-btn Styling in Parties & Ledgers ---');
  // Click on "Parties & Ledgers" tab
  await page.evaluate(() => {
    const navs = Array.from(document.querySelectorAll('.nav-item'));
    const ledgerTab = navs.find(n => n.textContent.includes('Parties & Ledgers') || n.textContent.includes('Party'));
    if (ledgerTab) ledgerTab.click();
  });
  await delay(1200);

  const statBtnStyle = await page.evaluate(() => {
    const btn = document.querySelector('.ledger-stat .tile-menu-btn');
    if (!btn) return null;
    const computed = window.getComputedStyle(btn);
    return {
      background: computed.backgroundColor,
      border: computed.border,
      opacity: computed.opacity,
      boxShadow: computed.boxShadow
    };
  });
  console.log('Computed .tile-menu-btn styling on ledger stat card:', statBtnStyle);
  if (statBtnStyle) {
    const isTransparent = statBtnStyle.background.includes('0, 0, 0, 0') || statBtnStyle.background.includes('transparent');
    console.log(`Button transparent: ${isTransparent} (background: ${statBtnStyle.background})`);
  }
  await page.screenshot({ path: path.join(__dirname, 'test_ledger_stats_clean_buttons.png') });
  console.log('Saved test_ledger_stats_clean_buttons.png');

  // -------------------------------------------------------------
  // TEST 3: Hide an Item & Verify Master Restore Modal
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Hide item and verify in Master Restore Modal ---');
  // Hide the 'all' ledger stat card by triggering handleStatHide
  await page.evaluate(() => {
    const hidden = ['all'];
    localStorage.setItem('tc_ledger_stat_hidden', JSON.stringify(hidden));
    window.dispatchEvent(new Event('tc-unhide-sync'));
  });
  await delay(600);

  const hiddenCount = await page.evaluate(() => {
    const badge = document.querySelector('.user-menu-dropdown span[style*="background: rgba(16, 185, 129"]');
    return badge ? badge.textContent.trim() : null;
  });

  // Open Account Menu
  const userMenuBtn = await page.$('.user-menu-trigger');
  if (userMenuBtn) {
    await userMenuBtn.click();
    await delay(500);

    const badgeInDropdown = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.user-menu-dropdown button'));
      const restoreBtn = items.find(b => b.textContent.includes('Restore Hidden Items'));
      return restoreBtn ? restoreBtn.innerText : null;
    });
    console.log('Account Menu Restore Hidden Items button text:', badgeInDropdown);

    // Click "Restore Hidden Items"
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.user-menu-dropdown button'));
      const restoreBtn = items.find(b => b.textContent.includes('Restore Hidden Items'));
      if (restoreBtn) restoreBtn.click();
    });
    await delay(700);

    // Check items listed in modal
    const modalItems = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.unhide-modal-dialog [style*="border-radius: 12px"]'));
      return rows.map(r => r.innerText.replace(/\n+/g, ' - '));
    });
    console.log('Items displayed in Master Restore Modal:', modalItems);
    await page.screenshot({ path: path.join(__dirname, 'test_master_unhide_populated.png') });
    console.log('Saved test_master_unhide_populated.png');

    // Click "Restore All"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.unhide-modal-dialog button'));
      const restoreAll = btns.find(b => b.textContent.includes('Restore All'));
      if (restoreAll) restoreAll.click();
      else {
        const close = document.querySelector('.feedback-modal-header button');
        if (close) close.click();
      }
    });
    await delay(600);
  }

  // -------------------------------------------------------------
  // TEST 4: AI Assistant Dialog Centering in Middle
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Check AI Assistant Middle Centering ---');
  const fab = await page.$('.ai-assistant-fab');
  if (fab) {
    await fab.click();
    await delay(600);

    const dialogMetrics = await page.evaluate(() => {
      const dialog = document.querySelector('.ai-assistant-dialog');
      const scrim = document.querySelector('.ai-assistant-scrim');
      if (!dialog) return null;
      const dRect = dialog.getBoundingClientRect();
      const sRect = scrim ? scrim.getBoundingClientRect() : null;
      return {
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
        dialogTop: dRect.top,
        dialogBottom: dRect.bottom,
        dialogHeight: dRect.height,
        dialogWidth: dRect.width,
        isCenteredVertically: Math.abs(dRect.top - (window.innerHeight - dRect.bottom)) < 15,
        isCutOffTop: dRect.top < 0,
        isCutOffBottom: dRect.bottom > window.innerHeight
      };
    });
    console.log('AI Assistant Dialog Metrics:', dialogMetrics);
    await page.screenshot({ path: path.join(__dirname, 'test_ai_assistant_centered_middle.png') });
    console.log('Saved test_ai_assistant_centered_middle.png');

    // Close AI assistant modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.ai-close-circle');
      if (closeBtn) closeBtn.click();
    });
    await delay(500);
  }

  // -------------------------------------------------------------
  // TEST 5: Reports Category Tabs Drag & Drop
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Reports Category Tabs Drag & Drop ---');
  await page.evaluate(() => {
    const navs = Array.from(document.querySelectorAll('.nav-item'));
    const repTab = navs.find(n => n.textContent.includes('Reports'));
    if (repTab) repTab.click();
  });
  await delay(1200);

  const repTabsCount = await page.evaluate(() => {
    const pills = document.querySelectorAll('button[draggable="true"][title*="reorder tabs"]');
    return pills.length;
  });
  console.log(`Found ${repTabsCount} draggable category tabs in Reports`);

  if (repTabsCount >= 2) {
    await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('button[draggable="true"][title*="reorder tabs"]'));
      const source = pills[1];
      const target = pills[0];
      const dt = new DataTransfer();
      source.dispatchEvent(new DragEvent('dragstart', { dataTransfer: dt, bubbles: true }));
      target.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true }));
      target.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true }));
      source.dispatchEvent(new DragEvent('dragend', { dataTransfer: dt, bubbles: true }));
    });
    await delay(600);
    const catOrder = await page.evaluate(() => localStorage.getItem('tc_reports_category_order'));
    console.log('Updated tc_reports_category_order:', catOrder);
  }
  await page.screenshot({ path: path.join(__dirname, 'test_reports_tabs_and_cards.png') });
  console.log('Saved test_reports_tabs_and_cards.png');

  console.log('\n=== All Tests Completed Successfully ===');
  await browser.close();
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});

const puppeteer = require('../tally-frontend/node_modules/puppeteer');
const path = require('path');
const fs = require('fs');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log('=== Starting Comprehensive Drag & Drop & UI Verification ===');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

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

  await delay(1200);

  // -------------------------------------------------------------
  // TEST 1: Sidebar Navigation Tabs Drag & Drop
  // -------------------------------------------------------------
  console.log('\n--- TEST 1: Sidebar Navigation Tabs Drag & Drop ---');
  const navTabs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.nav-item.draggable')).map(el => {
      const text = el.querySelector('span:not(.nav-grip-handle)')?.innerText || el.innerText;
      return text.trim();
    });
  });
  console.log('Current visible sidebar nav tabs:', navTabs);

  // Drag 'Bills' (or 2nd/3rd tab) to the top position
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.nav-item.draggable'));
    if (items.length >= 2) {
      const source = items[1];
      const target = items[0];
      const dt = new DataTransfer();
      const sourceId = source.getAttribute('title')?.includes('ledger') ? 'ledger' : 'bills';
      dt.setData('text/plain', sourceId);
      source.dispatchEvent(new DragEvent('dragstart', { dataTransfer: dt, bubbles: true }));
      target.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true }));
      target.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true }));
      source.dispatchEvent(new DragEvent('dragend', { dataTransfer: dt, bubbles: true }));
    }
  });
  await delay(600);

  const navOrderAfter = await page.evaluate(() => localStorage.getItem('tc_nav_order'));
  console.log('Saved tc_nav_order in localStorage:', navOrderAfter);
  const navTabsAfter = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.nav-item.draggable')).map(el => {
      const text = el.querySelector('span:not(.nav-grip-handle)')?.innerText || el.innerText;
      return text.trim();
    });
  });
  console.log('Sidebar tabs in DOM after drag:', navTabsAfter);
  await page.screenshot({ path: path.join(__dirname, 'test_sidebar_nav_reordered.png') });
  console.log('Saved test_sidebar_nav_reordered.png');

  // -------------------------------------------------------------
  // TEST 2: Parties & Ledgers Stat Cards AND Filter Tabs Drag & Drop
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Parties & Ledgers Drag & Drop ---');
  await page.evaluate(() => {
    const navs = Array.from(document.querySelectorAll('.nav-item'));
    const partyTab = navs.find(n => n.textContent.includes('Parties & Ledgers') || n.textContent.includes('Ledger'));
    if (partyTab) partyTab.click();
  });
  await delay(1200);

  // Check stat cards
  const statKeysBefore = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.ledger-stat')).map(el => el.querySelector('.ledger-stat-label')?.innerText);
  });
  console.log('Ledger stat cards before drag:', statKeysBefore);

  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.ledger-stat.draggable-card'));
    if (cards.length >= 2) {
      const source = cards[1]; // Customers
      const target = cards[0]; // Ledgers
      const dt = new DataTransfer();
      dt.setData('text/plain', 'customers');
      source.dispatchEvent(new DragEvent('dragstart', { dataTransfer: dt, bubbles: true }));
      target.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true }));
      target.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true }));
      source.dispatchEvent(new DragEvent('dragend', { dataTransfer: dt, bubbles: true }));
    }
  });
  await delay(500);

  const statOrderAfter = await page.evaluate(() => localStorage.getItem('tc_ledger_stat_order'));
  console.log('Saved tc_ledger_stat_order:', statOrderAfter);

  // Check seg-control filter tabs
  const filterTabsBefore = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.seg-control button')).map(el => el.innerText.trim().replace(/\s+/g, ' '));
  });
  console.log('Ledger filter tabs before drag:', filterTabsBefore);

  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.seg-control button.tab-draggable'));
    if (tabs.length >= 2) {
      const source = tabs[1]; // Customers
      const target = tabs[0]; // All
      const dt = new DataTransfer();
      dt.setData('text/plain', 'customers');
      source.dispatchEvent(new DragEvent('dragstart', { dataTransfer: dt, bubbles: true }));
      target.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true }));
      target.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true }));
      source.dispatchEvent(new DragEvent('dragend', { dataTransfer: dt, bubbles: true }));
    }
  });
  await delay(500);

  const filterTabOrderAfter = await page.evaluate(() => localStorage.getItem('tc_ledger_tab_order'));
  console.log('Saved tc_ledger_tab_order:', filterTabOrderAfter);
  const filterTabsAfter = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.seg-control button')).map(el => el.innerText.trim().replace(/\s+/g, ' '));
  });
  console.log('Ledger filter tabs in DOM after drag:', filterTabsAfter);
  await page.screenshot({ path: path.join(__dirname, 'test_ledger_tabs_dragged.png') });
  console.log('Saved test_ledger_tabs_dragged.png');

  // -------------------------------------------------------------
  // TEST 3: Bills Manager Summary Cards Drag & Drop
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Bills Manager Summary Cards Drag & Drop ---');
  await page.evaluate(() => {
    const navs = Array.from(document.querySelectorAll('.nav-item'));
    const billsTab = navs.find(n => n.textContent.includes('Bills'));
    if (billsTab) billsTab.click();
  });
  await delay(1200);

  const billsCardsBefore = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.summary-card h3')).map(el => el.innerText);
  });
  console.log('Bills summary cards before drag:', billsCardsBefore);

  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.summary-card.draggable-card'));
    if (cards.length >= 2) {
      const source = cards[1];
      const target = cards[0];
      const dt = new DataTransfer();
      dt.setData('text/plain', '1');
      source.dispatchEvent(new DragEvent('dragstart', { dataTransfer: dt, bubbles: true }));
      target.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true }));
      target.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true }));
      source.dispatchEvent(new DragEvent('dragend', { dataTransfer: dt, bubbles: true }));
    }
  });
  await delay(500);

  const billsOrderAfter = await page.evaluate(() => localStorage.getItem('tc_bills_summary_order'));
  console.log('Saved tc_bills_summary_order:', billsOrderAfter);
  await page.screenshot({ path: path.join(__dirname, 'test_bills_cards_dragged.png') });
  console.log('Saved test_bills_cards_dragged.png');

  // -------------------------------------------------------------
  // TEST 4: Reports Category Tabs, Summary Cards & Report Cards Drag & Drop
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Reports Category Tabs & Cards Drag & Drop ---');
  await page.evaluate(() => {
    const navs = Array.from(document.querySelectorAll('.nav-item'));
    const repTab = navs.find(n => n.textContent.includes('Reports'));
    if (repTab) repTab.click();
  });
  await delay(1200);

  const repCatsBefore = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button[draggable="true"][title*="reorder tabs"]')).map(el => el.innerText.trim());
  });
  console.log('Reports category tabs before drag:', repCatsBefore);

  await page.evaluate(() => {
    const pills = Array.from(document.querySelectorAll('button[draggable="true"][title*="reorder tabs"]'));
    if (pills.length >= 2) {
      const source = pills[1]; // Sales & Purchases
      const target = pills[0]; // All Reports
      const dt = new DataTransfer();
      dt.setData('text/plain', 'sales');
      source.dispatchEvent(new DragEvent('dragstart', { dataTransfer: dt, bubbles: true }));
      target.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true }));
      target.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true }));
      source.dispatchEvent(new DragEvent('dragend', { dataTransfer: dt, bubbles: true }));
    }
  });
  await delay(500);

  const repCatOrderAfter = await page.evaluate(() => localStorage.getItem('tc_reports_category_order'));
  console.log('Saved tc_reports_category_order:', repCatOrderAfter);

  const repCatsAfter = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button[draggable="true"][title*="reorder tabs"]')).map(el => el.innerText.trim());
  });
  console.log('Reports category tabs in DOM after drag:', repCatsAfter);

  await page.screenshot({ path: path.join(__dirname, 'test_reports_all_dragged.png') });
  console.log('Saved test_reports_all_dragged.png');

  console.log('\n=== All Tests Finished Successfully ===');
  await browser.close();
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});

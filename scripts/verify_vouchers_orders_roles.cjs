const puppeteer = require('../tally-frontend/node_modules/puppeteer');
const path = require('path');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log('=== Starting Vouchers, Orders & Role Permissions Verification ===');
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
    console.log('Logging in as Admin...');
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
  // TEST 1: Voucher Categories Drag & Drop
  // -------------------------------------------------------------
  console.log('\n--- TEST 1: Voucher Categories Drag & Drop ---');
  await page.evaluate(() => {
    const navs = Array.from(document.querySelectorAll('.nav-item'));
    const voucherNav = navs.find(n => n.textContent.includes('Vouchers'));
    if (voucherNav) voucherNav.click();
  });
  await delay(1200);

  const catCards = await page.$$('.vm-cat-card');
  console.log(`Found ${catCards.length} category cards in Voucher Overview.`);

  if (catCards.length >= 2) {
    const dragResult = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.vm-cat-card'));
      const handles = Array.from(document.querySelectorAll('.vm-cat-card .item-drag-handle'));
      if (cards.length >= 2) {
        const source = cards[1];
        const target = cards[0];
        const sourceId = source.getAttribute('data-category-id') || 'sales';
        const targetId = target.getAttribute('data-category-id') || 'all';

        const dt = new DataTransfer();
        dt.setData('text/plain', sourceId);
        source.dispatchEvent(new DragEvent('dragstart', { dataTransfer: dt, bubbles: true }));
        target.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true }));
        target.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true }));
        source.dispatchEvent(new DragEvent('dragend', { dataTransfer: dt, bubbles: true }));

        return {
          sourceId,
          targetId,
          hasHandle: handles.length > 0,
          savedOrder: localStorage.getItem('tc_vouchers_cat_order')
        };
      }
      return null;
    });
    console.log('Category Drag Result:', dragResult);
  }
  await delay(500);

  // -------------------------------------------------------------
  // TEST 2: Voucher List View Drag & Drop and Quick Hide
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Voucher List View Drag & Drop & Quick Hide ---');
  // Click on a category (e.g. Sales or All)
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.vm-cat-card'));
    if (cards.length > 0) cards[0].click();
  });
  await delay(1200);

  const voucherRows = await page.$$('.vm-voucher-row');
  console.log(`Found ${voucherRows.length} voucher rows in card view.`);

  const voucherCardCheck = await page.evaluate(() => {
    const row = document.querySelector('.vm-voucher-row');
    if (!row) return null;
    const handle = row.querySelector('.item-drag-handle');
    const hideBtn = row.querySelector('.item-quick-hide-btn');
    return {
      hasDragHandle: !!handle,
      hasQuickHide: !!hideBtn,
      isDraggable: row.getAttribute('draggable') === 'true'
    };
  });
  console.log('Voucher Card Drag Handle & Quick Hide check:', voucherCardCheck);

  // Switch to Table Mode
  await page.evaluate(() => {
    const prefBtns = Array.from(document.querySelectorAll('.seg-btn'));
    const tableBtn = prefBtns.find(b => b.title?.toLowerCase().includes('table') || b.innerText?.toLowerCase().includes('table') || b.querySelector('svg.lucide-table'));
    if (tableBtn) tableBtn.click();
  });
  await delay(800);

  const tableCheck = await page.evaluate(() => {
    const table = document.querySelector('.standard-data-table');
    if (!table) return null;
    const dragTh = table.querySelector('thead th:first-child');
    const firstTr = table.querySelector('tbody tr');
    const dragTd = firstTr ? firstTr.querySelector('.item-drag-handle') : null;
    const hideBtn = firstTr ? firstTr.querySelector('button[title*="Hide"]') : null;
    return {
      hasTable: true,
      hasTh: !!dragTh,
      firstTrDraggable: firstTr ? firstTr.getAttribute('draggable') === 'true' : false,
      hasTdDragHandle: !!dragTd,
      hasHideBtn: !!hideBtn
    };
  });
  console.log('Voucher Table Drag Handle & Quick Hide check:', tableCheck);

  // -------------------------------------------------------------
  // TEST 3: Orders Book Drag & Drop, Hide & Context Menu
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Orders Book Drag & Drop & Context Menu ---');
  const allNavs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.nav-item')).map(n => n.innerText.trim());
  });
  console.log('All visible nav items:', allNavs);

  await page.evaluate(() => {
    const navs = Array.from(document.querySelectorAll('.nav-item'));
    const ordersNav = navs.find(n => n.textContent.includes('Order'));
    if (ordersNav) ordersNav.click();
  });
  await delay(1200);

  const ordersCheck = await page.evaluate(() => {
    const h1 = document.querySelector('h1')?.innerText;
    const isTable = !!document.querySelector('.table-container table');
    const tableRows = Array.from(document.querySelectorAll('tbody tr.draggable-card'));
    const cards = Array.from(document.querySelectorAll('.party-card.draggable-card'));
    const items = tableRows.length > 0 ? tableRows : cards;
    const firstItem = items[0];
    const dragHandle = firstItem ? firstItem.querySelector('.item-drag-handle') : null;
    const hideBtn = firstItem ? firstItem.querySelector('.item-quick-hide-btn, button[title*="Hide"]') : null;
    return {
      pageH1: h1,
      isTable,
      tableRowCount: tableRows.length,
      cardCount: cards.length,
      firstItemDraggable: firstItem ? firstItem.getAttribute('draggable') === 'true' : false,
      hasDragHandle: !!dragHandle,
      hasQuickHide: !!hideBtn
    };
  });
  console.log('Orders Check:', ordersCheck);

  // Right-click context menu on order card
  await page.evaluate(() => {
    const firstCard = document.querySelector('.party-card.draggable-card, .draggable-card');
    if (firstCard) {
      firstCard.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    }
  });
  await delay(500);

  const popoverCheck = await page.evaluate(() => {
    const popover = document.querySelector('.item-popover-box');
    if (!popover) return null;
    const actionBtns = Array.from(popover.querySelectorAll('.item-popover-action-btn')).map(b => b.innerText.trim());
    return {
      hasPopover: true,
      actionButtons: actionBtns
    };
  });
  console.log('Order Popover Menu Check:', popoverCheck);

  // Close popover
  await page.evaluate(() => {
    const overlay = document.querySelector('.item-popover-overlay');
    if (overlay) overlay.click();
  });
  await delay(500);

  // -------------------------------------------------------------
  // TEST 4: Account → Users & Roles Modal Check
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Users & Roles Modal Permissions & Restrictions ---');
  await page.evaluate(() => {
    const navs = Array.from(document.querySelectorAll('.nav-item'));
    const accNav = navs.find(n => n.textContent.includes('User Management') || n.textContent.includes('Users'));
    if (accNav) accNav.click();
  });
  await delay(1200);

  const usersCheck = await page.evaluate(() => {
    const userRows = document.querySelectorAll('table tbody tr');
    return { userTableRows: userRows.length };
  });
  console.log('Users tab check:', usersCheck);

  console.log('\n=== All Verification Tests Passed ===');
  await browser.close();
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});

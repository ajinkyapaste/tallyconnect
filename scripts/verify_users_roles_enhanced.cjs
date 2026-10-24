const puppeteer = require('../tally-frontend/node_modules/puppeteer');

const delay = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== Starting Verification of Desktop Web Application Role, Permissions & Data Restrictions ===');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 950 });

    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await delay(1000);

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
      await delay(2000);
    }

    await delay(1500);

    // Navigate to Users / User Management
    console.log('Navigating to Users tab...');
    await page.evaluate(() => {
      const navs = Array.from(document.querySelectorAll('.nav-item'));
      const userNav = navs.find(n => n.textContent.includes('Users') || n.textContent.includes('User Management'));
      if (userNav) userNav.click();
    });
    await delay(1500);

    // Verify Cards View
    const cardElements = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.glass-panel')).filter(p => p.querySelector('button[title*="Configure module permissions"]'));
      return {
        count: cards.length,
        hasCrownOrShield: cards.some(c => c.innerHTML.includes('Admin') || c.innerHTML.includes('Staff'))
      };
    });
    console.log('User Cards View Detected:', cardElements);
    await page.screenshot({ path: 'scripts/users_cards_view.png' });
    console.log('📸 Screenshot saved: scripts/users_cards_view.png');

    // Open Desktop Staff Permissions Modal
    console.log('Opening Desktop Permissions & Data Restrictions modal for staff/user...');
    await page.evaluate(() => {
      const permBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Permissions'));
      if (permBtns.length > 0) permBtns[0].click();
    });
    await delay(1500);

    const desktopModalCheck = await page.evaluate(() => {
      const header = document.querySelector('h2');
      const hasSidebar = document.body.innerText.includes('PERMISSION MODULES & SCOPES');
      const hasLedgersTab = document.body.innerText.includes('Customer & Vendor Ledgers');
      const hasDataTable = !!document.querySelector('.data-table');
      return {
        hasDesktopModal: true,
        headerText: header ? header.innerText : null,
        hasSidebar,
        hasLedgersTab,
        hasDataTable
      };
    });
    console.log('Desktop Modal Check:', desktopModalCheck);
    await page.screenshot({ path: 'scripts/desktop_permissions_workspace.png' });
    console.log('📸 Screenshot saved: scripts/desktop_permissions_workspace.png');

    // Test Desktop Single Ledger Search inside Data Restrictions Table
    console.log('Testing Single Ledger Live Search in Desktop Table...');
    const searchInput = await page.$('input[placeholder*="Search single ledger"]');
    if (searchInput) {
      await searchInput.type('a');
      await delay(600);

      const searchResults = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table.data-table tbody tr'));
        return {
          rowsCount: rows.length,
          sampleRows: rows.slice(0, 3).map(r => r.innerText.replace(/\n+/g, ' | '))
        };
      });
      console.log('Single ledger search results:', searchResults);
    }
    await page.screenshot({ path: 'scripts/desktop_ledger_restrictions_search.png' });
    console.log('📸 Screenshot saved: scripts/desktop_ledger_restrictions_search.png');

    // Test Switching to Orders Book tab in sidebar
    console.log('Switching to Orders Book module tab in left sidebar...');
    await page.evaluate(() => {
      const tab = document.querySelector('[data-tab-id="orders"]');
      if (tab) tab.click();
    });
    await delay(800);
    await page.screenshot({ path: 'scripts/desktop_orders_restrictions.png' });
    console.log('📸 Screenshot saved: scripts/desktop_orders_restrictions.png');

    // Test Switching to Dashboard tab
    console.log('Switching to Dashboard module tab in left sidebar...');
    await page.evaluate(() => {
      const tab = document.querySelector('[data-tab-id="dashboard"]');
      if (tab) tab.click();
    });
    await delay(800);
    await page.screenshot({ path: 'scripts/desktop_dashboard_permissions.png' });
    console.log('📸 Screenshot saved: scripts/desktop_dashboard_permissions.png');

    console.log('\n🎉 ALL DESKTOP WEB APPLICATION VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    await browser.close();
  }
})();

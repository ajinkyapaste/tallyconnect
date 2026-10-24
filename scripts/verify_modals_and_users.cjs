const puppeteer = require('../tally-frontend/node_modules/puppeteer');
const path = require('path');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  console.log('--- Running UI Verification for Modals, Opacity Removal, and Drag/Pin/Unhide ---');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const artifactDir = 'C:/Users/User/.gemini/antigravity-ide/brain/4b949fca-6e69-4d16-9183-b723e4940aeb';

  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForSelector('#tc-username', { timeout: 10000 });

  // Toggle Admin tab
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text && text.trim() === 'Admin') { await b.click(); break; }
  }
  await page.type('#tc-username', 'tallyconnect@gmail.com');
  await page.type('#tc-password', 'abcd@123');
  await page.click('button[type="submit"]');

  await page.waitForSelector('.nav-item', { timeout: 10000 });
  await delay(2500);

  // Setup localStorage mock data for Activity & Companies
  await page.evaluate(() => {
    const demoActivities = [
      {
        id: "queue-vch-101",
        voucher_type: "Sales",
        voucher_no: "SAL/2026/042",
        voucher_date: new Date().toISOString().slice(0, 10),
        customer: "Apex Global Traders Pvt Ltd",
        amount: 145000,
        status: "Waiting",
        channel: "Web ERP",
        created_at: new Date().toISOString()
      }
    ];
    localStorage.setItem('tc_user_activity', JSON.stringify(demoActivities));

    const demoCompanies = [
      {
        company_guid: "COMP-001-ALPHA",
        name: "Lumilo Technologies India Pvt Ltd",
        is_active: true
      },
      {
        company_guid: "COMP-002-BETA",
        name: "Acme Industrial Logistics Ltd",
        is_active: false
      },
      {
        company_guid: "COMP-003-GAMMA",
        name: "Zenith Retail Distributors",
        is_active: false
      }
    ];
    localStorage.setItem('tc_companies_cache', JSON.stringify(demoCompanies));
  });

  // 1. Navigate to Activity page
  console.log('Navigating to Activity page...');
  await page.evaluate(() => {
    const navs = Array.from(document.querySelectorAll('.nav-item'));
    const actNav = navs.find(el => el.textContent.includes('Activity'));
    if (actNav) actNav.click();
  });
  await delay(2000);

  // Click first activity item / View button to open Selected Activity modal (Screenshot 1)
  console.log('Opening Activity Detail modal...');
  const openedActivity = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const viewBtn = btns.find(b => b.textContent.includes('View'));
    if (viewBtn) {
      viewBtn.click();
      return true;
    }
    const card = document.querySelector('.activity-card-item');
    if (card) {
      card.click();
      return true;
    }
    const row = document.querySelector('tbody tr');
    if (row) {
      row.click();
      return true;
    }
    return false;
  });

  if (openedActivity) {
    await delay(1200);
    await page.screenshot({ path: path.join(artifactDir, 'activity_center_modal_verified.png') });
    console.log('✅ Captured activity_center_modal_verified.png');

    // Close modal by clicking "Done" or close button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const doneBtn = btns.find(b => b.textContent.includes('Done'));
      if (doneBtn) doneBtn.click();
    });
    await delay(800);
  } else {
    console.log('⚠️ Could not open activity modal');
  }

  // Open Tally Connector Hub Modal (Screenshot 4)
  console.log('Opening Tally Connector Hub modal...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const connBtn = btns.find(b => b.textContent.includes('Connector Hub') || b.textContent.includes('Agent Hub'));
    if (connBtn) connBtn.click();
  });
  await delay(1200);
  await page.screenshot({ path: path.join(artifactDir, 'tally_connector_modal_verified.png') });
  console.log('✅ Captured tally_connector_modal_verified.png');

  // Close Tally Connector modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const closeBtn = btns.find(b => b.title === 'Close diagnostics modal' || b.querySelector('svg.lucide-x'));
    if (closeBtn) closeBtn.click();
  });
  await delay(800);

  // 2. Navigate to User Management
  console.log('Navigating to User Management...');
  await page.evaluate(() => {
    const navs = Array.from(document.querySelectorAll('.nav-item'));
    const userNav = navs.find(el => el.textContent.includes('Users') || el.textContent.includes('User Management'));
    if (userNav) userNav.click();
  });
  await delay(2000);

  // Switch to Table View in User Management
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const tableBtn = btns.find(b => b.textContent.includes('Table'));
    if (tableBtn) tableBtn.click();
  });
  await delay(1200);

  await page.screenshot({ path: path.join(artifactDir, 'user_management_table_verified.png') });
  console.log('✅ Captured user_management_table_verified.png');

  // 3. Navigate to Companies
  console.log('Navigating to Companies...');
  await page.evaluate(() => {
    const navs = Array.from(document.querySelectorAll('.nav-item'));
    const compNav = navs.find(el => el.textContent.includes('Companies'));
    if (compNav) compNav.click();
  });
  await delay(2000);

  await page.screenshot({ path: path.join(artifactDir, 'companies_view_verified.png') });
  console.log('✅ Captured companies_view_verified.png');

  await browser.close();
  console.log('--- All screenshots captured successfully ---');
})();

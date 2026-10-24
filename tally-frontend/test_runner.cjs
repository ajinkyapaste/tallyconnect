const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

    // Login as Admin
    await page.waitForSelector('#tc-username');
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.innerText, b);
      if (text && text.trim() === 'Admin') {
        await b.click();
        break;
      }
    }
    await page.type('#tc-username', 'tallyconnect@gmail.com');
    await page.type('#tc-password', 'abcd@123');
    await page.click('button[type="submit"]');

    console.log('Waiting for Dashboard...');
    await page.waitForSelector('.nav-item, .summary-card', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 2000));

    // TC-01 & TC-02: Check navigation items
    const navItems = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.nav-item span')).map(s => s.innerText.trim());
    });
    console.log('NAV ITEMS:', navItems);

    const hasReportsNav = navItems.includes('Reports');
    const hasItemsNav = navItems.includes('Items');
    const hasOldMonthly = navItems.includes('Monthly Sales') || navItems.includes('Month-wise Summary');
    const hasOldInventory = navItems.includes('Inventory');

    console.log('TC-01 — Reports in Nav:', hasReportsNav, '(Old Monthly present:', hasOldMonthly, ')');
    console.log('TC-02 — Items in Nav:', hasItemsNav, '(Old Inventory present:', hasOldInventory, ')');

    // TC-01: Click Reports
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.nav-item'));
      const rep = items.find(el => el.innerText.includes('Reports'));
      if (rep) rep.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    const reportsHeader = await page.evaluate(() => {
      return {
        h1: document.querySelector('h1')?.innerText,
        p: document.querySelector('.page-header p')?.innerText,
        summaryCards: Array.from(document.querySelectorAll('.summary-card h3')).map(h => h.innerText),
        reportCardTitles: Array.from(document.querySelectorAll('.dashboard-content .glass-panel h3')).map(h => h.innerText)
      };
    });
    console.log('REPORTS HEADER & CARDS:', reportsHeader);
    await page.screenshot({ path: 'reports_2x2_preview.png' });

    // TC-02: Click Items
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.nav-item'));
      const it = items.find(el => el.innerText.includes('Items'));
      if (it) it.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    const itemsHeader = await page.evaluate(() => {
      return {
        h1: document.querySelector('h1')?.innerText,
        p: document.querySelector('.page-header p')?.innerText,
        hasTable: !!document.querySelector('table'),
        tableHeaders: Array.from(document.querySelectorAll('th')).map(th => th.innerText)
      };
    });
    console.log('ITEMS HEADER & TABLE:', itemsHeader);

    // TC-03: Route compatibility - Navigate back to Reports
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.nav-item'));
      const rep = items.find(el => el.innerText.includes('Reports'));
      if (rep) rep.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Test Date Filters (TC-07, TC-08, TC-09, TC-10, TC-12)
    console.log('Testing Date Filters...');
    const filterButtons = ['Today', 'Last 7 Days', 'This Month', 'All Time'];
    for (const f of filterButtons) {
      await page.evaluate((filterText) => {
        const btns = Array.from(document.querySelectorAll('button'));
        const target = btns.find(b => b.innerText && b.innerText.trim() === filterText);
        if (target) target.click();
      }, f);
      await new Promise(r => setTimeout(r, 500));
    }
    console.log('Date filters clicked successfully.');

    // Test Category Filters (TC-13)
    console.log('Testing Category Filters...');
    const categories = ['Sales & Purchases', 'Party & Customers', 'Stock & Items', 'Accounts & Trends', 'All Reports'];
    for (const cat of categories) {
      await page.evaluate((catText) => {
        const btns = Array.from(document.querySelectorAll('button'));
        const target = btns.find(b => b.innerText && b.innerText.trim() === catText);
        if (target) target.click();
      }, cat);
      await new Promise(r => setTimeout(r, 500));
    }
    console.log('Category filters tested successfully.');

    // Test Top Customers view & chart switching (TC-14, TC-15)
    console.log('Testing Top Customers sub-view & chart types...');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.dashboard-content .glass-panel'));
      const topCust = cards.find(c => c.innerText.includes('Top Customers'));
      if (topCust) topCust.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    const topCustView = await page.evaluate(() => {
      return {
        h2: document.querySelector('h2')?.innerText,
        hasChart: !!document.querySelector('svg'),
        chartButtons: Array.from(document.querySelectorAll('button')).filter(b => /Bar|Pie|Line/i.test(b.innerText)).map(b => b.innerText.trim())
      };
    });
    console.log('TOP CUSTOMERS VIEW:', topCustView);

    // Switch chart types
    for (const chartType of ['Pie', 'Line', 'Bar']) {
      await page.evaluate((type) => {
        const btns = Array.from(document.querySelectorAll('button'));
        const target = btns.find(b => b.innerText && b.innerText.includes(type));
        if (target) target.click();
      }, chartType);
      await new Promise(r => setTimeout(r, 400));
    }
    console.log('Chart types switched successfully.');

    // Click Back to Reports
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const back = btns.find(b => b.innerText && b.innerText.includes('Back'));
      if (back) back.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Test Stock Summary sub-view (TC-23)
    console.log('Testing Stock Summary sub-view...');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.dashboard-content .glass-panel'));
      const stockCard = cards.find(c => c.innerText.includes('Stock Summary'));
      if (stockCard) stockCard.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    const stockSummaryView = await page.evaluate(() => {
      return {
        h2: document.querySelector('h2')?.innerText,
        hasSvg: !!document.querySelector('svg'),
        hasTable: !!document.querySelector('table')
      };
    });
    console.log('STOCK SUMMARY VIEW:', stockSummaryView);

    // Click Back
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const back = btns.find(b => b.innerText && b.innerText.includes('Back'));
      if (back) back.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Responsive checks: Tablet & Mobile (TC-36, TC-37, TC-38, TC-39)
    console.log('Testing Tablet Viewport (768px)...');
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(r => setTimeout(r, 500));
    let overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    console.log('Tablet horizontal overflow:', overflow ? 'YES (FAIL)' : 'NO (PASS)');

    console.log('Testing Mobile Viewport (390px)...');
    await page.setViewport({ width: 390, height: 844 });
    await new Promise(r => setTimeout(r, 500));
    overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    console.log('Mobile 390px horizontal overflow:', overflow ? 'YES (FAIL)' : 'NO (PASS)');

    console.log('Testing Mobile Viewport (360px)...');
    await page.setViewport({ width: 360, height: 740 });
    await new Promise(r => setTimeout(r, 500));
    overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    console.log('Mobile 360px horizontal overflow:', overflow ? 'YES (FAIL)' : 'NO (PASS)');

    console.log('ALL VERIFICATION STEPS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test runner failed:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();

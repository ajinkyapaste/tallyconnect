const puppeteer = require('../tally-frontend/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1050 });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

  // Set demo company in localStorage if needed
  await page.evaluate(() => {
    try {
      localStorage.setItem('tc_active_company', 'DEMO-COMPANY-001');
    } catch {}
  });

  // Login
  const loginField = await page.$('#tc-username');
  if (loginField) {
    console.log('Logging in...');
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.innerText, b);
      if (text && text.trim() === 'Admin') { await b.click(); break; }
    }
    await page.type('#tc-username', 'tallyconnect@gmail.com');
    await page.type('#tc-password', 'abcd@123');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.nav-item', { timeout: 15000 });
  }

  await new Promise(r => setTimeout(r, 1500));

  // Click on "Reports" nav tab
  console.log('Navigating to Reports tab...');
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.nav-item'));
    const rep = items.find(el => el.innerText.includes('Reports'));
    if (rep) rep.click();
  });

  await new Promise(r => setTimeout(r, 2000));

  // Screenshot 1: Main Reports view with Bar chart visible immediately
  console.log('Taking screenshot of Main Reports dashboard with Bar chart...');
  await page.screenshot({ path: 'scripts/reports_restored_bar_view.png', fullPage: false });

  // Click "Pie" chart toggle on the main visual analytics card
  console.log('Clicking Pie chart toggle...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const pieBtn = btns.find(b => b.textContent && b.textContent.trim().startsWith('Pie'));
    if (pieBtn) pieBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'scripts/reports_restored_pie_view.png', fullPage: false });

  // Click "Line" chart toggle on the main visual analytics card
  console.log('Clicking Line chart toggle...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const lineBtn = btns.find(b => b.textContent && b.textContent.trim().startsWith('Line'));
    if (lineBtn) lineBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'scripts/reports_restored_line_view.png', fullPage: false });

  console.log('All screenshots captured successfully!');
  await browser.close();
  process.exit(0);
})();

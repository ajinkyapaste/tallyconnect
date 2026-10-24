const puppeteer = require('../tally-frontend/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1050 });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

  // Login
  const loginField = await page.$('#tc-username');
  if (loginField) {
    console.log('Selecting Admin role & logging in...');
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

  // 1. Click on "Top Customers" card
  console.log('Clicking Top Customers report card...');
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.dashboard-content .glass-panel, .glass-panel, h3'));
    const topCust = cards.find(el => el.textContent && el.textContent.includes('Top Customers'));
    if (topCust) topCust.click();
  });

  await new Promise(r => setTimeout(r, 1200));

  // Scroll the detail view into full view
  await page.evaluate(() => {
    const detail = document.querySelector('.fade-in');
    if (detail) detail.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 500));

  await page.screenshot({ path: 'scripts/top_customers_bar_view.png', fullPage: false });
  console.log('Saved scripts/top_customers_bar_view.png');

  // 2. Click "Pie" chart toggle
  console.log('Clicking Pie chart toggle...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const pieBtn = btns.find(b => b.textContent && b.textContent.trim().includes('Pie'));
    if (pieBtn) pieBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'scripts/top_customers_pie_view.png', fullPage: false });
  console.log('Saved scripts/top_customers_pie_view.png');

  // 3. Click "Line" chart toggle
  console.log('Clicking Line chart toggle...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const lineBtn = btns.find(b => b.textContent && b.textContent.trim().includes('Line'));
    if (lineBtn) lineBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'scripts/top_customers_line_view.png', fullPage: false });
  console.log('Saved scripts/top_customers_line_view.png');

  // 4. Back to All Reports -> Open Customer & Supplier Summary
  console.log('Returning to Reports dashboard and opening Customer & Supplier Summary...');
  await page.evaluate(() => {
    const backBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Back to All Reports'));
    if (backBtn) backBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.dashboard-content .glass-panel, .glass-panel, h3'));
    const partyCard = cards.find(el => el.textContent && el.textContent.includes('Customer & Supplier Summary'));
    if (partyCard) partyCard.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Scroll into view of Visual Analysis section
  await page.evaluate(() => {
    const detail = document.querySelector('.fade-in');
    if (detail) detail.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 500));

  await page.screenshot({ path: 'scripts/party_summary_with_visuals.png', fullPage: false });
  console.log('Saved scripts/party_summary_with_visuals.png');

  await browser.close();
  console.log('Screenshots refreshed with exact element scroll!');
})().catch(console.error);

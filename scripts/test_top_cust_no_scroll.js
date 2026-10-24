const puppeteer = require('../tally-frontend/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950 });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

  // Login
  const loginField = await page.$('#tc-username');
  if (loginField) {
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

  // Navigate to Reports tab
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.nav-item'));
    const rep = items.find(el => el.innerText.includes('Reports'));
    if (rep) rep.click();
  });

  await new Promise(r => setTimeout(r, 1500));

  // Click on "Top Customers" card
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.dashboard-content .glass-panel, .glass-panel, h3'));
    const topCust = cards.find(el => el.textContent && el.textContent.includes('Top Customers'));
    if (topCust) topCust.click();
  });

  await new Promise(r => setTimeout(r, 1000));

  // Take screenshot WITHOUT ANY SCROLL (scrollY = 0)
  await page.screenshot({ path: 'scripts/top_customers_no_scroll.png', fullPage: false });
  console.log('Saved scripts/top_customers_no_scroll.png without scroll!');

  await browser.close();
})().catch(console.error);

const puppeteer = require('../tally-frontend/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message, err.stack));

  console.log('Opening http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  
  // Login
  await page.waitForSelector('#tc-username');
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text && text.trim() === 'Admin') { await b.click(); break; }
  }
  await page.type('#tc-username', 'tallyconnect@gmail.com');
  await page.type('#tc-password', 'abcd@123');
  await page.click('button[type="submit"]');

  await page.waitForSelector('.nav-item', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1500));

  // Go to Reports
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.nav-item'));
    const rep = items.find(el => el.innerText.includes('Reports'));
    if (rep) rep.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  console.log('Looking for Customer & Supplier Summary card...');
  const clicked = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.dashboard-content .glass-panel, .glass-panel'));
    const target = cards.find(c => c.innerText && c.innerText.includes('Customer & Supplier Summary'));
    if (target) {
      target.click();
      return true;
    }
    return false;
  });

  console.log('Card clicked:', clicked);
  await new Promise(r => setTimeout(r, 2000));

  // Scroll down to the table
  await page.evaluate(() => {
    const el = document.querySelector('.dashboard-content') || document.querySelector('.app-main') || document.querySelector('main');
    if (el) el.scrollTop = 900;
    const all = Array.from(document.querySelectorAll('*'));
    for (const c of all) {
      if (c.scrollHeight > c.clientHeight && c.clientHeight > 300) {
        c.scrollTop = 3000;
      }
    }
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'customer_summary_click.png' });

  const result = await page.evaluate(() => {
    return {
      h1: document.querySelector('h1')?.innerText,
      h2: document.querySelector('h2')?.innerText,
      hasTable: !!document.querySelector('table'),
      rowCount: document.querySelectorAll('tr').length,
      firstTrText: document.querySelector('tbody tr')?.innerText
    };
  });
  console.log('Result after click:', result);

  await browser.close();
})();

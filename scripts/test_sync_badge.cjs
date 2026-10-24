const puppeteer = require('../tally-frontend/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950 });
  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 1200));

  const usernameInput = await page.$('#tc-username');
  if (usernameInput) {
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.innerText, b);
      if (text && text.trim() === 'Admin') { await b.click(); break; }
    }
    await page.type('#tc-username', 'tallyconnect@gmail.com');
    await page.type('#tc-password', 'abcd@123');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 2000));
  }

  // Click company dropdown to select Lumilo
  await page.evaluate(() => {
    const compBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Select Company') || b.textContent.includes('Lumilo'));
    if (compBtn) compBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('*')).filter(el => el.textContent && el.textContent.includes('Lumilo'));
    // click the deepest item with Lumilo
    const target = items[items.length - 1];
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const syncText = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*')).filter(el => el.textContent && el.textContent.includes('Last Sync:'));
    return els[0] ? els[0].innerText.replace(/\n/g, ' ') : 'Not found';
  });
  console.log('Resulting Header Sync Badge:', syncText);

  await page.screenshot({ path: 'scripts/verified_live_header_badge.png' });
  console.log('📸 Screenshot saved: scripts/verified_live_header_badge.png');
  await browser.close();
})();

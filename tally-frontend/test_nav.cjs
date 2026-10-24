const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('http://[::1]:5174/', { waitUntil: 'networkidle2' });

  // Login
  await page.evaluate(() => {
    const adminBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Admin');
    if (adminBtn) adminBtn.click();
  });
  await page.type('#tc-username', 'tallyconnect@gmail.com');
  await page.type('#tc-password', 'abcd@123');
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => !document.querySelector('#tc-username'), { timeout: 10000 });
  await new Promise(r => setTimeout(r, 2000));

  console.log('Clicking .nav-item[title*="Vouchers"] using puppeteer page.click...');
  await page.click('.nav-item[title*="Vouchers"]');

  await new Promise(r => setTimeout(r, 2000));

  const afterClick = await page.evaluate(() => {
    return {
      h1: document.querySelector('h1')?.innerText,
      hasVouchersHeader: !!document.querySelector('.vm-header'),
      hasVouchersContainer: !!document.querySelector('.vm-container'),
      bodySnippet: document.body.innerText.slice(0, 300)
    };
  });
  console.log('After click:', afterClick);

  await browser.close();
})();

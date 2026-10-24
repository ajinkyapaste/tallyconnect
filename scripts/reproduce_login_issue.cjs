const puppeteer = require('../tally-frontend/node_modules/puppeteer');
const fs = require('fs');

(async () => {
  const chromePath = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ].find(p => fs.existsSync(p));

  const browser = await puppeteer.launch({
    headless: 'new',
    ...(chromePath ? { executablePath: chromePath } : {}),
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('requestfailed', req => console.log('REQ FAILED:', req.url(), req.failure().errorText));
  page.on('response', async res => {
    if (res.status() >= 400) {
      console.log(`HTTP ${res.status()} on ${res.url()}`);
      try {
        const text = await res.text();
        console.log(`   Response text: ${text.slice(0, 150)}`);
      } catch {}
    }
  });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173');
  await page.waitForSelector('#tc-username');

  // Try Admin Login
  console.log('Testing Admin Login...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const adminBtn = btns.find(b => b.textContent && b.textContent.trim() === 'Admin');
    if (adminBtn) adminBtn.click();
  });
  await new Promise(r => setTimeout(r, 300));
  await page.type('#tc-username', 'tallyconnect@gmail.com');
  await page.type('#tc-password', 'abcd@123');
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: 'scripts/login_result_admin.png' });
  console.log('Saved scripts/login_result_admin.png');

  const finalUrl = page.url();
  const tokenInStorage = await page.evaluate(() => localStorage.getItem('tc_token'));
  const userInStorage = await page.evaluate(() => localStorage.getItem('tc_user'));
  console.log('Final URL:', finalUrl);
  console.log('Token in storage:', tokenInStorage ? 'PRESENT (len: ' + tokenInStorage.length + ')' : 'NULL');
  console.log('User in storage:', userInStorage);

  await browser.close();
})();

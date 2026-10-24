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

  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('response', async res => {
    if (res.status() >= 400) {
      console.log(`HTTP ${res.status()} on ${res.url()}:`, await res.text().catch(() => ''));
    }
  });

  console.log('Navigating...');
  await page.goto('http://localhost:5173');
  await page.waitForSelector('#tc-username');

  // Select Admin tab
  console.log('Selecting Admin...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const adminBtn = btns.find(b => b.textContent && b.textContent.trim() === 'Admin');
    if (adminBtn) adminBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  await page.type('#tc-username', 'tallyconnect@gmail.com');
  await page.type('#tc-password', 'abcd@123');
  console.log('Submitting login...');
  await page.click('button[type="submit"]');

  // Wait 4 seconds for full dashboard load
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: 'scripts/verify_admin_stayed_logged_in.png' });
  console.log('Saved scripts/verify_admin_stayed_logged_in.png');

  const token = await page.evaluate(() => localStorage.getItem('tc_token'));
  const user = await page.evaluate(() => localStorage.getItem('tc_user'));
  console.log('Token status:', token ? 'ACTIVE (length: ' + token.length + ')' : 'NULL (logged out)');
  console.log('User status:', user ? 'LOGGED IN: ' + JSON.parse(user).email : 'NULL');

  await browser.close();
})();

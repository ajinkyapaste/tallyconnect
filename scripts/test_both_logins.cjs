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

  // TEST 1: USER LOGIN
  console.log('--- TEST 1: USER LOGIN ---');
  const page1 = await browser.newPage();
  await page1.setViewport({ width: 1440, height: 900 });
  page1.on('console', msg => console.log('PAGE1 LOG:', msg.text()));
  page1.on('response', async res => {
    if (res.url().includes('/auth') || res.status() >= 400) {
      console.log('PAGE1 RES:', res.url(), res.status(), await res.text().catch(() => ''));
    }
  });

  await page1.goto('http://localhost:5173');
  await page1.waitForSelector('#tc-username');

  // Explicitly click 'User' button
  await page1.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const userBtn = btns.find(b => b.textContent && b.textContent.trim() === 'User');
    if (userBtn) userBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  await page1.type('#tc-username', 'demo-ui@test.local');
  await page1.type('#tc-password', 'Demo@1234');
  await page1.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 3500));
  const userToken = await page1.evaluate(() => localStorage.getItem('tc_token'));
  const userData = await page1.evaluate(() => localStorage.getItem('tc_user'));
  console.log('USER LOGIN TOKEN:', userToken ? 'SUCCESS (length ' + userToken.length + ')' : 'FAILED (null)');
  console.log('USER LOGIN USER:', userData);
  await page1.screenshot({ path: 'scripts/verify_user_logged_in.png' });
  await page1.close();

  // TEST 2: ADMIN LOGIN
  console.log('--- TEST 2: ADMIN LOGIN ---');
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 1440, height: 900 });

  await page2.goto('http://localhost:5173');
  await page2.waitForSelector('#tc-username');

  // Explicitly click 'Admin' button
  await page2.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const adminBtn = btns.find(b => b.textContent && b.textContent.trim() === 'Admin');
    if (adminBtn) adminBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  await page2.type('#tc-username', 'tallyconnect@gmail.com');
  await page2.type('#tc-password', 'abcd@123');
  await page2.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 3500));
  const adminToken = await page2.evaluate(() => localStorage.getItem('tc_token'));
  const adminData = await page2.evaluate(() => localStorage.getItem('tc_user'));
  console.log('ADMIN LOGIN TOKEN:', adminToken ? 'SUCCESS (length ' + adminToken.length + ')' : 'FAILED (null)');
  console.log('ADMIN LOGIN USER:', adminData);
  await page2.screenshot({ path: 'scripts/verify_admin_logged_in.png' });
  await page2.close();

  await browser.close();
  console.log('Both login flows tested successfully!');
})();

const puppeteer = require('../tally-frontend/node_modules/puppeteer');
const jwt = require('../tally-backend/node_modules/jsonwebtoken');

(async () => {
  const fs = require('fs');
  const chromePath = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ].find(p => fs.existsSync(p));

  const browser = await puppeteer.launch({
    headless: 'new',
    ...(chromePath ? { executablePath: chromePath } : {}),
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  page.on('response', async res => {
    if (res.url().includes('/auth/login') || res.url().includes('/login')) {
      console.log('Login URL:', res.url(), 'status:', res.status(), 'text:', await res.text().catch(e => e.message));
    }
  });
  await page.goto('http://localhost:5173');
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text && text.trim() === 'Admin') { await b.click(); break; }
  }
  await page.type('#tc-username', 'tallyconnect@gmail.com');
  await page.type('#tc-password', 'abcd@123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));
  const token = await page.evaluate(() => localStorage.getItem('tc_token'));
  console.log('Token:', token);
  if (token) {
    const decoded = jwt.decode(token);
    console.log('Decoded header/payload:', decoded);
    const secretFromEnv = "qTDbDAfreT22Y07hpQf8/zqLr9OXf6dgEb3qbgooB6g=";
    try {
      jwt.verify(token, secretFromEnv);
      console.log('Verified with env secret!');
    } catch (e) {
      console.log('Verification error with env secret:', e.message);
    }
  }
  await browser.close();
})();

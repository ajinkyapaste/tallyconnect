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

  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 1200));

  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text && text.trim() === 'Admin') { await b.click(); break; }
  }
  await page.type('#tc-username', 'tallyconnect@gmail.com');
  await page.type('#tc-password', 'abcd@123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  // Navigate to Leave Management
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.nav-item'));
    const leaveItem = items.find(it => it.innerText && it.innerText.includes('Leave Management'));
    if (leaveItem) leaveItem.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  await new Promise(r => setTimeout(r, 1500));

  // Switch to Policy & Settings sub-tab
  console.log('Clicking Policy & Settings...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.nav-tab-btn, button'));
    const sBtn = btns.find(b => b.innerText && b.innerText.includes('Policy & Settings'));
    if (sBtn) sBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'scripts/verify_settings_tab.png' });
  console.log('Saved scripts/verify_settings_tab.png');

  // Click "Add Default Types" button if present
  console.log('Clicking Add Default Types...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const defBtn = btns.find(b => b.innerText && b.innerText.includes('Add Default Types'));
    if (defBtn) defBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Toggle Module Enable
  console.log('Toggling Module Enable...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const toggleBtn = btns.find(b => b.innerText && (b.innerText.includes('Enable Module') || b.innerText.includes('Disable Module')));
    if (toggleBtn) toggleBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'scripts/verify_settings_enabled.png' });
  console.log('Saved scripts/verify_settings_enabled.png');

  // Switch to Team Calendar tab
  console.log('Clicking Team Calendar...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.nav-tab-btn, button'));
    const cBtn = btns.find(b => b.innerText && b.innerText.includes('Team Calendar'));
    if (cBtn) cBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'scripts/verify_calendar_tab.png' });
  console.log('Saved scripts/verify_calendar_tab.png');

  await browser.close();
  console.log('All tabs verified!');
})();

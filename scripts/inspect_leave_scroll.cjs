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
  await page.waitForSelector('#tc-username');

  // Log in as Admin
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const adminBtn = btns.find(b => b.textContent && b.textContent.trim() === 'Admin');
    if (adminBtn) adminBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.type('#tc-username', 'tallyconnect@gmail.com');
  await page.type('#tc-password', 'abcd@123');
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 2500));

  // Navigate to Leave Management
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.nav-item'));
    const leaveItem = items.find(it => it.innerText && it.innerText.includes('Leave Management'));
    if (leaveItem) leaveItem.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  await new Promise(r => setTimeout(r, 1500));

  // Screenshot 1: Leave Management Admin default (top)
  await page.screenshot({ path: 'scripts/leave_admin_top.png' });

  // Scroll down
  await page.evaluate(() => {
    const scrollContainer = document.querySelector('.content-scroll');
    if (scrollContainer) scrollContainer.scrollTop = 500;
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'scripts/leave_admin_scrolled.png' });

  // Click on Calendar tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.nav-tab-btn'));
    const calBtn = btns.find(b => b.innerText && b.innerText.includes('Calendar'));
    if (calBtn) calBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'scripts/leave_admin_calendar.png' });

  // Click on Settings tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.nav-tab-btn'));
    const setBtn = btns.find(b => b.innerText && b.innerText.includes('Policy & Settings'));
    if (setBtn) setBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'scripts/leave_admin_settings.png' });

  // Scroll down settings
  await page.evaluate(() => {
    const scrollContainer = document.querySelector('.content-scroll');
    if (scrollContainer) scrollContainer.scrollTop = 600;
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'scripts/leave_admin_settings_scrolled.png' });

  console.log('Screenshots captured successfully');
  await browser.close();
})();

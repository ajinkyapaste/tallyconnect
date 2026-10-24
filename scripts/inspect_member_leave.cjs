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

  // Member login
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const memberBtn = btns.find(b => b.textContent && b.textContent.trim() === 'Member');
    if (memberBtn) memberBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.type('#tc-username', 'john_doe');
  await page.type('#tc-password', 'abcd@123');
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 2500));

  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.nav-item'));
    const leaveItem = items.find(it => it.innerText && it.innerText.includes('Leave Management'));
    if (leaveItem) leaveItem.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({ path: 'scripts/leave_member_top.png' });

  // Scroll down
  await page.evaluate(() => {
    const scrollContainer = document.querySelector('.content-scroll');
    if (scrollContainer) scrollContainer.scrollTop = 500;
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'scripts/leave_member_scrolled.png' });

  // Switch to table mode
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const tableBtn = btns.find(b => b.innerText && b.innerText.includes('Table'));
    if (tableBtn) tableBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'scripts/leave_member_table.png' });

  await browser.close();
  console.log('Member screenshots done');
})();

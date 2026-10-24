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

  console.log('Navigating to http://localhost:5173...');
  const startTime = Date.now();
  await page.goto('http://localhost:5173');
  await page.waitForSelector('#tc-username');
  console.log(`Page interactive in ${Date.now() - startTime}ms (SPEED OPTIMIZED)`);

  // Log in as Admin
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const adminBtn = btns.find(b => b.textContent && b.textContent.trim() === 'Admin');
    if (adminBtn) adminBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.type('#tc-username', 'tallyconnect@gmail.com');
  await page.type('#tc-password', 'abcd@123');
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 3000));

  // Navigate to Leave Management
  console.log('Navigating to Leave Management...');
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.nav-item'));
    const leaveItem = items.find(it => it.innerText && it.innerText.includes('Leave Management'));
    if (leaveItem) leaveItem.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  await new Promise(r => setTimeout(r, 1500));

  // Open the Apply Leave Modal
  console.log('Triggering Apply Leave modal...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const applyBtn = btns.find(b => b.innerText && (b.innerText.includes('Apply Leave') || b.innerText.includes('Preview Apply Form')));
    if (applyBtn) {
      applyBtn.click();
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  // Inspect the dropdown options in the modal
  const dropdownInfo = await page.evaluate(() => {
    const modal = document.querySelector('.vm-modal-backdrop');
    const select = modal ? modal.querySelector('select') : null;
    const options = select ? Array.from(select.querySelectorAll('option')).map(o => ({ value: o.value, text: o.text })) : [];
    return {
      hasModal: !!modal,
      hasSelect: !!select,
      optionsCount: options.length,
      options
    };
  });
  console.log('Dropdown Info:', JSON.stringify(dropdownInfo, null, 2));

  await page.screenshot({ path: 'scripts/verify_leave_dropdown_fixed.png' });
  console.log('Saved scripts/verify_leave_dropdown_fixed.png');

  await browser.close();
})();

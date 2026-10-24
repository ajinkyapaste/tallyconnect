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
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForSelector('#tc-username', { timeout: 10000 });

  // Log in
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
  console.log('Navigating to Leave Management...');
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.nav-item'));
    const leaveItem = items.find(it => it.innerText && it.innerText.includes('Leave Management'));
    if (leaveItem) leaveItem.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  await new Promise(r => setTimeout(r, 1200));

  // Check the Apply Leave button in header
  console.log('Checking Apply Leave button...');
  const headerBtnText = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const applyBtn = btns.find(b => b.innerText && b.innerText.includes('Apply Leave'));
    return applyBtn ? applyBtn.innerText.trim() : null;
  });
  console.log('Header Apply Button:', headerBtnText);

  // Click Apply Leave button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const applyBtn = btns.find(b => b.innerText && b.innerText.includes('Apply Leave'));
    if (applyBtn) applyBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Inspect Modal
  const modalInfo = await page.evaluate(() => {
    const modal = document.querySelector('.vm-modal-backdrop');
    if (!modal) return { open: false };
    const submitBtn = modal.querySelector('button[type="submit"]');
    const reasonInput = modal.querySelector('textarea');
    const select = modal.querySelector('select');
    return {
      open: true,
      submitText: submitBtn ? submitBtn.innerText.trim() : null,
      hasReasonInput: !!reasonInput,
      optionsCount: select ? select.querySelectorAll('option').length : 0
    };
  });
  console.log('Modal Info:', JSON.stringify(modalInfo, null, 2));

  // Fill in reason and submit
  console.log('Entering reason: "Annual family retreat"...');
  await page.type('.vm-modal-backdrop textarea', 'Annual family retreat');
  await new Promise(r => setTimeout(r, 400));

  console.log('Clicking Submit Request...');
  await page.evaluate(() => {
    const modal = document.querySelector('.vm-modal-backdrop');
    const submitBtn = modal ? modal.querySelector('button[type="submit"]') : null;
    if (submitBtn) submitBtn.click();
  });

  await new Promise(r => setTimeout(r, 1500));

  // Take screenshot after submission
  await page.screenshot({ path: 'scripts/verify_apply_leave_submitted.png' });
  console.log('Saved scripts/verify_apply_leave_submitted.png');

  // Check if request appears in the list
  const requestsFound = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasRetreatReason: text.includes('Annual family retreat'),
      hasAdminBlockMessage: text.toLowerCase().includes('cannot take leave') || text.toLowerCase().includes('admins do not apply'),
      toastMessage: document.querySelector('.dashboard-toast')?.innerText || null
    };
  });
  console.log('Submission Verification Result:', JSON.stringify(requestsFound, null, 2));

  // If there's an Approve button, test approving it!
  const approveResult = await page.evaluate(async () => {
    const btns = Array.from(document.querySelectorAll('button'));
    const approveBtn = btns.find(b => b.innerText && b.innerText.trim() === 'Approve');
    if (approveBtn) {
      approveBtn.click();
      return true;
    }
    return false;
  });

  if (approveResult) {
    await new Promise(r => setTimeout(r, 600));
    // Confirm in decision modal
    await page.evaluate(() => {
      const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('CONFIRM'));
      if (confirmBtn) confirmBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: 'scripts/verify_apply_leave_approved.png' });
    console.log('Saved scripts/verify_apply_leave_approved.png');
  }

  await browser.close();
})();

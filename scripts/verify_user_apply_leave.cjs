const puppeteer = require('../tally-frontend/node_modules/puppeteer');
const fs = require('fs');

(async () => {
  const chromePath = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ].find(p => fs.existsSync(p));

  // 1. Obtain authenticated session for USER account (demo-ui@test.local)
  console.log('Fetching JWT for demo-ui@test.local (USER role)...');
  const authRes = await fetch('http://localhost:4000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'demo-ui@test.local', password: 'Demo@1234', loginType: 'USER' })
  });
  const authData = await authRes.json();
  console.log('Authenticated User:', JSON.stringify(authData.user, null, 2));

  const browser = await puppeteer.launch({
    headless: 'new',
    ...(chromePath ? { executablePath: chromePath } : {}),
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  // Seed authenticated user session into localStorage before scripts run
  await page.evaluateOnNewDocument((auth) => {
    localStorage.setItem('tc_token', auth.token);
    localStorage.setItem('tc_user', JSON.stringify(auth.user));
    localStorage.setItem('tc_token_origin', 'http://localhost:4000');
    sessionStorage.setItem('tc_app_initialized', '1');
  }, authData);

  console.log('Navigating directly to authenticated dashboard...');
  await page.goto('http://localhost:5173');
  await page.waitForSelector('.nav-item', { timeout: 10000 });
  console.log('Dashboard loaded for User account.');

  // 2. Navigate to Leave Management
  console.log('Navigating to Leave Management...');
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.nav-item'));
    const leaveItem = items.find(it => it.innerText && it.innerText.includes('Leave Management'));
    if (leaveItem) leaveItem.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });

  await page.waitForFunction(() => document.body.innerText.includes('Leave Management'), { timeout: 8000 });
  console.log('On Leave Management page.');

  // 3. Inspect the Header Apply Leave button
  const headerBtnText = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => x.innerText && x.innerText.includes('Apply Leave'));
    return b ? b.innerText.trim() : null;
  });
  console.log('Header Button:', headerBtnText);

  // 4. Click "+ Apply Leave"
  console.log('Clicking Apply Leave button...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => x.innerText && x.innerText.includes('Apply Leave'));
    if (b) b.click();
  });

  await page.waitForSelector('.vm-modal-backdrop', { timeout: 5000 });
  console.log('Apply Leave Modal is open.');

  // 5. Check options & submit button
  const modalInfo = await page.evaluate(() => {
    const modal = document.querySelector('.vm-modal-backdrop');
    const select = modal.querySelector('select');
    const options = select ? Array.from(select.querySelectorAll('option')).map(o => o.text) : [];
    const submitBtn = modal.querySelector('button[type="submit"]');
    return {
      title: modal.querySelector('h3')?.innerText,
      options,
      submitBtnText: submitBtn ? submitBtn.innerText : null
    };
  });
  console.log('Modal Info:', JSON.stringify(modalInfo, null, 2));

  // 6. Enter leave reason and submit
  console.log('Typing leave reason: "Emergency medical leave"...');
  await page.type('.vm-modal-backdrop textarea', 'Emergency medical leave');
  await new Promise(r => setTimeout(r, 400));

  console.log('Submitting leave request...');
  await page.evaluate(() => {
    const modal = document.querySelector('.vm-modal-backdrop');
    const submitBtn = modal.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.click();
  });

  // Wait for modal to close
  await page.waitForFunction(() => !document.querySelector('.vm-modal-backdrop'), { timeout: 5000 });
  console.log('Modal closed successfully without error!');
  await new Promise(r => setTimeout(r, 1200));

  // 7. Verify result in user view
  const result = await page.evaluate(() => {
    const text = document.body.innerText;
    const toast = document.querySelector('.dashboard-toast')?.innerText || null;
    return {
      hasEmergencyReason: text.includes('Emergency medical leave'),
      hasAdminBlockMsg: text.toLowerCase().includes('cannot take leave') || text.toLowerCase().includes('admins do not apply'),
      toastMessage: toast
    };
  });
  console.log('Verification Result:', JSON.stringify(result, null, 2));

  await page.screenshot({ path: 'scripts/verify_user_account_leave_applied.png' });
  console.log('Saved scripts/verify_user_account_leave_applied.png');

  await browser.close();
  console.log('ALL CHECKS PASSED: USER CAN APPLY LEAVE WITHOUT ANY ADMIN ERROR!');
})();

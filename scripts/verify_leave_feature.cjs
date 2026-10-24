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

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 1200));

  // Screenshot EarthLoader / Login
  await page.screenshot({ path: 'scripts/verify_1_loader_login.png' });
  console.log('Saved verify_1_loader_login.png');

  // Toggle Admin login button
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text && text.trim() === 'Admin') { await b.click(); break; }
  }

  await page.type('#tc-username', 'tallyconnect@gmail.com');
  await page.type('#tc-password', 'abcd@123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2500));

  // Verify dashboard loaded
  await page.screenshot({ path: 'scripts/verify_2_dashboard.png' });
  console.log('Saved verify_2_dashboard.png');

  // Navigate to Leave Management tab
  console.log('Clicking on Leave Management in sidebar...');
  const navItems = await page.$$('.nav-item');
  let clickedLeave = false;
  for (const item of navItems) {
    const text = await page.evaluate(el => el.innerText, item);
    if (text && text.includes('Leave Management')) {
      await item.click();
      clickedLeave = true;
      break;
    }
  }

  if (!clickedLeave) {
    console.log('Sidebar item not clicked directly, using page navigation evaluate...');
    await page.evaluate(() => {
      // Find element with text Leave Management
      const els = Array.from(document.querySelectorAll('*'));
      const el = els.find(e => e.innerText && e.innerText.trim() === 'Leave Management');
      if (el) el.click();
    });
  }

  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'scripts/verify_3_leave_admin_requests.png' });
  console.log('Saved verify_3_leave_admin_requests.png');

  // Test Settings Sub-Tab
  console.log('Switching to Policy & Settings tab...');
  const subTabButtons = await page.$$('.nav-tab-btn');
  for (const b of subTabButtons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text && text.includes('Policy & Settings')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'scripts/verify_4_leave_settings.png' });
  console.log('Saved verify_4_leave_settings.png');

  // Test Calendar Sub-Tab
  console.log('Switching to Calendar tab...');
  const subTabButtons2 = await page.$$('.nav-tab-btn');
  for (const b of subTabButtons2) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text && text.includes('Team Calendar')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'scripts/verify_5_leave_calendar.png' });
  console.log('Saved verify_5_leave_calendar.png');

  console.log('All verification steps completed successfully!');
  await browser.close();
})();

const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/User/.gemini/antigravity-ide/brain/4b949fca-6e69-4d16-9183-b723e4940aeb';

async function verifyConnectedUI() {
  console.log('Launching browser for Connected UI verification...');
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1440, height: 960 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960 });

  // 1. Login
  console.log('Logging in as Admin (sudhirtally@gmail.com)...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.textContent.trim(), b);
    if (text === 'Admin') {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 400));
  await page.type('#tc-username', 'sudhirtally@gmail.com');
  await page.type('#tc-password', '12345678');
  await page.click('button[type="submit"]');

  await page.waitForSelector('.sidebar, .nav-item', { timeout: 10000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));

  // 2. Navigate to Companies tab
  console.log('Navigating to Companies tab...');
  const navItems = await page.$$('.nav-item, li, button');
  for (const n of navItems) {
    const text = await page.evaluate(el => el.textContent, n);
    if (text && text.includes('Companies')) {
      await n.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 2000));

  // Capture Companies tab with Add Company button
  const compPath = path.join(ARTIFACTS_DIR, 'verified_companies_add_button.png');
  await page.screenshot({ path: compPath });
  console.log('✅ Screenshot saved:', compPath);

  // Click Add Company button to open modal
  console.log('Opening Add Company modal...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.textContent && b.textContent.includes('Add Company'));
    if (addBtn) addBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  // Capture Add Company modal
  const modalPath = path.join(ARTIFACTS_DIR, 'verified_add_company_modal.png');
  await page.screenshot({ path: modalPath });
  console.log('✅ Screenshot saved:', modalPath);

  // 3. Navigate to Notifications
  console.log('Navigating to Notifications...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const bellBtn = btns.find(b => b.title && b.title.includes('Notifications'));
    if (bellBtn) bellBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const notifPath = path.join(ARTIFACTS_DIR, 'verified_notifications_download_ui.png');
  await page.screenshot({ path: notifPath });
  console.log('✅ Screenshot saved:', notifPath);

  await browser.close();
  console.log('All verification screenshots captured.');
}

verifyConnectedUI().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});

const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/User/.gemini/antigravity-ide/brain/4b949fca-6e69-4d16-9183-b723e4940aeb';

async function captureConnectorUI() {
  console.log('Launching browser for Activity & Connector Hub capture...');
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1440, height: 960 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960 });

  // 1. Login as Admin
  console.log('Logging in as Admin (sudhirtally@gmail.com)...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

  // Click Admin toggle button if present
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

  // 2. Select demo company if company selection is active
  await page.evaluate(() => {
    localStorage.setItem('tc_active_company', 'DEMO-COMPANY-001');
    localStorage.setItem('tc_company_name', 'TallyConnect Demo Co');
  });

  // 3. Navigate to Activity tab
  console.log('Navigating to Activity tab in sidebar...');
  const navItems = await page.$$('.nav-item, li, button');
  let clickedActivity = false;
  for (const n of navItems) {
    const text = await page.evaluate(el => el.textContent, n);
    if (text && text.includes('Activity')) {
      await n.click();
      clickedActivity = true;
      break;
    }
  }

  await new Promise(r => setTimeout(r, 2500));

  // Capture 1: Activity Manager with Live Queue & Connector Hub button
  console.log('Taking screenshot of Activity Manager...');
  const actPath = path.join(ARTIFACTS_DIR, 'verified_activity_connector_hub.png');
  await page.screenshot({ path: actPath });
  console.log('✅ Screenshot saved:', actPath);

  // 4. Click Connector Hub button
  console.log('Opening Tally Connector Hub modal...');
  const hubClicked = await page.evaluate(() => {
    const allBtns = Array.from(document.querySelectorAll('button'));
    const btn = allBtns.find(b => b.textContent && b.textContent.includes('Connector Hub'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Hub button clicked:', hubClicked);
  await new Promise(r => setTimeout(r, 1500));

  // Capture 2: Connector Modal - 11 Agent Endpoints
  console.log('Taking screenshot of Connector Modal (11 Agent Endpoints)...');
  const modalPath = path.join(ARTIFACTS_DIR, 'verified_tally_connector_modal_endpoints.png');
  await page.screenshot({ path: modalPath });
  console.log('✅ Screenshot saved:', modalPath);

  // 5. Click Remaining Endpoints tab
  await page.evaluate(() => {
    const tabBtns = Array.from(document.querySelectorAll('button'));
    const remTab = tabBtns.find(b => b.textContent && b.textContent.includes('Remaining Endpoints'));
    if (remTab) remTab.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const remPath = path.join(ARTIFACTS_DIR, 'verified_tally_connector_modal_remaining.png');
  await page.screenshot({ path: remPath });
  console.log('✅ Screenshot saved:', remPath);

  // 6. Click Architecture Flow tab
  await page.evaluate(() => {
    const tabBtns = Array.from(document.querySelectorAll('button'));
    const flowTab = tabBtns.find(b => b.textContent && b.textContent.includes('Architecture Flow'));
    if (flowTab) flowTab.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const flowPath = path.join(ARTIFACTS_DIR, 'verified_tally_connector_modal_flow.png');
  await page.screenshot({ path: flowPath });
  console.log('✅ Screenshot saved:', flowPath);

  // 7. Click Live Queue Inspector tab
  await page.evaluate(() => {
    const tabBtns = Array.from(document.querySelectorAll('button'));
    const queueTab = tabBtns.find(b => b.textContent && b.textContent.includes('Live Queue Inspector'));
    if (queueTab) queueTab.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const queuePath = path.join(ARTIFACTS_DIR, 'verified_tally_connector_modal_queue.png');
  await page.screenshot({ path: queuePath });
  console.log('✅ Screenshot saved:', queuePath);

  await browser.close();
  console.log('All Activity & Tally Connector Hub screenshots captured successfully.');
}

captureConnectorUI().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});

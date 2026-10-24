const puppeteer = require('../tally-frontend/node_modules/puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to frontend...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

  // Toggle Admin login button
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text && text.trim() === 'Admin') { await b.click(); break; }
  }
  await new Promise(r => setTimeout(r, 500));

  await page.type('#tc-username', 'tallyconnect@gmail.com');
  await page.type('#tc-password', 'abcd@123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 3000));

  // Navigate to Activity tab
  console.log('Clicking Activity tab...');
  const activityBtn = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, [role="tab"], .nav-item'));
    const act = buttons.find(b => b.innerText && b.innerText.includes('Activity'));
    if (act) {
      act.click();
      return true;
    }
    return false;
  });

  await new Promise(r => setTimeout(r, 2500));

  const artifactDir = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\4b949fca-6e69-4d16-9183-b723e4940aeb';
  await page.screenshot({ path: path.join(artifactDir, 'verified_activity_with_mobile_queue.png'), fullPage: false });
  console.log('Saved verified_activity_with_mobile_queue.png');

  // Click Connector Hub button to verify mobile queue card
  const connectorClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const hub = btns.find(b => b.innerText && b.innerText.includes('Connector Hub'));
    if (hub) {
      hub.click();
      return true;
    }
    return false;
  });

  if (connectorClicked) {
    console.log('Opened Connector Hub modal...');
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(artifactDir, 'verified_connector_hub_mobile_queue.png'), fullPage: false });
    console.log('Saved verified_connector_hub_mobile_queue.png');
  }

  await browser.close();
  console.log('Verification finished successfully.');
})();

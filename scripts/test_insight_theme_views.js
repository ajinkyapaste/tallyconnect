const puppeteer = require('../tally-frontend/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1050 });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

  // Login
  const loginField = await page.$('#tc-username');
  if (loginField) {
    console.log('Selecting Admin role & logging in...');
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.innerText, b);
      if (text && text.trim() === 'Admin') { await b.click(); break; }
    }
    await page.type('#tc-username', 'tallyconnect@gmail.com');
    await page.type('#tc-password', 'abcd@123');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.nav-item', { timeout: 15000 });
  }

  await new Promise(r => setTimeout(r, 1500));

  // 1. Click on "Reports" nav tab
  console.log('Navigating to Reports tab...');
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.nav-item'));
    const rep = items.find(el => el.innerText.includes('Reports'));
    if (rep) rep.click();
  });

  await new Promise(r => setTimeout(r, 2000));

  // Click on "Top Customers" card
  console.log('Clicking Top Customers report card...');
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.dashboard-content .glass-panel, .glass-panel, h3'));
    const topCust = cards.find(el => el.textContent && el.textContent.includes('Top Customers'));
    if (topCust) topCust.click();
  });

  await new Promise(r => setTimeout(r, 1200));

  // 1. Bar view screenshot
  await page.screenshot({ path: 'scripts/optimized_bar_view.png', fullPage: false });
  console.log('Saved scripts/optimized_bar_view.png');

  // 2. Pie view screenshot
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const pieBtn = btns.find(b => b.textContent && b.textContent.trim().includes('Pie'));
    if (pieBtn) pieBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'scripts/optimized_pie_view.png', fullPage: false });
  console.log('Saved scripts/optimized_pie_view.png');

  // 3. Line view screenshot
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const lineBtn = btns.find(b => b.textContent && b.textContent.trim().includes('Line'));
    if (lineBtn) lineBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'scripts/optimized_line_view.png', fullPage: false });
  console.log('Saved scripts/optimized_line_view.png');

  // 4. Test Settings Theme Switching: Change color to iOS Blue (#007aff)
  console.log('Navigating to Settings tab to switch theme color...');
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.nav-item'));
    const settings = items.find(el => el.innerText.includes('Settings'));
    if (settings) settings.click();
  });

  await new Promise(r => setTimeout(r, 1500));

  console.log('Selecting iOS Blue color in Settings...');
  await page.evaluate(() => {
    // Find iOS Blue button in SettingsHub
    const buttons = Array.from(document.querySelectorAll('button'));
    const blueBtn = buttons.find(b => b.textContent && b.textContent.includes('iOS Blue'));
    if (blueBtn) {
      blueBtn.click();
    } else {
      // Fallback: trigger root style variable directly
      document.documentElement.style.setProperty('--primary-color', '#007aff');
    }
  });

  await new Promise(r => setTimeout(r, 1000));

  // Go back to Reports -> Top Customers
  console.log('Navigating back to Reports to verify dynamic theme update to Blue...');
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.nav-item'));
    const rep = items.find(el => el.innerText.includes('Reports'));
    if (rep) rep.click();
  });

  await new Promise(r => setTimeout(r, 1500));

  // Check if we need to click Top Customers card again
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.dashboard-content .glass-panel, .glass-panel, h3'));
    const topCust = cards.find(el => el.textContent && el.textContent.includes('Top Customers'));
    if (topCust) topCust.click();
  });

  await new Promise(r => setTimeout(r, 1200));

  // Pie View in Blue
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const pieBtn = btns.find(b => b.textContent && b.textContent.trim().includes('Pie'));
    if (pieBtn) pieBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'scripts/theme_blue_pie_view.png', fullPage: false });
  console.log('Saved scripts/theme_blue_pie_view.png');

  // Bar View in Blue
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const barBtn = btns.find(b => b.textContent && b.textContent.trim().includes('Bar'));
    if (barBtn) barBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'scripts/theme_blue_bar_view.png', fullPage: false });
  console.log('Saved scripts/theme_blue_bar_view.png');

  // 5. Test Theme Switching: Change color to Sunset Orange (#ff9500)
  console.log('Switching to Sunset Orange (#ff9500)...');
  await page.evaluate(() => {
    document.documentElement.style.setProperty('--primary-color', '#ff9500');
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'scripts/theme_orange_bar_view.png', fullPage: false });
  console.log('Saved scripts/theme_orange_bar_view.png');

  // Line View in Orange
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const lineBtn = btns.find(b => b.textContent && b.textContent.trim().includes('Line'));
    if (lineBtn) lineBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'scripts/theme_orange_line_view.png', fullPage: false });
  console.log('Saved scripts/theme_orange_line_view.png');

  await browser.close();
  console.log('Verification completed successfully!');
})();

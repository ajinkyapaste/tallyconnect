const puppeteer = require("puppeteer");
const path = require("path");

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--window-size=1440,960']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960 });

  await page.goto("http://localhost:5173/");

  // Login
  try {
    await page.waitForSelector('input[type="text"]', { timeout: 4000 });
    await page.type('input[type="text"]', 'demo-ui@test.local');
    await page.type('input[type="password"]', 'Demo@1234');
    await page.click('button[type="submit"]');
  } catch (e) {
    console.log("Login form not shown or already logged in:", e.message);
  }

  // Wait for main dashboard navigation
  await new Promise(r => setTimeout(r, 3000));

  // Navigate to Reports tab
  await page.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll('button, .nav-item, .mob-nav-item, span, div'));
    const reportsBtn = navItems.find(el => el.textContent && el.textContent.trim() === 'Reports');
    if (reportsBtn) reportsBtn.click();
  });
  await new Promise(r => setTimeout(r, 2500));

  // 1. Screenshot Reports view with Sales analytics option card
  const reportsScreenshot = path.join(__dirname, 'reports_with_sales_analytics.png');
  await page.screenshot({ path: reportsScreenshot, fullPage: false });
  console.log("Saved Reports screenshot to:", reportsScreenshot);

  // 2. Click on "Sales analytics" card
  const clicked = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('div, button'));
    const saCard = elements.find(el => el.textContent && el.textContent.includes('Sales analytics') && el.textContent.includes('Trend, top customers'));
    if (saCard) {
      saCard.click();
      return true;
    }
    return false;
  });
  console.log("Clicked Sales Analytics card:", clicked);
  await new Promise(r => setTimeout(r, 2000));

  // 3. Screenshot Sales Analytics Detail View
  const saDetailScreenshot = path.join(__dirname, 'sales_analytics_detail_view.png');
  await page.screenshot({ path: saDetailScreenshot, fullPage: false });
  console.log("Saved Sales Analytics Detail View screenshot to:", saDetailScreenshot);

  // 4. Test toggling "By quantity"
  const toggled = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const byQty = btns.find(b => b.textContent && b.textContent.trim() === 'By quantity');
    if (byQty) {
      byQty.click();
      return true;
    }
    return false;
  });
  console.log("Toggled By quantity:", toggled);
  await new Promise(r => setTimeout(r, 1000));

  const saQtyScreenshot = path.join(__dirname, 'sales_analytics_by_quantity.png');
  await page.screenshot({ path: saQtyScreenshot, fullPage: false });
  console.log("Saved By Quantity screenshot to:", saQtyScreenshot);

  await browser.close();
  console.log("Sales Analytics UI test finished successfully!");
})();

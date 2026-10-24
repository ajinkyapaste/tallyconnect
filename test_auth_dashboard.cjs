const puppeteer = require('d:/Prototype/tally-frontend/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });

  // Navigate first to set origin
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });

  // Set mock authenticated user in localStorage
  await page.evaluate(() => {
    localStorage.setItem('tc_token', 'mock-test-token');
    localStorage.setItem('tc_token_origin', 'https://tallymobile.utkarshmishra.online');
    localStorage.setItem('tc_user', JSON.stringify({
      id: 'usr_123',
      name: 'Demo Admin',
      email: 'demo@tallyconnect.com',
      isAdmin: true
    }));
  });

  // Reload page to enter authenticated dashboard
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const textContent = await page.evaluate(() => document.body.innerText.slice(0, 1000));
  console.log('Dashboard text preview:\n', textContent);

  const screenshotPath = 'C:/Users/User/.gemini/antigravity-ide/brain/7a0de719-6d44-4b49-8f8c-7777ec156ad1/authenticated_dashboard.png';
  await page.screenshot({ path: screenshotPath });
  console.log('Authenticated screenshot saved to:', screenshotPath);

  if (consoleErrors.length > 0) {
    console.log('Console errors encountered:', consoleErrors);
  } else {
    console.log('Zero console errors inside authenticated dashboard!');
  }

  await browser.close();
})();

const puppeteer = require('d:/Prototype/tally-frontend/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  
  // Enable request interception
  await page.setRequestInterception(true);
  page.on('request', interceptedRequest => {
    const url = interceptedRequest.url();
    if (url.includes('/company') || url.includes('/dashboard') || url.includes('/auth') || url.includes('/vouchers') || url.includes('/reports')) {
      if (url.includes('/company')) {
        interceptedRequest.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            companies: [
              { guid: 'comp-1', name: 'Alpha Traders Ltd', formal_name: 'Alpha Traders Limited', country: 'India' }
            ]
          })
        });
      } else {
        interceptedRequest.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] })
        });
      }
    } else {
      interceptedRequest.continue();
    }
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });

  // Set mock user in localStorage
  await page.evaluate(() => {
    localStorage.setItem('tc_token', 'valid-mock-jwt');
    localStorage.setItem('tc_token_origin', 'https://tallymobile.utkarshmishra.online');
    localStorage.setItem('tc_user', JSON.stringify({
      id: 'usr_123',
      name: 'Utkarsh Admin',
      email: 'admin@tallyconnect.com',
      isAdmin: true
    }));
  });

  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const screenshotPath = 'C:/Users/User/.gemini/antigravity-ide/brain/7a0de719-6d44-4b49-8f8c-7777ec156ad1/mock_auth_verified_dashboard.png';
  await page.screenshot({ path: screenshotPath });
  console.log('Mock auth screenshot saved to:', screenshotPath);

  await browser.close();
})();

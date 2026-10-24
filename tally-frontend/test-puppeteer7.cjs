const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('response', async (response) => {
    if (response.url().includes('localhost:4000')) {
      console.log('RESPONSE:', response.url(), 'STATUS:', response.status());
    }
  });

  page.on('requestfailed', request => {
    if (request.url().includes('localhost:4000')) {
      console.log('FAILED:', request.url(), request.failure()?.errorText);
    }
  });
  
  await page.goto('http://localhost:5173');
  
  await page.select('select', 'USER');
  await page.type('input[type="text"]', 'demo-ui@test.local');
  await page.type('input[type="password"]', 'Demo@1234');
  
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 4000));
  
  await browser.close();
})();

const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173');
  
  await page.select('select', 'USER');
  await page.type('input[type="text"]', 'demo-ui@test.local');
  await page.type('input[type="password"]', 'Demo@1234');
  
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 4000));
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log("BODY AFTER 4 SECONDS:\n" + text.substring(0, 1000));
  
  await browser.close();
})();

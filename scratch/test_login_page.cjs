const puppeteer = require('../tally-frontend/node_modules/puppeteer');

(async () => {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await puppeteer.launch({ headless: 'new', executablePath: chromePath, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('requestfailed', req => console.log('REQ FAIL:', req.url(), req.failure()?.errorText));
  page.on('response', res => {
    if (res.status() >= 400) console.log('REQ STATUS:', res.status(), res.url());
  });

  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 1000));

  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text && text.trim() === 'Admin') { 
      console.log('Clicking Admin button');
      await b.click(); 
      break; 
    }
  }

  await page.type('#tc-username', 'tallyconnect@gmail.com');
  await page.type('#tc-password', 'abcd@123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 3000));

  const tc_token = await page.evaluate(() => localStorage.getItem('tc_token'));
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300));

  console.log({ tc_token, bodyPreview: bodyText });
  await browser.close();
})();

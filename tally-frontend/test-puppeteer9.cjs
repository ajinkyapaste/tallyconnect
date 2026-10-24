const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER LOG:', msg.text());
  });
  
  await page.evaluateOnNewDocument(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      console.log('FETCH CALLED: ' + args[0]);
      try {
        const res = await originalFetch(...args);
        console.log('FETCH SUCCESS: ' + args[0] + ' ' + res.status);
        return res;
      } catch (err) {
        console.log('FETCH ERROR: ' + args[0] + ' ' + err.message);
        throw err;
      }
    };
  });

  await page.goto('http://localhost:5173');
  
  await page.select('select', 'USER');
  await page.type('input[type="text"]', 'demo-ui@test.local');
  await page.type('input[type="password"]', 'Demo@1234');
  
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 4000));
  
  await browser.close();
})();

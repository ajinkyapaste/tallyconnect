const puppeteer = require('puppeteer'); 
(async () => { 
  const browser = await puppeteer.launch(); 
  const page = await browser.newPage(); 
  page.on('console', msg => console.log('PAGE LOG:', msg.text())); 
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message)); 
  await page.goto('http://localhost:5173', {waitUntil: 'networkidle0'}); 
  await page.type('#tc-username', 'demo-ui@test.local'); 
  await page.type('#tc-password', 'Demo@1234'); 
  await page.click('button[type="submit"]'); 
  await page.waitForNavigation({waitUntil: 'networkidle0'}).catch(()=>null); 
  await new Promise(r => setTimeout(r, 2000)); 
  console.log('BODY:', await page.content()); 
  await browser.close(); 
})();

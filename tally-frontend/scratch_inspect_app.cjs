const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  
  const state = await page.evaluate(() => {
    return {
      title: document.title,
      token: localStorage.getItem('tc_token'),
      user: localStorage.getItem('tc_user'),
      activeCompany: localStorage.getItem('tc_active_company'),
      companiesCache: localStorage.getItem('tc_companies_cache'),
      bodySnippet: document.body.innerText.substring(0, 500)
    };
  });
  
  console.log('APP STATE:', JSON.stringify(state, null, 2));
  await browser.close();
})();

const puppeteer = require('./tally-frontend/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("http://localhost:5173/", { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  
  // Login
  const emailField = await page.$("input[type='email'], #tc-username");
  if (emailField) {
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button")).find(x => x.innerText.trim() === "Admin");
      if (b) b.click();
    });
    await page.type("#tc-username", "tallyconnect@gmail.com");
    await page.type("#tc-password", "abcd@123");
    await page.click("button[type='submit']");
    await new Promise(r => setTimeout(r, 3500));
  }
  
  const results = await page.evaluate(async () => {
    const token = localStorage.getItem('tc_token');
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    const origin = localStorage.getItem('tc_token_origin') || 'https://tallymobile.utkarshmishra.online';
    
    const fetchJson = async (path) => {
      try {
        const res = await fetch(`${origin}${path}`, { headers });
        const json = await res.json();
        return { 
          path, 
          status: res.status, 
          count: Array.isArray(json) ? json.length : (Array.isArray(json?.data) ? json.data.length : 'obj'), 
          sample: Array.isArray(json) ? json.slice(0, 1) : (Array.isArray(json?.data) ? json.data.slice(0, 1) : json) 
        };
      } catch (e) {
        return { path, error: e.message };
      }
    };

    return await Promise.all([
      fetchJson('/company'),
      fetchJson('/company/active'),
      fetchJson('/voucher-entry'),
      fetchJson('/ledger'),
      fetchJson('/inventory'),
      fetchJson('/dashboard/bills')
    ]);
  });

  console.log("API Investigation Results:\n", JSON.stringify(results, null, 2));
  await browser.close();
})();

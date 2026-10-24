const puppeteer = require('../tally-frontend/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await page.waitForSelector('#tc-username');
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text && text.trim() === 'Admin') { await b.click(); break; }
  }
  await page.type('#tc-username', 'tallyconnect@gmail.com');
  await page.type('#tc-password', 'abcd@123');
  await page.click('button[type="submit"]');
  await page.waitForSelector('.nav-item', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 2000));
  
  const stats = await page.evaluate(async () => {
    const token = localStorage.getItem('token');
    const company = JSON.parse(localStorage.getItem('selectedCompany') || '{}');
    const apiUrl = 'https://dashboard.tally-connect.com/api';
    const res = await fetch(`${apiUrl}/ledger?company_guid=${company.guid || ''}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const json = await res.json();
    const list = json.data || json || [];
    const groups = {};
    let debtors = 0, creditors = 0, others = 0;
    list.forEach(l => {
      const g = (l.parent_group || l.type || 'Unknown').trim();
      groups[g] = (groups[g] || 0) + 1;
      const lower = g.toLowerCase();
      if (lower.includes('debtor') || lower.includes('customer')) debtors++;
      else if (lower.includes('creditor') || lower.includes('supplier') || lower.includes('vendor')) creditors++;
      else others++;
    });
    return {
      total: list.length,
      debtors,
      creditors,
      others,
      topGroups: Object.entries(groups).sort((a,b)=>b[1]-a[1]).slice(0, 10)
    };
  });
  console.log('STATS:', JSON.stringify(stats, null, 2));
  await browser.close();
})();

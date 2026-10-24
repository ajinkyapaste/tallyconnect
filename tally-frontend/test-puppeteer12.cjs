const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER LOG:', msg.text());
  });
  page.on('pageerror', err => {
    console.log('BROWSER ERROR:', err.toString());
  });
  
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('tally-connect.com')) {
      console.log(`PROD NETWORK RESPONSE: ${response.status()} ${url}`);
    }
  });

  console.log("Navigating to http://localhost:5173...");
  await page.goto('http://localhost:5173');
  
  await page.waitForSelector('#tc-username');
  console.log("Clicking Admin button...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const adminBtn = btns.find(b => b.innerText && b.innerText.trim() === 'Admin');
    if (adminBtn) adminBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  console.log("Logging in as Admin (tallyconnect@gmail.com)...");
  await page.type('#tc-username', 'tallyconnect@gmail.com');
  await page.type('#tc-password', 'abcd@123');
  
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 4000));
  
  // Verify Dashboard loaded
  const dashboardText = await page.evaluate(() => document.body.innerText);
  console.log("Dashboard screen text (first 300 chars):", dashboardText.substring(0, 300).replace(/\n+/g, ' '));

  // 1. Check Company Switch
  console.log("\n--- Testing Company Switch ---");
  const trigger = await page.waitForSelector('div[title="Select Company"]', { timeout: 5000 }).catch(() => null);
  if (!trigger) {
    console.log("ERROR: Company dropdown trigger not found!");
  } else {
    const currentCompanyText = await page.evaluate(el => el.innerText, trigger);
    console.log("Current company in dropdown trigger:", currentCompanyText.trim().replace(/\n+/g, ' '));

    console.log("Clicking company dropdown...");
    await trigger.click();
    await new Promise(r => setTimeout(r, 1000));

    const options = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[title="Select Company"] ~ div div[style*="cursor: pointer"], div[title="Select Company"] + div div[style*="cursor: pointer"]'));
      return items.map(it => it.innerText.trim());
    });
    console.log("Available company options in dropdown:", options);

    // Let's click the other company
    const switched = await page.evaluate(() => {
      // Find all company option rows in the dropdown
      const allDivs = Array.from(document.querySelectorAll('div'));
      // Look for Test or TestTallyCompany1
      const target = allDivs.find(d => d.innerText && (d.innerText.trim() === 'Test' || d.innerText.trim().includes('Test\n')) && d.onclick);
      // or find by role/style
      const options = allDivs.filter(d => d.style && d.style.cursor === 'pointer' && (d.innerText.includes('Test') || d.innerText.includes('TestTallyCompany1')));
      if (options.length > 0) {
        // click the one that is NOT currently selected, or the second one
        const targetOpt = options.find(o => !o.innerText.includes('TestTallyCompany1')) || options[0];
        targetOpt.click();
        return targetOpt.innerText.trim();
      }
      return null;
    });
    console.log("Clicked company option:", switched);

    const switchStartTime = Date.now();
    await new Promise(r => setTimeout(r, 2000));
    const switchedCompanyText = await page.evaluate(() => {
      const el = document.querySelector('div[title="Select Company"]');
      return el ? el.innerText.trim().replace(/\n+/g, ' ') : '';
    });
    console.log(`Active company after switch (${Date.now() - switchStartTime}ms):`, switchedCompanyText);
  }

  // 2. Check Voucher Explore
  console.log("\n--- Testing Voucher Explore ---");
  const clickedVoucher = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.trim() === 'Voucher Explore');
    if (el) { el.click(); return true; }
    return false;
  });
  console.log("Clicked Voucher Explore tab:", clickedVoucher);

  await new Promise(r => setTimeout(r, 3000));
  const voucherScreenText = await page.evaluate(() => document.body.innerText);
  console.log("\nVOUCHER EXPLORE SCREEN TEXT:\n" + voucherScreenText.substring(0, 800));

  await page.screenshot({ path: 'prod_voucher_explore.png' });
  console.log("Screenshot saved to prod_voucher_explore.png");

  await browser.close();
})();

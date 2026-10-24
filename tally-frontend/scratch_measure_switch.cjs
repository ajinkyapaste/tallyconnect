const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const networkTimings = [];
  page.on('request', req => {
    req._startTime = Date.now();
  });
  page.on('requestfinished', req => {
    const dur = Date.now() - (req._startTime || Date.now());
    if (req.url().includes('tally-connect.com')) {
      networkTimings.push({ url: req.url(), method: req.method(), durationMs: dur });
      console.log(`[NET] ${req.method()} ${req.url().split('.com')[1]} -> ${dur}ms`);
    }
  });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173');
  await page.waitForSelector('#tc-username');

  // Click Admin
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const adminBtn = btns.find(b => b.innerText && b.innerText.trim() === 'Admin');
    if (adminBtn) adminBtn.click();
  });
  await new Promise(r => setTimeout(r, 200));

  await page.type('#tc-username', 'tallyconnect@gmail.com');
  await page.type('#tc-password', 'abcd@123');
  await page.click('button[type="submit"]');

  await page.waitForSelector('div[title="Select Company"]', { timeout: 10000 });
  console.log('Logged in successfully. Waiting for initial page load to settle...');
  await new Promise(r => setTimeout(r, 3000));

  networkTimings.length = 0; // clear initial login calls

  console.log('\n=== STEP 1: Open Dropdown ===');
  let t0 = Date.now();
  await page.click('div[title="Select Company"]');
  console.log(`Dropdown opened in ${Date.now() - t0}ms`);

  const options = await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div'));
    const menu = divs.find(d => d.style && d.style.zIndex === '100');
    if (!menu) return [];
    return Array.from(menu.querySelectorAll('div')).map(d => d.innerText.trim()).filter(Boolean);
  });
  console.log('Dropdown items:', options);

  console.log('\n=== STEP 2: Click to Switch Company ===');
  t0 = Date.now();
  const switchedTo = await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div'));
    const menu = divs.find(d => d.style && d.style.zIndex === '100');
    if (!menu) return null;
    const clickable = Array.from(menu.children).filter(c => c.style && c.style.cursor === 'pointer');
    // Click the one that is not currently active
    for (const opt of clickable) {
      if (!opt.innerText.includes('Add / Manage') && !opt.querySelector('div[style*="border-radius: 4px"]')) {
        opt.click();
        return opt.innerText.trim();
      }
    }
    // If none found, click first company
    if (clickable[0]) {
      clickable[0].click();
      return clickable[0].innerText.trim();
    }
    return null;
  });
  console.log(`Clicked option: "${switchedTo}" in ${Date.now() - t0}ms`);

  // Monitor how long it takes for the UI and network requests
  const switchStart = Date.now();
  let uiUpdatedTime = null;

  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 100));
    const currentTitle = await page.evaluate(() => {
      const el = document.querySelector('div[title="Select Company"]');
      return el ? el.innerText.trim().replace(/\n+/g, ' ') : '';
    });
    if (!uiUpdatedTime && currentTitle.includes(switchedTo)) {
      uiUpdatedTime = Date.now() - switchStart;
      console.log(`[UI] Dropdown header updated to "${currentTitle}" in ${uiUpdatedTime}ms!`);
    }
  }

  console.log(`Total wait finished. Waiting another 2s to catch trailing requests...`);
  await new Promise(r => setTimeout(r, 2000));

  console.log('\n=== Summary of network calls during switch: ===');
  networkTimings.forEach(n => console.log(`- ${n.method} ${n.url.split('.com')[1]}: ${n.durationMs}ms`));

  await browser.close();
})();

const puppeteer = require('../tally-frontend/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--ignore-gpu-blocklist']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 900 });

  await page.goto('http://localhost:5173/earth_preview.html');
  await page.waitForFunction(() => window.isReady === true, { timeout: 15000 });

  const angles = [4.8, 5.0, 5.2, 5.4, 5.6];
  for (const a of angles) {
    await page.evaluate((angle) => { window.setAngle(angle); }, a);
    await new Promise(r => setTimeout(r, 200));
    const filename = `scripts/earth_atlantic_${a.toFixed(2)}.png`;
    await page.screenshot({ path: filename });
    console.log(`Saved ${filename}`);
  }

  await browser.close();
  console.log('Done captures.');
})();

const puppeteer = require('../tally-frontend/node_modules/puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--ignore-gpu-blocklist']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  await page.evaluateOnNewDocument(() => {
    sessionStorage.clear();
  });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173');

  // Capture while loader is actively rotating (at 700ms)
  await new Promise(r => setTimeout(r, 700));
  const shotLoader = path.resolve(__dirname, 'earth_loader_live_active.png');
  await page.screenshot({ path: shotLoader });
  console.log('Captured live loader:', shotLoader);

  // Capture after loader completely unmounts (at 2400ms)
  await new Promise(r => setTimeout(r, 1700));
  const shotRevealed = path.resolve(__dirname, 'earth_loader_live_revealed.png');
  await page.screenshot({ path: shotRevealed });
  console.log('Captured revealed website:', shotRevealed);

  // Confirm EarthLoader is completely removed from DOM
  const isLoaderInDom = await page.evaluate(() => {
    return !!document.querySelector('.earth-loader-overlay');
  });
  console.log('Is EarthLoader still in DOM after completion?', isLoaderInDom);

  await browser.close();
  console.log('Verification finished.');
})();

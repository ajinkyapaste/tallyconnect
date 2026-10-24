const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle0' });

  // Let's test a sequence of rotation angles via page.evaluate
  const angles = [0, 0.8, 1.6, 2.4, 3.2, 4.0, 4.8, 5.6];

  for (let i = 0; i < angles.length; i++) {
    const angle = angles[i];
    await page.evaluate((a) => {
      // Find canvas or Three scene if exposed or reload with hash
      window.location.hash = 'angle=' + a;
    }, angle);
  }

  await browser.close();
})();

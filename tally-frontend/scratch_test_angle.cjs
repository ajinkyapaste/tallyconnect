const puppeteer = require('puppeteer');
const path = require('path');

async function testAngle(angle) {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));

  const out = path.join(__dirname, 'preview_angle.png');
  await page.screenshot({ path: out });
  await browser.close();
  return out;
}

(async () => {
  await testAngle(0);
  console.log('Tested angle');
})();

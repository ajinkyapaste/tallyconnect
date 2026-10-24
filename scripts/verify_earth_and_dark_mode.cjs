const puppeteer = require('../tally-frontend/node_modules/puppeteer');
const path = require('path');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  console.log('--- Verifying Earth Loading Animation & Dark Mode Logo/Background ---');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage'
    ],
    protocolTimeout: 60000
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const artifactDir = 'C:/Users/User/.gemini/antigravity-ide/brain/4b949fca-6e69-4d16-9183-b723e4940aeb';

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  // 1. Navigate to page to test EarthLoader
  console.log('Navigating to http://localhost:5173 to capture Earth Loading Animation...');
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait 600ms for Earth textures to render and capture initial frame
  await delay(700);
  await page.screenshot({ path: path.join(artifactDir, 'earth_loader_initial_frame.png') });
  console.log('✅ Captured earth_loader_initial_frame.png');

  // Wait another 900ms to verify rotation and city lights
  await delay(900);
  await page.screenshot({ path: path.join(artifactDir, 'earth_loader_rotating_frame.png') });
  console.log('✅ Captured earth_loader_rotating_frame.png');

  // Wait until EarthLoader fades out and reveals the application
  console.log('Waiting for EarthLoader to smoothly fade out and reveal the site...');
  await delay(2000);
  await page.screenshot({ path: path.join(artifactDir, 'earth_loader_revealed_site.png') });
  console.log('✅ Captured earth_loader_revealed_site.png');

  // 2. Now login to Admin and check Dark Mode
  console.log('Logging in to verify Dark Mode Logo and Background...');
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text && text.trim() === 'Admin') { await b.click(); break; }
  }
  await page.type('#tc-username', 'tallyconnect@gmail.com');
  await page.type('#tc-password', 'abcd@123');
  await page.click('button[type="submit"]');

  await page.waitForSelector('.brand', { timeout: 15000 });
  await delay(1500);

  // Turn on Dark Mode
  await page.evaluate(() => {
    localStorage.setItem('tc_dark', '1');
    document.body.classList.add('dark-theme');
    document.documentElement.classList.add('dark');
  });

  // Reload page to observe EarthLoader on reload + Dark Mode
  console.log('Reloading with Dark Mode active...');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await delay(800);
  await page.screenshot({ path: path.join(artifactDir, 'earth_loader_on_reload.png') });
  console.log('✅ Captured earth_loader_on_reload.png');

  // Wait for site reveal after reload
  await delay(2500);

  // Capture dark mode sidebar brand and full dashboard
  const brandEl = await page.$('.brand');
  if (brandEl) {
    await brandEl.screenshot({ path: path.join(artifactDir, 'dark_mode_logo_fixed.png') });
    console.log('✅ Captured dark_mode_logo_fixed.png');
  }

  const sidebarEl = await page.$('.glass-sidebar');
  if (sidebarEl) {
    await sidebarEl.screenshot({ path: path.join(artifactDir, 'dark_mode_sidebar_fixed.png') });
    console.log('✅ Captured dark_mode_sidebar_fixed.png');
  }

  await page.screenshot({ path: path.join(artifactDir, 'dark_mode_dashboard_fixed.png') });
  console.log('✅ Captured dark_mode_dashboard_fixed.png');

  await browser.close();
  console.log('--- Verification finished successfully ---');
})();

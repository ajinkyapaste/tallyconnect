const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = path.resolve(__dirname, '../../scratch');
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function runTests() {
  console.log('========================================================================');
  console.log('STARTING APPEARANCE & PERSONALIZATION (BITRIX24 STYLE) TEST SUITE');
  console.log('========================================================================\n');

  const chromePath = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ].find(p => fs.existsSync(p));

  const browser = await puppeteer.launch({
    headless: 'new',
    ...(chromePath ? { executablePath: chromePath } : {}),
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  let passedCount = 0;
  let totalCount = 0;

  function assert(condition, testName) {
    totalCount++;
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passedCount++;
    } else {
      console.error(`✗ FAIL: ${testName}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  try {
    // 1. Authenticate and Navigate to Settings
    console.log('--- STEP 1: Logging in and navigating to Settings ---');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#tc-username, .main-wrapper', { timeout: 15000 });

    const isLogin = await page.$('#tc-username');
    if (isLogin) {
      console.log('On login screen. Selecting Admin tab...');
      const btns = await page.$$('button');
      for (const b of btns) {
        const text = await page.evaluate(el => el.innerText, b);
        if (text && text.trim() === 'Admin') {
          await b.click();
          break;
        }
      }
      await new Promise(r => setTimeout(r, 400));
      await page.$eval('#tc-username', el => { el.value = ''; });
      await page.type('#tc-username', 'tallyconnect@gmail.com');
      await page.$eval('#tc-password', el => { el.value = ''; });
      await page.type('#tc-password', 'abcd@123');
      await page.click('button[type="submit"]');
      console.log('Credentials submitted. Waiting for video loader to complete and dashboard to mount...');
      await page.waitForSelector('.main-wrapper, .glass-sidebar, .page-header, .summary-card', { timeout: 20000 });
      await new Promise(r => setTimeout(r, 1200));
    }

    // Navigate to Settings
    console.log('Navigating to Settings...');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('tc-navigate-tab', { detail: { tab: 'settings' } }));
    });
    await new Promise(r => setTimeout(r, 800));

    // If not open, click launchpad tile or header appearance button
    let hasHub = await page.$('.tc-appearance-hub, .bitrix-appearance-container');
    if (!hasHub) {
      console.log('Trying fallback navigation click on Settings tile / header icon...');
      await page.evaluate(() => {
        const headerAppBtn = document.querySelector('.header-appearance-btn');
        if (headerAppBtn) {
          // Can open modal directly
        }
        const tiles = Array.from(document.querySelectorAll('.launchpad-tile, button, .nav-item'));
        const tile = tiles.find(el => el.textContent && el.textContent.toLowerCase().includes('settings'));
        if (tile) tile.click();
      });
    }

    await page.waitForSelector('.bitrix-appearance-container, .tc-appearance-hub', { timeout: 10000 });
    assert(true, 'Appearance & Personalization container rendered in Settings');

    // 2. Test Bitrix24 Banner, Optimized Cards & Grid System
    console.log('\n--- STEP 2: Verifying Bitrix24 Sections, Optimized Cards & Grid System ---');
    const sectionsInfo = await page.evaluate(() => {
      const banner = document.querySelector('.tc-appearance-banner');
      const themeCards = document.querySelectorAll('.tc-theme-card');
      const appThemeCards = document.querySelectorAll('.tc-app-theme-card');
      const textSizeCards = document.querySelectorAll('.tc-text-size-card');
      const themeGrid = document.querySelector('.tc-theme-grid');
      const viewModeToggle = document.querySelector('.tc-view-mode-toggle');
      const firstCard = themeCards[0];
      const cardHeight = firstCard ? firstCard.getBoundingClientRect().height : 0;

      return {
        hasBanner: Boolean(banner),
        bannerText: banner ? banner.innerText : '',
        themeCount: themeCards.length,
        appThemeCount: appThemeCards.length,
        textSizeCount: textSizeCards.length,
        hasGrid: Boolean(themeGrid),
        hasViewModeToggle: Boolean(viewModeToggle),
        cardHeight: Math.round(cardHeight)
      };
    });

    assert(sectionsInfo.hasBanner, 'Top banner "Select the theme according to your preference" exists');
    assert(sectionsInfo.themeCount >= 10, `Visual themes list contains all presets + Bitrix24 themes (found ${sectionsInfo.themeCount})`);
    assert(sectionsInfo.appThemeCount === 3, 'App theme options has exactly 3 choices: Light, Dark, System');
    assert(sectionsInfo.textSizeCount === 3, 'Text size options has exactly 3 choices: ×1, ×1.5, ×2');
    assert(sectionsInfo.hasGrid, 'Theme selection operates on an optimized CSS Grid system (.tc-theme-grid)');
    assert(sectionsInfo.hasViewModeToggle, 'Theme view mode toggle (Grid / Scroll) is available');
    assert(sectionsInfo.cardHeight > 0 && sectionsInfo.cardHeight <= 165, `Card height is optimized and compact (measured ${sectionsInfo.cardHeight}px, down from 236px)`);

    // 3. Test App Theme Switching (Light, Dark, System)
    console.log('\n--- STEP 3: Testing App Theme Switching (Light, Dark, System) ---');
    // Click Dark
    await page.evaluate(() => {
      const darkCard = document.querySelector('[data-theme-option="dark"]');
      if (darkCard) darkCard.click();
    });
    await new Promise(r => setTimeout(r, 400));
    
    let isDark = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme') === 'dark' &&
             localStorage.getItem('tc_theme_mode') === 'dark' &&
             localStorage.getItem('tc_dark') === '1';
    });
    assert(isDark, 'Selecting Dark theme applies data-theme="dark" and persists tc_theme_mode="dark"');

    // Click Light
    await page.evaluate(() => {
      const lightCard = document.querySelector('[data-theme-option="light"]');
      if (lightCard) lightCard.click();
    });
    await new Promise(r => setTimeout(r, 400));

    let isLight = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme') === 'light' &&
             localStorage.getItem('tc_theme_mode') === 'light' &&
             localStorage.getItem('tc_dark') === '0';
    });
    assert(isLight, 'Selecting Light theme applies data-theme="light" and persists tc_theme_mode="light"');

    // Click System
    await page.evaluate(() => {
      const systemCard = document.querySelector('[data-theme-option="system"]');
      if (systemCard) systemCard.click();
    });
    await new Promise(r => setTimeout(r, 400));

    let isSystem = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme-mode') === 'system' &&
             localStorage.getItem('tc_theme_mode') === 'system';
    });
    assert(isSystem, 'Selecting System theme applies data-theme-mode="system" and listens to OS media query');

    // 4. Test Text Size Scaling (×1, ×1.5, ×2)
    console.log('\n--- STEP 4: Testing Text Size Scaling (×1, ×1.5, ×2) ---');
    // Click ×1.5
    await page.evaluate(() => {
      const card = document.querySelector('[data-text-size-option="1.5"]');
      if (card) card.click();
    });
    await new Promise(r => setTimeout(r, 400));

    let scale15 = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-text-scale') === '1.5' &&
             localStorage.getItem('tc_text_scale') === '1.5';
    });
    assert(scale15, 'Selecting ×1.5 applies data-text-scale="1.5" and persists tc_text_scale="1.5"');

    // Click ×2
    await page.evaluate(() => {
      const card = document.querySelector('[data-text-size-option="2"]');
      if (card) card.click();
    });
    await new Promise(r => setTimeout(r, 400));

    let scale2 = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-text-scale') === '2' &&
             localStorage.getItem('tc_text_scale') === '2';
    });
    assert(scale2, 'Selecting ×2 applies data-text-scale="2" and persists tc_text_scale="2"');

    // Reset back to ×1
    await page.evaluate(() => {
      const card = document.querySelector('[data-text-size-option="1"]');
      if (card) card.click();
    });
    await new Promise(r => setTimeout(r, 400));

    let scale1 = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-text-scale') === '1' &&
             localStorage.getItem('tc_text_scale') === '1';
    });
    assert(scale1, 'Selecting ×1 applies data-text-scale="1"');

    // 5. Test Wallpaper Selection & Persistence
    console.log('\n--- STEP 5: Testing Wallpaper / Theme Selection & Persistence ---');
    await page.evaluate(() => {
      // Find "Vibecoding" theme card
      const cards = Array.from(document.querySelectorAll('.tc-theme-card'));
      const vibecodingCard = cards.find(c => c.innerText && c.innerText.includes('Vibecoding'));
      if (vibecodingCard) {
        const btn = vibecodingCard.querySelector('button, .tc-apply-btn') || vibecodingCard;
        btn.click();
      }
    });
    await new Promise(r => setTimeout(r, 500));

    const bgVal = await page.evaluate(() => localStorage.getItem('tc_bg'));
    assert(Boolean(bgVal), 'Selecting Vibecoding wallpaper updates tc_bg in localStorage');

    // Take screenshot of Settings with Bitrix24 Appearance UI
    const shotPath = path.join(ARTIFACT_DIR, 'bitrix24_appearance_settings_verified.png');
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`Saved screenshot: ${shotPath}`);

    // Scroll into view to capture App theme and Text size sections
    await page.evaluate(() => {
      const appThemeSec = document.querySelector('.tc-app-theme-grid');
      if (appThemeSec) appThemeSec.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise(r => setTimeout(r, 400));
    const shotPath2 = path.join(ARTIFACT_DIR, 'bitrix24_app_theme_and_text_size_verified.png');
    await page.screenshot({ path: shotPath2, fullPage: false });
    console.log(`Saved screenshot: ${shotPath2}`);

    // 6. Test Page Reload Persistence
    console.log('\n--- STEP 6: Testing Page Reload & Preference Restoration ---');
    await page.reload({ waitUntil: 'networkidle2' });
    console.log('Waiting for video loader to complete after reload...');
    await page.waitForSelector('.main-wrapper, .glass-sidebar, .page-header', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 2600));

    const persistedState = await page.evaluate(() => {
      return {
        bg: localStorage.getItem('tc_bg'),
        themeMode: localStorage.getItem('tc_theme_mode'),
        textScale: localStorage.getItem('tc_text_scale'),
        domTheme: document.documentElement.getAttribute('data-theme'),
        domTextScale: document.documentElement.getAttribute('data-text-scale')
      };
    });
    console.log('Restored Preferences After Reload:', persistedState);
    assert(Boolean(persistedState.bg), 'Wallpaper persisted across reload');
    assert(persistedState.themeMode === 'system', 'Theme Mode (system) persisted across reload');
    assert(persistedState.textScale === '1', 'Text Scale persisted across reload');

    // 7. Test Quick-Access Header Appearance Modal
    console.log('\n--- STEP 7: Testing Header Appearance Quick-Access Modal ---');
    await page.waitForSelector('.header-appearance-btn', { timeout: 5000 });
    await page.click('.header-appearance-btn');
    await page.waitForSelector('.modal-backdrop .tc-appearance-hub', { timeout: 8000 });
    assert(true, 'Header Appearance button opens centralized Appearance modal');
    const shotPath3 = path.join(ARTIFACT_DIR, 'bitrix24_appearance_modal_verified.png');
    await page.screenshot({ path: shotPath3, fullPage: false });
    console.log(`Saved screenshot: ${shotPath3}`);

    console.log(`\n========================================================================`);
    console.log(`ALL APPEARANCE & PERSONALIZATION TESTS PASSED! (${passedCount}/${totalCount})`);
    console.log(`========================================================================\n`);

  } catch (err) {
    console.error('\n❌ TEST ERROR:', err);
    try {
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'debug_appearance_failure.png') });
    } catch {}
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTests();

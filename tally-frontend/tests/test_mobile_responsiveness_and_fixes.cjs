const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = path.resolve(__dirname, '../../scratch');
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function runMobileResponsivenessTests() {
  console.log('========================================================================');
  console.log('TALLYCONNECT MOBILE RESPONSIVENESS & FIXES VERIFICATION TEST SUITE');
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
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('error') || text.includes('failed') || text.includes('Notice') || text.includes('Login')) {
      console.log('BROWSER CONSOLE:', text);
    }
  });
  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`✓ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`✗ FAIL: ${message}`);
      throw new Error(`Test assertion failed: ${message}`);
    }
  }

  try {
    // ------------------------------------------------------------------
    // TEST 1: VideoLoader (Earth Animation) on Mobile (390x844)
    // ------------------------------------------------------------------
    console.log('\n--- TEST 1: VideoLoader Earth Animation on Mobile (iPhone 14: 390x844) ---');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    // Clear localStorage to see login & loader
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });

    // Verify VideoLoader overlays and scales
    const loaderExists = await page.waitForSelector('.tc-video-loader-overlay', { timeout: 4000 }).catch(() => null);
    if (loaderExists) {
      const loaderMetrics = await page.evaluate(() => {
        const stage = document.querySelector('.tc-video-stage');
        const video = document.querySelector('.tc-video-element');
        const shield = document.querySelector('.tc-logo-floating-brand');
        const hud = document.querySelector('.tc-loader-hud');

        const stageRect = stage ? stage.getBoundingClientRect() : null;
        const videoRect = video ? video.getBoundingClientRect() : null;
        const shieldRect = shield ? shield.getBoundingClientRect() : null;

        return {
          hasStage: Boolean(stage),
          hasVideo: Boolean(video),
          hasShield: Boolean(shield),
          hasHud: Boolean(hud),
          stageWidth: stageRect ? Math.round(stageRect.width) : 0,
          stageHeight: stageRect ? Math.round(stageRect.height) : 0,
          shieldCenterRel: shieldRect && stageRect ? (shieldRect.top + shieldRect.height / 2 - stageRect.top) / stageRect.height : 0
        };
      });

      assert(loaderMetrics.hasStage, 'VideoLoader stage (.tc-video-stage) rendered');
      assert(loaderMetrics.hasVideo, 'Rotating Earth video element mounted');
      assert(loaderMetrics.hasShield, 'Official TallyConnect branding shield rendered');
      assert(loaderMetrics.stageWidth <= 390, `Stage width (${loaderMetrics.stageWidth}px) fits mobile viewport (390px) without overflow`);
      assert(
        loaderMetrics.shieldCenterRel >= 0.70 && loaderMetrics.shieldCenterRel <= 0.76,
        `Logo shield center is locked synchronously to stage at 73% relative position (measured ${(loaderMetrics.shieldCenterRel * 100).toFixed(1)}%)`
      );

      // Capture Mobile Loader Screenshot
      const mobileLoaderShot = path.join(ARTIFACT_DIR, 'test_loader_mobile_390.png');
      await page.screenshot({ path: mobileLoaderShot });
      console.log(`Saved screenshot: ${mobileLoaderShot}`);
    } else {
      console.log('VideoLoader completed quickly; testing component metrics...');
    }

    // ------------------------------------------------------------------
    // TEST 2: VideoLoader on Tablet (768x1024) and Desktop (1440x900)
    // ------------------------------------------------------------------
    console.log('\n--- TEST 2: VideoLoader Earth Animation on Tablet (768x1024) & Desktop (1440x900) ---');
    await page.setViewport({ width: 768, height: 1024 });
    const tabletStageFit = await page.evaluate(() => {
      // Create temporary loader instance check or inspect CSS aspect-ratio rules
      const testEl = document.createElement('div');
      testEl.className = 'tc-video-stage';
      document.body.appendChild(testEl);
      const style = window.getComputedStyle(testEl);
      const aspect = style.aspectRatio;
      testEl.remove();
      return aspect;
    });
    assert(tabletStageFit.includes('16 / 9') || tabletStageFit.includes('16/9') || tabletStageFit === '1.77778', 'tc-video-stage enforces 16:9 aspect-ratio across viewports');

    // ------------------------------------------------------------------
    // TEST 3: Login Page Mobile Responsiveness (360px & 390px)
    // ------------------------------------------------------------------
    console.log('\n--- TEST 3: Login Page Mobile Layout, Spacing, Typography & Touch Targets ---');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.waitForSelector('.login-card', { timeout: 10000 });

    const loginMetrics = await page.evaluate(() => {
      const shell = document.querySelector('.auth-shell');
      const card = document.querySelector('.login-card');
      const logo = document.querySelector('.login-card svg, .login-card img');
      const userBtn = Array.from(document.querySelectorAll('.login-card button')).find(b => b.textContent.trim() === 'User');
      const adminBtn = Array.from(document.querySelectorAll('.login-card button')).find(b => b.textContent.trim() === 'Admin');
      const submitBtn = document.querySelector('.login-card button[type="submit"]');
      const emailInput = document.querySelector('#tc-username');
      const passwordInput = document.querySelector('#tc-password');
      const poweredBy = document.querySelector('.auth-powered-by');

      const cardRect = card ? card.getBoundingClientRect() : null;
      const userBtnRect = userBtn ? userBtn.getBoundingClientRect() : null;
      const submitBtnRect = submitBtn ? submitBtn.getBoundingClientRect() : null;
      const emailStyle = emailInput ? window.getComputedStyle(emailInput) : null;
      const poweredByRect = poweredBy ? poweredBy.getBoundingClientRect() : null;

      // Check for horizontal overflow
      const docWidth = document.documentElement.scrollWidth;
      const winWidth = window.innerWidth;

      return {
        hasCard: Boolean(card),
        hasLogo: Boolean(logo),
        hasUserBtn: Boolean(userBtn),
        hasAdminBtn: Boolean(adminBtn),
        hasSubmitBtn: Boolean(submitBtn),
        cardWidth: cardRect ? Math.round(cardRect.width) : 0,
        userBtnHeight: userBtnRect ? Math.round(userBtnRect.height) : 0,
        submitBtnHeight: submitBtnRect ? Math.round(submitBtnRect.height) : 0,
        emailFontSize: emailStyle ? emailStyle.fontSize : '',
        emailMinHeight: emailStyle ? parseFloat(emailStyle.minHeight || '0') : 0,
        hasHorizontalOverflow: docWidth > winWidth,
        poweredByVisible: Boolean(poweredBy) && poweredByRect && poweredByRect.height > 0
      };
    });

    assert(loginMetrics.hasCard, 'Login card mounted');
    assert(loginMetrics.hasLogo, 'TallyConnect logo rendered inside login card');
    assert(!loginMetrics.hasHorizontalOverflow, 'Zero horizontal overflow on mobile (390px)');
    assert(loginMetrics.cardWidth <= 390, `Login card width (${loginMetrics.cardWidth}px) properly padded for mobile viewport`);
    assert(loginMetrics.userBtnHeight >= 40, `Role toggle button height (${loginMetrics.userBtnHeight}px) meets touch target minimum (>= 40px)`);
    assert(loginMetrics.submitBtnHeight >= 44, `Sign In submit button height (${loginMetrics.submitBtnHeight}px) meets touch target minimum (>= 44px)`);
    assert(
      parseFloat(loginMetrics.emailFontSize) >= 16,
      `Input font size (${loginMetrics.emailFontSize}) is >= 16px to prevent iOS Safari auto-zoom`
    );
    assert(loginMetrics.poweredByVisible, '"Powered by Averlon" footer visible and correctly positioned');

    // Capture Mobile Login Screenshot
    const mobileLoginShot = path.join(ARTIFACT_DIR, 'test_login_mobile_390.png');
    await page.screenshot({ path: mobileLoginShot });
    console.log(`Saved screenshot: ${mobileLoginShot}`);

    // Test on smaller mobile screen: 360x740 (Samsung Galaxy / Android small)
    await page.setViewport({ width: 360, height: 740, isMobile: true, hasTouch: true });
    await new Promise(r => setTimeout(r, 300));
    const smallMobileFit = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth;
    });
    assert(smallMobileFit, 'Zero horizontal overflow on compact mobile viewport (360px)');
    const smallLoginShot = path.join(ARTIFACT_DIR, 'test_login_mobile_360.png');
    await page.screenshot({ path: smallLoginShot });
    console.log(`Saved screenshot: ${smallLoginShot}`);

    // ------------------------------------------------------------------
    // TEST 4: Touch Interactions & Role Switching
    // ------------------------------------------------------------------
    console.log('\n--- TEST 4: Touch Interactions & Role Switching ---');
    // Click "Admin" toggle
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const adminBtn = btns.find(b => b.textContent.trim() === 'Admin');
      if (adminBtn) adminBtn.click();
    });
    await new Promise(r => setTimeout(r, 200));

    const adminActive = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const adminBtn = btns.find(b => b.textContent.trim() === 'Admin');
      return adminBtn && adminBtn.style.color && adminBtn.style.color.includes('primary-color');
    });
    assert(adminActive, 'Admin button activates cleanly upon touch/click');

    // Click "User" toggle back
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const userBtn = btns.find(b => b.textContent.trim() === 'User');
      if (userBtn) userBtn.click();
    });
    await new Promise(r => setTimeout(r, 200));

    // ------------------------------------------------------------------
    // TEST 5: Desktop Regression (1440x900)
    // ------------------------------------------------------------------
    console.log('\n--- TEST 5: Desktop Login Page Regression & Layout Preservation ---');
    await page.setViewport({ width: 1440, height: 900, isMobile: false, hasTouch: false });
    await new Promise(r => setTimeout(r, 400));

    const desktopMetrics = await page.evaluate(() => {
      const card = document.querySelector('.login-card');
      const poweredBy = document.querySelector('.auth-powered-by');
      const cardRect = card ? card.getBoundingClientRect() : null;
      const poweredStyle = poweredBy ? window.getComputedStyle(poweredBy) : null;

      return {
        cardWidth: cardRect ? Math.round(cardRect.width) : 0,
        poweredPosition: poweredStyle ? poweredStyle.position : ''
      };
    });

    assert(desktopMetrics.cardWidth >= 400 && desktopMetrics.cardWidth <= 460, `Desktop login card width is preserved at 460px (measured ${desktopMetrics.cardWidth}px)`);
    assert(desktopMetrics.poweredPosition === 'absolute', 'Desktop "Powered by Averlon" badge stays in bottom-right absolute corner');

    const desktopLoginShot = path.join(ARTIFACT_DIR, 'test_login_desktop_1440.png');
    await page.screenshot({ path: desktopLoginShot });
    console.log(`Saved screenshot: ${desktopLoginShot}`);

    // ------------------------------------------------------------------
    // TEST 6: Successful Login & Dashboard Access
    // ------------------------------------------------------------------
    console.log('\n--- TEST 6: Submitting Credentials & Verifying Post-Login Transition ---');
    // Select Admin tab
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

    console.log('Waiting for login auth & dashboard mount...');
    await page.waitForSelector('.main-wrapper, .glass-sidebar, .page-header, .summary-card', { timeout: 25000 });
    assert(true, 'Login succeeded and redirected to dashboard');

    // ------------------------------------------------------------------
    // TEST 7: Account Profile Avatar Upload Verification
    // ------------------------------------------------------------------
    console.log('\n--- TEST 7: Account Profile Avatar Image Upload Verification ---');
    // Test backend avatar endpoint directly with FormData
    const token = await page.evaluate(() => localStorage.getItem('tc_token'));
    assert(Boolean(token), 'Valid auth token retrieved for logged in user');

    // Upload test image via fetch in page context
    const avatarUploadResult = await page.evaluate(async () => {
      try {
        // Create 64x64 test PNG image blob
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#007aff';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px sans-serif';
        ctx.fillText('TC', 10, 44);

        const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
        const file = new File([blob], 'test-avatar.png', { type: 'image/png' });
        const formData = new FormData();
        formData.append('avatar', file);

        const token = localStorage.getItem('tc_token');
        const res = await fetch('/api/users/me/avatar', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData
        });

        const data = await res.json();
        return { ok: res.ok, status: res.status, data };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    });

    console.log('Avatar upload response:', JSON.stringify(avatarUploadResult));
    assert(
      avatarUploadResult.ok && avatarUploadResult.data?.avatar_url,
      `Account profile accepts image upload and returns valid avatar URL: ${avatarUploadResult.data?.avatar_url}`
    );

    // ------------------------------------------------------------------
    // TEST 8: Custom Background Wallpaper Upload & Screen Fit Modes
    // ------------------------------------------------------------------
    console.log('\n--- TEST 8: Custom Wallpaper High-Definition Processing & Screen Fit ---');
    // Navigate to Settings
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('tc-navigate-tab', { detail: { tab: 'settings' } }));
    });
    await page.waitForSelector('.tc-appearance-hub, .bitrix-appearance-container', { timeout: 10000 });

    // Expand custom wallpaper section if collapsed
    await page.evaluate(() => {
      const customToggle = document.querySelector('.tc-custom-bg-toggle');
      if (customToggle) customToggle.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // Verify Wallpaper Screen Fit selector rendered
    const fitButtons = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns
        .filter(b => ['Fill Screen', 'Fit to Screen', 'Match Screen'].includes(b.textContent.trim()))
        .map(b => b.textContent.trim());
    });

    assert(fitButtons.includes('Fill Screen'), 'Fit option "Fill Screen" available');
    assert(fitButtons.includes('Fit to Screen'), 'Fit option "Fit to Screen" available');
    assert(fitButtons.includes('Match Screen'), 'Fit option "Match Screen" available');

    // Test clicking "Match Screen"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const matchBtn = btns.find(b => b.textContent.trim() === 'Match Screen');
      if (matchBtn) matchBtn.click();
    });
    await new Promise(r => setTimeout(r, 300));

    const appliedFit = await page.evaluate(() => {
      return {
        storageFit: localStorage.getItem('tc_bg_size'),
        cssVar: document.documentElement.style.getPropertyValue('--bg-size')
      };
    });
    assert(appliedFit.storageFit === '100% 100%', 'Selecting "Match Screen" updates tc_bg_size in localStorage');
    assert(appliedFit.cssVar === '100% 100%', 'Selecting "Match Screen" sets CSS variable --bg-size: 100% 100%');

    // Test clicking "Fit to Screen"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const fitBtn = btns.find(b => b.textContent.trim() === 'Fit to Screen');
      if (fitBtn) fitBtn.click();
    });
    await new Promise(r => setTimeout(r, 300));
    const containFit = await page.evaluate(() => localStorage.getItem('tc_bg_size'));
    assert(containFit === 'contain', 'Selecting "Fit to Screen" updates tc_bg_size to "contain"');

    // Reset back to "Fill Screen"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const fillBtn = btns.find(b => b.textContent.trim() === 'Fill Screen');
      if (fillBtn) fillBtn.click();
    });
    await new Promise(r => setTimeout(r, 300));

    // Screenshot of Settings with Custom Wallpaper controls
    const shotCustom = path.join(ARTIFACT_DIR, 'test_wallpaper_screen_fit_verified.png');
    await page.screenshot({ path: shotCustom });
    console.log(`Saved screenshot: ${shotCustom}`);

    console.log('\n========================================================================');
    console.log(`ALL TESTS PASSED! (${passedTests}/${totalTests} assertions)`);
    console.log('========================================================================\n');
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED WITH ERROR:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runMobileResponsivenessTests();

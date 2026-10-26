const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = path.resolve(__dirname, '../../scratch');
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function runSettingsAndChatbotTests() {
  console.log('========================================================================');
  console.log('TEST SUITE: SETTINGS PAGE OPTIMIZATION & CHATBOT BRANDING VERIFICATION');
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
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });

    // Handle login if redirected to login card
    const loginCard = await page.waitForSelector('.login-card', { timeout: 4000 }).catch(() => null);
    if (loginCard) {
      console.log('Logging in with admin credentials...');
      const btns = await page.$$('button');
      for (const b of btns) {
        const text = await page.evaluate(el => el.innerText, b);
        if (text && text.trim() === 'Admin') {
          await b.click();
          break;
        }
      }
      await new Promise(r => setTimeout(r, 300));
      await page.$eval('#tc-username', el => { el.value = ''; });
      await page.type('#tc-username', 'tallyconnect@gmail.com');
      await page.$eval('#tc-password', el => { el.value = ''; });
      await page.type('#tc-password', 'abcd@123');
      await page.click('button[type="submit"]');
      await page.waitForSelector('.main-wrapper, .glass-sidebar', { timeout: 20000 });
      console.log('Login successful.');
    }

    await new Promise(r => setTimeout(r, 1000));

    // ------------------------------------------------------------------
    // TEST 1: CHATBOT HOVER & BRANDING (NO LUMILO / LUMINO)
    // ------------------------------------------------------------------
    console.log('\n--- TEST 1: Chatbot Hover, Tooltip & Title Branding ---');
    const fabSelector = '.ai-assistant-fab';
    await page.waitForSelector(fabSelector, { timeout: 8000 });

    // Hover cursor over chatbot button
    await page.hover(fabSelector);
    await new Promise(r => setTimeout(r, 400));

    const chatbotMeta = await page.evaluate(() => {
      const fab = document.querySelector('.ai-assistant-fab');
      const container = document.querySelector('.ai-fab-container');
      const tooltip = document.querySelector('.ai-fab-tooltip');
      const betaBadge = document.querySelector('.ai-fab-beta-badge');
      const icon = document.querySelector('.tc-ai-chatbot-icon');

      const fabTitle = fab ? fab.getAttribute('title') : '';
      const fabAria = fab ? fab.getAttribute('aria-label') : '';
      const containerTitle = container ? container.getAttribute('title') : '';
      const tooltipText = tooltip ? tooltip.textContent.trim() : '';
      const badgeTitle = betaBadge ? betaBadge.getAttribute('title') : '';
      const iconAria = icon ? icon.getAttribute('aria-label') : '';

      return {
        fabTitle,
        fabAria,
        containerTitle,
        tooltipText,
        badgeTitle,
        iconAria,
        hasLumilo: (fabTitle + fabAria + containerTitle + tooltipText + badgeTitle + iconAria).toLowerCase().includes('lumil') ||
                   (fabTitle + fabAria + containerTitle + tooltipText + badgeTitle + iconAria).toLowerCase().includes('lumin')
      };
    });

    console.log('Chatbot FAB metadata:', chatbotMeta);
    assert(chatbotMeta.fabTitle.includes('TallyConnect AI Chatbot'), `FAB title is "${chatbotMeta.fabTitle}" (contains TallyConnect AI Chatbot)`);
    assert(chatbotMeta.tooltipText === 'TallyConnect AI Chatbot', `Hover tooltip text is "${chatbotMeta.tooltipText}"`);
    assert(chatbotMeta.badgeTitle.includes('TallyConnect AI Chatbot'), `Beta badge title is "${chatbotMeta.badgeTitle}"`);
    assert(!chatbotMeta.hasLumilo, 'Zero mentions of "Lumilo" or "lumino" on hover / cursor over chatbot');

    // Click chatbot button to open dialog
    await page.click(fabSelector);
    await page.waitForSelector('.ai-assistant-dialog', { timeout: 5000 });

    const dialogMeta = await page.evaluate(() => {
      const title = document.querySelector('.ai-dialog-title')?.textContent?.trim() || '';
      const sub = document.querySelector('.ai-dialog-sub')?.textContent?.trim() || '';
      return {
        title,
        sub,
        hasLumilo: (title + sub).toLowerCase().includes('lumil') || (title + sub).toLowerCase().includes('lumin')
      };
    });

    console.log('Chatbot dialog metadata:', dialogMeta);
    assert(dialogMeta.title.includes('TallyConnect AI Chatbot'), `Dialog title is "${dialogMeta.title}"`);
    assert(dialogMeta.sub.includes('TallyConnect AI'), `Dialog subtitle is "${dialogMeta.sub}"`);
    assert(!dialogMeta.hasLumilo, 'Zero mentions of "Lumilo" or "lumino" inside chatbot dialog');

    const chatbotShot = path.join(ARTIFACT_DIR, 'test_chatbot_verified.png');
    await page.screenshot({ path: chatbotShot });
    console.log(`Saved screenshot: ${chatbotShot}`);

    // Close chatbot
    await page.click('.ai-close-circle[title="Close"]');
    await new Promise(r => setTimeout(r, 400));

    // ------------------------------------------------------------------
    // TEST 2: SETTINGS PAGE CATEGORIZATION & UNCLUTTERED LAYOUT
    // ------------------------------------------------------------------
    console.log('\n--- TEST 2: Settings Page Optimization & Tabs Navigation ---');

    // Navigate to Settings
    await page.evaluate(() => {
      const navItems = Array.from(document.querySelectorAll('.nav-item, .user-menu-dropdown button, button'));
      const settingsItem = navItems.find(b => b.textContent.toLowerCase().includes('settings'));
      if (settingsItem) settingsItem.click();
    });

    await page.waitForSelector('.form-container h1', { timeout: 8000 });
    await new Promise(r => setTimeout(r, 600));

    const settingsHeader = await page.evaluate(() => {
      const h1 = document.querySelector('.page-header h1')?.textContent?.trim();
      const p = document.querySelector('.page-header p')?.textContent?.trim();
      return { h1, p };
    });
    console.log('Settings header:', settingsHeader);
    assert(settingsHeader.h1.includes('Settings'), 'Settings page mounted with clean header');

    // Check Quick Overview Status Cards
    const quickCards = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.form-container .glass-panel'));
      return cards.slice(0, 3).map(c => c.textContent.trim());
    });
    console.log('Top status cards count:', quickCards.length);
    assert(quickCards.length >= 3, 'Top status cards (Profile, Company, Notifications) are rendered cleanly');

    // Check Category Tabs
    const tabLabels = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.form-container button[type="button"]'));
      return tabs.filter(b => ['Appearance & Themes', 'General & Workspace', 'Automated Reports', 'Admin & Visibility'].includes(b.textContent.trim()))
                 .map(b => b.textContent.trim());
    });
    console.log('Category tabs rendered:', tabLabels);
    assert(tabLabels.includes('Appearance & Themes'), 'Category tab "Appearance & Themes" present');
    assert(tabLabels.includes('General & Workspace'), 'Category tab "General & Workspace" present');
    assert(tabLabels.includes('Automated Reports'), 'Category tab "Automated Reports" present');
    assert(tabLabels.includes('Admin & Visibility'), 'Category tab "Admin & Visibility" present');

    // Tab 1: Appearance & Themes (Default)
    const appearanceVisible = await page.evaluate(() => {
      return Boolean(document.querySelector('.appearance-settings-container, .theme-mode-segmented'));
    });
    assert(appearanceVisible, 'Appearance & Themes tab displays themes & wallpaper controls smoothly');

    const settingsShotAppearance = path.join(ARTIFACT_DIR, 'test_settings_appearance_tab.png');
    await page.screenshot({ path: settingsShotAppearance });
    console.log(`Saved screenshot: ${settingsShotAppearance}`);

    // Tab 2: Switch to General & Workspace
    console.log('\n--- Switching to General & Workspace Tab ---');
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.form-container button'));
      const generalTab = tabs.find(b => b.textContent.includes('General & Workspace'));
      if (generalTab) generalTab.click();
    });
    await new Promise(r => setTimeout(r, 400));

    const generalVisible = await page.evaluate(() => {
      const hasAutoSync = document.body.innerText.includes('Auto Sync with Tally');
      const hasLanguage = Boolean(document.querySelector('#settings-language'));
      const hasUnhide = document.body.innerText.includes('Unhide Hidden Items');
      return hasAutoSync && hasLanguage && hasUnhide;
    });
    assert(generalVisible, 'General & Workspace tab renders Auto Sync, Language and Unhide Hidden Items in dedicated cards');

    const settingsShotGeneral = path.join(ARTIFACT_DIR, 'test_settings_general_tab.png');
    await page.screenshot({ path: settingsShotGeneral });
    console.log(`Saved screenshot: ${settingsShotGeneral}`);

    // Tab 3: Switch to Automated Reports
    console.log('\n--- Switching to Automated Reports Tab ---');
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.form-container button'));
      const reportsTab = tabs.find(b => b.textContent.includes('Automated Reports'));
      if (reportsTab) reportsTab.click();
    });
    await new Promise(r => setTimeout(r, 400));

    const reportsVisible = await page.evaluate(() => {
      const hasSchedule = document.body.innerText.includes('Automated Monthly Financial Reports');
      const hasDay = document.body.innerText.includes('Dispatch Day of Month');
      const hasTime = document.body.innerText.includes('Target Delivery Time');
      const hasSaveBtn = Boolean(document.querySelector('button[type="submit"]'));
      return hasSchedule && hasDay && hasTime && hasSaveBtn;
    });
    assert(reportsVisible, 'Automated Reports tab renders scheduling form cleanly without congestion');

    const settingsShotReports = path.join(ARTIFACT_DIR, 'test_settings_reports_tab.png');
    await page.screenshot({ path: settingsShotReports });
    console.log(`Saved screenshot: ${settingsShotReports}`);

    // Tab 4: Switch to Admin & Visibility
    console.log('\n--- Switching to Admin & Visibility Tab ---');
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.form-container button'));
      const adminTab = tabs.find(b => b.textContent.includes('Admin & Visibility'));
      if (adminTab) adminTab.click();
    });
    await new Promise(r => setTimeout(r, 400));

    const adminVisible = await page.evaluate(() => {
      const hasVoucherFields = document.body.innerText.includes('Dynamic Voucher Fields Customizer');
      const hasUserVisibility = document.body.innerText.includes('Administrator Visibility Controls');
      return hasVoucherFields && hasUserVisibility;
    });
    assert(adminVisible, 'Admin & Visibility tab renders Voucher Fields Customizer and Visibility Controls cards');

    const settingsShotAdmin = path.join(ARTIFACT_DIR, 'test_settings_admin_tab.png');
    await page.screenshot({ path: settingsShotAdmin });
    console.log(`Saved screenshot: ${settingsShotAdmin}`);

    // ------------------------------------------------------------------
    // TEST 3: BITRIX24 FILTER SEARCH BUTTON CLICK ACCESSIBILITY
    // ------------------------------------------------------------------
    console.log('\n--- TEST 3: Bitrix24 Search Button Click Accessibility ---');
    // Navigate to Vouchers or Customers
    await page.evaluate(() => {
      const navButtons = Array.from(document.querySelectorAll('.nav-menu button, .glass-sidebar button'));
      const vouchersBtn = navButtons.find(b => b.textContent.toLowerCase().includes('vouchers') || b.textContent.toLowerCase().includes('day book'));
      if (vouchersBtn) vouchersBtn.click();
    });

    await page.waitForSelector('.bitrix-search-bar-wrap', { timeout: 8000 });
    await new Promise(r => setTimeout(r, 500));

    // Verify clicking the search button inside the search bar opens the filter dropdown!
    const dropdownOpened = await page.evaluate(async () => {
      const trigger = document.querySelector('.bitrix-search-bar-wrap .search-trigger');
      if (!trigger) return false;
      trigger.click();
      await new Promise(r => setTimeout(r, 400));
      const dropdown = document.querySelector('.bitrix-filter-dropdown');
      return Boolean(dropdown && dropdown.offsetParent !== null);
    });

    assert(dropdownOpened, 'Clicking search button inside search bar immediately opens the Bitrix24 filter popup');

    const bitrixShot = path.join(ARTIFACT_DIR, 'test_bitrix_search_button_opened.png');
    await page.screenshot({ path: bitrixShot });
    console.log(`Saved screenshot: ${bitrixShot}`);

    console.log(`\n========================================================================`);
    console.log(`ALL TESTS PASSED! (${passedTests}/${totalTests})`);
    console.log(`========================================================================\n`);

  } catch (err) {
    console.error('Test run failed with error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runSettingsAndChatbotTests();

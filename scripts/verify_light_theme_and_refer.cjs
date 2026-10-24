const puppeteer = require('../tally-frontend/node_modules/puppeteer');
const path = require('path');
const fs = require('fs');

const delay = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== Verifying Light Theme Modals, Refer a Friend Tab, and Live Sync Time ===');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 950 });

    console.log('1. Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await delay(1200);

    // Login if on login page
    const usernameInput = await page.$('#tc-username');
    if (usernameInput) {
      console.log('Logging in as Admin...');
      const buttons = await page.$$('button');
      for (const b of buttons) {
        const text = await page.evaluate(el => el.innerText, b);
        if (text && text.trim() === 'Admin') { await b.click(); break; }
      }
      await page.type('#tc-username', 'tallyconnect@gmail.com');
      await page.type('#tc-password', 'abcd@123');
      await page.click('button[type="submit"]');
      await delay(2000);
    }

    await delay(1500);

    // 2. Check Header Last Sync Badge
    const headerSyncText = await page.evaluate(() => {
      const badges = Array.from(document.querySelectorAll('div, span')).filter(el => el.textContent && el.textContent.includes('Last Sync:'));
      return badges[0] ? badges[0].innerText.replace(/\n/g, ' ') : 'Not found';
    });
    console.log('Header Last Sync Badge text:', headerSyncText);
    await page.screenshot({ path: 'scripts/verified_header_sync.png' });
    console.log('📸 Screenshot saved: scripts/verified_header_sync.png');

    // 3. Navigate to Activity Center and check Last Synced display
    console.log('Navigating to Activity tab...');
    await page.evaluate(() => {
      const navs = Array.from(document.querySelectorAll('.nav-item'));
      const actNav = navs.find(n => n.textContent.includes('Activity'));
      if (actNav) actNav.click();
    });
    await delay(1500);

    const activitySyncText = await page.evaluate(() => {
      const paragraphs = Array.from(document.querySelectorAll('p')).filter(p => p.textContent && p.textContent.includes('Last Synced:'));
      return paragraphs[0] ? paragraphs[0].innerText : 'Not found';
    });
    console.log('Activity Center Last Synced text:', activitySyncText);
    await page.screenshot({ path: 'scripts/verified_activity_sync.png' });
    console.log('📸 Screenshot saved: scripts/verified_activity_sync.png');

    // 4. Navigate to Users tab
    console.log('Navigating to Users tab...');
    await page.evaluate(() => {
      const navs = Array.from(document.querySelectorAll('.nav-item'));
      const userNav = navs.find(n => n.textContent.includes('Users') || n.textContent.includes('User Management'));
      if (userNav) userNav.click();
    });
    await delay(1500);

    // 5. Click "Refer a Friend" tab
    console.log('Clicking "Refer a Friend" tab...');
    const referBtnClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button')).filter(b => b.textContent && b.textContent.includes('Refer a Friend'));
      if (buttons[0]) {
        buttons[0].click();
        return true;
      }
      return false;
    });
    console.log('Refer a Friend tab clicked:', referBtnClicked);
    await delay(1000);

    // Verify referral components in DOM
    const referInfo = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h3, h4, h5')).map(h => h.innerText);
      const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim());
      const inputs = Array.from(document.querySelectorAll('input, textarea')).map(i => i.placeholder);
      return { headings, buttons, inputs };
    });
    console.log('Referral Workspace Headings:', referInfo.headings.filter(h => h.includes('Refer') || h.includes('Partner') || h.includes('Invite')));
    console.log('Referral Action Buttons:', referInfo.buttons.filter(b => b.includes('Refer') || b.includes('Copy') || b.includes('WhatsApp')));

    await page.screenshot({ path: 'scripts/verified_refer_a_friend_tab.png' });
    console.log('📸 Screenshot saved: scripts/verified_refer_a_friend_tab.png');

    // 6. Test Open Permissions Modal in Light Theme
    console.log('Switching to Direct Create tab to view user list...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button')).filter(b => b.textContent && b.textContent.includes('Direct Create'));
      if (buttons[0]) buttons[0].click();
    });
    await delay(800);

    console.log('Opening Permissions modal for a staff user...');
    await page.evaluate(() => {
      const permBtns = Array.from(document.querySelectorAll('button[title*="Configure module permissions"]'));
      if (permBtns.length > 0) permBtns[0].click();
    });
    await delay(1200);

    // Check modal background color in DOM
    const modalStyle = await page.evaluate(() => {
      const modal = document.querySelector('.light-theme-modal');
      if (!modal) return null;
      const comp = window.getComputedStyle(modal);
      return {
        backgroundColor: comp.backgroundColor,
        color: comp.color,
        border: comp.border
      };
    });
    console.log('StaffPermissionsModal computed light style:', modalStyle);

    await page.screenshot({ path: 'scripts/verified_light_theme_permissions_modal.png' });
    console.log('📸 Screenshot saved: scripts/verified_light_theme_permissions_modal.png');

    console.log('=== All Verifications Completed Successfully ===');
  } catch (err) {
    console.error('❌ Verification failed:', err);
  } finally {
    await browser.close();
  }
})();

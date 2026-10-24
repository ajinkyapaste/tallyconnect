const puppeteer = require('../tally-frontend/node_modules/puppeteer');
const path = require('path');
const fs = require('fs');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function testLumiloAndUnhide() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 15000 });

  // Login if on login page
  const usernameInput = await page.$('#tc-username');
  if (usernameInput) {
    console.log('Logging in...');
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.innerText, b);
      if (text && text.trim() === 'Admin') { await b.click(); break; }
    }
    await page.type('#tc-username', 'tallyconnect@gmail.com');
    await page.type('#tc-password', 'abcd@123');
    await page.click('button[type="submit"]');
    await delay(1500);
  }

  // 1. Check Dashboard without in-place unhide tiles
  await delay(1000);
  await page.screenshot({ path: path.join(__dirname, 'test_dashboard_clean.png') });
  console.log('Captured test_dashboard_clean.png');

  // 2. Open Account Menu (user avatar)
  const userMenuBtn = await page.$('.user-menu-trigger');
  if (userMenuBtn) {
    console.log('Opening Account Menu...');
    await userMenuBtn.click();
    await delay(500);
    await page.screenshot({ path: path.join(__dirname, 'test_account_menu.png') });
    console.log('Captured test_account_menu.png');

    // Click "Restore Hidden Items"
    console.log('Clicking Restore Hidden Items button...');
    const clickedRestore = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.user-menu-dropdown button'));
      const target = btns.find(b => b.textContent.includes('Restore Hidden Items'));
      if (target) {
        target.click();
        return true;
      }
      return false;
    });

    if (clickedRestore) {
      console.log('Checking Master Unhide modal...');
      await delay(600);
      await page.screenshot({ path: path.join(__dirname, 'test_master_unhide_modal.png') });
      console.log('Captured test_master_unhide_modal.png');

      // Close modal by clicking backdrop or close button
      const closeBtn = await page.$('.feedback-modal-header button.icon-btn');
      if (closeBtn) {
        await closeBtn.click();
      } else {
        await page.click('.feedback-modal-overlay');
      }
      await delay(500);
    }
  }

  // 3. Open Lumilo AI Assistant FAB
  const fab = await page.$('.ai-assistant-fab');
  if (fab) {
    console.log('Clicking AI Assistant FAB...');
    await fab.click();
    await delay(600);
    await page.screenshot({ path: path.join(__dirname, 'test_lumilo_initial.png') });
    console.log('Captured test_lumilo_initial.png');

    // 4. Click first suggestion pill ("Who owes me the most?")
    const clickedPill = await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('.ai-suggestion-pill'));
      const pill = pills.find(p => p.textContent.includes('Who owes me the most?'));
      if (pill) {
        pill.click();
        return true;
      }
      return false;
    });

    if (clickedPill) {
      console.log('Clicked "Who owes me the most?" pill, waiting for response...');
      await delay(1500);
      await page.screenshot({ path: path.join(__dirname, 'test_lumilo_response.png') });
      console.log('Captured test_lumilo_response.png');
    }
  } else {
    console.log('Warning: .ai-assistant-fab not found!');
  }

  await browser.close();
  console.log('All tests completed successfully!');
}

testLumiloAndUnhide().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});

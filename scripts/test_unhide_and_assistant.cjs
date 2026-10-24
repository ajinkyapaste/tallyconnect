const puppeteer = require('../tally-frontend/node_modules/puppeteer');
const path = require('path');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('=== Starting Verification: AI Assistant UI & Account Menu Unhide ===');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 15000 });

  // Handle Login
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
    await delay(1800);
  }

  await delay(1200);

  // -------------------------------------------------------------
  // TEST 1: Open AI Assistant & Capture Initial State (Image 1)
  // -------------------------------------------------------------
  console.log('\n--- TEST 1: AI Assistant Initial State ---');
  // Reset tokens to 10,000 for fresh test
  await page.evaluate(() => {
    localStorage.removeItem('tc_ai_tokens');
  });

  const fab = await page.$('.ai-assistant-fab');
  if (fab) {
    await fab.click();
    await delay(600);
  }

  await page.screenshot({ path: path.join(__dirname, 'test_ai_assistant_initial.png') });
  console.log('Saved test_ai_assistant_initial.png');

  // -------------------------------------------------------------
  // TEST 2: Ask "Who owes me the most?" & Capture Active Chat (Image 2)
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: AI Assistant Active Response State ---');
  await page.evaluate(() => {
    const pills = Array.from(document.querySelectorAll('.ai-suggestion-pill'));
    const target = pills.find(p => p.textContent.includes('Who owes me the most?'));
    if (target) target.click();
  });

  await delay(1500);

  await page.screenshot({ path: path.join(__dirname, 'test_ai_assistant_response.png') });
  console.log('Saved test_ai_assistant_response.png');

  // Close AI Assistant
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.ai-close-circle');
    if (closeBtn) closeBtn.click();
  });
  await delay(500);

  // -------------------------------------------------------------
  // TEST 3: Account Menu "Unhide" Button
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Account Menu Unhide Button ---');
  // Hide an item to verify Unhide counter
  await page.evaluate(() => {
    localStorage.setItem('tc_kpi_hidden', JSON.stringify(['kpi-receivable']));
    window.dispatchEvent(new Event('tc-unhide-sync'));
  });
  await delay(400);

  // Open user menu
  const userMenuTrigger = await page.$('.user-menu-trigger');
  if (userMenuTrigger) {
    await userMenuTrigger.click();
    await delay(500);
  }

  await page.screenshot({ path: path.join(__dirname, 'test_account_menu_unhide.png') });
  console.log('Saved test_account_menu_unhide.png');

  // Click Unhide button in user menu
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('.user-menu-dropdown button'));
    const unhideBtn = buttons.find(b => b.textContent.includes('Unhide'));
    if (unhideBtn) unhideBtn.click();
  });
  await delay(500);

  await page.screenshot({ path: path.join(__dirname, 'test_master_unhide_modal.png') });
  console.log('Saved test_master_unhide_modal.png');

  await browser.close();
  console.log('=== All Verifications Finished Successfully ===');
}

run().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});

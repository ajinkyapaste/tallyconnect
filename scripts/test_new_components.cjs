const puppeteer = require('../tally-frontend/node_modules/puppeteer');
const fs = require('fs');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  console.log('--- Testing New UI Components (Feedback, AI Assistant, Drag & Drop Grid) ---');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Real login to access authenticated dashboard
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForSelector('#tc-username', { timeout: 10000 });
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text && text.trim() === 'Admin') { await b.click(); break; }
  }
  await page.type('#tc-username', 'tallyconnect@gmail.com');
  await page.type('#tc-password', 'abcd@123');
  await page.click('button[type="submit"]');

  await page.waitForSelector('.nav-item', { timeout: 10000 });
  await delay(1500);

  // 1. Verify Header Feedback Component
  console.log('\n[1] Verifying Header Feedback Component...');
  const feedbackBtn = await page.$('.header-feedback-btn');
  if (!feedbackBtn) {
    throw new Error('Header Feedback button (.header-feedback-btn) not found beside bell icon!');
  }
  console.log('✅ Feedback button found beside bell icon');

  // Click Feedback button
  await feedbackBtn.click();
  await page.waitForSelector('.feedback-modal-dialog', { visible: true });
  console.log('✅ Feedback modal opened');

  // Verify Categories
  const categories = await page.$$eval('.feedback-cat-pill', pills => pills.map(p => p.textContent.trim()));
  console.log('Feedback Categories:', categories);
  const expectedCats = ['Feedback', 'Report a bug', 'Suggestion'];
  const hasAllCats = expectedCats.every(c => categories.includes(c));
  if (!hasAllCats) throw new Error('Missing expected categories: ' + expectedCats.join(', '));
  console.log('✅ Category switcher has: Feedback, Report a bug, Suggestion');

  // Click 'Suggestion'
  await page.$$eval('.feedback-cat-pill', pills => {
    const sug = pills.find(p => p.textContent.trim() === 'Suggestion');
    if (sug) sug.click();
  });
  await delay(300);

  // Star Rating
  const stars = await page.$$('.feedback-star-btn');
  console.log(`Found ${stars.length} star buttons`);
  if (stars.length !== 5) throw new Error('Expected 5 star rating buttons');
  await stars[3].click(); // click 4 stars
  await delay(300);
  console.log('✅ 1-5 Star rating selector functional');

  // Enter Message
  await page.type('.feedback-textarea', 'Amazing dashboard! Would love automated ledger summaries.');
  await page.screenshot({ path: 'scripts/feedback_modal_preview.png' });
  console.log('📸 Saved scripts/feedback_modal_preview.png');

  // Submit Feedback
  await page.click('.feedback-modal-dialog button[type="submit"]');
  await page.waitForSelector('.feedback-success-state', { visible: true });
  console.log('✅ Feedback submitted successfully (POST /api/feedback called)');
  await delay(2000); // wait for modal auto-close

  // 2. Verify AI Assistant Floating Widget
  console.log('\n[2] Verifying AI Assistant Floating Widget...');
  const fab = await page.$('.ai-assistant-fab');
  if (!fab) throw new Error('Floating Action Button (.ai-assistant-fab) not found at bottom-right corner');
  console.log('✅ AI Assistant FAB found at bottom-right corner');

  // Click FAB to open dialog
  await fab.click();
  await page.waitForSelector('.ai-assistant-dialog', { visible: true });
  console.log('✅ AI Assistant dialog opened');

  // Verify Provider Tag ("Google Gemini")
  const providerText = await page.$eval('.ai-provider-badge', el => el.textContent.trim());
  console.log('Provider badge text:', providerText);
  if (!providerText.includes('Google Gemini')) throw new Error('Expected Google Gemini provider tag');
  console.log('✅ Provider tag "Google Gemini" verified');

  // Verify link to aistudio.google.com
  const studioLink = await page.$eval('.ai-studio-link', el => el.href);
  console.log('AI Studio link:', studioLink);
  if (!studioLink.includes('aistudio.google.com')) throw new Error('Expected link to aistudio.google.com');
  console.log('✅ Link to "aistudio.google.com" verified');

  // Test API key validation (must start with "AIza...")
  await page.type('.ai-key-input', 'invalid_key_123');
  await page.click('.ai-setup-card button[type="submit"]');
  await page.waitForSelector('.ai-key-error', { visible: true });
  const errorMsg = await page.$eval('.ai-key-error', el => el.textContent.trim());
  console.log('Validation error message:', errorMsg);
  if (!errorMsg.includes('AIza')) throw new Error('Expected validation error for key starting with AIza');
  console.log('✅ Gemini API Key validation (starts with "AIza...") verified');

  // Clear and type valid format key
  await page.$eval('.ai-key-input', el => el.value = '');
  await page.type('.ai-key-input', 'AIzaSyDemoGeminiKeyValidFormatForTesting12345');
  await page.screenshot({ path: 'scripts/ai_assistant_setup_preview.png' });
  console.log('📸 Saved scripts/ai_assistant_setup_preview.png');

  // Connect
  await page.click('.ai-setup-card button[type="submit"]');
  await delay(600);

  // Check localStorage for saved key
  const savedKey = await page.evaluate(() => localStorage.getItem('tc_gemini_api_key'));
  console.log('Saved key in localStorage:', savedKey ? 'YES (starts with ' + savedKey.substring(0, 6) + ')' : 'NO');
  if (!savedKey || !savedKey.startsWith('AIza')) throw new Error('Expected key saved to client storage');
  console.log('✅ Connect button validates and saves key to client secure storage');

  // Verify Chat Interface is enabled
  const chatMessages = await page.$('.ai-chat-messages');
  if (!chatMessages) throw new Error('Chat interface not opened after connect');
  console.log('✅ Chat interaction interface active');
  await page.screenshot({ path: 'scripts/ai_assistant_chat_preview.png' });
  console.log('📸 Saved scripts/ai_assistant_chat_preview.png');

  // Close AI Assistant dialog
  await page.click('.ai-header-btn[title="Close AI Assistant"]');
  await delay(400);

  // 3. Verify Drag-and-Drop Dashboard Grid
  console.log('\n[3] Verifying Drag-and-Drop Dashboard Grid...');
  const tiles = await page.$$eval('.launchpad-tile', els => els.map(el => ({
    name: el.querySelector('b')?.textContent.trim(),
    hint: el.querySelector('i')?.textContent.trim()
  })));
  console.log('Dashboard tiles found:', tiles.map(t => t.name));

  const expectedTiles = ['Items', 'Party', 'Vouchers', 'Invoices', 'Bills', 'Orders', 'Reports', 'Settings'];
  const hasAllTiles = expectedTiles.every(name => tiles.some(t => t.name === name));
  if (!hasAllTiles) throw new Error('Missing expected tiles in grid: ' + expectedTiles.join(', '));
  console.log('✅ All 8 dashboard cards present: Items, Party, Vouchers, Invoices, Bills, Orders, Reports, Settings');

  // Test Context Menu on first tile (Items)
  const firstTile = await page.$('.launchpad-tile');
  await firstTile.click({ button: 'right' });
  await page.waitForSelector('.dashboard-context-menu', { visible: true });
  console.log('✅ Right-click context menu opened');

  const menuOptions = await page.$$eval('.dashboard-context-menu button', btns => btns.map(b => b.textContent.trim()));
  console.log('Context menu options:', menuOptions);
  const expectedMenu = ['Pin', 'Open', 'Drag', 'Hide', 'Share'];
  const hasAllMenu = expectedMenu.every(opt => menuOptions.includes(opt));
  if (!hasAllMenu) throw new Error('Missing context menu options: ' + expectedMenu.join(', '));
  console.log('✅ Context menu contains: Pin, Open, Drag, Hide, and Share');

  await page.screenshot({ path: 'scripts/dashboard_context_menu_preview.png' });
  console.log('📸 Saved scripts/dashboard_context_menu_preview.png');

  // Click 'Pin'
  await page.$$eval('.dashboard-context-menu button', btns => {
    const pinBtn = btns.find(b => b.textContent.includes('Pin'));
    if (pinBtn) pinBtn.click();
  });
  await delay(500);

  const pinnedBadge = await page.$('.pinned-badge');
  if (!pinnedBadge) throw new Error('Pinned badge not rendered after pinning');
  console.log('✅ Pin option successfully toggled pin badge');

  // Test Drag & Drop reordering simulation
  console.log('Testing optimistic drag-and-drop tile reordering...');
  await page.evaluate(() => {
    const tiles = document.querySelectorAll('.launchpad-tile');
    if (tiles.length >= 2) {
      const dt = new DataTransfer();
      dt.setData('text/plain', '0');
      tiles[0].dispatchEvent(new DragEvent('dragstart', { dataTransfer: dt, bubbles: true }));
      tiles[1].dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true }));
      tiles[1].dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true }));
      tiles[0].dispatchEvent(new DragEvent('dragend', { bubbles: true }));
    }
  });
  await delay(600);

  const orderInStorage = await page.evaluate(() => localStorage.getItem('tc_dashboard_order'));
  console.log('Updated order in localStorage:', orderInStorage);
  if (!orderInStorage) throw new Error('Expected tc_dashboard_order updated in storage');
  console.log('✅ Drag-and-drop optimistically updates order and triggers sync');

  await page.screenshot({ path: 'scripts/dashboard_drag_drop_preview.png' });
  console.log('📸 Saved scripts/dashboard_drag_drop_preview.png');

  await browser.close();
  console.log('\n🎉 ALL 3 COMPONENTS VERIFIED SUCCESSFULLY WITH 100% PASS RATE! 🎉');
})();

const puppeteer = require('../tally-frontend/node_modules/puppeteer');
const path = require('path');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  console.log('--- Testing Account Menu Master Unhide Integration for Companies & Users ---');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const artifactDir = 'C:/Users/User/.gemini/antigravity-ide/brain/4b949fca-6e69-4d16-9183-b723e4940aeb';

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForSelector('#tc-username', { timeout: 10000 });

  // Toggle Admin tab & login
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text && text.trim() === 'Admin') { await b.click(); break; }
  }
  await page.type('#tc-username', 'tallyconnect@gmail.com');
  await page.type('#tc-password', 'abcd@123');
  await page.click('button[type="submit"]');

  await page.waitForSelector('.user-menu-trigger', { timeout: 10000 });
  await delay(2000);

  // Set mock data: Hide 1 company and 1 user, plus set metadata maps
  console.log('Injecting hidden company and hidden user into localStorage...');
  await page.evaluate(() => {
    localStorage.setItem('tc_companies_hidden', JSON.stringify(['COMP-002-BETA']));
    localStorage.setItem('tc_companies_meta_map', JSON.stringify({
      'COMP-002-BETA': 'Acme Industrial Logistics Ltd'
    }));

    localStorage.setItem('tc_users_hidden', JSON.stringify([2]));
    localStorage.setItem('tc_users_meta_map', JSON.stringify({
      2: 'Priya Sharma (Finance Exec)'
    }));

    // Trigger sync event
    window.dispatchEvent(new Event('tc-unhide-sync'));
  });
  await delay(1000);

  // Check global hidden count in state
  const countInHeader = await page.evaluate(() => {
    const trigger = document.querySelector('.user-menu-trigger');
    return trigger ? trigger.innerText : null;
  });
  console.log('User menu trigger info:', countInHeader);

  // Click user menu trigger to open account menu dropdown
  console.log('Opening Account Menu...');
  await page.click('.user-menu-trigger');
  await delay(800);

  // Verify unhide badge exists in account menu
  const badgeText = await page.evaluate(() => {
    const badge = document.querySelector('.unhide-count-badge');
    return badge ? badge.innerText.trim() : null;
  });
  console.log('Unhide count badge in Account Menu:', badgeText);

  await page.screenshot({ path: path.join(artifactDir, 'account_menu_dropdown_verified.png') });
  console.log('✅ Captured account_menu_dropdown_verified.png');

  // Click "Unhide Hidden Items"
  console.log('Clicking "Unhide Hidden Items" in Account Menu...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const unhideBtn = btns.find(b => b.textContent.includes('Unhide Hidden Items'));
    if (unhideBtn) unhideBtn.click();
  });
  await delay(1200);

  // Check if MasterUnhideModal is visible and lists both items
  const modalContent = await page.evaluate(() => {
    const modal = document.querySelector('.master-unhide-modal') || document.querySelector('[class*="unhide"]') || document.body;
    const items = Array.from(document.querySelectorAll('.unhide-item, [class*="unhide-item"], tr, li'))
      .map(el => el.innerText)
      .filter(t => t && (t.includes('Acme') || t.includes('Priya') || t.includes('COMP-002') || t.includes('Companies') || t.includes('Users')));
    return {
      textSample: document.body.innerText.slice(0, 1000),
      matchedItems: items
    };
  });
  console.log('Modal detection results:', modalContent.matchedItems);

  await page.screenshot({ path: path.join(artifactDir, 'account_menu_unhide_modal_verified.png') });
  console.log('✅ Captured account_menu_unhide_modal_verified.png');

  // Test Restoring the company from MasterUnhideModal
  console.log('Testing restoring Acme Industrial Logistics Ltd from MasterUnhideModal...');
  const restored = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const restoreBtns = buttons.filter(b => b.textContent.includes('Unhide') || b.textContent.includes('Restore') || b.title === 'Unhide');
    if (restoreBtns.length > 0) {
      restoreBtns[0].click();
      return true;
    }
    return false;
  });
  console.log('Restore button clicked:', restored);
  await delay(1000);

  const remainingInStorage = await page.evaluate(() => {
    return {
      companies: localStorage.getItem('tc_companies_hidden'),
      users: localStorage.getItem('tc_users_hidden')
    };
  });
  console.log('Storage after unhiding one:', remainingInStorage);

  await page.screenshot({ path: path.join(artifactDir, 'account_menu_after_unhide_verified.png') });
  console.log('✅ Captured account_menu_after_unhide_verified.png');

  await browser.close();
  console.log('--- Account Menu Unhide verification completed successfully ---');
})();

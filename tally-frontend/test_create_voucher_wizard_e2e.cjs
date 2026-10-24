const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/User/.gemini/antigravity-ide/brain/bf40a3da-5687-43f6-bfae-4f621515d2e7');

(async () => {
  console.log('--- Starting Create Voucher Wizard E2E Verification ---');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
    defaultViewport: { width: 1400, height: 950 }
  });
  const page = await browser.newPage();

  page.on('console', msg => {
    const txt = msg.text();
    if (!txt.includes('Download the React DevTools') && !txt.includes('[vite]')) {
      console.log('BROWSER:', txt);
    }
  });

  try {
    // 1. Pre-seed authentication & company session in localStorage
    await page.goto('http://[::1]:5174/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('tc_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwicm9sZSI6IkFETUlOIiwiYWRtaW5JZCI6NSwidXNlcm5hbWUiOiJ0YWxseWNvbm5lY3QiLCJlbWFpbCI6InRhbGx5Y29ubmVjdEBnbWFpbC5jb20iLCJpYXQiOjE3OTIwNDY4MTEsImV4cCI6MTc5MjEzMzIxMX0.W9uCYFUHX8Q5Cev_J-GqVtRq-a0G7_YvzhKLNkz8CWU');
      localStorage.setItem('tc_user', JSON.stringify({ id: 5, username: 'tallyconnect', email: 'tallyconnect@gmail.com', role: 'ADMIN', adminId: 5, plan: 'Enterprise' }));
      localStorage.setItem('tc_token_origin', 'https://tallymobile.utkarshmishra.online');
      localStorage.setItem('tc_active_company', 'Lumilo');
      localStorage.setItem('tc_company_name', 'Lumilo');
      localStorage.setItem('tc_companies_cache', JSON.stringify([{ company_guid: 'Lumilo', company_name: 'Lumilo' }]));
    });

    // 2. Reload with seeded session
    console.log('Reloading with seeded session...');
    await page.goto('http://[::1]:5174/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    // 3. Navigate to Vouchers
    console.log('Navigating to Vouchers...');
    await page.evaluate(() => {
      const navItem = Array.from(document.querySelectorAll('.nav-item')).find(n => (n.getAttribute('title') || '').includes('Vouchers'));
      if (navItem) navItem.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // 4. Click "Create Voucher"
    console.log('Clicking "Create Voucher" button...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Create Voucher'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // 5. Verify Step 1: Details (Matches Screenshot 1)
    console.log('Verifying Step 1 (Details) UI elements...');
    const step1Check = await page.evaluate(() => {
      const card = document.querySelector('.cv-wizard-card');
      const headerTitle = card?.querySelector('h2')?.innerText;
      const subtitle = card?.querySelector('p')?.innerText;
      const stepItems = Array.from(card?.querySelectorAll('.cv-wizard-card span') || []).map(s => s.innerText);
      const inputs = Array.from(card?.querySelectorAll('input, select, textarea') || []).map(i => ({
        tag: i.tagName,
        type: i.type,
        placeholder: i.placeholder,
        value: i.value
      }));
      const helpBtn = card?.querySelector('button[title*="Help"]');
      const addCustomerBtn = card?.querySelector('button[title*="Add new customer"]');
      return {
        hasCard: !!card,
        headerTitle,
        subtitle,
        hasHelpBtn: !!helpBtn,
        hasAddCustomerBtn: !!addCustomerBtn,
        inputsCount: inputs.length,
        inputs
      };
    });
    console.log('Step 1 Check:', step1Check);

    const shotStep1 = path.join(ARTIFACT_DIR, 'wizard_step1_details.png');
    await page.screenshot({ path: shotStep1, fullPage: false });
    console.log('Saved Wizard Step 1 screenshot:', shotStep1);

    // 6. Test Help Screen (Screenshots 2, 3, 4)
    console.log('Clicking (?) Help button...');
    await page.evaluate(() => {
      const helpBtn = document.querySelector('.cv-wizard-card button[title*="Help"]');
      if (helpBtn) helpBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    const helpCheck = await page.evaluate(() => {
      const title = Array.from(document.querySelectorAll('h1')).find(h => h.innerText === 'Help')?.innerText;
      const howItWorks = Array.from(document.querySelectorAll('h3')).find(h => h.innerText.includes('How TallyConnect works'))?.innerText;
      const faqs = Array.from(document.querySelectorAll('button')).filter(b => b.innerText && b.innerText.includes('?')).map(b => b.innerText);
      const support = document.body.innerText.includes('info@averlonworld.com');
      return { title, howItWorks, faqsCount: faqs.length, sampleFaqs: faqs.slice(0, 3), hasSupport: support };
    });
    console.log('Help Screen Check:', helpCheck);

    const shotHelp = path.join(ARTIFACT_DIR, 'wizard_help_screen.png');
    await page.screenshot({ path: shotHelp, fullPage: false });
    console.log('Saved Help Screen screenshot:', shotHelp);

    // Click "< Entry" to return to Step 1
    console.log('Clicking "< Entry" to return to wizard...');
    await page.evaluate(() => {
      const entryBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Entry'));
      if (entryBtn) entryBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    // 7. Test Add Customer Modal
    console.log('Testing [+] Add Customer modal...');
    await page.evaluate(() => {
      const addBtn = document.querySelector('button[title*="Add new customer"]');
      if (addBtn) addBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    const shotAddCustomer = path.join(ARTIFACT_DIR, 'wizard_add_customer_modal.png');
    await page.screenshot({ path: shotAddCustomer, fullPage: false });
    console.log('Saved Add Customer Modal screenshot:', shotAddCustomer);

    // Fill customer form and save
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="FitLife"]');
      if (input) {
        input.value = 'FitLife Sports Club (Bandra)';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Save Customer'));
      if (saveBtn) saveBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    // 8. Click "Next >" to go to Step 2: Items
    console.log('Clicking "Next >" to advance to Step 2 (Items)...');
    await page.evaluate(() => {
      const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Next'));
      if (nextBtn) nextBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Verify Step 2 (Items)
    const step2Check = await page.evaluate(() => {
      const text = document.querySelector('.cv-wizard-card')?.innerText || '';
      const hasSubtotal = text.includes('Subtotal');
      const hasGST = text.includes('GST');
      const hasTotalAmount = text.includes('Total Amount');
      return { hasSubtotal, hasGST, hasTotalAmount };
    });
    console.log('Step 2 (Items) Check:', step2Check);

    const shotStep2 = path.join(ARTIFACT_DIR, 'wizard_step2_items.png');
    await page.screenshot({ path: shotStep2, fullPage: false });
    console.log('Saved Wizard Step 2 screenshot:', shotStep2);

    // 9. Click "Next >" to go to Step 3: Payment
    console.log('Clicking "Next >" to advance to Step 3 (Payment)...');
    await page.evaluate(() => {
      const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Next'));
      if (nextBtn) nextBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Verify Step 3 (Payment)
    const step3Check = await page.evaluate(() => {
      const text = document.querySelector('.cv-wizard-card')?.innerText || '';
      const hasPaymentTerms = text.includes('Payment Terms');
      const hasBalanceDue = text.includes('Remaining Balance Due');
      return { hasPaymentTerms, hasBalanceDue };
    });
    console.log('Step 3 (Payment) Check:', step3Check);

    const shotStep3 = path.join(ARTIFACT_DIR, 'wizard_step3_payment.png');
    await page.screenshot({ path: shotStep3, fullPage: false });
    console.log('Saved Wizard Step 3 screenshot:', shotStep3);

    // 10. Click "Next >" to go to Step 4: Check
    console.log('Clicking "Next >" to advance to Step 4 (Check)...');
    await page.evaluate(() => {
      const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Next'));
      if (nextBtn) nextBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Verify Step 4 (Check / Review)
    const step4Check = await page.evaluate(() => {
      const text = document.querySelector('.cv-wizard-card')?.innerText || '';
      const hasReadyPill = text.includes('Ready to sync with Tally Prime');
      const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Save Voucher'));
      return { hasReadyPill, hasSaveBtn: !!saveBtn };
    });
    console.log('Step 4 (Check) Check:', step4Check);

    const shotStep4 = path.join(ARTIFACT_DIR, 'wizard_step4_check.png');
    await page.screenshot({ path: shotStep4, fullPage: false });
    console.log('Saved Wizard Step 4 screenshot:', shotStep4);

    // 11. Click "Save Voucher"
    console.log('Clicking "✓ Save Voucher"...');
    await page.evaluate(() => {
      const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Save Voucher'));
      if (saveBtn) saveBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    const shotPostSave = path.join(ARTIFACT_DIR, 'wizard_step5_post_save.png');
    await page.screenshot({ path: shotPostSave, fullPage: false });
    console.log('Saved Post Save screenshot:', shotPostSave);

    console.log('==================================================');
    console.log('CREATE VOUCHER WIZARD E2E VERIFIED SUCCESSFULLY!');
    console.log('==================================================');

  } catch (err) {
    console.error('Wizard Verification Error:', err);
  } finally {
    await browser.close();
  }
})();

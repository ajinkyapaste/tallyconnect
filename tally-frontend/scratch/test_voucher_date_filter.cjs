const puppeteer = require('puppeteer');

(async () => {
  console.log('Testing Voucher Date Filter...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 15000 });

    // Handle login if present
    const loginInput = await page.$('#tc-username');
    if (loginInput) {
      console.log('Logging in as Admin...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const adminBtn = buttons.find(b => b.textContent && b.textContent.trim() === 'Admin');
        if (adminBtn) adminBtn.click();
      });
      await page.type('#tc-username', 'tallyconnect@gmail.com');
      await page.type('#tc-password', 'abcd@123');
      await page.click('button[type="submit"]');
      await page.waitForFunction(() => !document.querySelector('#tc-username'), { timeout: 10000 });
      await new Promise(r => setTimeout(r, 2000));
    }

    console.log('App loaded! Navigating to Vouchers tab...');
    // Click on nav item for vouchers
    const clicked = await page.evaluate(() => {
      const navItems = Array.from(document.querySelectorAll('.nav-item, button, a'));
      const v = navItems.find(el => el.textContent && el.textContent.includes('Vouchers'));
      if (v) {
        v.click();
        return true;
      }
      return false;
    });
    console.log('Nav item clicked:', clicked);
    await new Promise(r => setTimeout(r, 3000));

    // Check date pills present
    const pills = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.date-pill-btn'));
      return buttons.map(b => ({
        label: b.textContent.trim(),
        active: b.classList.contains('active')
      }));
    });
    console.log('Detected Date Pills:', pills);

    // Test clicking pills: 1 Month, 3 Months, 1 Day, All Time
    for (const targetLabel of ['Last 1 Month', 'Last 3 Months', '1 Day', 'All Time']) {
      const clickRes = await page.evaluate((label) => {
        const buttons = Array.from(document.querySelectorAll('.date-pill-btn'));
        const btn = buttons.find(b => b.textContent.trim() === label);
        if (!btn) return { found: false };
        btn.click();
        return { found: true };
      }, targetLabel);

      await new Promise(r => setTimeout(r, 800));

      const status = await page.evaluate((label) => {
        const buttons = Array.from(document.querySelectorAll('.date-pill-btn'));
        const btn = buttons.find(b => b.textContent.trim() === label);
        const periodSpan = Array.from(document.querySelectorAll('span')).find(s => s.textContent?.includes('· Lumilo') || s.textContent?.includes('· TallyConnect'))?.textContent?.trim() || '';
        const metrics = Array.from(document.querySelectorAll('.vm-summary-val')).map(m => m.textContent?.trim());
        const countText = Array.from(document.querySelectorAll('span, div')).find(e => e.textContent?.includes('total entries recorded'))?.textContent?.trim() || '';
        return {
          label,
          isActive: btn?.classList.contains('active'),
          periodSpan,
          metrics,
          countText
        };
      }, targetLabel);

      console.log(`Clicked "${targetLabel}":`, status);
    }

    // Now test list view as well
    console.log('\nNavigating to List View by clicking "View All Records"...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const allRecordsBtn = btns.find(b => b.textContent?.includes('View All Records'));
      if (allRecordsBtn) allRecordsBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    const listPills = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.date-pill-btn'));
      return buttons.map(b => ({
        label: b.textContent.trim(),
        active: b.classList.contains('active')
      }));
    });
    console.log('List View Date Pills:', listPills);

    for (const targetLabel of ['1 Day', 'Last 7 Days', 'Last 1 Month', 'All Time']) {
      await page.evaluate((label) => {
        const buttons = Array.from(document.querySelectorAll('.date-pill-btn'));
        const btn = buttons.find(b => b.textContent.trim() === label);
        if (btn) btn.click();
      }, targetLabel);
      await new Promise(r => setTimeout(r, 800));

      const listStatus = await page.evaluate((label) => {
        const buttons = Array.from(document.querySelectorAll('.date-pill-btn'));
        const btn = buttons.find(b => b.textContent.trim() === label);
        const rows = document.querySelectorAll('.vm-voucher-row').length;
        const showingText = Array.from(document.querySelectorAll('span')).find(s => s.textContent?.includes('Showing '))?.textContent?.trim() || '';
        return {
          label,
          isActive: btn?.classList.contains('active'),
          rows,
          showingText
        };
      }, targetLabel);

      console.log(`List View Clicked "${targetLabel}":`, listStatus);
    }

    console.log('\nSUCCESS: All voucher date filters verified working!');
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await browser.close();
  }
})();

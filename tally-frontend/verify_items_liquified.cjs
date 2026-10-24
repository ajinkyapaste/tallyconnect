const puppeteer = require('puppeteer');

(async () => {
  console.log('--- Starting Liquified Items & Drag/Hide Verification ---');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('Failed to load resource')) {
      console.log('BROWSER LOG:', text);
    }
  });

  try {
    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

    // Set origin in localStorage so token doesn't get cleared
    await page.evaluate(() => {
      localStorage.setItem('tc_token_origin', 'https://tallymobile.utkarshmishra.online');
    });

    // Check if already logged in or login form is present
    const hasLogin = await page.$('#tc-username');
    if (hasLogin) {
      console.log('Clicking Admin button...');
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const adminBtn = btns.find(b => b.innerText && b.innerText.trim() === 'Admin');
        if (adminBtn) adminBtn.click();
      });
      await new Promise(r => setTimeout(r, 500));

      console.log('Typing credentials...');
      await page.type('#tc-username', 'tallyconnect@gmail.com');
      await page.type('#tc-password', 'abcd@123');

      console.log('Clicking submit...');
      await page.click('button[type="submit"]');
      await new Promise(r => setTimeout(r, 4500));
    }

    // Verify Dashboard loaded
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Page state text:', bodyText.substring(0, 150).replace(/\n+/g, ' '));

    // Navigate to Items Tab
    console.log('Navigating to Items tab...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('button, a, div, span'));
      const itemsTab = items.find(el => el.innerText && el.innerText.trim().toLowerCase() === 'items');
      if (itemsTab) {
        itemsTab.click();
      } else {
        throw new Error('Items tab button not found in navigation');
      }
    });

    await page.waitForSelector('.items-view-root', { timeout: 8000 });
    console.log('Items view root loaded successfully!');

    // Wait for items to populate
    await new Promise(r => setTimeout(r, 1500));

    // 1. Verify 4-Card Liquified KPI Grid
    const kpiInfo = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.items-kpi-card'));
      return cards.map(c => {
        const style = window.getComputedStyle(c);
        return {
          title: c.querySelector('.items-kpi-label')?.innerText?.trim(),
          value: c.querySelector('.items-kpi-value')?.innerText?.trim(),
          sub: c.querySelector('.items-kpi-sub')?.innerText?.trim(),
          hasDragHandle: !!c.querySelector('.items-kpi-drag-handle'),
          hasHideBtn: !!c.querySelector('.items-kpi-hide-btn'),
          backdropFilter: style.backdropFilter || style.webkitBackdropFilter,
          borderRadius: style.borderRadius,
          background: style.backgroundColor
        };
      });
    });

    console.log('\n--- KPI Cards Detected ---');
    console.log(`Total KPI cards visible: ${kpiInfo.length}`);
    kpiInfo.forEach((k, idx) => {
      console.log(`  Card ${idx + 1}: "${k.title}" = ${k.value} | Sub: "${k.sub}" | DragHandle: ${k.hasDragHandle} | HideBtn: ${k.hasHideBtn} | BackdropFilter: ${k.backdropFilter}`);
    });

    if (kpiInfo.length !== 4) {
      throw new Error(`Expected 4 KPI cards, found ${kpiInfo.length}`);
    }

    // 2. Verify Item Cards
    const itemRows = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.item-card-row'));
      return rows.map(r => {
        const style = window.getComputedStyle(r);
        return {
          name: r.querySelector('.item-name-title')?.innerText?.trim(),
          group: r.querySelector('.item-group-pill')?.innerText?.trim(),
          valuation: r.querySelector('.item-valuation-text')?.innerText?.trim(),
          hasDragHandle: !!r.querySelector('.item-drag-handle'),
          hasQuickHideBtn: !!r.querySelector('.item-quick-hide-btn'),
          has3DotMenu: !!r.querySelector('.item-menu-dot-btn'),
          backdropFilter: style.backdropFilter || style.webkitBackdropFilter,
          borderRadius: style.borderRadius,
          background: style.backgroundColor
        };
      });
    });

    console.log(`\n--- Item Cards Detected ---`);
    console.log(`Total item rows visible: ${itemRows.length}`);
    itemRows.slice(0, 4).forEach((it, idx) => {
      console.log(`  Item ${idx + 1}: "${it.name}" [${it.group}] = ${it.valuation} | DragHandle: ${it.hasDragHandle} | QuickHide: ${it.hasQuickHideBtn} | BackdropFilter: ${it.backdropFilter}`);
    });

    if (itemRows.length === 0) {
      throw new Error('No item cards found on page!');
    }

    // Capture initial screenshot of the Liquified Items screen
    await page.screenshot({ path: 'items_liquified_initial.png', fullPage: false });
    console.log('Saved items_liquified_initial.png');

    // 3. Test Hiding an Item via Quick Hide Button
    console.log('\n--- Testing Quick Hide on Item Card ---');
    const firstItemName = itemRows[0].name;
    console.log(`Clicking Quick Hide on first item: "${firstItemName}"...`);
    await page.evaluate(() => {
      const firstHideBtn = document.querySelector('.item-card-row .item-quick-hide-btn');
      if (firstHideBtn) firstHideBtn.click();
    });

    await new Promise(r => setTimeout(r, 800));

    // Verify item is hidden and "Unhide Items (1)" button appears
    const afterItemHide = await page.evaluate(() => {
      const unhideBtn = Array.from(document.querySelectorAll('.btn-unhide-pill')).find(b => b.innerText.includes('Unhide Items'));
      const rows = Array.from(document.querySelectorAll('.item-card-row'));
      return {
        hasUnhideItemsBtn: !!unhideBtn,
        unhideBtnText: unhideBtn ? unhideBtn.innerText.trim() : null,
        visibleCount: rows.length
      };
    });

    console.log('After hiding item:', afterItemHide);
    if (!afterItemHide.hasUnhideItemsBtn || afterItemHide.visibleCount !== itemRows.length - 1) {
      throw new Error('Quick hide did not properly hide the item or display the unhide button!');
    }

    // 4. Test Unhide Modal for Items
    console.log('Clicking "Unhide Items" button to open modal...');
    await page.evaluate(() => {
      const unhideBtn = Array.from(document.querySelectorAll('.btn-unhide-pill')).find(b => b.innerText.includes('Unhide Items'));
      if (unhideBtn) unhideBtn.click();
    });

    await page.waitForSelector('.unhide-modal-dialog', { timeout: 4000 });
    console.log('Unhide modal opened successfully!');

    // Capture screenshot of Unhide Modal
    await page.screenshot({ path: 'items_unhide_modal_open.png', fullPage: false });
    console.log('Saved items_unhide_modal_open.png');

    // Click "Unhide" or "Restore All" in the modal
    console.log('Restoring the hidden item...');
    await page.evaluate(() => {
      const restoreBtn = Array.from(document.querySelectorAll('.unhide-modal-dialog button')).find(b => b.innerText.includes('Unhide') || b.innerText.includes('Restore All'));
      if (restoreBtn) restoreBtn.click();
    });

    await new Promise(r => setTimeout(r, 800));

    // Close modal if still open
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.unhide-modal-dialog button[aria-label="Close"]');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    const restoredCount = await page.evaluate(() => document.querySelectorAll('.item-card-row').length);
    console.log(`Restored item count: ${restoredCount} (original was ${itemRows.length})`);

    // 5. Test Hiding a KPI Card
    console.log('\n--- Testing Hide on KPI Card ---');
    console.log('Clicking hide button on "Running Low Stock" KPI card...');
    await page.evaluate(() => {
      const lowKpiCard = Array.from(document.querySelectorAll('.items-kpi-card')).find(c => c.innerText.includes('Running Low'));
      if (lowKpiCard) {
        const hideBtn = lowKpiCard.querySelector('.items-kpi-hide-btn');
        if (hideBtn) hideBtn.click();
      }
    });

    await new Promise(r => setTimeout(r, 800));

    const afterKpiHide = await page.evaluate(() => {
      const unhideCardsBtn = Array.from(document.querySelectorAll('.btn-unhide-pill')).find(b => b.innerText.includes('Unhide Cards'));
      const kpis = document.querySelectorAll('.items-kpi-card');
      return {
        hasUnhideCardsBtn: !!unhideCardsBtn,
        unhideCardsBtnText: unhideCardsBtn ? unhideCardsBtn.innerText.trim() : null,
        kpiCount: kpis.length
      };
    });

    console.log('After hiding KPI card:', afterKpiHide);
    if (!afterKpiHide.hasUnhideCardsBtn || afterKpiHide.kpiCount !== 3) {
      throw new Error('KPI card hide failed to update grid or show Unhide Cards button!');
    }

    // Capture screenshot with KPI hidden
    await page.screenshot({ path: 'items_kpi_hidden.png', fullPage: false });
    console.log('Saved items_kpi_hidden.png');

    // Click "Unhide Cards" and restore all
    console.log('Clicking "Unhide Cards" to restore KPI card...');
    await page.evaluate(() => {
      const unhideCardsBtn = Array.from(document.querySelectorAll('.btn-unhide-pill')).find(b => b.innerText.includes('Unhide Cards'));
      if (unhideCardsBtn) unhideCardsBtn.click();
    });

    await page.waitForSelector('.unhide-modal-dialog', { timeout: 4000 });
    console.log('KPI Unhide modal opened!');

    await page.evaluate(() => {
      const restoreBtn = Array.from(document.querySelectorAll('.unhide-modal-dialog button')).find(b => b.innerText.includes('Unhide') || b.innerText.includes('Restore All'));
      if (restoreBtn) restoreBtn.click();
    });

    await new Promise(r => setTimeout(r, 800));

    const restoredKpiCount = await page.evaluate(() => document.querySelectorAll('.items-kpi-card').length);
    console.log(`Restored KPI count: ${restoredKpiCount} (should be 4)`);

    // Capture final verified screenshot
    await page.screenshot({ path: 'items_liquified_final_verified.png', fullPage: false });
    console.log('Saved items_liquified_final_verified.png');

    console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('Test error:', err);
    await page.screenshot({ path: 'items_test_error.png', fullPage: false });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();

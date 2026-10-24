const puppeteer = require('../tally-frontend/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const chromePath = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ].find(p => fs.existsSync(p));

  const browser = await puppeteer.launch({
    headless: 'new',
    ...(chromePath ? { executablePath: chromePath } : {}),
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // 1. USER VIEW - SCROLLED DOWN
    console.log('Testing USER view scrolled down...');
    const pageUser = await browser.newPage();
    await pageUser.setViewport({ width: 1440, height: 850 });

    const authResUser = await fetch('http://localhost:4000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'demo-ui@test.local', password: 'Demo@1234', loginType: 'USER' })
    });
    const authDataUser = await authResUser.json();

    await pageUser.evaluateOnNewDocument((auth) => {
      localStorage.setItem('tc_token', auth.token);
      localStorage.setItem('tc_user', JSON.stringify(auth.user));
      localStorage.setItem('tc_token_origin', 'http://localhost:4000');
      sessionStorage.setItem('tc_app_initialized', '1');
    }, authDataUser);

    await pageUser.goto('http://localhost:5173');
    await pageUser.waitForSelector('.nav-item', { timeout: 10000 });

    // Click Leave Management
    await pageUser.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.nav-item'));
      const leaveItem = items.find(it => it.innerText && it.innerText.includes('Leave Management'));
      if (leaveItem) leaveItem.click();
    });

    await pageUser.waitForFunction(() => document.body.innerText.includes('Leave Management'), { timeout: 8000 });
    await new Promise(r => setTimeout(r, 1200));

    // Scroll down the inner content scroll container
    await pageUser.evaluate(() => {
      const scrollable = document.querySelector('.content-scroll');
      if (scrollable) {
        scrollable.scrollTop = 500;
      }
    });
    await new Promise(r => setTimeout(r, 600));

    const shotUser = path.resolve(__dirname, 'verify_scroll_user_requests.png');
    await pageUser.screenshot({ path: shotUser });
    console.log('Saved:', shotUser);
    await pageUser.close();

    // 2. ADMIN VIEW - SCROLLED DOWN (Requests, Calendar, Settings)
    console.log('Testing ADMIN view scrolled down...');
    const pageAdmin = await browser.newPage();
    await pageAdmin.setViewport({ width: 1440, height: 850 });

    const authResAdmin = await fetch('http://localhost:4000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'tallyconnect@gmail.com', password: 'abcd@123', loginType: 'ADMIN' })
    });
    const authDataAdmin = await authResAdmin.json();

    await pageAdmin.evaluateOnNewDocument((auth) => {
      localStorage.setItem('tc_token', auth.token);
      localStorage.setItem('tc_user', JSON.stringify(auth.user));
      localStorage.setItem('tc_token_origin', 'http://localhost:4000');
      sessionStorage.setItem('tc_app_initialized', '1');
    }, authDataAdmin);

    await pageAdmin.goto('http://localhost:5173');
    await pageAdmin.waitForSelector('.nav-item', { timeout: 10000 });

    // Click Leave Management
    await pageAdmin.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.nav-item'));
      const leaveItem = items.find(it => it.innerText && it.innerText.includes('Leave Management'));
      if (leaveItem) leaveItem.click();
    });

    await pageAdmin.waitForFunction(() => document.body.innerText.includes('Leave Management'), { timeout: 8000 });
    await new Promise(r => setTimeout(r, 1200));

    // Admin Requests Tab Scrolled
    await pageAdmin.evaluate(() => {
      const scrollable = document.querySelector('.content-scroll');
      if (scrollable) {
        scrollable.scrollTop = 500;
      }
    });
    await new Promise(r => setTimeout(r, 600));

    const shotAdminReq = path.resolve(__dirname, 'verify_scroll_admin_requests.png');
    await pageAdmin.screenshot({ path: shotAdminReq });
    console.log('Saved:', shotAdminReq);

    // Click Calendar Tab
    console.log('Switching to Calendar Tab...');
    await pageAdmin.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button, [role="tab"]'));
      const calTab = tabs.find(t => t.innerText && t.innerText.includes('Calendar'));
      if (calTab) calTab.click();
    });
    await new Promise(r => setTimeout(r, 800));

    await pageAdmin.evaluate(() => {
      const scrollable = document.querySelector('.content-scroll');
      if (scrollable) {
        scrollable.scrollTop = 500;
      }
    });
    await new Promise(r => setTimeout(r, 600));

    const shotCalendar = path.resolve(__dirname, 'verify_scroll_calendar.png');
    await pageAdmin.screenshot({ path: shotCalendar });
    console.log('Saved:', shotCalendar);

    // Click Policy & Settings Tab
    console.log('Switching to Policy & Settings Tab...');
    await pageAdmin.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button, [role="tab"]'));
      const setTab = tabs.find(t => t.innerText && (t.innerText.includes('Policy') || t.innerText.includes('Settings')));
      if (setTab) setTab.click();
    });
    await new Promise(r => setTimeout(r, 800));

    await pageAdmin.evaluate(() => {
      const scrollable = document.querySelector('.content-scroll');
      if (scrollable) {
        scrollable.scrollTop = 500;
      }
    });
    await new Promise(r => setTimeout(r, 600));

    const shotSettings = path.resolve(__dirname, 'verify_scroll_settings.png');
    await pageAdmin.screenshot({ path: shotSettings });
    console.log('Saved:', shotSettings);

    await pageAdmin.close();
  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await browser.close();
    console.log('Verification run complete.');
  }
})();

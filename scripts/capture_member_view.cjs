const puppeteer = require('../tally-frontend/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/User/.gemini/antigravity-ide/brain/4b949fca-6e69-4d16-9183-b723e4940aeb';
const SCRIPTS_DIR = 'd:/Prototype/scripts';
const delay = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  // 1. Get real member token from backend
  const res = await fetch('http://localhost:4000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'demo-ui@test.local', password: 'Demo@1234', loginType: 'USER' })
  });
  const data = await res.json();
  console.log('Member login token received for:', data.user.email);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 950 });

    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await delay(500);

    // Set authenticated member session directly with origin
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('tc_token', token);
      localStorage.setItem('tc_user', JSON.stringify(user));
      localStorage.setItem('tc_token_origin', 'https://tallymobile.utkarshmishra.online');
      localStorage.setItem('tc_active_company', 'COMP_001');
      window.dispatchEvent(new Event('tc-auth'));
    }, data);

    await page.reload({ waitUntil: 'networkidle2' });
    await delay(1500);

    // Ensure on Attendance tab
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('tc-navigate-tab', { detail: { tab: 'attendance' } }));
    });
    await delay(1800);

    const memberShot = path.join(SCRIPTS_DIR, 'attendance_member_punch_view_verified.png');
    await page.screenshot({ path: memberShot });
    fs.copyFileSync(memberShot, path.join(ARTIFACTS_DIR, 'attendance_member_punch_view_verified.png'));
    console.log('✅ Captured member punch clock view screenshot successfully!');
  } finally {
    await browser.close();
  }
})();

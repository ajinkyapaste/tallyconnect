const puppeteer = require('./tally-frontend/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("http://localhost:5173/");
  await new Promise(r => setTimeout(r, 2000));
  
  // Login
  const emailField = await page.$("input[type='email'], #tc-username");
  if (emailField) {
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button")).find(x => x.innerText.trim() === "Admin");
      if (b) b.click();
    });
    await page.type("#tc-username", "tallyconnect@gmail.com");
    await page.type("#tc-password", "abcd@123");
    await page.click("button[type='submit']");
    await new Promise(r => setTimeout(r, 3000));
  }
  
  // Click company dropdown
  const info = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Company"));
    if (btn) btn.click();
    return {
      tc_active: localStorage.getItem("tc_active_company"),
      tc_companies: localStorage.getItem("tc_companies_cache"),
      dropdownBtnText: btn ? btn.innerText : null
    };
  });
  console.log("Company Info:", info);
  
  await new Promise(r => setTimeout(r, 1000));
  const options = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("div, button, li, p"))
      .filter(el => el.innerText && el.innerText.length > 2 && el.innerText.length < 80)
      .map(el => el.innerText);
  });
  console.log("Found text elements:", options.slice(0, 15));
  
  await browser.close();
})();

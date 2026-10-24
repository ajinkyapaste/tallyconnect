
const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // Login
  await page.goto("http://127.0.0.1:5173/");
  await page.waitForSelector("input[placeholder=\"Username or Email\"]");
  await page.type("input[placeholder=\"Username or Email\"]", "demo-ui@test.local");
  await page.type("input[placeholder=\"Password\"]", "demo123");
  await page.click("button[type=\"submit\"]");

  // Wait for Dashboard to render
  try {
    await page.waitForSelector(".summary-card h3", { timeout: 3000 });
  } catch (err) {
    console.log("Dashboard did not load in time.");
  }
  
  // Dump text content of Dashboard
  const dashboardText = await page.evaluate(() => document.body.innerText);
  console.log("=== DASHBOARD TEXT ===");
  console.log(dashboardText);

  const localState = await page.evaluate(() => {
    return {
      tc_user: localStorage.getItem("tc_user")
    };
  });
  console.log("=== LOCAL STORAGE ===");
  console.log(JSON.stringify(localState, null, 2));

  await browser.close();
})();


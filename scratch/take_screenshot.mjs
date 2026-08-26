import puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set viewport to a typical desktop size
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log("Navigating to localhost:5173/login...");
  await page.goto('http://localhost:5173/login');
  
  console.log("Logging in...");
  await page.type('input[type="email"]', 'siddhesh@gmail.com');
  await page.type('input[type="password"]', 'Password@123');
  await page.click('button[type="submit"]');
  
  console.log("Waiting for dashboard...");
  // Wait for navigation and network idle
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  
  // Wait a bit more to ensure React renders completely
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Taking screenshot...");
  await page.screenshot({ path: 'scratch/screenshot.png', fullPage: true });
  
  console.log("Extracting HTML...");
  const html = await page.content();
  const fs = await import('fs');
  fs.writeFileSync('scratch/dashboard.html', html);
  
  await browser.close();
  console.log("Done!");
}
run().catch(console.error);

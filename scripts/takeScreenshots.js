import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const email = process.env.TEST_EMAIL;
const password = process.env.TEST_PASSWORD;

if (!email || !password) {
  console.error('Please provide TEST_EMAIL and TEST_PASSWORD environment variables.');
  process.exit(1);
}

const url = 'http://localhost:5173';
const outputDir = path.join(__dirname, '..', 'docs', 'images');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set a good desktop viewport
  await page.setViewport({ width: 1440, height: 900 });
  console.log(`Navigating to ${url}...`);
  // Navigate straight to login to bypass prompt
  await page.goto(`${url}/login?role=nagarsevak`, { waitUntil: 'networkidle0' });

  console.log('Logging in...');
  
  // Wait for the login page specifically - it should definitely be visible now thanks to the query param
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', password);
  
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
  ]);

  console.log('Logged in successfully!');
  
  // Explicitly click the language button to Marathi
  try {
     console.log('Switching UI Language to Marathi...');
     // The button in AppLayout has 'मराठी' as text
     const marathiBtn = await page.waitForSelector('button::-p-text(मराठी)', { timeout: 10000 });
     if (marathiBtn) {
         await marathiBtn.click();
         // Wait for UI to re-render in Marathi
         await new Promise(r => setTimeout(r, 2000));
     }
  } catch (err) {
      console.log('Could not find or click Marathi language button, proceeding anyway.', err.message);
  }
  
  const takeScreenshot = async (route, filename, delayMs = 2500) => {
    console.log(`Capturing ${route} -> ${filename}...`);
    try {
      await page.goto(`${url}${route}`, { waitUntil: 'networkidle2', timeout: 20000 });
      await new Promise(r => setTimeout(r, delayMs)); // wait for datatables or charts to render
      await page.screenshot({ path: path.join(outputDir, filename), fullPage: false });
    } catch (error) {
       console.error(`Failed to capture ${route}:`, error.message);
    }
  };

  // Capture Detailed Sections based on AppLayout
  
  // 1. Daily Work
  await takeScreenshot('/dashboard', '1_dashboard.png', 2000);
  await takeScreenshot('/dashboard/complaints', '2_complaints.png', 1000);
  await takeScreenshot('/dashboard/letters', '2_letters.png', 1000);
  await takeScreenshot('/dashboard/tasks', '2_tasks.png', 1000);
  await takeScreenshot('/dashboard/visitors', '2_visitors.png', 1000);
  await takeScreenshot('/dashboard/schemes', '2_schemes.png', 1000);

  // 2. Ward Info
  await takeScreenshot('/dashboard/ward/problems', '3_ward_problems.png', 1000);
  await takeScreenshot('/dashboard/ward/map', '3_ward_map.png', 1000);
  await takeScreenshot('/dashboard/history', '3_history.png', 1000);
  await takeScreenshot('/dashboard/ward/improvements', '3_improvements.png', 1000);
  await takeScreenshot('/dashboard/ward/provision', '3_provision.png', 1000);

  // 3. Municipal Work
  await takeScreenshot('/dashboard/diary', '4_diary.png', 1000);
  await takeScreenshot('/dashboard/budget', '4_budget.png', 1000);

  // 4. Gov Office
  await takeScreenshot('/dashboard/government-office', '5_gov_office.png', 1000);

  // 5. Media Promotion
  await takeScreenshot('/dashboard/social', '6_social.png', 1000);
  await takeScreenshot('/dashboard/media/newspaper', '6_newspaper.png', 1000);
  await takeScreenshot('/dashboard/content', '6_content.png', 1000);

  // 6. Programs Activities
  await takeScreenshot('/dashboard/events', '7_events.png', 1000);
  await takeScreenshot('/dashboard/gallery', '7_gallery.png', 1000);

  // 7. Political
  await takeScreenshot('/dashboard/results', '8_results.png', 1000);
  await takeScreenshot('/dashboard/sadasya', '8_sadasya.png', 1000);
  await takeScreenshot('/dashboard/surveys', '8_surveys.png', 1000);
  await takeScreenshot('/dashboard/voters', '8_voters.png', 1000);
  await takeScreenshot('/dashboard/staff', '8_staff.png', 1000);
  await takeScreenshot('/dashboard/political/voter-forms', '8_voter_forms.png', 1000);

  // 8. Public Comm
  await takeScreenshot('/dashboard/communication/sms', '9_sms.png', 1000);
  await takeScreenshot('/dashboard/communication/whatsapp', '9_whatsapp.png', 1000);
  await takeScreenshot('/dashboard/communication/voice', '9_voice.png', 1000);
  await takeScreenshot('/dashboard/communication/ai-voice', '9_ai_voice.png', 1000);
  await takeScreenshot('/dashboard/communication/conference', '9_conference.png', 1000);
  await takeScreenshot('/dashboard/communication/whatsapp-call', '9_whatsapp_call.png', 1000);

  // 9. Analysis
  await takeScreenshot('/dashboard/analysis-strategy', '10_analysis.png', 1000);

  console.log('Screenshots captured successfully in docs/images/');
  await browser.close();
})();

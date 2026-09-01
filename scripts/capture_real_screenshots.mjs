import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 860 },
    deviceScaleFactor: 2 // 2x Retina quality
  });
  const page = await context.newPage();

  const prototypePath = path.resolve('_prototype/site/index.html');
  const fileUrl = `file:///${prototypePath.replace(/\\/g, '/')}`;
  console.log('Loading prototype from:', fileUrl);

  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const outDir = path.resolve('screenshots');
  fs.mkdirSync(outDir, { recursive: true });

  // 1. Landing Page
  console.log('Capturing Landing Page...');
  await page.evaluate(() => window.showView('landing'));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, '01_landing_page.png'), fullPage: false });

  // 2. Step 1: Upload CV
  console.log('Capturing Step 1: Upload CV...');
  await page.evaluate(() => {
    window.loadSampleCv('operation-research');
    window.showView('story-a');
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '02_cv_upload.png'), fullPage: false });

  // 3. Step 2: Career Break Intake
  console.log('Capturing Step 2: Career Break...');
  await page.evaluate(() => {
    window.showView('story-b');
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '03_career_break.png'), fullPage: false });

  // 4. Step 3: Skill Snapshot Baseline
  console.log('Capturing Step 3: Skill Snapshot...');
  await page.evaluate(() => {
    window.showView('snapshot');
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '04_skill_snapshot.png'), fullPage: false });

  // 5. Step 4: Target Role & Readiness Gap (Operation Research Analyst)
  console.log('Capturing Step 4: Target Role & Gap (Operation Research Analyst)...');
  await page.evaluate(() => {
    window.showView('gap');
    window.renderRole('operation-research');
  });
  await page.waitForTimeout(1400);
  await page.screenshot({ path: path.join(outDir, '05_target_role_gap.png'), fullPage: false });

  // 6. Target Role & Gap (Data Analyst)
  console.log('Capturing Step 4: Target Role & Gap (Data Analyst)...');
  await page.evaluate(() => {
    window.renderRole('data-analyst');
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, '06_role_data_analyst.png'), fullPage: false });

  await browser.close();
  console.log('All real screenshots captured successfully to', outDir);
}

capture().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});

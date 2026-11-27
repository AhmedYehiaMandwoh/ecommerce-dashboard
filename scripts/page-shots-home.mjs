// Customer home snapshots (no API needed): Arabic and English at many widths, plus hover-free state.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const out = process.env.OUT; fs.mkdirSync(out, { recursive: true });
const WEB = process.env.WEB_URL;
const widths = [1920, 1440, 1280, 1100, 960, 899, 900, 800, 768, 700, 600, 500, 501, 480, 430, 390, 360];
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true, args: ['--no-sandbox'] });
for (const lang of ['ar', 'en']) for (const w of widths) {
  const page = await (await browser.newContext({ viewport: { width: w, height: 900 } })).newPage();
  await page.goto(WEB + '/'); await page.waitForLoadState('networkidle');
  if (lang === 'en') { await page.getByRole('button', { name: 'English', exact: true }).click(); }
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/home-${lang}-${w}.png`, fullPage: true });
  await page.close();
}
await browser.close(); console.log('done', fs.readdirSync(out).length);

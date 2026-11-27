// Merchant and admin dashboard snapshots across widths (incl. 480-768).
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const out = process.env.OUT; fs.mkdirSync(out, { recursive: true });
const WEB = process.env.WEB_URL;
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true, args: ['--no-sandbox'] });
const short = process.env.ROUTES_MODE === 'short';
const routes = short ? {
  merchant: ['/dashboard', '/dashboard/orders', '/dashboard/inventory', '/dashboard/add-product', '/dashboard/support', '/dashboard/settlements'],
  admin: ['/dashboard', '/dashboard/catalog', '/dashboard/applications', '/dashboard/support'],
} : {
  merchant: ['/dashboard', '/dashboard/orders', '/dashboard/inventory', '/dashboard/add-product', '/dashboard/import', '/dashboard/shop-profile', '/dashboard/returns', '/dashboard/settlements', '/dashboard/delivery', '/dashboard/support', '/dashboard/more', '/dashboard/legacy-orders'],
  admin: ['/dashboard', '/dashboard/review', '/dashboard/applications', '/dashboard/catalog', '/dashboard/support', '/dashboard/settlements', '/dashboard/orders', '/dashboard/more'],
};
for (const w of (process.env.WIDTHS || '1280,768,700,600,480,390').split(',').map(Number)) {
  for (const role of Object.keys(routes)) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(WEB + '/login'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(600);
    await page.getByRole('button', { name: 'دخول البريد للتطوير والإدارة', exact: true }).click();
    await page.getByLabel('البريد الإلكتروني', { exact: true }).fill(role + '@example.test');
    await page.getByLabel('كلمة المرور', { exact: true }).fill(process.env.DEMO_PASSWORD);
    await page.getByRole('button', { name: 'دخول', exact: true }).click();
    await page.waitForTimeout(2500);
    for (const r of routes[role]) {
      try {
        await page.goto(WEB + r); await page.waitForLoadState('networkidle'); await page.waitForTimeout(900);
        await page.screenshot({ path: `${out}/${role}-${r.replace(/\W+/g, '_')}-${w}.png`, fullPage: true });
      } catch (e) { console.log('ERR', role, r, String(e).slice(0, 80)); }
    }
    await ctx.close();
  }
}
await browser.close(); console.log('done', fs.readdirSync(out).length);

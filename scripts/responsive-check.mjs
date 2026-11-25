// Responsive check: signs in as merchant/admin, visits routes at several viewport widths, records horizontal overflow and screenshots.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const out = process.env.OUT || '/tmp/resp';
fs.mkdirSync(out, { recursive: true });
const WEB = process.env.WEB_URL || 'http://127.0.0.1:3200';
const sizes = (process.env.SIZES || '2560x1440,1920x1080,1440x900,1024x768,768x1024,390x727').split(',').map((s) => s.split('x').map(Number));
const roleRoutes = { merchant: ['/dashboard', '/dashboard/orders', '/dashboard/inventory', '/dashboard/add-product', '/dashboard/more'], admin: ['/dashboard', '/dashboard/applications', '/dashboard/orders', '/dashboard/review', '/dashboard/more'] };
const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), headless: true, args: ['--no-sandbox'] });
const bad = [];
for (const [w, h] of sizes) for (const role of Object.keys(roleRoutes)) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.goto(WEB + '/login'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(600);
  await page.getByRole('button', { name: 'دخول البريد للتطوير والإدارة', exact: true }).click();
  await page.getByLabel('البريد الإلكتروني', { exact: true }).fill(role + '@example.test');
  await page.getByLabel('كلمة المرور', { exact: true }).fill(process.env.DEMO_PASSWORD);
  await page.getByRole('button', { name: 'دخول', exact: true }).click();
  await page.waitForURL((u) => u.pathname.replace(/\/+$/, '') === '/dashboard'); await page.waitForTimeout(1500);
  for (const r of roleRoutes[role]) {
    if (r !== '/dashboard') { await page.evaluate((p) => window.useNuxtApp().$router.push(p), r); await page.waitForTimeout(900); }
    const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, path: location.pathname }));
    const name = `${role}-${r.replace(/\W+/g, '_')}-${w}`;
    await page.screenshot({ path: `${out}/${name}.png`, fullPage: false });
    const ok = m.sw <= m.cw && m.path.replace(/\/$/, '') === r;
    console.log(ok ? 'OK ' : 'BAD', name, JSON.stringify(m));
    if (!ok) bad.push(name);
  }
  await ctx.close();
}
await browser.close();
console.log(bad.length ? 'OVERFLOW/ROUTE FAIL: ' + bad.join(' ') : 'ALL OK: no horizontal overflow, routes as asserted');
process.exit(bad.length ? 1 : 0);

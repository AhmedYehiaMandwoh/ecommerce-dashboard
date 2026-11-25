// Customer website responsive check with a logged-in test customer: product, cart, checkout, orders, profile at several widths.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const out = process.env.OUT || '/tmp/cust'; fs.mkdirSync(out, { recursive: true });
const WEB = process.env.WEB_URL || 'http://127.0.0.1:3200';
const sizes = (process.env.SIZES || '2560x1440,1440x900,1024x768,768x1024,390x727').split(',').map((s) => s.split('x').map(Number));
const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), headless: true, args: ['--no-sandbox'] });
const bad = [];
const email = 'cust' + Date.now().toString(36) + '@example.test';
for (const [w, h] of sizes) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } }); const page = await ctx.newPage();
  await page.goto(WEB + '/login'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(600);
  await page.getByRole('button', { name: 'دخول البريد للتطوير والإدارة', exact: true }).click();
  await page.getByRole('button', { name: 'لسه جديد؟ اعمل حساب' }).click();
  await page.getByLabel('الاسم', { exact: true }).fill('عميل تجريبي'); await page.getByLabel('البريد الإلكتروني', { exact: true }).fill(w + email);
  await page.getByLabel('كلمة المرور', { exact: true }).fill('Test-pass-12345'); await page.getByRole('button', { name: 'إنشاء الحساب' }).click(); await page.waitForTimeout(2500);
  await page.evaluate(() => window.useNuxtApp().$router.push('/shops')); await page.waitForTimeout(1500);
  const det = page.getByRole('button', { name: 'التفاصيل' }).first(); await det.click(); await page.waitForTimeout(1200);
  const prodPath = await page.evaluate(() => location.pathname);
  const shots = [['product', null]];
  const add = page.getByRole('button', { name: /أضف للسلة|أضف/ }).first(); if (await add.count()) await add.click().catch(() => {}); await page.waitForTimeout(800);
  const routes = [['product', prodPath], ['cart', '/cart'], ['checkout', '/checkout'], ['orders', '/orders'], ['profile', '/profile']];
  for (const [n, r] of routes) {
    await page.evaluate((p) => window.useNuxtApp().$router.push(p), r); await page.waitForTimeout(1200);
    const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, path: location.pathname }));
    const name = `cust-${n}-${w}`; await page.screenshot({ path: `${out}/${name}.png` });
    const ok = m.sw <= m.cw; console.log(ok ? 'OK ' : 'BAD', name, JSON.stringify(m)); if (!ok) bad.push(name);
  }
  await ctx.close();
}
await browser.close();
console.log(bad.length ? 'OVERFLOW: ' + bad.join(' ') : 'ALL OK');
process.exit(bad.length ? 1 : 0);

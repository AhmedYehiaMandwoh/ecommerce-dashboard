// Extra snapshots: product detail, cart with items, login, at 1280/768/600/390.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const out = process.env.OUT; fs.mkdirSync(out, { recursive: true });
const WEB = process.env.WEB_URL, API = process.env.API_URL || 'http://localhost:4100/api';
const items = (await (await fetch(API + '/products')).json()).items;
const ids = items.filter(i => i.offers?.length && i.offers[0].stock).slice(0, 2).map(i => i.id);
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true, args: ['--no-sandbox'] });
for (const [w, h] of [[1280, 900], [768, 900], [700, 900], [600, 900], [480, 900], [390, 800]]) {
  const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
  const shot = async n => { await page.waitForLoadState('networkidle'); await page.waitForTimeout(900); await page.screenshot({ path: `${out}/${n}-${w}.png`, fullPage: true }); };
  for (const r of ['/login', '/shops', '/cart', '/join-shop']) { await page.goto(WEB + r); await shot('anon' + r.replace(/\W+/g, '_')); }
  await page.goto(WEB + '/product/' + ids[0]); await shot('product-0');
  await page.getByRole('button', { name: 'أضف للسلة' }).first().click(); await page.waitForTimeout(800);
  await page.goto(WEB + '/product/' + ids[1]); await shot('product-1');
  await page.getByRole('button', { name: 'أضف للسلة' }).first().click(); await page.waitForTimeout(800);
  await page.goto(WEB + '/cart'); await shot('cart-items');
  await page.goto(WEB + '/login'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'دخول البريد للتطوير والإدارة', exact: true }).click();
  await page.getByLabel('البريد الإلكتروني', { exact: true }).fill('customer@example.test');
  await page.getByLabel('كلمة المرور', { exact: true }).fill(process.env.DEMO_PASSWORD);
  await page.getByRole('button', { name: 'دخول', exact: true }).click(); await page.waitForTimeout(2500);
  await page.goto(WEB + '/join-shop'); await shot('join-shop-customer');
  await page.close();
}
await browser.close(); console.log('done', fs.readdirSync(out).length);

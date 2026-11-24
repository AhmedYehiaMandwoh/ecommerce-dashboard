// Web dashboard (Nuxt + shadcn-vue) end-to-end test. Needs API :4000 and web :3000 running with a freshly seeded DB.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const out = process.env.OUT || '/tmp/dash-shots';
fs.mkdirSync(out, { recursive: true });
const WEB = process.env.WEB_URL || 'http://127.0.0.1:3000';
const API = process.env.API_URL || 'http://127.0.0.1:4000/api';
const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), headless: true, args: ['--no-sandbox'] });
const errs = [];
const fail = (m) => errs.push(m);
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
async function session(role, viewport) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => fail(role + ' pageerror: ' + e.message.slice(0, 160)));
  page.on('console', (m) => { if (m.type() === 'error') fail(role + ' console: ' + m.text().slice(0, 160)); });
  await page.goto(WEB + '/login');
  await page.getByRole('button', { name: 'دخول البريد للتطوير والإدارة', exact: true }).click();
  await page.getByLabel('البريد الإلكتروني', { exact: true }).fill(role + '@example.test');
  await page.getByLabel('كلمة المرور', { exact: true }).fill(process.env.DEMO_PASSWORD);
  await page.getByRole('button', { name: 'دخول', exact: true }).click();
  await page.waitForURL((u) => u.pathname.replace(/\/+$/, '') === '/dashboard');
  await page.waitForTimeout(1500);
  return { ctx, page };
}
const snap = async (page, name) => { await page.waitForTimeout(700); await page.screenshot({ path: `${out}/${name}.png`, fullPage: true }); console.log('shot', name); };
const nav = async (page, name) => { await page.getByRole('link', { name, exact: true }).first().click(); await page.waitForTimeout(900); };
const pick = async (page, label, option) => { await page.getByRole('combobox', { name: label }).first().click(); await page.getByRole('option', { name: option, exact: true }).first().click(); };
const sku = 'DT-' + Date.now().toString(36).toUpperCase();
const title = 'منتج اختبار ' + sku;
// merchant, desktop
let { ctx, page } = await session('merchant', { width: 1280, height: 900 });
await snap(page, 'merchant-19-home-desktop');
await nav(page, 'إضافة منتج');
await page.getByLabel('اسم المنتج', { exact: true }).fill(title);
await page.getByLabel('رقم القطعة', { exact: true }).fill(sku);
await page.getByLabel('الماركة (العلامة التجارية)', { exact: true }).fill('DTBRAND');
await pick(page, 'القسم', 'فرامل');
await page.getByLabel('الوصف', { exact: true }).fill('وصف تجريبي للمنتج داخل اختبار الداش بورد');
fs.writeFileSync('/tmp/dt.png', png);
await page.getByLabel('صورة المنتج').setInputFiles('/tmp/dt.png');
await pick(page, 'الماركة', 'Toyota');
await pick(page, 'الموديل', 'Corolla');
await pick(page, 'من سنة', '2016');
await pick(page, 'إلى سنة', '2020');
await pick(page, 'المحرك', '1.6L');
await page.getByRole('button', { name: 'إضافة هذا التوافق' }).click();
if (!(await page.getByText('Toyota Corolla • 2016-2020 • 1.6L').count())) fail('fitment row not added');
await snap(page, 'merchant-20-add-product-filled');
await page.getByRole('button', { name: 'حفظ المنتج وإرساله للمراجعة' }).click();
await page.getByText('تم إرسال المنتج لمراجعة الإدارة').waitFor({ timeout: 10000 }).catch(() => fail('product submit message missing'));
if (!(await page.getByText(title.slice(0, 20)).count())) fail('submitted product not listed under pending');
await snap(page, 'merchant-20-add-product-submitted');
// order detail with tracking
await nav(page, 'الطلبات');
await page.getByRole('button', { name: /^طلب / }).first().click();
await page.waitForTimeout(800);
await snap(page, 'merchant-21-order-detail');
await ctx.close();
// admin, desktop
({ ctx, page } = await session('admin', { width: 1280, height: 900 }));
await snap(page, 'admin-22-overview-desktop');
await nav(page, 'المحلات');
await snap(page, 'admin-23-shop-applications');
await nav(page, 'المراجعة');
if (!(await page.getByText(title).count())) fail('merchant product missing from admin review');
await snap(page, 'admin-24-review-center');
await page.getByText(title, { exact: true }).locator('xpath=ancestor::*[contains(@class,"flex-row")][1]').getByRole('button', { name: 'قبول', exact: true }).click();
await page.waitForTimeout(1200);
await nav(page, 'المزيد');
await snap(page, 'admin-more');
await ctx.close();
// mobile widths
for (const role of ['merchant', 'admin']) {
  const s = await session(role, { width: 430, height: 900 });
  await snap(s.page, role + '-home-mobile');
  await s.ctx.close();
}
// API-level confirmation that the merchant submission saved image and unverified fitment
const login = await (await fetch(API + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'admin@example.test', password: process.env.DEMO_PASSWORD }) })).json();
const dash = await (await fetch(API + '/dashboard', { headers: { Authorization: 'Bearer ' + login.token } })).json();
const p = dash.products.find((x) => x.partNumber === sku);
if (!p) fail('submitted product not in API');
else { if (!/^\/api\/media\//.test(p.image)) fail('image not saved'); if (!p.fitments.length || p.fitments.some((f) => f.verified)) fail('fitment missing or already verified'); if (!p.approved) fail('admin approve click did not approve'); }
await browser.close();
if (errs.length) { console.log('FAIL', errs); process.exit(1); }
console.log('PASS dashboard e2e: merchant submit with image and fitment, admin review and approve, order detail, mobile and desktop screenshots. No browser errors.');

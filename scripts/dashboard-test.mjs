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
  await page.goto(WEB + '/login'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(800);
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
await page.getByLabel('السعر (بالقروش)').first().fill('12500');
await page.getByLabel('المخزون').first().fill('7');
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
// New merchant session: the server-persisted proposed price and stock prefill the offer form after approval.
({ ctx, page } = await session('merchant', { width: 430, height: 900 }));
await nav(page, 'إضافة منتج');
await page.getByRole('combobox', { name: 'المنتج المعتمد' }).click();
await page.getByRole('option', { name: new RegExp(title.slice(0, 20)) }).click();
if ((await page.getByLabel('السعر (بالقروش)').nth(1).inputValue()) !== '12500' || (await page.getByLabel('المخزون').nth(1).inputValue()) !== '7') fail('proposed price/stock not prefilled in a new session');
await ctx.close();
// Cancellation after delivery started: merchant ships, customer requests cancellation, admin decides in the web UI.
{
  const jlogin = async (email) => (await (await fetch(API + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: process.env.DEMO_PASSWORD }) })).json()).token;
  const call = async (path, method, token, body) => { const r = await fetch(API + path, { method, headers: { 'content-type': 'application/json', Authorization: 'Bearer ' + token }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json().catch(() => ({})) }; };
  const [mt, ct, at] = [await jlogin('merchant@example.test'), await jlogin('customer@example.test'), await jlogin('admin@example.test')];
  const adm = (await call('/dashboard', 'GET', at)).body;
  const area = adm.deliveryAreas.find((a) => a.active);
  const offer = adm.shops.find((sh) => sh.name.includes('أوتو')).offers[0];
  const addr = (await call('/addresses', 'POST', ct, { label: 'اختبار', city: area.city, details: 'عنوان اختبار آلي غير حقيقي', phone: '01000000000' })).body;
  const quote = (await call('/orders/quote', 'POST', ct, { items: [{ offerId: offer.id, quantity: 1 }], addressId: addr.id, deliveryAreaId: area.id })).body;
  const placed = await call('/checkouts', 'POST', ct, { items: [{ offerId: offer.id, quantity: 1 }], addressId: addr.id, deliveryAreaId: area.id, requestKey: 'dash-cancel-' + Date.now(), expectedTotal: quote.total });
  const target = (await call('/dashboard', 'GET', at)).body.orders.find((o) => o.status === 'PLACED' && (o.checkoutId === placed.body.id || o.address?.details === 'عنوان اختبار آلي غير حقيقي'));
  if (!target) fail('could not create a PLACED customer order for the cancellation test');
  else {
    for (const st of ['ACCEPTED', 'PREPARING']) { const r = await call('/orders/' + target.id + '/status', 'PATCH', mt, { status: st }); if (r.status >= 300) fail('status ' + st + ' failed ' + r.status); }
    const shipped = await call('/orders/' + target.id + '/status', 'PATCH', mt, { status: 'SHIPPED', trackingNumber: 'TRK-' + sku });
    if (shipped.status >= 300) fail('ship failed ' + shipped.status);
    const direct = await call('/orders/' + target.id + '/status', 'PATCH', ct, { status: 'CANCELLED' });
    if (direct.status < 400) fail('customer could cancel directly after delivery started (status ' + direct.status + ')');
    const req = await call('/orders/' + target.id + '/cancellation-requests', 'POST', ct, { reason: 'العميل لا يستطيع الاستلام اليوم' });
    if (req.status !== 201) fail('cancellation request failed ' + req.status);
    ({ ctx, page } = await session('admin', { width: 1280, height: 900 }));
    await nav(page, 'المزيد');
    await page.locator('a[href="/dashboard/legacy-orders"]').first().click();
    await page.waitForTimeout(1200);
    if (!(await page.getByText('طلب إلغاء للمراجعة').count())) fail('admin UI shows no pending cancellation review');
    else {
      await page.locator('textarea').last().fill('تم التحقق من تكلفة الشحن الفعلية');
      await page.locator('input[type=number]').last().fill('0');
      await snap(page, 'admin-cancellation-review');
      await page.getByRole('button', { name: 'الموافقة على الإلغاء' }).first().click();
      await page.waitForTimeout(1800);
      const after = (await call('/dashboard', 'GET', at)).body.orders.find((o) => o.id === target.id);
      if (after.status !== 'CANCELLED') fail('order not cancelled after admin approval: ' + after.status);
      else console.log('cancellation after shipping approved in UI; order status CANCELLED; direct cancel attempt status', direct.status);
      await snap(page, 'admin-cancellation-approved');
    }
    await ctx.close();
  }
}
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

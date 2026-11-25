// Shop application, photos, private documents, approval, public display and merchant edit. Test stack only.
import { chromium } from '@playwright/test';
import fs from 'node:fs'; import zlib from 'node:zlib';
const WEB = process.env.WEB_URL || 'http://127.0.0.1:3200', API = process.env.API_URL || 'http://127.0.0.1:4100/api', OUT = process.env.OUT || '/tmp/shop';
fs.mkdirSync(OUT, { recursive: true });
function png(w, h, rgb) { const raw = Buffer.alloc((w * 3 + 1) * h); for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; for (let x = 0; x < w; x++) { const o = y * (w * 3 + 1) + 1 + x * 3; raw[o] = rgb[0] + (x * 40 / w) | 0; raw[o + 1] = rgb[1] + (y * 40 / h) | 0; raw[o + 2] = rgb[2]; } }
  const crc = (b) => { let c, t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } let r = 0xffffffff; for (const x of b) r = t[(r ^ x) & 255] ^ (r >>> 8); return (r ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]); }
fs.writeFileSync(OUT + '/cover.png', png(800, 600, [20, 90, 200])); fs.writeFileSync(OUT + '/g1.png', png(640, 480, [200, 90, 20]));
fs.writeFileSync(OUT + '/reg.pdf', '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n'); fs.writeFileSync(OUT + '/bad.txt', 'not an image');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const j = (p, o = {}) => fetch(API + p, o);
const adm = (await (await j('/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'admin@example.test', password: process.env.DEMO_PASSWORD }) })).json()).token;
const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
const email = 'shop' + Date.now().toString(36) + '@example.test', shopName = 'محل اختبار ' + Date.now().toString(36);
await page.goto(WEB + '/login'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(600);
await page.getByRole('button', { name: 'دخول البريد للتطوير والإدارة', exact: true }).click();
await page.getByRole('button', { name: 'لسه جديد؟ اعمل حساب' }).click();
await page.getByLabel('الاسم', { exact: true }).fill('صاحب محل'); await page.getByLabel('البريد الإلكتروني', { exact: true }).fill(email);
await page.getByLabel('كلمة المرور', { exact: true }).fill('Test-pass-12345'); await page.getByRole('button', { name: 'إنشاء الحساب' }).click(); await page.waitForTimeout(2500);
await page.evaluate(() => window.useNuxtApp().$router.push('/profile')); await page.waitForTimeout(1500);
const f = page.locator('.saf');
await f.getByLabel('اسم المحل').fill(shopName); await f.getByLabel('المدينة *').fill('القاهرة'); await f.getByLabel('الحي أو المنطقة').fill('مدينة نصر');
await f.getByLabel('مواعيد العمل').fill('يوميًا 10 ص إلى 10 م'); await f.getByLabel('نبذة عن المحل').fill('قطع غيار يابانية وكورية بضمان الوكيل.');
await f.getByLabel('تفاصيل النشاط للمراجعة').fill('فلاتر وزيوت وفرامل لسيارات يابانية وكورية');
await f.getByLabel('اسم المسؤول').fill('أحمد علي'); await f.getByLabel('هاتف المحل').fill('01012345678'); await f.getByLabel('واتساب').fill('01012345678'); await f.getByLabel('البريد الإلكتروني').fill('shop@example.test');
await f.getByLabel('عنوان المحل بالتفصيل').fill('١٢ شارع عباس العقاد، مدينة نصر'); await f.getByLabel('رقم السجل التجاري').fill('RC-123456'); await f.getByLabel('رقم البطاقة الضريبية').fill('TX-998877');
await page.screenshot({ path: OUT + '/apply-form-1440.png', fullPage: true });
await f.getByRole('button', { name: 'إرسال طلب انضمام' }).click(); await page.waitForTimeout(2000);
ok((await page.locator('.saf').innerText()).includes('قيد المراجعة'), 'application submitted, state pending shown');
const inputs = f.locator('input[type=file]');
await inputs.nth(0).setInputFiles(OUT + '/cover.png'); await page.waitForTimeout(1500);
await inputs.nth(1).setInputFiles(OUT + '/g1.png'); await page.waitForTimeout(1500);
await inputs.nth(1).setInputFiles(OUT + '/bad.txt'); await page.waitForTimeout(600);
ok((await f.innerText()).includes('الصيغ المسموحة'), 'non-image photo rejected in UI');
await inputs.nth(2).setInputFiles(OUT + '/reg.pdf'); await page.waitForTimeout(1500);
await page.reload(); await page.waitForLoadState('networkidle'); await page.waitForTimeout(1500);
const t = await page.locator('.saf').innerText();
ok(t.includes('reg.pdf'), 'private document persisted after reload'); ok(await page.locator('.saf .spm-item').count() === 2, 'two photos persisted after reload');
ok(await page.locator('.saf input[maxlength="100"]').first().inputValue() === shopName, 'form values restored from server');
await page.screenshot({ path: OUT + '/apply-photos-1440.png', fullPage: true });
const token = await page.evaluate(() => sessionStorage.getItem('ghiyar-token'));
const mine = await (await j('/shop-application', { headers: { Authorization: 'Bearer ' + token } })).json();
ok(mine.registrationNumber === 'RC-123456' && mine.description.startsWith('قطع غيار') && mine.photos.length === 2 && mine.documents.length === 1, 'API returns persisted fields, photos, documents');
// invalid uploads server-side
const fd = new FormData(); fd.append('image', new Blob(['hello'], { type: 'image/png' }), 'x.png'); const bad = await j('/shop-application/photos', { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: fd }); ok(bad.status === 400, 'fake PNG rejected by server (' + bad.status + ')');
const fd2 = new FormData(); fd2.append('kind', 'TAX'); fd2.append('file', new Blob(['hello'], { type: 'application/pdf' }), 'x.pdf'); const bad2 = await j('/shop-application/documents', { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: fd2 }); ok(bad2.status === 400, 'fake PDF rejected by server (' + bad2.status + ')');
// access control on documents
const docId = mine.documents[0].id;
ok((await j('/shop-documents/' + docId)).status === 401, 'document: anonymous denied');
const other = await (await j('/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'customer@example.test', password: process.env.DEMO_PASSWORD }) })).json();
ok((await j('/shop-documents/' + docId, { headers: { Authorization: 'Bearer ' + other.token } })).status === 403, 'document: other customer denied');
ok((await j('/shop-documents/' + docId, { headers: { Authorization: 'Bearer ' + adm } })).status === 200, 'document: admin allowed');
ok((await j('/shop-documents/' + docId, { headers: { Authorization: 'Bearer ' + token } })).status === 200, 'document: owner allowed');
// pending application must not be public
const pub0 = await (await j('/shops')).json(); ok(!pub0.some((s) => s.name === shopName), 'pending shop not in public list');
// admin approves
const dash = await (await j('/dashboard', { headers: { Authorization: 'Bearer ' + adm } })).json();
const appRow = dash.shopApplications.find((a) => a.id === mine.id); ok(appRow && appRow.photos.length === 2 && appRow.documents.length === 1, 'admin dashboard lists application with photos and documents');
const dec = await j('/admin/shop-applications/' + mine.id + '/decision', { method: 'POST', headers: { Authorization: 'Bearer ' + adm, 'content-type': 'application/json' }, body: JSON.stringify({ approve: true, reason: 'بيانات كاملة' }) }); ok(dec.status < 300, 'admin approved (' + dec.status + ')');
const pub = await (await j('/shops')).json(); const mineShop = pub.find((s) => s.name === shopName);
ok(mineShop && mineShop.photos.length === 2 && mineShop.description.startsWith('قطع غيار') && mineShop.workingHours && mineShop.district === 'مدينة نصر', 'public shop shows approved photos, description, hours, district');
ok(!JSON.stringify(mineShop).match(/01012345678|RC-123456|TX-998877|shop@example/), 'public shop exposes no phone, email or document numbers');
ok(mineShop.photos.every((p) => p.demo === true), 'photos flagged demo in non-production build');
// public shop page
const pg2 = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await pg2.goto(WEB + '/shops'); await pg2.waitForLoadState('networkidle'); await pg2.waitForTimeout(1500);
const card = pg2.locator('.store-discovery-card', { hasText: shopName }); ok(await card.count() === 1, 'shop card on public /shops');
ok(await card.locator('img').count() >= 2 && (await card.innerText()).includes('صورة تجريبية'), 'card shows real photos with demo label');
await card.scrollIntoViewIfNeeded(); await card.screenshot({ path: OUT + '/shop-card.png' }); await pg2.screenshot({ path: OUT + '/shops-page-1440.png' });
// merchant edit after approval
const ml = await (await j('/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'Test-pass-12345' }) })).json();
await page.evaluate(() => sessionStorage.clear()); await page.goto(WEB + '/login'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(600);
await page.getByRole('button', { name: 'دخول البريد للتطوير والإدارة', exact: true }).click();
await page.getByLabel('البريد الإلكتروني', { exact: true }).fill(email); await page.getByLabel('كلمة المرور', { exact: true }).fill('Test-pass-12345'); await page.getByRole('button', { name: /^دخول$/ }).click().catch(() => {}); await page.waitForTimeout(2500);
await page.evaluate(() => window.useNuxtApp().$router.push('/dashboard/shop-profile')); await page.waitForTimeout(2500);
ok(page.url().includes('/dashboard/shop-profile'), 'merchant reaches shop-profile page: ' + page.url());
await page.locator('#sp-h').fill('السبت إلى الخميس 9 ص إلى 9 م'); await page.getByRole('button', { name: 'حفظ', exact: true }).click(); await page.waitForTimeout(1500);
await page.locator('.spm input[type=file]').nth(1).setInputFiles(OUT + '/g1.png'); await page.waitForTimeout(1800);
await page.screenshot({ path: OUT + '/merchant-shop-profile-1440.png', fullPage: true });
const pub2 = (await (await j('/shops')).json()).find((s) => s.name === shopName);
ok(pub2.workingHours.startsWith('السبت') && pub2.photos.length === 3, 'merchant edit persisted: hours changed, third photo added');
await page.setViewportSize({ width: 390, height: 727 }); await page.waitForTimeout(800); await page.screenshot({ path: OUT + '/merchant-shop-profile-390.png' });
await pg2.setViewportSize({ width: 390, height: 727 }); await pg2.waitForTimeout(600); await card.scrollIntoViewIfNeeded(); await pg2.screenshot({ path: OUT + '/shops-page-390.png' });
ok(errs.length === 0, 'no page errors ' + errs.slice(0, 2).join('|'));
await browser.close();

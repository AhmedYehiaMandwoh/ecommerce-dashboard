// Order flow snapshots: checkout (reviewed) and order-success, at several widths. Registers a throwaway test customer per width.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const OUT = process.env.OUT; fs.mkdirSync(OUT, { recursive: true });
const WEB = process.env.WEB_URL;
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true, args: ['--no-sandbox'] });
for (const w of (process.env.WIDTHS || '1280,768,700,600,480,390').split(',').map(Number)) {
  const page = await (await browser.newContext({ viewport: { width: w, height: 900 } })).newPage();
  const go = async r => { await page.evaluate(r => window.useNuxtApp().$router.push(r), r); await page.waitForTimeout(1500); };
  const shot = async n => { await page.waitForLoadState('networkidle'); await page.waitForTimeout(700); await page.screenshot({ path: `${OUT}/${n}-${w}.png`, fullPage: true }); };
  await page.goto(WEB + '/login'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(600);
  await page.getByRole('button', { name: 'دخول البريد للتطوير والإدارة', exact: true }).click();
  await page.getByRole('button', { name: 'لسه جديد؟ اعمل حساب' }).click();
  await page.getByLabel('الاسم', { exact: true }).fill('عميل تجريبي'); await page.getByLabel('البريد الإلكتروني', { exact: true }).fill('shot' + w + Date.now().toString(36) + '@example.test');
  await page.getByLabel('كلمة المرور', { exact: true }).fill('Test-pass-12345'); await page.getByRole('button', { name: 'إنشاء الحساب' }).click(); await page.waitForTimeout(2500);
  await go('/shops');
  await page.getByRole('button', { name: 'التفاصيل' }).first().click(); await page.waitForTimeout(1200);
  await page.getByRole('button', { name: /أضف للسلة/ }).first().click(); await page.waitForTimeout(800);
  await go('/profile');
  await page.getByLabel('اسم العنوان').fill('البيت'); await page.getByLabel('المدينة', { exact: true }).fill('القاهرة');
  await page.getByLabel('العنوان بالتفصيل').fill('١٢ شارع التجربة، مدينة نصر'); await page.getByLabel('رقم التواصل').fill('01000000000');
  await page.getByRole('button', { name: 'حفظ العنوان' }).click(); await page.waitForTimeout(1500);
  await go('/cart'); await shot('cart-one');
  await go('/checkout');
  await page.locator('select').first().selectOption({ index: 1 }); await page.getByLabel('منطقة التوصيل').selectOption({ index: 1 }); await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'راجع التكلفة النهائية' }).click(); await page.waitForTimeout(2000); await shot('checkout-review');
  await page.getByRole('button', { name: /تأكيد الطلب/ }).click(); await page.waitForTimeout(3000); await shot('order-success');
  await page.close();
}
await browser.close(); console.log('done', fs.readdirSync(OUT).length);

// Customer website responsive check: public routes at several widths, overflow + screenshots.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const out = process.env.OUT || '/tmp/site'; fs.mkdirSync(out, { recursive: true });
const WEB = process.env.WEB_URL || 'http://127.0.0.1:3200';
const sizes = (process.env.SIZES || '2560x1440,1920x1080,1440x900,1024x768,768x1024,390x727').split(',').map((s) => s.split('x').map(Number));
const routes = ['/', '/shops', '/login'];
const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), headless: true, args: ['--no-sandbox'] });
const bad = [];
for (const [w, h] of sizes) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } }); const page = await ctx.newPage();
  for (const r of routes) {
    await page.goto(WEB + r); await page.waitForLoadState('networkidle'); await page.waitForTimeout(900);
    const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, path: location.pathname }));
    const name = `site-${r.replace(/\W+/g, '_')}-${w}`;
    await page.screenshot({ path: `${out}/${name}.png` });
    const ok = m.sw <= m.cw; console.log(ok ? 'OK ' : 'BAD', name, JSON.stringify(m)); if (!ok) bad.push(name);
  }
  await ctx.close();
}
await browser.close();
console.log(bad.length ? 'OVERFLOW: ' + bad.join(' ') : 'ALL OK');
process.exit(bad.length ? 1 : 0);

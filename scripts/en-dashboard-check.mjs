// English coverage of every dashboard page: logs in as merchant/admin in English, visits each sidebar link, reports Arabic text leaks, console errors and horizontal overflow. Needs API+web running with the demo password in DEMO_PASSWORD.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const WEB = process.env.WEB_URL || 'http://127.0.0.1:3200', OUT = process.env.OUT || '/tmp/en-dash'; fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), headless: true, args: ['--no-sandbox'] });
let bad = 0;
for (const role of (process.env.ROLES || 'merchant,admin').split(',')) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 120))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
  await p.goto(WEB + '/login'); await p.waitForLoadState('networkidle');
  await p.getByRole('button', { name: 'English', exact: true }).click(); await p.waitForTimeout(800);
  await p.getByRole('button', { name: 'Email sign-in for development and admin' }).click();
  await p.getByLabel('Email', { exact: true }).fill(role + '@example.test'); await p.getByLabel('Password', { exact: true }).fill(process.env.DEMO_PASSWORD);
  await p.getByRole('button', { name: 'Sign in', exact: true }).last().click();
  await p.waitForURL((u) => u.pathname.replace(/\/+$/, '') === '/dashboard'); await p.waitForTimeout(1500);
  const hrefs = [...new Set(await p.$$eval('a[href^="/dashboard"]', (a) => a.filter((x) => x.offsetParent !== null).map((x) => x.getAttribute('href'))))];
  console.log(role, 'pages:', hrefs.join(' '));
  for (const h of hrefs) {
    await p.locator(`a[href="${h}"]:visible`).first().click(); await p.waitForTimeout(1500);
    const here = new URL(p.url()).pathname.replace(/\/+$/, ''); if (here !== h) { bad++; console.log('FLAG wrong page', role, h, 'landed on', here); continue; }
    const r = await p.evaluate(() => { const ar = /[\u0600-\u06FF]/; const leaks = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const t = n.textContent.trim(); if (t && ar.test(t) && !n.parentElement.closest('header') && t !== 'العربية' && !/^(ت|إ)$/.test(t)) leaks.push(t.slice(0, 50)); } const ph = [...document.querySelectorAll('[placeholder],[aria-label],[title]')].map((e) => e.getAttribute('placeholder') || e.getAttribute('aria-label') || e.title).filter((t) => t && ar.test(t) && t !== 'العربية').slice(0, 5); return { dir: document.documentElement.dir, ov: document.documentElement.scrollWidth - document.documentElement.clientWidth, leaks: [...new Set(leaks)].slice(0, 8), ph }; });
    const name = role + h.replace(/\W+/g, '_');
    await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
    const flag = r.dir !== 'ltr' || r.ov > 0 || r.leaks.length || r.ph.length; if (flag) bad++;
    console.log(flag ? 'FLAG' : 'OK  ', role, h, JSON.stringify(r));
  }
  console.log(role, 'errors:', errs.length ? [...new Set(errs)].slice(0, 5).join(' | ') : 'none'); await ctx.close();
}
await b.close(); console.log(bad ? 'FLAGGED ' + bad : 'ALL OK');

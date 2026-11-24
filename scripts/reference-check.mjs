import { chromium } from '@playwright/test';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const page=await browser.newPage();
await page.route('**/api/**',route=>route.fulfill({json:route.request().url().endsWith('/products')?{items:[],pages:1}:[]}));
for(const width of [390,804]){await page.setViewportSize({width,height:1429});await page.goto('http://127.0.0.1:3000');await page.evaluate(()=>document.fonts.ready);await page.locator('.reference-home').screenshot({path:'/downloads/ghiyar-verification/recovery-home-'+width+'.png'});console.log(width,await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth})));}
await browser.close();

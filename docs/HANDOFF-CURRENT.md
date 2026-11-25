# Current work and serving setup (handoff)

Status: partial repair. Not a PDF match and not a template match. Non-live source, cash only, static test OTP 123456, Twilio blank.

## Repos
- ecommerce-dashboard (this repo): apps/api (NestJS + Prisma), apps/web (Nuxt, shadcn-vue), scripts, prisma.
- ecommerce-apps: customer React Native app that follows the 24-screen PDF.

## Done
- Customer website, merchant dashboard, admin dashboard: responsive desktop-first web, Arabic RTL and English LTR (language cookie `ghiyar-lang`, switch in headers, `app/composables/useI18n.ts`, `app/i18n-en.json`, `app/i18n-api-ar.json`).
- Shop application form, shop photos and private documents (owner/admin only download), merchant shop profile, admin review of real application fields.
- Checkout with area filtered by address city, admin-set per-area shipping fee per basket.

## Not done
- React Native localization (Arabic/English, RTL/LTR) and RN screenshots proving shop photos on shop list and shop screens.
- Mobile screens 07 and 17 fidelity vs the PDF.
- English review of lower dashboard pages (inventory, settlements, import) and English assertions for checkout and form validation.
- Server messages not in i18n-api-ar.json show in English in Arabic mode.
- Discount funding policy is unresolved. No settlement policy.

## Conventions for translations
Arabic text is the key: `t('نص عربي', arg0)` with `{0}` placeholders. User-entered content (shop and product names) is shown as authored. Add the English text to `app/i18n-en.json`.

## Checks (run from repo root)
`node scripts/dashboard-test.mjs`, `shop-flow.mjs`, `checkout-flow.mjs`, `i18n-check.mjs`, `responsive-check.mjs`, `site-check.mjs`; in apps/web `npx vue-tsc --noEmit`. Needs CHROME_PATH, DEMO_PASSWORD, WEB_URL, API_URL; use an isolated test database, never the demo data.

## Running
Environment variables are in docs/ENVIRONMENT.md (PRIVATE_DOCS_DIR for private documents). A Nuxt build needs about 1 GB free memory: run `NODE_OPTIONS=--max-old-space-size=1100 npx nuxt build`, copy `.output` to a new folder and start the copy, then stop the old process. Secrets are never stored in the repo.

## Recovery after a sandbox restart (no reseed)
Background processes do not survive a restart; database files and builds do.
1. Start MariaDB from the existing data directory (do not drop or reseed the preview database).
2. Start the API (dist/main.js) with its env file; set MEDIA_DIR and PRIVATE_DOCS_DIR.
3. Start the web build copy with PORT and NUXT_PUBLIC_API_BASE pointing at the API.
4. Start Expo web with EXPO_PUBLIC_API_URL and EXPO_PUBLIC_ASSET_URL.
5. Quick public tunnels get new hostnames each time. Start the tunnels first, then restart the API with CORS_ORIGINS, WEBAUTHN_ORIGIN and WEBAUTHN_RP_ID set to the new web/app hosts, and the web/Expo with the new API host.
6. Verify in a real browser that the pages load and the API calls return 200 from the new origins, not only HTTP 200 on the page.

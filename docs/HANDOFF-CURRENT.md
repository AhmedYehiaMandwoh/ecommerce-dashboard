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

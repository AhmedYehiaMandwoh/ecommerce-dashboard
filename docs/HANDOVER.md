# Non-live source handover

This snapshot contains the requested Nuxt customer/merchant/admin, NestJS/Prisma/MySQL and separately packaged React Native customer source. Twilio values are blank; explicit non-production static-test code123456. No APK, server deployment or real financial transfer.

## Verified exact source trees

Separate npm ci installs, API/Nuxt production builds, standalone app TypeScript and Expo Web export. Connected exact split trees passed34 API integration checks,14 unit tests and Chrome browser flows against disposable MySQL8.4.6. Browser covers phone test login, virtual passkey register/login/revoke, multi-shop checkout/fee split/cancel review/settlement, delivered returns/refund evidence, shop applications, catalog editing, favorites/support, RN Web cart restore/join/cancel/return and offline recovery. Responsive home checks320/390/804/1280px. Virtual authenticator is not physical FaceID proof.

Synthetic test:50k catalog products queried in124-354ms locally;1k import preview492ms, commit5.1s, replay passed. These are local measurements, not production capacity or a50k-row single import.

## Boundaries before real launch

- Static OTP is deliberately insecure and refused in production. Configure actual Twilio privately and obtain permission before paid SMS tests.
- Native biometric/device-passcode/protected storage needs physical-device testing.12h access/30d device expiry are testing defaults. Recovery/phone change remains later work.
- No Docker is used. HTTPS/proxy, backups/restore, production security/distributed abuse/retention/capacity review remain operator gates.
- Web development bearer sessions use sessionStorage, not hardened HttpOnly production auth. Large view components remain a maintainability limitation.
- Real catalog fitment/image rights/inventory connectors need verified source data. No guessed fitment. CSV is approved existing catalog,1000-row absolute snapshots with bound preview/history, not a supplier connector.
- Returns are case-by-case admin review, no invented window or eligibility. Cash/refund/shipping evidence records never transfer money. Commercial tax/commission/returns/legal policies remain owner decisions.

Optional CI is docs/templates/verify-workflow.yml only, disabled until installed by owner. No remote workflow triggered. Never commit private env, uploaded media, database contents, tokens or signing files.

## Update: discount codes, tracking, merchant product workflow, shadcn dashboard

Scope is unchanged: non-live test source, cash only, static test OTP 123456, Twilio blank, admin-set per-area shipping fee, no deployment.

### Discount codes (test behavior, business rule OPEN)
- Table `DiscountCode` (code, percent 1-50, active, maxUses, used, expiresAt). Demo code `GHIYAR10` (10%) is seeded. There is no admin screen to create codes yet.
- A code reduces product value per shop BEFORE shipping is allocated, so shipping shares stay proportional to post-discount values. The zone fee itself is never discounted. `Order.subtotal` stores the post-discount value and `Order.discount` stores the amount taken off (see `applyPercent` for rounding). Pre-delivery cancellation reallocates the fixed zone fee over the remaining orders' post-discount subtotals (covered by an integration test).
- UNRESOLVED business decision: who funds the discount. In this source the shop's order subtotal is the discounted value, so the shop collects less and nothing credits the shop or debits the platform. This is test behavior only. Decide the funding rule (shop-funded, platform-funded, or split) and the settlement entries before any real use. Nothing here asserts platform funding.
- Max uses is consumed atomically inside the checkout transaction; replaying the same request key does not consume another use.

### Tracking number
`Order.trackingNumber` (3-40 characters: letters, digits, `- _ . /` and space). Set by merchant or admin through `PATCH /api/orders/:id/status` together with a status change. Display only, no carrier integration.

### Merchant product workflow
Merchants submit a product (`POST /api/products`), then its image (`POST /api/products/:id/image`) and fitment rows (`POST|DELETE /api/products/:id/fitments`). Only the submitting merchant can do this and only while the product is unapproved. Fitments are always saved unverified. The admin reviews and approves in the dashboard review center. `GET /api/vehicle-catalog` (public) feeds the make/model/year/engine selectors from fitment data.

### Support image
`POST /api/support-tickets` accepts an optional `attachment` data URL (PNG, JPEG or WebP, data URL up to 1.6M characters). It is stored with the ticket.

### Web dashboard (Nuxt 4 + Tailwind v4 + shadcn-vue)
Merchant and admin screens live in the web dashboard only. Routes: `/dashboard` (merchant home / admin overview), `/orders`, `/add-product`, `/applications`, `/review`, `/catalog`, `/more`, plus older pages (inventory, import, settlements, returns, delivery, support, legacy-orders) that still use the older styling and are not yet converted to shadcn. The legacy stylesheet is wrapped in a lower CSS layer so shadcn utilities win.

### Tests
- `pnpm test` (API unit), `pnpm test:integration` against a freshly seeded database (it is not repeatable on a used database).
- `node scripts/dashboard-test.mjs` (Playwright, needs API :4000 and web :3000, `CHROME_PATH` and `DEMO_PASSWORD`).
- The old `scripts/visual-test.mjs` was removed; use `scripts/dashboard-test.mjs` (web) and the mobile app repo `scripts/mobile-test.mjs`.

### Known gaps
Native iOS/Android rendering of the NativeWind app is not verified (Expo web only). Tracking art in the app is static artwork, not live GPS. See the repository issues list in this file for remaining PDF fidelity items.

### Demo seed (updated)
Three fictional shops (same demo merchant account) and an accessories product (`DEMO-ACC-07`) so the shops list and multi-shop cart can be tried. All catalog data is fictional test data. Vehicle fitments in the seed are unverified.

### Mobile app notes
The customer app vehicle screen uses dropdown rows fed by `GET /api/vehicle-catalog`. The order tracking illustration is static artwork and is labelled as such on screen. NativeWind output was checked on Expo web only.

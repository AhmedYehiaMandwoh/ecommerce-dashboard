# غيار | Ghiyar marketplace

**Non-live testing source. Not cleared for real customers or production.**

Current owner scope: complete source for non-live testing, cash only, each shop delivers independently, one admin-set area fee per basket. No APK or live deployment. Final source is intended for the two owner-selected GitHub repositories after completion. Twilio credentials remain blank; explicit static-test OTP uses 123456 and must never authenticate real customers.

A connected multi-merchant spare-parts foundation using Ahmed's selected stack:

- Nuxt 4 website, merchant dashboard and platform administration.
- NestJS API, Prisma 7 and MySQL schema/migrations.
- The React Native (Expo) customer app lives in its own repository: https://github.com/AhmedYehiaMandwoh/ecommerce-apps
- Arabic RTL screens in the accepted blue/orange visual direction.

The current connected source lets a customer browse fictional parts, compare shop offers, sign in with test phone OTP (or development email/password), save an address and vehicle, place a **test order**, and follow its status. The shop can see its own orders, move them through allowed states, and maintain price/stock. Admin reviews shop applications, products, shipping/cancellations/returns and support. See docs/HANDOVER.md for exact tested scope and remaining real-launch gates.

## Current status (read this first)

- Customer web storefront, merchant dashboard and admin dashboard use Nuxt 4 + Tailwind v4 + shadcn-vue. The mobile app (React Native + NativeWind) is customer-only and lives in the apps repository. Merchant and admin work happens only in the web dashboard.
- Implemented and tested against a local MySQL-compatible database: phone static-test OTP login, addresses, vehicle selection from a catalog endpoint, multi-shop cash-on-delivery test checkout with an admin-set per-area fee, percent discount codes (demo code `GHIYAR10`), two-stage cancellation, returns with refund evidence, shipping ledger and settlements, order tracking numbers, merchant product submission with image and unverified fitment (admin approves), support tickets with an image attachment, CSV offer import.
- **Open business decision:** who funds a discount (shop, platform or split). The code only reduces the shop's order subtotal and credits no one. See docs/HANDOVER.md.
- The online-card payment row is shown disabled with the label "قريبًا" (owner-approved). Nothing else is disabled or stubbed except what the Safety section lists.
- Layouts follow the 24-screen reference PDF by eye. The PDF is image-only, so this is not a pixel-exact match. NativeWind was checked on Expo web only, not on a physical device.
- Tests: `pnpm --filter @ghiyar/api test` (unit), `pnpm --filter @ghiyar/api test:integration` (needs a freshly seeded database), `node scripts/dashboard-test.mjs` (web browser end to end, needs API and web running). The apps repository has `scripts/mobile-test.mjs`.

## Start here

0. No Docker is needed or supplied. Everything runs directly with Node, pnpm and MySQL.
0. Read [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for every environment variable and safe example handling.
1. Read [docs/SETUP.md](docs/SETUP.md) for a development setup and demo data.
2. Read [docs/VERIFICATION.md](docs/VERIFICATION.md) for what was actually tested.
3. Read [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) before using a server.
4. Read [docs/ANDROID.md](docs/ANDROID.md) before attempting an APK.
5. Read [docs/ROADMAP.md](docs/ROADMAP.md) for the remaining work, boundaries and decisions.

No live deployment, external account, paid service or production signing identity is included. No APK has been built or device-tested in this milestone. Android/iOS JavaScript export is **not** a native binary.

## Repository

```
apps/api/          NestJS services, DTOs, schema, migrations, tests
apps/web/          Nuxt website + merchant/admin dashboard
scripts/           Android build helper, environment check, dashboard-test.mjs browser test
docs/              Setup, architecture, API, verification, remaining work
```

## Safety and scope

- The API rejects checkout unless `TEST_CHECKOUT=true`. Even when enabled it creates only `TEST_COD` test orders.
- All example products, prices, stock and shipping fees are invented. Product imagery is generated illustration, not a reliable representation of a purchasable part.
- Admin manages delivery zones and one fee per basket. Demo prices/fees are fictional. Taxes and commissions are not implemented.
- Multi-shop baskets commit atomically to a parent checkout and child shop orders, with proportional shipping allocation.
- Product identity is shared (brand + manufacturer part number); each shop owns an offer with its SKU, price and stock. Packaging/variant identity needs expansion before real catalog imports.
- Vehicle records do not prove fitment. Demo products have no verified fitments. Do not publish guessed fitment.
- CSV import supports a 1,000-row synchronous batch of **existing catalog items**, not a validated 50,000-SKU inventory integration.
- Phone OTP uses static-test code 123456 in local testing. Twilio adapter is staged but not activated. Web passkeys are protocol-tested with a virtual authenticator; native protected device unlock needs physical-device acceptance. Email/password is a development/admin fallback. Account recovery/phone change remain release work.
- The proposed name غيار and illustrations are working design assets, not legally cleared branding or licensed manufacturer product photography.

## License

Project-specific code is supplied for Ahmed's project. Third-party packages and generated native templates retain their own licenses. Before public distribution, review package licenses, branding and catalog/image rights. No claim of exclusive rights in generated illustrations is made.

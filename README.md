# غيار | Ghiyar marketplace

**Non-live testing source. Not cleared for real customers or production.**

Current owner scope: complete source for non-live testing, cash only, each shop delivers independently, one admin-set area fee per basket. No APK or live deployment. Final source is intended for the two owner-selected GitHub repositories after completion. Twilio credentials remain blank; explicit static-test OTP uses 123456 and must never authenticate real customers.

A connected multi-merchant spare-parts foundation using Ahmed's selected stack:

- Nuxt 4 website, merchant dashboard and platform administration.
- NestJS API, Prisma 7 and MySQL schema/migrations.
- React Native customer app using Expo 58, with Android build configuration.
- Arabic RTL screens in the accepted blue/orange visual direction.

The current connected source lets a customer browse fictional parts, compare shop offers, sign in with test phone OTP (or development email/password), save an address and vehicle, place a **test order**, and follow its status. The shop can see its own orders, move them through allowed states, and maintain price/stock. Admin reviews shop applications, products, shipping/cancellations/returns and support. See docs/HANDOVER.md for exact tested scope and remaining real-launch gates.

## Start here

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
apps/mobile/       React Native/Expo customer app
scripts/           Android build helper, environment check, browser verification
compose.yaml       MySQL 8.4 + API + web deployment starting point, not executed here
Dockerfile.*       Container build definitions, not executed here
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

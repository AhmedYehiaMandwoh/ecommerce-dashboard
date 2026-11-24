# Local setup

## Requirements

- Node 22.22.3+ on the Node 22 line (development verification used 22.23.5).
- npm 10+.
- A **disposable development** MySQL 8.4 database, or MariaDB for compatibility testing.
- Current Android development tools only if you want to compile a native Android app.

Run from repository root:

```bash
npm ci
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env
```

Edit `apps/api/.env` with your own local database URL. Do not commit it. A password containing reserved URL characters must be URL-encoded in the connection URL.

```bash
cd apps/api
npm run db:generate
npm run db:migrate
```

Create an administrator using environment variables in your own terminal (do not use a real password in shared chat or commit it):

```bash
# Set ADMIN_EMAIL, ADMIN_NAME and ADMIN_PASSWORD in your local environment first.
npm run admin:create
```

For fictional local demo data only, supply a temporary `DEMO_PASSWORD` of at least 12 characters in your local environment and then:

```bash
ALLOW_DEMO_SEED=true npm run db:seed
```

This creates `customer@example.test`, `merchant@example.test`, `admin@example.test`. They use the password **you** supplied, not a bundled default. Seed is refused when `NODE_ENV=production`. Re-running seed resets only these demo account password hashes and preserves existing catalog/offer data. Use a fresh disposable database for repeatable tests.

In separate terminals, from root:

```bash
# apps/api/.env must explicitly contain TEST_CHECKOUT=true for local test orders.
npm run dev:api
npm run dev:web
npm run dev:mobile
```

Web: `http://localhost:3000`. API: `http://localhost:4000/api`. The app reads its API from `EXPO_PUBLIC_API_URL`.

For Android emulator, `10.0.2.2` addresses the host computer. For a physical phone, use the development computer's reachable LAN IP. `localhost` on a phone means the phone, not your computer. Never place a database password or private API secret in `EXPO_PUBLIC_*` or `NUXT_PUBLIC_*` variables.

The source archive deliberately does not include installed dependencies, generated Prisma client, `.nuxt`, `.output`, native signing files or compiled binaries. `npm ci`, Prisma generate and the documented builds recreate these.

## Phone testing

The example API environment uses OTP_MODE=static-test, NODE_ENV=development and SMS_SEND_ENABLED=false. Twilio identifiers and token stay blank. Use fictional E.164 numbers, then code 123456. This is not real verification and must never be used for real customers. Static mode is refused with NODE_ENV=production.

For web passkeys, open exactly http://localhost:3000 to match WEBAUTHN_RP_ID and WEBAUTHN_ORIGIN. After phone sign-in, open account and enable a passkey. Later choose passkey sign-in. A supported browser/authenticator is required; fingerprint/FaceID/PIN selection is controlled by the OS. Real hardware still needs acceptance.

Uploaded product images use MEDIA_DIR, default media under API working directory. Back up this directory with the database. Administrators upload JPEG/PNG/WebP under 5MB; server decodes/re-encodes to WebP and removes metadata. Do not commit uploaded media or customer data.

## Demo walkthrough

1. Log in as customer or create a new customer.
2. Save a delivery address (use fictional information in test environments).
3. Pick a product, choose a shop offer, add to cart.
4. Checkout as a test. No payment is processed.
5. Log in as merchant in another browser/session, open dashboard, accept the order, prepare and ship it.
6. Customer refreshes orders to see status changes.
7. Log in as admin to review shops and products.

## Commands

```bash
npm test
npm run build:api    # requires DATABASE_URL in apps/api/.env for Prisma config
npm run build:web
npm run typecheck -w apps/web
npm run check -w apps/mobile
npm run export -w apps/mobile
```

Integration tests use a running test API and mutate the connected database. They create orders, alter stock and test admin moderation. **Never run them against production.** Set `TEST_API_URL` and `DEMO_PASSWORD`, seed a disposable database, enable test checkout, then run `npm run test:integration -w apps/api`.

## Reproducible local checks

With a disposable empty MySQL database in DATABASE_URL and a temporary DEMO_PASSWORD supplied in your terminal, set CONFIRM_DISPOSABLE_DATABASE=yes then run `node scripts/verify-local.mjs`. It builds both services, applies migrations, seeds fictional data, starts the API, runs units/integration and stops its child server. Add --scale to create/clean50k synthetic products and a1000-row import. Never use a customer database. Integration checks expect a fresh database for a repeatable run; the script does not silently drop an existing database.

Browser checks: install Playwright Chromium with `npx playwright install chromium`, start the API on4000, built Nuxt on3000, and the app's Web export on8081, then `node scripts/visual-test.mjs`. Optional CHROME_PATH selects an installed Chromium. The script uses only local test identities. It writes screenshots under verification-output by default; VISUAL_OUTPUT_DIR overrides that destination. No live account/service is touched. Optional docs/templates/verify-workflow.yml is a disabled documentation template, not installed under .github/workflows. It has not run remotely; copy it there only when the owner chooses to enable manual CI.

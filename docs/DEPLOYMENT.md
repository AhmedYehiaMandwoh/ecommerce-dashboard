# Server preparation without Docker, not a production clearance

No server deployment was authorized or performed. This repository does not use Docker. The steps below run directly on a Linux server with Node 22, npm and MySQL 8.

1. Install Node 22, MySQL 8 and a reverse proxy (nginx or Caddy) with HTTPS.
2. Create the database and a least-privilege user. Copy apps/api/.env.example to apps/api/.env and apps/web/.env.example to apps/web/.env. Set a unique DATABASE_URL password, CORS_ORIGINS to the real web origin, WEBAUTHN_RP_ID and WEBAUTHN_ORIGIN to the real domain.
3. Run `pnpm install --frozen-lockfile`, then `pnpm build:api` and `pnpm --filter @ghiyar/api db:migrate`.
4. Create the real admin in a private terminal with `pnpm --filter @ghiyar/api admin:create` (set ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD first). Do not enable demo seed on a public server.
5. Start the API with `pnpm --filter @ghiyar/api start` (port 4000). Build the website with `NUXT_PUBLIC_API_BASE=https://your-domain/api pnpm build:web`, then `pnpm --filter @ghiyar/web start` (port 3000). Keep both running with systemd or pm2.
6. Proxy the web domain to port 3000 and /api to port 4000. Back up the database and the MEDIA_DIR folder.

Static-test OTP is refused when NODE_ENV=production, so connect Twilio (or another SMS provider) before real customers sign in. TEST_CHECKOUT must be true for orders to be accepted in this release; see docs/ROADMAP.md for remaining launch gates. The mobile app needs the HTTPS API and asset URLs at build time.

## Release blockers

- Cash-only, no payment gateway requested. Real Twilio credentials/sends remain disabled; static-test code must never be used with real customers. No email reset, courier or inventory-provider connector.
- Shipping allocation/cancellation/shop approval are implemented per owner decisions. Commission/tax/returns eligibility and real operations need policy review.
- No production review of device sessions, consent, privacy policy, retention or abuse controls.
- Web sessionStorage token should be replaced with hardened authentication suitable for the deployment.
- Database user privileges, TLS to remote databases, firewall, backups and restoration test must be set up.
- Imports now have bound previews, stale-state checks and history, but50k scale/queued connectors remain unverified.
- No load test for 50,000+ products or many concurrent shops.
- No physical-device biometric QA. APK/signing/store submission are outside requested scope.
- Container definitions have not been verified by Docker build/run.

Before going public: use staging, run MySQL 8.4 integration and browser tests, security/dependency review, backup restoration, real-device tests and a business acceptance checklist. Keep all purchases and real ordering disabled until separately configured and approved.

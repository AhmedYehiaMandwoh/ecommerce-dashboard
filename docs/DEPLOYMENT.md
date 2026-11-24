# Server preparation, not a production clearance

No server deployment was authorized or performed. Container definitions were created but could not be run here because Docker was unavailable. Local Node production builds were run instead. MySQL migrations and the current32 API integration checks were exercised on Oracle MySQL8.4.6 locally (earlier core checks also used MariaDB10.6). The supplied container configuration itself still needs staging build/run verification.

## Container starting point

Install current Docker/Compose on your own staging server. Copy `.env.example` to `.env`, set unique database passwords and public endpoint values, then:

```bash
docker compose build
docker compose up -d mysql
docker compose run --rm api npm run db:migrate
docker compose up -d api web
```

The API and web ports bind only to server loopback. Put an HTTPS reverse proxy in front of them. Expose web on its domain and `/api` via a proxy to 4000, or a separate API domain. Set `NUXT_PUBLIC_API_BASE` to the browser-reachable API, not the internal container hostname. Set API CORS to the actual web origin. Mobile needs a reachable HTTPS API and asset host embedded at build time.

Passwords in Compose DATABASE_URL must be URL-safe or encoded consistently. Do not commit `.env`. Do not enable demo seed on a public server. Bootstrap a real admin using a private terminal and `npm run admin:create` in the API environment. Default `TEST_CHECKOUT=false` keeps test ordering unavailable.

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

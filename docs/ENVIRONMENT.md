# Complete environment configuration

This is the full configuration inventory for the current source. No production passwords or API keys have been supplied. Public repositories may include the files and non-secret test values, but must never include actual credentials. Copy the examples into the corresponding `.env` files locally. Do not invent a shared default password.

## Database variables (used in your DATABASE_URL, no Docker)

| Variable | Development example | Production requirement |
| --- | --- | --- |
| MYSQL_DATABASE | ghiyar | Database name chosen by owner |
| MYSQL_USER | ghiyar | Least-privilege application database user |
| MYSQL_PASSWORD | empty until set | Unique strong password, URL-encoded for DATABASE_URL |
| MYSQL_ROOT_PASSWORD | empty until set | Different unique password, not used by API |
| CORS_ORIGINS | http://localhost:3000 | Exact HTTPS website origins, comma-separated |
| NUXT_PUBLIC_API_BASE | http://localhost:4000/api | Browser-reachable HTTPS API URL |
| TEST_CHECKOUT | false | Keep false until actual release gate is implemented and tested |

## API `apps/api/.env`

| Variable | Required | Meaning |
| --- | --- | --- |
| DATABASE_URL | yes | mysql://USER:URL_ENCODED_PASSWORD@HOST:PORT/DATABASE |
| PORT | default4000 | API listening port |
| NODE_ENV | development | production on server, disables demo seed |
| CORS_ORIGINS | yes | Exact trusted website origins |
| TEST_CHECKOUT | false | Explicitly true only for disposable test orders |
| ALLOW_DEMO_SEED | seed only | true enables fictional development seed, never production |
| DEMO_PASSWORD | seed/tests only | Operator-supplied temporary password, min12 characters |
| ADMIN_EMAIL | bootstrap only | Owner-selected administrator email |
| ADMIN_NAME | bootstrap only | Owner-selected administrator name |
| ADMIN_PASSWORD | bootstrap only | Operator-supplied password, never commit or put in logs |
| TEST_API_URL | integration tests only | Defaults http://127.0.0.1:4000/api, disposable data only |

## Web `apps/web/.env`

`NUXT_PUBLIC_API_BASE=http://localhost:4000/api` is the only current web variable. It is public configuration, not a secret. The browser must be able to reach it.

## Mobile app

The React Native app is in the ecommerce-apps repository; see its .env.example and README.

## Services not configured

No live SMS credentials, transactional email, payment gateway, object-storage credentials, courier API or production signing key exists in this source. Local static-test OTP is described below. Cash-only is the selected payment model, so no online payment secret is needed. No APK is required under the current owner scope.

Test configuration alone does not make the source launch-ready. Server TLS, backups, mail/contact recovery, verified merchants, real inventory and operational acceptance are separate release checks.

## Phone identity and fast unlock

Owner chose blank Twilio credentials and static code for non-live testing. `OTP_MODE=static-test` accepts 123456 only, does not send SMS and is refused with NODE_ENV=production. Other values require SMS_SEND_ENABLED=true and private configured Twilio credentials. Never use real customer numbers in static-test mode.

Server-only Twilio values stay blank: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID. SMS_SEND_ENABLED=false. Switching modes invalidates pending challenges from the other mode.

WEBAUTHN_RP_ID=localhost and WEBAUTHN_ORIGIN=http://localhost:3000 must exactly match the web test origin. Production passkeys require the actual HTTPS origin/domain. A passkey is optional after initial login. The operating system chooses fingerprint, Face ID or device PIN as supported. Virtual-authenticator tests do not prove physical hardware.

Native source keeps a revocable 30-day device token in authentication-protected SecureStore only after opt-in, rotates it on unlock, and keeps its 12-hour access token in memory. Revoked/expired/invalidated storage requires phone verification again. These durations are implementation defaults for testing, not a confirmed commercial policy. Web tab sessions last up to 12 hours; passkey sign-in avoids another OTP.

MEDIA_DIR=media is a private server filesystem directory for uploaded, decoded/re-encoded WebP images. Mount persistent storage and back it up. Only administrators can upload. The API serves these images at /api/media. No object-storage credentials are required for this local implementation.

References: https://www.twilio.com/docs/verify/api/verification , https://www.twilio.com/docs/verify/api/verification-check , https://docs.expo.dev/versions/latest/sdk/securestore/ , https://docs.expo.dev/versions/latest/sdk/local-authentication/ , https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API .

## Shop profile, photos and private documents
- `MEDIA_DIR` (default `media`) holds public images, including shop photos, served at `/api/media/`.
- `PRIVATE_DOCS_DIR` (default `private-docs`) holds submitted shop documents. It is never served statically. Documents are readable only through `GET /api/shop-documents/:id` by the applicant or an admin. Keep this folder out of any public web root and out of backups that are shared.
- Shop photos are flagged `demo` when `NODE_ENV` is not `production`. The UI shows a "demo photo" label for them.
- Migration `20261125160000_shop_profile_photos_documents` adds shop profile fields, `ShopPhoto` and `ShopDocument`. It only adds columns and tables.

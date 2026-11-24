# Non-live source handover

This snapshot contains the requested Nuxt customer/merchant/admin, NestJS/Prisma/MySQL and separately packaged React Native customer source. Twilio values are blank; explicit non-production static-test code123456. No APK, server deployment or real financial transfer.

## Verified exact source trees

Separate npm ci installs, API/Nuxt production builds, standalone app TypeScript and Expo Web export. Connected exact split trees passed34 API integration checks,14 unit tests and Chrome browser flows against disposable MySQL8.4.6. Browser covers phone test login, virtual passkey register/login/revoke, multi-shop checkout/fee split/cancel review/settlement, delivered returns/refund evidence, shop applications, catalog editing, favorites/support, RN Web cart restore/join/cancel/return and offline recovery. Responsive home checks320/390/804/1280px. Virtual authenticator is not physical FaceID proof.

Synthetic test:50k catalog products queried in124-354ms locally;1k import preview492ms, commit5.1s, replay passed. These are local measurements, not production capacity or a50k-row single import.

## Boundaries before real launch

- Static OTP is deliberately insecure and refused in production. Configure actual Twilio privately and obtain permission before paid SMS tests.
- Native biometric/device-passcode/protected storage needs physical-device testing.12h access/30d device expiry are testing defaults. Recovery/phone change remains later work.
- Docker definitions have not been built/run because verification host lacks Docker. HTTPS/proxy, backups/restore, production security/distributed abuse/retention/capacity review remain operator gates.
- Web development bearer sessions use sessionStorage, not hardened HttpOnly production auth. Large view components remain a maintainability limitation.
- Real catalog fitment/image rights/inventory connectors need verified source data. No guessed fitment. CSV is approved existing catalog,1000-row absolute snapshots with bound preview/history, not a supplier connector.
- Returns are case-by-case admin review, no invented window or eligibility. Cash/refund/shipping evidence records never transfer money. Commercial tax/commission/returns/legal policies remain owner decisions.

Optional CI is docs/templates/verify-workflow.yml only, disabled until installed by owner. No remote workflow triggered. Never commit private env, uploaded media, database contents, tokens or signing files.

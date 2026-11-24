# Verification record

Date: 2026-11-24. Development milestone 0.1.

## Passed

- NestJS TypeScript compilation and Prisma client generation.
- Nuxt production build and typecheck.
- React Native TypeScript check.
- Expo JavaScript exports for Android/iOS/web (not native binaries).
- Android native project generation through Expo prebuild (not native compilation).
- 4 unit tests: salted passwords, token digest, duplicate cart line aggregation/limits, terminal order transitions.
- 18 API integration checks on both MariaDB 10.6.23 and Oracle MySQL 8.4.6 using Prisma MySQL provider:
  - Sign-in for customer/merchant/admin.
  - Anonymous/customer dashboard denial.
  - Registration role injection denial.
  - Incorrect password denial.
  - Approved public catalog.
  - Invalid quantity denial.
  - Altered/stale total rejection and rollback.
  - Idempotent checkout and single stock decrement.
  - Merchant cannot create customer order.
  - Cross-merchant order/stock writes denied.
  - Cross-merchant order reads isolated.
  - Status-step skipping denied.
  - Cancellation restores stock once.
  - CSV preview does not mutate inventory.
  - Invalid CSV cannot commit.
  - Catalog moderation restricted to admin.
  - Concurrent checkout of last unit cannot oversell.
  - Logout revokes session.
- Browser interaction tests: web customer saves address and places order; merchant sees and accepts it; admin view loads; phone-width web view; React Native Web customer sign-in/cart/address selection/test order.
- No uncaught page errors in that browser run.
- Actual screenshots inspected for hierarchy, RTL, card layout, merchant controls and mobile rendering.
- npm audit returned zero known vulnerabilities after locked dependency overrides (at check time only, not a guarantee of security).

## Not tested / not claimed

actual server deployment; reverse proxy/TLS; real payments/OTP/email/courier; 50,000-row import/load; device-native Android behavior; APK compilation, installation or signing; iOS native build; full security audit or penetration test.

## Reproduction

See setup instructions and tests in `apps/api/test`. `scripts/dashboard-test.mjs` (web dashboard) and the mobile repo `scripts/mobile-test.mjs` expect seeded disposable data and running API/web/mobile-web endpoints on 4000/3000/8081 and an externally supplied `DEMO_PASSWORD`. It uses local Chrome for inspection. It creates test orders and is not safe for production data.

Screenshots in the separate verification attachment contain only fictional seeded data and test orders. They are evidence of the implemented milestone, not substitutes for the remaining original design screens.

Technical references checked:

- https://docs.nestjs.com/data/prisma
- https://nuxt.com/docs/4.x/getting-started/installation
- https://www.prisma.io/docs/orm/overview/databases/mysql
- https://docs.expo.dev/build-reference/apk/

Follow-up: JDK 21 and Android SDK/NDK were installed locally. Gradle compiled native C++ and progressed to Expo Kotlin compilation, but no complete native build or APK was produced within bounded attempts. Caches are not included in source. No cloud build or deployment was performed.

Visual follow-up: commercial home banners, category illustrations, vehicle prompt, campaign tiles and shop cards implemented on web and React Native. Browser checkout flow rerun on Oracle MySQL 8.4.6 after changes. Home fidelity improved, not an assertion that all original screens are matched.

Polish verification: replaced fallback square vehicle/shop glyphs with raster icons; separated hero heading and stripe; wrapped category choices and constrained navigation. Home overflow tests passed at 320, 390 and 1280 pixels in web and React Native Web. Screenshots inspected at 320/390/1280 for web and 390 for React Native Web. These are home-only checks, not full-screen accessibility clearance.

## Home recovery checkpoint, 24 November 2026

The earlier implementation home was rejected as a mismatch with the approved concept. Home is now isolated in `ReferenceHome.vue`, matching the approved section order and layout. Text and controls are live HTML/CSS; images are illustrative assets, not inventory proof. Hero and promotional text is no longer baked into screenshots. This checkpoint awaits user review and is not design acceptance. Other screens and React Native have not received this replacement shell.

Revalidated against local Oracle MySQL 8.4.6: all 18 API checks; browser customer checkout, address save, merchant acceptance, admin view, unchanged RN Web checkout. Added connected home search-empty-state, category filter and cart navigation checks. Home overflow checks passed at 320, 390, 804 and 1280 px. Inspected actual 390 and 804 px screenshots. Nuxt typecheck and production build passed.

Remaining visual issues: cutout edge quality, exact light-streak background, font/icon differences, phone section heights. Artwork remains illustrative. Native APK, production deployment and real payment/OTP remain unverified/unconfigured as stated above.

## Continued implementation after home review

Home was reviewed and continuation requested. React Native now has a separate home component with live type and bundled illustrative artwork, a separate catalog screen, bottom navigation and revised product compatibility panel. This has only been tested as React Native Web, not on a device. Nuxt secondary pages share the blue/logo shell, orange actions and image-backed shop discovery. Merchant/admin work is split into overview, orders, inventory, import and review tabs instead of one long form page. These are still intermediate screens, not full visual parity or launch completion.

Repeated TypeScript checks, Nuxt production build, Expo web export, local MySQL 8.4.6 integration tests and connected browser journeys passed after propagation. Secondary phone overflow checks passed for catalog, detail, cart and merchant overview. Pixels inspected for phone home, catalog, cart, merchant and RN detail.

Native: an isolated single-worker Kotlin task with explicit compiler heap/metaspace limits still failed to finish in its bounded local window. No APK exists. Repeated unchanged retries are paused. A suitable uninterrupted build host remains needed.

## Product/cart/merchant pass after 0.4

Re-read the accepted product, checkout and merchant sheets before this pass. New shared mobile header centers the logo and keeps the cart reachable. Product detail now places a live price/action and shop strip directly after the art, with a vehicle-review panel rather than an unsupported fitment claim. Cart now shows the actual shop name, larger product art, orange line price, bounded plus/minus controls and full-width continuation action. Merchant orders include product images returned from the order's offer/product relation and expandable shipping/status details. The existing stock/status guards remain server-enforced.

RN home placeholder shop glyph replaced with a drawn storefront icon. RN navigation now has the accepted four bottom destinations, with cart moved to the header, still reachable and checked. RN detail/cart use live price/actions and expanded art. RN screenshots are Web rendering, not native-device evidence.

Latest verification: API production build and Prisma generation, Nuxt typecheck/build, RN typecheck/web export, Oracle MySQL8.4.6 all18 integration checks, connected browser customer checkout + merchant acceptance + admin review + RN Web checkout. Added explicit browser assertion for cart plus/minus and merchant expanded details. Visually checked phone product, cart, merchant expanded detail and RN cart/home. No horizontal overflow or uncaught page errors in the tested views. Remaining design parity is not claimed, especially multi-shop checkout, full merchant add-product/fitment workflow, admin charts and confirmation screen.


## Scope and latest backend checkpoint, 14:26

Owner removed APK, selected cash only and clarified independent shop delivery. Platform admin owns area-based shipping fees, once per entire basket. Added global DeliveryArea schema/migration, admin-only fee endpoint, public active area list and non-mutating grouped basket quote. Quote returns one shipping fee, group subtotals and explicit unsupported multi-shop commit/allocation flags. No live checkout has been enabled. Merchant fee management was corrected before migration testing after the owner's fee-ownership correction.

Password change API and web account form now verify the current password and revoke all sessions atomically. Password recovery is not implemented. Latest21 API integration checks passed, including password-change/session invalidation, admin-only shipping configuration, quote arithmetic and unavailable area rejection. Nuxt and API builds/typechecks and RN typecheck/web export passed. Existing connected checkout remains TEST_COD with legacy test-only fixed fee; clients still need integration with the global quote and grouped commit path before real ordering. Multi-shop fee collector/recipient remains an owner decision.


Owner further clarified at14:26 that platform/main store collects the single fee and distributes shipping dues to shops or companies. This supersedes the prior unresolved collector identity. Collection mechanics, allocation and cancellation treatment still need decisions. No real funds moved. Admin delivery form was browser-tested saving a fictional area and visually inspected at390px with no overflow.

## Allocation checkpoint after0.5

Added BigInt intermediate proportional allocation in `shipping.ts`, stable shop order and exact final remainder.10 unit tests pass, including owner70/30 example, fixed-fee cancellation66.67/33.33 example, all-cancel zero, post-delivery manual-review flag and3500 small-fee combinations. Grouped quote now returns allocated shares. Cancellation helper is preview-only, not wired to the transactional status/ledger path. Latest API build and existing21 integration/browser checks passed after helper changes.

Nuxt checkout now has an optional global delivery-area selector and quote button, quote invalidation on cart/address/area change, and quote-based expected total when selected. This newly added selector has not yet been exercised/visually inspected; existing browser suite still follows legacy test-only fixed fee. Do not claim quote-client flow is verified or live-ready. RN quote integration remains to be done.

## Grouped checkout, cancellation, shipping settlement and shop application checkpoint

- Parent Checkout with atomic per-shop Order creation, one fixed zone fee, proportional piastre allocations, area/address/price snapshot, fingerprinted idempotency and financial audit.
- Nuxt and RN Web now commit grouped quotes, invalidate quote on address/area/quantity changes and show each shop's collection amount. Both client paths browser-tested. Still TEST_COD/test-only, not live ordering.
- Before any delivery starts, cancel child reallocates fixed fee among active shops. All canceled zeroes shipping. If another shop already started, direct redistribution is blocked for admin review rather than silently altering collected amounts.
- Separate cancellation request record freezes order/settlement. Admin rejection leaves amounts unchanged; approval retains explicit reviewed shipping share, audits decision and does not automatically restock dispatched goods. All-canceled exception removes all shipping. Immutable delivery-start actor/time. Review request and rejection audited.
- Delivered shipping shares create receivable entries owed to platform. Admin-only remittance/offset records use unique receipt references, prevent duplicate/over-settlement and do not perform money transfers. Historical entries not overwritten. Refund payments, return verification and payouts to shipping providers remain separate incomplete work.
- Customer web shop-join form and admin approval/rejection. No merchant role/shop exists until approval. Approve creates one shop and grants role atomically; self/duplicate approval denied. Manual review, no automatic identity/business verification claim.
- Browser exercised customer cancellation request, admin rejection, settlement record and shop application/rejection. Phone viewports and element pixels inspected. Full-page screenshots had offscreen paint artifacts; decisive cancellation inspection used scrolled element/viewport captures instead.
- Latest26 API checks,14 unit tests, API build, Nuxt typecheck/build, RN check/web export and connected browser workflows passed. Mock Twilio tests only; no real SMS calls.
- Web cart persists non-secret validated product lines locally; no contact/phone/address stored there. Server still validates every price/stock/total. Recovery/session hardening remains unfinished.

## 2026-11-24 phone/passkey/returns/media checkpoint

30 API integration checks and14 unit tests pass against disposable MySQL8.4.6. Nuxt typecheck/build, API build, React Native TypeScript and Web export pass. Connected Chrome tests cover fixed-code phone login in Nuxt/RN Web, virtual WebAuthn registration/login/revocation, customer/merchant/admin checkout/cancel/settlement/onboarding, return request/admin receipt/restock/refund evidence, responsive layouts. Admin media test decodes a generated PNG to WebP and serves it, rejects invalid image bytes, and enforces admin role and year ranges.

Native biometric/passcode/protected-secret behavior is not hardware tested. Static OTP is local-test-only, not real phone ownership verification. No Twilio send, credential, paid charge, deployment, APK or source upload occurred. Container runtime, production acceptance, load/import scale and full new mobile branch coverage remain open.

## Inventory preview hardening after0.8

31 API checks pass. CSV preview now binds exact SHA-256 file hash, shop and actor, expires after30 minutes, snapshots existing offer stock/price/version, rejects stale state or mapping changes, commits atomically and returns replay without applying twice. Latest50 scoped import history records are available.1000-row cap remains;50k scale is unverified. Improved reject button contrast is pixel-verified.

## Independent repository clean-install review

The packaging script creates dashboard (Nuxt + API) and standalone app source trees without uploads, credentials, generated native projects or caches. Separate lockfiles were generated in review output, then npm ci --ignore-scripts succeeded independently. Dashboard API production build, Nuxt production build and14 unit tests pass. Standalone app TypeScript and Expo Web export pass. These review trees are not a final published snapshot and must be regenerated after source changes. Docker build/run remains unverified because this host has no Docker command/daemon.

32 API integration checks and full browser suite pass including new RN Web join request, cancellation review, delivered return request and cart reload persistence; web favorites and support ticket/admin reply. Native security acceptance remains unverified.

## Split runtime and fitment acceptance

Independent clean-installed dashboard and app review trees passed MySQL migrations,32 API checks and the full connected browser suite together, not just compilation. Subsequent source adds33rd API check for verified make/model/year/engine fitment filtering and out-of-range exclusion; full monorepo suite passes33 checks. These latest changes require final split regeneration. Local image paths resolve through API on both clients. Internal support, favorites and profile-name screens are implemented.

## Latest security/error-state check

34 API checks pass including OTP max-attempt exhaustion and forged/replayed passkey challenge rejection. Both clients clear stale access sessions on401 rather than keeping a false signed-in state. Backend serialization conflicts return retry409; unexpected errors no longer echo database diagnostics to logs. Twilio adapter check also respects disabled transport. Full browser suite remains passing.

Synthetic scale acceptance on disposable single-instance MySQL:50,000 fictional catalog products loaded in10.1s, four catalog/search/deep-page requests124/245/354/253ms,1000-row import preview492ms, atomic commit5.1s, replay passed. Synthetic rows cleaned afterward. This is neither a50k single import nor concurrent-user production capacity proof.

## Fresh split review02

Separate npm ci, API/Nuxt builds, standalone app TypeScript/Web export and34 MySQL API checks/full browser flows pass together. Browser test also verifies RN Web offline error then recovery without losing authenticated state. Source scan found no private keys, GitHub token patterns, live Twilio IDs or nonempty secret env assignments in deliverable source. Scan is heuristic, not a guarantee. Final source freeze/packaging and actual GitHub write remain open.

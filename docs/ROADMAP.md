# Non-live source acceptance and later release work

Owner clarification2026-11-24: source for non-live testing now. Twilio values blank; explicit static-test code123456, never real customers. No APK or deployment requested. Upload completed source only to the two selected public repositories. No paid sends/transfers.

## Implemented

- Nuxt customer/merchant/admin, NestJS/Prisma/MySQL, React Native customer.
- Accepted recovered blue/orange home with connected search/categories/shop/product/cart/checkout/address/vehicle/order routes.
- Multi-shop atomic parent/child checkout, one admin area fee proportionally allocated in integer piastres, fixed-fee cancellation redistribution and all-cancel zero.
- After-dispatch cancellation/admin review/freeze/audit, immutable delivery start, no blind restock. Platform shipping receivable with evidence-based remittance/offset.
- Manual shop applications, activation only after admin approval.
- Static-test phone auth/challenge limits, revocable rotating device tokens, native opt-in protected storage/local unlock source; WebAuthn registration/login/revocation verified with virtual authenticator.
- Delivered-item return quantities, admin receipt/refund/restock decision and separate cash evidence. No automatic eligibility/deadline/shipping refund.
- Admin catalog details/images/explicit verified fitments; edits remove approval. JPEG/PNG/WebP safely re-encoded to bounded WebP. Customer verified-fitment filters, no guessed compatibility.
- Private favorites, profile-name settings, internal support tickets/admin reply, persisted non-secret carts.
- Exact-file/shop/actor import preview binding,30-minute expiry, optimistic stock/price/version check, atomic snapshot commit/replay/history, max1000 rows per batch.
- Portable source split/setup, separate clean installs/builds and connected split runtime against MySQL. Manual-only CI starting point, not remotely executed.

## Current non-live handover checks

34 API checks,14 units, Nuxt/API builds, React Native checks/Web export and full Chrome browser suite pass. New mobile join/cancel/return/cart restore and offline recovery covered.50k synthetic catalog queries and1k import accepted locally, not production capacity. Independent split review passes34 API checks/full browser suite.

Still to close: final source freeze, final docs/manifest/secret scan, final source archive+independent lockfile packaging, final pixel/error review and authenticated GitHub write route. No completion/upload claim until those pass. Large view components remain a documented maintainability limitation, not a functionality claim.

## Later real-launch gates, not silently enabled

- Replace static OTP with privately configured Twilio and approve any paid SMS testing.
- Physical Android/iOS biometric/passcode/storage invalidation and HTTPS-domain passkey/recovery/phone-change acceptance.12h access/30d device lifetime are testing defaults.
- Docker build/run, server TLS/proxy, backup/restore, distributed abuse controls, production session/XSS security and capacity review.
- Real merchant inventory sample mapping, queued multi-batch50k onboarding and supplier connectors. Current50k test is catalog/query, not50k single import.
- Actual inventory/image rights, merchant records, taxes/commissions, returns eligibility/legal/retention/incident policy and cash-dispute procedure.
- No online gateway. No actual money transfers. Each shop delivers independently.

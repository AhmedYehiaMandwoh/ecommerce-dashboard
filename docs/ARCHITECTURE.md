# Architecture and key choices

The API is the authority for users, roles, catalog approval, shop ownership, stock, order totals and allowed status changes. Neither UI can choose its own role or submitted price.

## Data

- User -> Session, Address, Vehicle, owned Shops, customer Orders.
- Product: normalized uppercase brand and manufacturer part number, category, description, illustration path, approval.
- Fitment: explicit vehicle make/model/year range/engine and reviewed flag. No inferred demo compatibility.
- Offer: shop, shared product, merchant-local SKU, integer piastre price, integer stock, active flag.
- Order: one shop per order, immutable item titles/part numbers/prices, address snapshot, total and test payment designation.
- OrderEvent: each accepted status transition.

EGP amounts use integer piastres to avoid floating-point currency rounding. Checkout re-reads offer prices and stock; rejects a mismatched expected total; decrements stock conditionally; writes order, items and first event in a transaction. Customer/requestKey uniqueness makes retries return the existing order. Conflicting serializable transactions require client retry with the same key.

Cancellation before any sibling dispatch reallocates the fixed area fee to active shops, with zero shipping when all cancel. After dispatch, a reasoned admin review freezes affected settlement and makes audited changes. No dispatched stock is automatically restored. Delivered returns use explicit quantities, admin receipt/refund/restock decisions and one-time cash refund evidence. This is not a commercial eligibility policy or a money transfer.

## Authentication

Passwords use scrypt; opaque random session/device tokens are stored only as SHA-256 digests on the server. Access sessions last12 hours. Native opt-in device tokens last30 days and rotate on OS-protected unlock; physical hardware acceptance remains. Native access tokens stay in memory. Web tab access uses sessionStorage, so XSS hardening/HttpOnly redesign remains a release consideration.

Phone verification is explicitly static-test code123456 in owner-requested non-live testing. It sends nothing, cannot run in production, has persisted challenge cooldown/attempt/expiry/single-use controls and separates test/provider challenges. Twilio is staged but unconfigured. WebAuthn passkeys use a maintained library for server origin/RP/challenge/signature/user-verification checks and single-use stored challenges. Revocation invalidates passkey-issued sessions. Virtual-authenticator browser tests do not prove physical FaceID.

Public registration cannot set roles. Admin bootstrap is an offline command. Pending shops/products do not appear as public offers. Shop applications cannot activate themselves. Uploaded catalog images are admin-only, decoded with pixel limits, resized, re-encoded to WebP and stored outside source; changes remove product approval.

## Bulk inventory

Initial import endpoint maps `sku,brand,part_number,price_minor,stock` into shop offers, previews errors and supports 1,000 rows per batch. Unknown catalog identity is rejected, rather than inventing information. Existing SKU cannot be silently remapped to a different part in the normal offer route.

Preview is now bound to exact file hash/shop/actor for30 minutes; atomic commit checks prior stock/price/version and catalog approval. Committed preview replay does not reapply. Latest50 scoped history records are available. This is not yet the final import pipeline. It needs persistent import jobs, queues, row lineage, explicit snapshot-vs-delta semantics,  and supplier-specific mapping after a real sample is available. No API/export capability has been established for any actual merchant's inventory software.

## Current UI structure

The Nuxt and React Native views are each in a single large component for the connected milestone. Before adding the rest of the original screen set, split them into route-level screens, shared components, typed API clients and state modules. They currently refresh data on navigation/manual refresh, not via push notifications. The initial API service is likewise due for modular separation as coverage grows.

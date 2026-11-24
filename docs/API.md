# Current API inventory

Base `/api`. Protected routes use Authorization: Bearer. Body DTOs reject unknown properties. Money is integer piastres. This is a non-live test source; checkout requires TEST_CHECKOUT=true and always creates TEST_COD.

## Authentication

- POST /auth/register: name,email,password, always CUSTOMER. Development/admin fallback.
- POST /auth/login: email,password.
- POST /auth/phone/start: phone in E.164,deviceLabel. Static-test returns testMode=true, challengeId,expiresAt,resendAfterSeconds, sends nothing.
- POST /auth/phone/check: challengeId,code,name. Code 123456 only in explicit static-test. Returns access token,user, rotating deviceToken,deviceId,deviceExpiresAt. Never store deviceToken in unprotected client storage.
- POST /auth/device/refresh: deviceToken. One-use rotation, invalidates prior access sessions for that device.
- GET /auth/devices, DELETE /auth/devices/:id: owner-only metadata/revocation.
- POST /auth/passkeys/register/options and /register/verify: authenticated. Verify body challengeId,response. Requires user verification.
- POST /auth/passkeys/login/options and /login/verify: public. Verify body challengeId,response. Origin/RP/challenge/signature checked server-side.
- GET /auth/passkeys, DELETE /auth/passkeys/:id: owner metadata/revocation. Revocation invalidates sessions issued through that key.
- GET /me, POST /auth/logout; POST /auth/password currentPassword,newPassword. Password change revokes all access/device sessions.

Static-test is prohibited in production. Twilio path remains disabled/unconfigured. No recovery/phone-change endpoint is claimed.

## Catalog and account

- GET /health, /products, /products/:id, /shops, /categories, /delivery-areas.
- /products accepts search,category,page,shopId,make,model,year,engine. Verified fitments only.24 results per page.
- GET/POST /addresses, DELETE /addresses/:id. Owner-only.
- GET/POST /vehicles. Vehicle record is not proof of fitment.
- GET /shop-application, POST /shop-applications name,city,address,phone,details. New shops cannot sell before admin approval.

## Favorites, profile and support

- PATCH /me name only. Phone/email/role cannot be changed through it.
- GET /favorites returns approved saved products; POST /favorites/:productId idempotently saves; DELETE removes only caller favorite.
- GET /support-tickets own tickets, admin latest100 across users. POST subject,message creates internal ticket. No email/SMS is sent.
- PATCH /admin/support-tickets/:id reply,state OPEN/CLOSED. Admin-only, actor/time recorded. Do not include passwords or card data in tickets.

## Checkout and orders

- POST /orders/quote items[{offerId,quantity}],addressId,deliveryAreaId. Recomputes stock/current prices and one zone fee, allocates across shops.
- POST /checkouts: quote fields plus expectedTotal,requestKey, optional note. Serializable atomic grouped commit. Key replay with changed fingerprint rejected.
- POST /orders: legacy one-shop test endpoint, retained for compatibility tests. Clients use /checkouts.
- GET /orders: customer own, merchant own shops, admin all, latest100. Includes immutable item/address snapshots, events, cancellationReviews,returns,shippingEntries.
- PATCH /orders/:id/status status. PLACED -> ACCEPTED -> PREPARING -> SHIPPED -> DELIVERED. SHIPPED means OutForDelivery. Immutable start actor/time.
- Customer cancellation before any sibling dispatch reallocates fixed shipping across active shops. All canceled means zero shipping. Once any sibling dispatches, use admin review.
- POST /orders/:id/cancellation-requests reason. Freezes affected order/settlement.
- POST /admin/cancellation-requests/:id/decision approve,reason,shippingRetained when approved. Does not claim refund transfer. No automatic restock after dispatch.

## Returns and cash evidence

- POST /orders/:id/returns items[{orderItemId,quantity}],reason. Own delivered orders only. No invented deadline/automatic entitlement. Pending return freezes affected settlement.
- POST /admin/returns/:id/decision approve,goodsReceived,restock,refundAmount,reason. Goods receipt required for approval. Refund capped at returned items value. Rejected decisions change no stock/refund. One decision only.
- POST /admin/returns/:id/refund-evidence reference,note. Approved positive refund only, one evidence record. Does not transfer money.
- POST /admin/orders/:id/shipping-settlements amount,method(REMITTANCE/OFFSET),reference,note. Evidence-based platform receivable reduction, no over-settlement or transfer.

## Merchant and admin

- GET /dashboard scoped shops/orders. Admin also gets products with fitments,users,shopApplications,deliveryAreas.
- POST /shops name,city. Pending approval.
- POST /products brand,partNumber,title,category,description. Pending review.
- POST /shops/:id/offers productId,sku,price,stock.
- PATCH /offers/:id price,stock,active. Ownership enforced.
- POST /shops/:id/import csv,commit,previewId when committing. Existing approved catalog, max1000 rows. Preview returns hash/id with30-minute expiry, binds actor/shop/exact file and current inventory. Atomic absolute-stock snapshot commit rejects changed stock/price/mapping. Committed preview replay is idempotent. GET /shops/:id/imports returns latest50 scoped history records. Not yet a50k pipeline or source-specific connector.
- POST /admin/shop-applications/:id/decision approve,reason.
- POST /admin/delivery-areas city,area,fee,active.
- PATCH /admin/shops/:id or /admin/products/:id approved.
- PATCH /admin/users/:id/merchant.
- PATCH /admin/products/:id/details title,category,description. Identity not remapped; editing removes approval.
- POST /admin/products/:id/image multipart image. JPEG/PNG/WebP <=5MB; decode/re-encode, dimensions limited, metadata stripped. Removes product approval.
- GET /media/:filename serves generated WebP files. MEDIA_DIR must persist and be backed up.
- POST /admin/products/:id/fitments make,model,fromYear,toYear,engine,verified. Explicit admin review only.
- DELETE /admin/fitments/:id.

Baseline request throttling is100/minute/tracker, phone60-second cooldown and5 challenges/hour/phone,5 checks/challenge,10-minute OTP expiry,5-minute single-use passkey challenge. Production still needs distributed abuse controls, trusted proxy design, session-cookie/XSS hardening and physical-device acceptance.

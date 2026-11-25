# Continuity bundle: marketplace source delivery audit and repair (todo-01M86ZAPTNHB77E9R97JEQX1K0)
Written 2026-11-25 for the replacement worker. Status: partial repair, NOT a PDF match, NOT a template match. Never say "complete" or "PDF exact".

## 1. Source heads (GitHub, remote-verified)
- ecommerce-dashboard (AhmedYehiaMandwoh/ecommerce-dashboard) main: 60505669cfc27b67d5bf1fadb5a00264684eaf7c (more commits may follow, check `git ls-remote origin refs/heads/main`).
- ecommerce-apps (AhmedYehiaMandwoh/ecommerce-apps) main: 26c40bbdfb7859db311df5154f182b110dac7547 (RN: Arabic regression fix 1b31108, then English chevron direction 26c40bb; pushed 16:02).
- Authorization to push: Ahmed's original upload authorization, recoverable from his authenticated WhatsApp messages (see section 9). Token is a vault item named `ghiyar-github-upload-token`. Get it in the tools CLI: `tools vault write-file --key password --name ghiyar-github-upload-token --return-channel whatsapp --json | jq -r '.path // .'` (read its help first). It writes a file; use it only as `git -c http.extraheader="Authorization: Basic $(printf 'x-access-token:%s' "$(cat FILE)"|base64 -w0)" push origin HEAD:main`, then `rm -f FILE`. Never print or send the token. Commit identity: "Instinct assistant" / assistant@users.noreply.instinct.app. No force push, no history rewrite.
- /tmp/manifest.py (run before commit, writes the repo file manifest) is a local helper not in the repos; skip it if absent.

## 2. Scope and rules (from Ahmed via main)
Non-live source, cash only, static test OTP 123456, Twilio blank, admin-set per-area shipping fee per basket. No deployment, no hosting account, no new account, no spend. Screen 14: only the card row disabled, labelled "قريبًا". Screen 11 single-image. Passkeys stay (WebAuthn). Discount funding policy UNRESOLVED (disclose). Product-gallery expansion HELD. No test orders in the preview data. Do not reseed or reset DB `ghiyar` (preview), never run /tmp/preview.sh or /tmp/local.sh. Do not change the demo password. Use DB `ghiyar_t` for tests. Dashboards follow AdminCN-style reference (/downloads/image-12f83080.jpg) with RTL and our own functions; customer mobile follows /downloads/file-68c2273e.pdf (image-only, 24 screens). All web is responsive desktop-first shadcn. Whole project Arabic + English (RTL/LTR, full layout, persisted choice); user-entered content stays as authored. Ahmed writes Egyptian Arabic; main owns all communication with him. Proof must be native-size (390x727 from scrollTop 0) with route assertions, tied to the served commit.

## 3. What is done (do not rebuild)
Dashboard repo: shop application form, grouped real fields, shop photos (upload/preview/edit), private documents with access control, merchant and admin review, checkout with area-filtered per-area fee, web i18n (Arabic key + English JSON, 62 API error messages mapped to Arabic, LTR header, scripts/i18n-check.mjs 7/7), docs/HANDOFF-CURRENT.md.
Apps repo: 24-screen RN app, RN localization (src/i18n.ts, src/locale-en.json 310 strings, codemod applied, language switch in Account > App settings, persisted), scripts/en-check.mjs (7/7), scripts/en-flow.mjs, scripts/capture-matched.mjs (Arabic 18-screen flow, exit 0 on b521bb4), docs/LOCALIZATION.md.

## 4. Remaining acceptance gaps (honest ledger)
1. RN English: only home, shops, account, settings, search, cart, checkout captured. Unreviewed in LTR: product, order detail, support, track, vehicle, addresses, placed. Generic row-reversal rule may be wrong on some rows; fix component by component. Main review notes (3:24): shop cards must mirror structurally in English (icon/chevron sides) while authored Arabic text keeps its direction; search input icon must not crowd the placeholder; checkout "Review the cost" CTA must show one chevron only (fixed: one at the edge).
2. Native (iOS/Android) language switch is UNVERIFIED (only Expo web tested); native applies after reopening by design.
3. RN shows server API error text in English in both modes (no Arabic table in RN; the web has src app/i18n-api-ar.json to reuse).
4. Real uploaded gallery thumbnails in RN shop screens unproven (RN shop detail uses a bundled demo image; list covers show "Demo photo" labels).
5. Mobile screens 07 and 17 fidelity vs the PDF not started.
6. English assertions for web checkout/validation and lower dashboard pages (inventory, settlements, import) not done.
7. Checkout capture once stalled at a cold-start click; reruns passed 17-18 screens. Provisional diagnosis "cold-start click flake"; needs repeat runs.
8. Final regression set not run on the final heads (dashboard e2e, shop-flow, checkout-flow, i18n-check, responsive-check, site-check, vue-tsc, API unit tests, RN tsc, capture-matched, en-check, en-flow).

## 5. Runtime data NOT reproducible from the repos
(all local to the dead sandbox; nothing here is a secret or real personal data)
- MariaDB 11-style binary in /tmp/mdb (portable build) and data dir /tmp/mdata (214 MB, contains databases `ghiyar` preview demo data and `ghiyar_t` test fixtures). DB users/passwords are in /tmp/dbpw and /tmp/prev-api.env (NOT bundled, never print). If the sandbox is gone, rebuild instead: create an empty database, `cd apps/api && npx prisma migrate deploy`, then the seed (apps/api/prisma/seed.ts, `npx prisma db seed` as configured in package.json) for a REPRODUCIBLE seed. The preview DB had extra test shop data (shops with test photos); ghiyar_t is test-only fixtures (reset by `delete from OtpChallenge; update Offer set stock=40` before runs).
- test-media-webp.tar.gz: 332 KB of uploaded test shop/product photos (webp) used as MEDIA_DIR contents (/tmp/d/apps/api/media). Test-only. Filenames are UUIDs referenced by DB rows, so they are only useful together with the preview DB; a fresh seed does not need them.
- Private documents dirs /tmp/d2-private-docs (test) and /tmp/d2-private-docs-prev (preview): test-only, not bundled.
- Tools not in repos: /tmp/cloudflared (quick tunnels), Chrome at /usr/bin/google-chrome (set CHROME_PATH), /tmp/serve-J (built Nuxt .output copy), /tmp/d2 and /tmp/a clones.
- Env keys the API reads (values kept out): PORT, DATABASE_URL, NODE_ENV, TEST_CHECKOUT, OTP_MODE=static-test, SMS_SEND_ENABLED=false, CORS_ORIGINS, WEBAUTHN_ORIGIN, WEBAUTHN_RP_ID, MEDIA_DIR, PRIVATE_DOCS_DIR (see docs/ENVIRONMENT.md in the repo). Test credentials: resolve securely from your own authorized sources; never put them in chat or files.

## 6. Start and recover (safe)
- recover.sh (bundled) restarts DB, tunnels, APIs (4000 preview, 4100 test), web (3000, 3200 from /tmp/serve-J), Expo (8081 preview, 8082 test), writes /tmp/prev-urls. It does not reseed. Quick-tunnel hostnames change on every restart; after it runs, verify in a real browser (loaded UI plus API 200s from the new origins) before sending links.
- Fresh machine: clone both repos; `pnpm install` (no Docker); API: prisma migrate deploy, seed, build, run with env above; web: `NODE_OPTIONS=--max-old-space-size=1100 npx nuxt build` then run `.output/server/index.mjs` with PORT and NUXT_PUBLIC_API_BASE; RN: `EXPO_PUBLIC_API_URL=<api>/api EXPO_PUBLIC_ASSET_URL=<web origin> npx expo start --web --port 8081 --clear`. After editing RN source restart Expo with `--clear` (Metro serves stale bundles). Browser tests must run from the :3200/:8082 origins (CORS).
- Check commands: in dashboard `CHROME_PATH=/usr/bin/google-chrome DEMO_PASSWORD=<ask main> WEB_URL=http://127.0.0.1:3200 API_URL=http://127.0.0.1:4100/api node scripts/{dashboard-test,shop-flow,checkout-flow,i18n-check,responsive-check,site-check,customer-check}.mjs`; apps/web `npx vue-tsc --noEmit`; apps: `npx tsc --noEmit`, `APP_URL=http://127.0.0.1:8082 OUT=/tmp/shots ITEMS=1 CHROME_PATH=... node scripts/capture-matched.mjs` (about 100 s), en-check.mjs, en-flow.mjs.
- Web rebuild swap: build, copy .output to /tmp/serve-X, kill the process whose environ has PORT=<port>, start the copy. Never leave :3000/:8081 down without a replacement.

## 7. Uncommitted at bundle time
Nothing uncommitted in apps at 16:02 (26c40bb). Dashboard docs updated only by this file if pushed.

## 8. Links
Preview tunnel links (temporary, die on any restart) were last delivered at 15:06 by main.

## 9. Source message locators (Ahmed's authenticated WhatsApp, user +201099627470; read via observation SQL on phone_messages by message_id; do not rely on this summary)
- Upload request for the two repos, 24 Nov 14:36: wamid.HBgMMjAxMDk5NjI3NDcwFQIAEhgWM0VCMDZFNzc1RkEwOEU0MTZFNzc1RgA=
- "Finish source fully and push, repos are public", 24 Nov 14:39: wamid.HBgMMjAxMDk5NjI3NDcwFQIAEhgWM0VCMEEzOEEzRkY4RThGQkY4RDRFNAA=
- Token for upload agreed in principle, 24 Nov 4:12 PM: wamid.HBgMMjAxMDk5NjI3NDcwFQIAEhgWM0VCMDZFMjA0RUE3Q0Y3NzRCQ0UwMwA=. Note: the message at 4:13 PM (wamid ...M0VCMDNBNTMwQTI2MkUxM0IxMkY5RgA=) contained a pasted credential that was revoked; it must never be used or copied. The working token is the vault item `ghiyar-github-upload-token`.
- 24-screen PDF delivered 24 Nov 5:03 PM (agent doc, source file ghiyar-screen-set-68c2273e.pdf): wamid.HBgMMjAxMDk5NjI3NDcwFQIAEhgUM0FDQUI0RjZCMjQ3Qzc2RUQxNkUA; user wants a "طبق الاصل" copy of the PDF, voice note 24 Nov 7:31 PM: wamid.HBgMMjAxMDk5NjI3NDcwFQIAEhgUM0FFNTQxQzYwRDVFNDExOEZGOUEA (the audit rule is still "partial repair, not PDF match" unless proven).
- Dashboard reference image and web/dashboard direction, 25 Nov 1:08 PM: image wamid.HBgMMjAxMDk5NjI3NDcwFQIAEhgUM0EzQTc5MTdGRkVEQzc5MkQ1NUQA; voice notes ...M0FCMjFFOTJDRDRFQzI1NkMyRUMA, ...M0EwQUFBMDVFOEExNTdENkUxNEEA, ...M0FGNzg1RjJEM0E0QkU5MjFCMDAA (read the full wamid in the DB; ids here may be shortened by line wrap, search by ts).
- Shop forms/photos scope, 25 Nov 1:52 PM: ...M0EyOEEyMDk3OUJDM0JERTI5RTYA and ...M0E5Q0UxMDI3MDdBNjk3RjY1NTgA
- Localization (Arabic+English, RTL/LTR) scope, 25 Nov 1:53 PM: ...M0E3RkMwRDQzMTU0RUYxQkNDNDcA and ...M0FCRDYyQjZGNTE5RDlFOUU2MEEA
Locate with: SELECT message_id, ts, body FROM phone_messages WHERE conversation_id... author='user' AND ts BETWEEN the times above. Anything beyond these (stop/continue instructions, funding policy, hosting limits) came through main's relays: ask main for those message IDs.

## 10. Added 15:50
- RN direction model (see apps docs/LOCALIZATION.md): my first localization build set html dir=rtl which double-flipped every Arabic row (tabs, icons, chevrons on the wrong side). Fixed in 1b31108: layout root stays LTR (`#root{direction:ltr}`), html dir stays rtl/ltr per language, Arabic inputs/textareas direction rtl and text unicode-bidi plaintext, English mirrors rows via cx() (all flex-row swapped except h-10/12/14 headers). Verified on the public preview origin: html dir=rtl, root=ltr, 5 API calls 200. Native untested.
- Preview demo accounts: customer/merchant/admin@example.test, password chosen by Ahmed through a secure vault form and stored in vault item `ghiyar-preview-demo-password-3` (login; use `tools vault write-file --key password --name ghiyar-preview-demo-password-3 --return-channel whatsapp`, read it inside the command that needs it, delete the file). Applied to preview DB `ghiyar` only (3 rows) with the API's own hashPassword (apps/api/dist/security.js); test DB/scripts password unchanged. Verified: API login 201 for all three, UI login lands on /dashboard for merchant and admin. The password is under 12 characters (login accepts it; seed requires 12+). Do not re-seed: it would overwrite it. Authorization: Ahmed's WhatsApp 25 Nov 15:44 (wamid ...M0VCMEQwNUNDNTA3RjE5NzNDNjBDRgA= and ...M0VCMEJCQ0Y5QjI5QTJFREFCMkE1NgA=; the first contains a pasted secret: never retrieve or quote it).
- Admin/merchant UI login recipe: /login, button "دخول البريد للتطوير والإدارة", labels "البريد الإلكتروني" / "كلمة المرور", button "دخول".
- Customer app login: phone number + static code 123456.
- Scripts added in apps: scripts/en-screens.mjs (English account, support, addresses, vehicle, orders).

## 11. Final regression ledger (16:04 EET, test stack ghiyar_t, web :3200, API :4100, RN :8082)
PASS: scripts/i18n-check (exit 0), shop-flow, checkout-flow, responsive-check, site-check, customer-check, vue-tsc (0 errors), RN tsc clean, RN capture-matched Arabic 18 screens on 26c40bb source (no errors in log), en-check 7/7 (earlier on the same cx rule; not re-run after the chevron edit), en-screens captures.
NOT PASSING/unresolved: scripts/dashboard-test.mjs exits 1 twice at an admin screenshot (Page.captureScreenshot protocol error after the functional assertions, incl. "cancellation after shipping approved in UI; CANCELLED; direct cancel 403", had passed). Likely low memory in the sandbox (about 80 MB free); not proven. Re-run alone with other processes idle before claiming a pass.
NOT run: API unit tests, repeat checkout runs (the earlier capture stall is still "provisional flake"), web English assertions for checkout/validation.
Runtime export for replacement: see runtime-export/README-RUNTIME.md (sanitized demo-only DB export, test media).
No more writes from the prior worker after this handoff; the preview processes keep running until the sandbox restarts or the agent expires 16:28.

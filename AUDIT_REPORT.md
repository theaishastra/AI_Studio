# Full-Stack QA / Security / Performance / Architecture Audit
**Sai Kumar Studio — photography booking + gifts/corporate e-commerce platform**
Stack: FastAPI + SQLAlchemy + Postgres (Supabase) backend; static HTML/CSS/vanilla-JS frontend and admin panel; Razorpay payments; Cloudflare R2 media storage; single EC2 VM deployment.

Audit date: 2026-09-19. Method: full line-by-line review of backend routers/services/models/migrations, all 18 customer-facing HTML pages + their CSS/JS, the admin panel (HTML/JS/CSS + its backend API), and the database schema/migration/deployment architecture. Every finding below cites the actual file and line(s) read — nothing here is speculative.

---

## Executive summary

The app is **not production-ready in its current state**, but the gap is narrow and fixable in days, not weeks. The architecture and code are generally competent — role-based auth is consistently enforced (all 58 admin routes gated), IDOR scoping is correct everywhere it was checked, the DB schema uses sensible types (`Numeric` for money, UUID PKs, tz-aware timestamps), and there's real performance awareness in places (gzip, immutable media cache headers, deliberate composite indexes). The problems are concentrated in a small number of **insecure defaults** and a **recurring pattern**: a correct safety mechanism (escaping, refund authorization, stock restocking, price validation) exists and is used correctly in most places, but was missed in one or two spots — and those spots happen to be exploitable.

**The five issues that matter most, in order:**

1. **Checkout price is trusted from the client.** Anyone can submit `"price": 1` for any real product and pay that amount. Combined with #2, this is a direct revenue-loss exploit today.
2. **Mock payments are reachable if Razorpay keys are left unset**, which nothing forces or warns about — a customer can self-confirm any order as "paid" with zero money moved.
3. **OTP login returns the OTP in the API response by default** (`debug_otp: bool = True`) — full account takeover for any email address, no victim interaction needed.
4. **A stored-XSS pattern in the admin panel** (`onclick="fn('${esc(x)}')"`) lets an unauthenticated attacker plant a payload via the public OTP-request or media-URL APIs that executes in an admin's session the moment they view the Customers or Media pages — including staff → owner privilege escalation.
5. **Two reflected-XSS bugs on customer pages** (`booking.html?package=`, `booking-form.html?equipments=`) that steal the customer's auth token, which lives in plain `localStorage`.

None of these require architectural rework — they're each a small, targeted code fix. The deeper architectural issues (DB connection pool blocking horizontal scaling, in-process caching, boot-time migrations) don't threaten correctness today at current traffic, but they **will** block scaling past a single server without deliberate rework first.

---

## Findings — Critical

### C1. Checkout price is fully client-controlled
- **Module**: Backend / Orders / Payments
- **Files**: `backend/app/routers/orders.py` (`checkout()`, ~L97-191), `backend/app/services/pricing.py` (`price_cart()`, ~L39-62), `backend/app/schemas.py` (`CheckoutItemIn.price: float`, ~L406-416)
- **Repro**: `POST /api/orders/checkout` with a real `product_id` for a ₹74,999 package but `"price": 1` on that line. `checkout()` validates the product exists/is active/has stock but never compares the submitted price against `Product.price`. `price_cart()` uses `entry["price"]` verbatim.
- **Expected**: server re-derives price from `Product.price` for any line carrying a `product_id`; client-supplied price should only be trusted for the (documented) hardcoded storefront pages that have no backend `Product` row.
- **Actual**: price is trusted from the request body unconditionally.
- **Root cause**: no trust boundary between catalog-linked and free-text cart lines in `price_cart()`.
- **Fix**: in `checkout()`, when `product_id` is present, overwrite `entry.price` with `float(product.price)` (respecting `option_prices` overrides) before calling `price_cart()`.

### C2. Mock-payment endpoint reachable in production by silent default
- **Module**: Backend / Payments
- **Files**: `backend/app/config.py` (`razorpay_key_id` default `"rzp_test_placeholder"`, `razorpay_mock` property, ~L43,78-79), `backend/app/routers/payments.py` (`mock_pay()`, ~L100-114)
- **Repro**: deploy without setting real `RAZORPAY_KEY_ID`/`SECRET` (nothing enforces or warns) → `razorpay_mock` stays `True` → any customer can `POST /api/payments/mock-pay/{payment_id}` for their own order and flip it to "paid," decrementing stock, with no money moved.
- **Impact**: combined with C1, an attacker can checkout at ₹1 and self-confirm payment — a complete free-order exploit chain if Razorpay keys were ever left unconfigured.
- **Fix**: add an explicit environment flag; refuse to boot (or hard-disable `/mock-pay`) in production regardless of whether keys "look" like placeholders.

### C3. OTP code returned in the API response by default (`debug_otp: bool = True`)
- **Module**: Backend / Auth
- **Files**: `backend/app/config.py` (~L56), `backend/app/routers/auth.py` (`request_otp()`, ~L77-101, specifically L93-94: `if settings.debug_otp: response["debug_otp"] = code`)
- **Repro**: `POST /api/auth/otp/request` with any victim's email → response body contains the OTP directly. `POST /api/auth/otp/verify` with that code logs in as the victim. No email ownership is ever proven.
- **Severity rationale**: full account takeover for any address, zero interaction from the victim, and it's the *default* — anyone who forgets to flip this off in `.env` ships it live.
- **Fix**: default to `False`; ideally hard-tie to an explicit `environment != "production"` check, and log a loud startup warning if `True`.

### C4. Admin panel: stored XSS via `onclick="fn('${esc(x)}')"` pattern, including staff→owner escalation
- **Module**: Admin panel / Frontend-backend boundary
- **Files**: `admin/js/customers.js` (~L51-55: `unblockCustomerEmail`, `blockCustomerEmail`, `removeCustomer`, `removeOtpActivity`), `admin/js/media.js` (~L41: `copyMediaUrl`)
- **Root cause**: `esc()` (`admin/js/core.js` ~L88-90) HTML-entity-encodes for attribute/text context, but the browser HTML-*decodes* the attribute value before parsing it as JS for an inline `onclick` handler — so an escaped `&#39;` becomes a real `'` again and can break out of the intended string argument.
- **Attack chain (unauthenticated → admin session)**: `OtpRequest.email`/`OtpVerify.email` (`backend/app/schemas.py` ~L43-48) are plain `str` with **no `EmailStr`/format validation anywhere** — confirmed via grep. Anyone can `POST` `{"email": "x');alert(document.cookie);//"}` to the public, unauthenticated `/api/auth/otp/request`. That value lands as a "no signup" row on the admin **Customers** page — a page explicitly designed to prompt admins to click Block/Delete on exactly these suspicious rows. Clicking Block/Unblock/Delete/Remove executes the injected JS in the admin's authenticated session (`localStorage.admin_token`, no httpOnly cookie — trivially exfiltratable).
- **Attack chain (staff → owner escalation)**: `MediaIn.url: str` (`schemas.py` ~L174-178) also has no URL-format validation. A lower-privileged `staff` account can add a product photo "by URL" with a malicious string; it's rendered later via the same vulnerable `copyMediaUrl('${esc(m.url)}')` pattern in the Media Library — firing in the **owner's** browser the next time they browse it.
- **Fix**: never interpolate user-reachable strings into inline event-handler attributes. Use `data-*` attributes + delegated `addEventListener` (reads via `.dataset`, no re-parsing as JS source). Add `EmailStr` validation to `OtpRequest`/`OtpVerify`/`LoginIn`/`StaffIn` and URL-format validation to `MediaIn.url` as defense in depth.

### C5. Reflected XSS on `booking.html` via `?package=`
- **Module**: Frontend / Booking
- **Files**: `js/booking.js` (~L145 reads `params.get("package")` unescaped; ~L183 `innerHTML = \`...${p.pkg}...\`` with no escaping)
- **Repro**: `booking.html?category=wedding&package=<img src=x onerror=alert(document.cookie)>`
- **Impact**: customer JWT/refresh token live in plain `localStorage` (`js/shared/customer-api.js` ~L8-9,21-22) → full session hijack via a shareable link ("check out this package").
- **Note**: the very next line (`js/booking.js` ~L185,188) correctly uses `textContent` for the same value — this was a one-line miss, not a missing capability.
- **Fix**: use `textContent`, or the `esc()` helper already used correctly elsewhere in this same flow.

### C6. Reflected XSS on `booking-form.html` via `?equipments=`
- **Module**: Frontend / Booking
- **Files**: `js/booking-form.js` (~L29-34: builds `<span class="equip-tag">${n}</span>` from unescaped URL param via `innerHTML`)
- **Repro**: `booking-form.html?equipments=<img src=x onerror=alert(1)>&category=wedding`
- **Smoking gun**: `js/booking-confirmation.js` (~L13-14) — the *next page in the same flow* — defines and correctly uses an `esc()` helper on this exact same `equipments` value. The fix pattern already exists in the codebase; it just wasn't applied here.
- **Fix**: reuse the same `esc()` pattern before building the tag markup.

---

## Findings — High

### H1. Any staff account can fake a "refund" via the generic order-status dropdown, bypassing owner-only refund logic
- **Module**: Admin panel / Orders / Authorization
- **Files**: `admin/js/orders.js` (~L152-154, status `<select>` includes `"refunded"`), `backend/app/routers/admin.py` `update_order_status()` (~L603-619, gated only by `Depends(require_staff)`)
- **Repro**: log in as non-owner staff, open an order, select "Refunded" from the status dropdown. The PATCH succeeds, `order.status` becomes `"refunded"`, and a canned notification — **"Your refund has been initiated and will reflect in a few business days"** — is sent to the real customer, even though `Payment.status` is still `"captured"` and no Razorpay refund ever happened.
- **Contrast**: the dedicated `POST /api/payments/refund/{order_id}` is correctly `require_owner`-gated and actually calls Razorpay — but the plain status endpoint is a parallel, unguarded path to the same customer-visible state.
- **Fix**: reject direct transitions into `"cancelled"`/`"refunded"` from the generic status endpoint (require the dedicated flows), or require `require_owner` when the target status is one of those.

### H2. Manually cancelling via the status dropdown never restocks inventory
- **Module**: Admin panel / Backend / Inventory
- **Files**: `backend/app/routers/admin.py` `update_order_status()` (~L603-619) — sets status unconditionally, no `Product.stock` adjustment. Compare with `decide_cancellation_request`/`_decide_item_cancellation` (~L681-756) and `refund_order` (`payments.py` ~L135-141), which correctly restock.
- **Impact**: silent, permanent stock drift every time staff use the everyday status dropdown instead of the dedicated cancellation-approval flow — no error, cumulative over time.
- **Fix**: centralize stock adjustment in one helper (`_release_stock_for_order`) called from *every* code path that can set status to cancelled/refunded (webhook, verify, mock-pay, confirm_cod, admin status update, cancellation/refund flows).

### H3. Stock decrement is a read-modify-write race — overselling under concurrency
- **Module**: Backend / Database / Inventory
- **Files**: `backend/app/routers/payments.py` `_mark_paid()` (~L20-37), `backend/app/routers/orders.py` `confirm_cod()` (~L194-217), `backend/app/routers/admin.py` restocking paths
- **Scenario**: two near-simultaneous payment confirmations for the last unit of a limited-stock product (e.g. a webhook retry racing a `/verify` call, or two customers on a scarce item) both read the same pre-decrement `stock` value under Postgres READ COMMITTED with no `SELECT ... FOR UPDATE` and no atomic conditional update — both can succeed, overselling.
- **Compounding**: no stock *reservation* exists between checkout and payment either — `checkout()` only checks stock informationally, with no hold and no TTL on abandoned `payment_pending` orders.
- **Fix**: replace read-modify-write with an atomic conditional update — `UPDATE products SET stock = stock - :qty WHERE id = :id AND stock >= :qty RETURNING stock`, checking rowcount — at every stock-mutation site; add a reservation/expiry mechanism for `payment_pending` orders.

### H4. Customer checkout image uploads skip the validation pipeline admin uploads go through
- **Module**: Backend / File uploads
- **Files**: `backend/app/services/storage.py` `upload_data_uri()` (~L81-112), used by `orders.py` `_externalize_customization()` (~L30-63)
- **Gap**: admin uploads (`services/media.py`) run through a real Pillow decode + format allow-list + size/dimension caps + re-encode. Customer checkout uploads (photo/logo/artwork customization fields) only check the `data:` prefix and a **substring match** on the header (`"png" in header`, etc.) for content-type — no real format validation — before writing up to 20MB per field to the public R2 bucket.
- **Fix**: route customer upload bytes through the same `process_image()` pipeline before persisting.

### H5. Entire storefront depends on a single hardcoded Cloudflare quick-tunnel URL
- **Module**: Frontend / Operations
- **Files**: `js/shared/api-config.js` (~L6-11) — the file's own comment admits: *"this is a free 'quick tunnel' — the URL changes if the cloudflared service on the VM restarts, so it may need updating."*
- **Impact**: every fetch sitewide (search, cart sync, checkout, bookings, auth) depends on this one constant with zero fallback, health-check, or distinguishable "backend unreachable" messaging. A routine service restart silently breaks the entire site until someone manually edits and redeploys this file.
- **Fix**: move off the quick-tunnel to a stable hostname/domain for the API; at minimum, add a distinguishable network-error UI state.

### H6. Default admin/owner credentials + unauthenticated admin static mount + no login throttling
- **Module**: Backend / Admin panel / Auth
- **Files**: `backend/app/config.py` (~L38-39: `admin_password: str = "ChangeMe@2026"`, `secret_key: str = "dev-secret-change-me"`), `backend/app/seed.py` `seed_admin_user()` (~L649-660, only skips seeding if the email already exists — never warns the password is still default), `backend/app/main.py` (~L90-91: `app.mount("/admin", StaticFiles(...))` — **no auth dependency at all** in front of the admin UI's HTML/JS/CSS), `backend/app/routers/auth.py` `/api/auth/login` (~L31-42, no rate limit/lockout/CAPTCHA).
- **Compounding**: the admin JS (`admin/js/api.js`) lists every admin endpoint verbatim, so an unauthenticated visitor to `/admin/*` gets a full map of the API surface for free — the only remaining barrier to full owner compromise is the password itself, which is committed in this very repo as the default.
- **Fix**: fail startup if `admin_password`/`secret_key` are unchanged and no explicit dev flag is set; add per-IP/per-account login throttling; consider requiring a valid session to serve anything under `/admin/*` beyond the login shell.

### H7. Systemic missing HTML-escaping of catalog-derived text (product titles, search results)
- **Module**: Frontend / XSS defense-in-depth
- **Files**: `js/catalog.js` (~L670-693: raw `product.title`/`product.desc` in both an HTML attribute and `innerHTML`), `js/shared/search.js` (~L143-146,206-211: `highlight()` wraps raw `item.name` and interpolates raw `item.category`, while the *same file* escapes the query text a few lines away)
- **Why it matters**: these strings originate from admin-entered catalog data. `search.js` loads on 14+ pages, making it a sitewide surface. If a title ever contains `<` (accidental or via a compromised admin session — see C4), this becomes stored XSS served to every visitor.
- **Contrast**: `cart.js`, `my-account.js`, `wishlist-menu.js`, `booking-confirmation.js` all correctly escape equivalent fields — the pattern exists, just wasn't applied uniformly.
- **Fix**: apply the existing escape helpers (or consolidate into one shared one) everywhere a title/name/desc/category is templated into `innerHTML`.

### H8. Auth tokens in plain `localStorage`, no CSP
- **Module**: Frontend / Security posture
- **Files**: `js/shared/customer-api.js` (~L8-9,20-24)
- **Impact**: this is what turns C5/C6/H7 from "an XSS bug" into "full account takeover" — there's no defense-in-depth layer (no CSP header anywhere, no httpOnly cookie option) between a missed escaping spot and token theft.
- **Fix**: move tokens to httpOnly cookies (needs backend cooperation) or, at minimum, add a CSP header to blunt any single missed escaping spot.

### H9. Migrations run imperatively on every app boot — no version history, no rollback
- **Module**: Database / Architecture
- **Files**: `backend/app/main.py` (`lifespan`, ~L32-40), `backend/app/migrations.py` (entire file — hand-rolled idempotent ALTERs + 4 data backfills, run inside one `engine.begin()` transaction)
- **Risk**: (a) every redeploy re-runs all of this synchronously before the app accepts traffic, extending downtime as the DB grows; (b) if ever scaled to 2+ instances, concurrent `ALTER TABLE`/`CREATE INDEX IF NOT EXISTS` from multiple processes starting simultaneously can block/deadlock on table-level locks; (c) no migration-history table — schema version is only knowable by reading the code; (d) no rollback capability (an irreversible `DROP COLUMN IF EXISTS` already exists at `migrations.py` ~L22).
- **Fix**: move to Alembic with a proper version table, run migrations as a separate deploy step before app processes start, use `CREATE INDEX CONCURRENTLY` for future indexes on live tables (structurally impossible today since the current wrapper runs inside a transaction).

### H10. DB connection pool is a pre-fork singleton — blocks the standard scaling lever
- **Module**: Database / Architecture / Scalability
- **Files**: `backend/app/database.py` (~L6-9: `create_engine(...)` at module import time, before any process fork), `AWS_VM_Deployment_Runbook.pdf` (explicitly warns against `--workers 2+` due to this exact fork-safety issue)
- **Impact**: the normal first scaling step — more Uvicorn/Gunicorn workers on the same box — is **architecturally forbidden today**, not just under-tuned. `pool_size=5, max_overflow=10` (15 connections) is the ceiling for the entire deployment until this is refactored.
- **Fix**: create the engine lazily inside a startup hook (per-worker), or front Postgres with PgBouncer so `--workers N` becomes safe.

### H11. Single points of failure: one VM, one process, one DB instance, hard-stop deploys
- **Module**: Architecture / Reliability
- **Files**: `backend/app/config.py` (single `database_url`, no replica/failover), `AWS_VM_Deployment_Runbook.pdf` (single `t3.small` EC2, single systemd unit, redeploy = `systemctl restart` with a documented 30-40s cold-start outage window)
- **Impact**: any VM failure or routine deploy takes down the entire storefront + admin panel with no failover and a real, user-visible outage window on every code change.
- **Fix (once H10 is resolved)**: load balancer + 2+ instances for rolling deploys; automated Postgres backups/PITR and consider a read replica for admin-heavy reporting queries.

---

## Findings — Medium

| # | Issue | Module | File(s) | Fix |
|---|---|---|---|---|
| M1 | No rate limiting anywhere (OTP request/verify, login, contact form) | Backend | `routers/auth.py`, `routers/contact.py` | Add per-IP/per-email rate limiting (slowapi or similar); enforce a minimum cooldown between OTP requests |
| M2 | SSRF prefix-bypass in admin media proxy — `url.startswith(r2_public_base_url)` passes for `https://<real-host>.attacker.com/...` | Backend | `routers/admin.py` `download_media()` ~L1082-1108 | Compare parsed `netloc`, not a raw string prefix |
| M3 | Unescaped user input interpolated into HTML admin-notification emails | Backend | `routers/contact.py` ~L17-41 | `html.escape()` all interpolated fields |
| M4 | No `CHECK`/`ge=0` constraints on price/stock/coupon-value fields — negative values accepted end-to-end | Backend + DB + Admin | `models.py`, `schemas.py` (`ProductIn`, `CouponIn`) | Add `CheckConstraint` + `Field(ge=0)` (and `le=100` for percent coupons) |
| M5 | Status columns are free-text with no enum/CHECK; the code's own status list is already stale (`cod_confirmed` used but undeclared) | Database | `models.py` ~L280-292 | Postgres ENUM or `CHECK (status IN (...))`, kept in sync |
| M6 | Email/coupon-code uniqueness relies on app-level `.lower()` discipline, not a DB constraint | Database | `models.py` (`User.email`, `Coupon.code`) | `citext` type or functional unique index on `lower(email)` |
| M7 | In-process caches (catalog/homepage/media library) only stay coherent because there's exactly one process | Database / Architecture | `routers/catalog.py`, `routers/admin.py` | Move to Redis before adding a second worker/instance |
| M8 | Health check never touches the DB — useless for load-balancer routing decisions | Database / Reliability | `main.py` `/api/health` ~L109-111 | Add a `SELECT 1` with short timeout, return 503 on failure |
| M9 | Admin customer list loads entire `users`/`otp_codes`/`orders` tables into Python before paginating | Database / Admin | `routers/admin.py` `list_customers()` ~L904-967 | Push filter/sort/paginate into SQL as data volume grows |
| M10 | Likely-missing composite indexes given actual query shapes (`users.role`, `otp_codes(email,used,created_at)`, `payments(order_id,status)`) | Database | `models.py` | Add composite indexes matching hot query patterns |
| M11 | Future index/schema migrations can't use `CONCURRENTLY` (structurally blocked by running inside a transaction) — will lock tables under real traffic | Database | `migrations.py` | Run future index additions as standalone scripts outside the app's lifespan/transaction |
| M12 | Inconsistent phone validation — `booking-form.js` accepts any 10+ digit string ("0000000000") while checkout/account forms enforce a real pattern | Frontend | `js/booking-form.js` ~L152 vs `js/cart.js`, `js/my-account.js` | One shared validator module |
| M13 | Backend error messages rendered via `innerHTML` (unescaped) in one file, inconsistent with the rest of the same file | Frontend | `js/my-account.js` ~L208,352,381 | Use `textContent` or the existing `escapeAcctHTML` |
| M14 | Cart item name unescaped in 3 renderers despite escape helpers existing in the same file | Frontend | `js/cart.js` ~L83,395,527 | Apply `escapeHtml(item.name)` consistently |
| M15 | Full-catalog fetch (`/api/products?page_size=1000`) fires unconditionally on every page load just for search autosuggest, often duplicating another fetch on the same page | Frontend | `js/shared/search.js` ~L90-112 | Lazy-load on first search interaction, or cache with a short TTL |
| M16 | `.owner-only` CSS class only hides sidebar nav links; owner-only buttons elsewhere (Refund, Block, Clear Audit Log) remain visible to staff (though still 403'd server-side) | Admin | `admin/css/admin.css` ~L138-139 vs usage in `orders.js`, `customers.js`, `app.js` | Make the CSS rule global, not `.sidebar`-scoped |
| M17 | No client-side route guard for owner-only admin pages — direct hash navigation leaves staff on a permanently stuck loading spinner | Admin | `admin/js/core.js` `route()`, `staff.js`, `app.js` | Wrap in try/catch with an "Access denied" state, or gate by `CURRENT_USER.role` |
| M18 | Product `stock` is never surfaced to the customer-facing catalog/cart APIs — out-of-stock is only discovered at final checkout | Backend / Admin | `routers/catalog.py`, `routers/cart.py` | Include `stock`/`in_stock` in product responses; check at add-to-cart time too |
| M19 | Deleting a single photo in the Photos modal has no confirmation, unlike every other destructive admin action | Admin | `admin/js/catalog.js` `removeMedia()` ~L932-939 | Add `confirm()` for consistency |
| M20 | FastAPI 422 validation errors render as `[object Object]`/unreadable text in the admin UI | Admin | `admin/js/api.js` ~L42-49 | Detect array `detail`, join field messages into readable text |
| M21 | CORS default allows the `null` origin together with `allow_credentials=True` | Backend / Admin | `config.py` ~L24, `main.py` ~L65-71 | Remove `"null"` from the default origin list |

---

## Findings — Low / Code quality

- **`gallery.html` is fully dead code** — a 2-line synchronous redirect (`js/gallery.js`) fires before ~1,260 lines of markup/CSS/JS in the same page ever render, and nothing else links to it. Low real-world impact (nobody reaches the dead content), but a landmine for a future edit. *Delete it, or reduce it to just the redirect.*
- **~53,000 lines of CSS with heavy duplication** — `gifts.css` and `corporate.css` alone are >27,000 lines combined; 60+ identical class names (`.mega-dropdown`, `.cart-drawer`, `.mobile-bottom-nav`, etc.) are copy-pasted across `gifts.css`/`corporate.css`/`studio.css`/`photography.css`/`index.css`/`cart.css` instead of factored into `css/shared/` (currently only 440 lines). This is why single-purpose nav/dropdown fixes (see recent commit history) have to be reasoned about per-page instead of fixed once.
- **The `X.js`/`X-2.js`/`X-3.js` split-file pattern** (`index.js`/`index-2.js`, `gifts.js`/`gifts-2.js`, `corporate.js`/`corporate-3.js`, etc.) is intentional (both files are always loaded together, not orphaned), but each pair duplicates its own copy of cart-drawer rendering, `cldOpt()`, and empty-state markup rather than sharing one implementation — verified byte-identical in several cases.
- **No shared client-side validation module** — the same email regex is copy-pasted in 4 files (consistently, so far); phone validation has already drifted (see M12), showing the copy-paste approach doesn't hold up over time.
- **`loading="lazy"` present on only 5 of 18 pages**, and 0 of those on the most image-heavy pages (`booking*.html`, `equipment-details.html` — 36-37 `<img>` tags each). Meaningful LCP/page-weight cost.
- **Inconsistent responsive breakpoint coverage** — e.g. `booking-confirmation.css` has a single breakpoint (620px) versus `catalog.css`'s three-tier coverage; worth a manual check at 700-900px.
- Assorted backend maintainability notes: bare `except Exception` swallowing without logging in `security.py`/`admin.py` `download_media()`; `OrderStatusUpdate` allows arbitrary forward/backward status transitions with no state-machine validation; float/Decimal mixing when converting totals to paise for Razorpay (unlikely to misfire at these magnitudes, but inconsistent with the Decimal discipline used elsewhere); `expire_on_commit=False` combined with server-generated timestamp columns is a footgun that today is safe only because every write endpoint remembers to call `db.refresh()`.
- No safeguard against deactivating the last owner account (`admin.py` `deactivate_staff`) — a mistake here has no automatic recovery path since `seed_admin_user` only re-seeds when no row exists at all for that email.

---

## What's already solid (verified, not assumed)

- **Authorization coverage**: all 58 admin API routes carry `Depends(require_staff)` or `Depends(require_owner)`, correctly matched to action sensitivity (owner-only: delete product/category, staff management, audit log, refunds, customer deletion).
- **IDOR protection**: every customer-facing query (addresses, cart, wishlist, bookings, orders, payments) is consistently scoped by `user_id == current_user.id`. No cross-user enumeration found anywhere checked.
- **JWT/refresh-token design**: signature/expiry validated via `python-jose`; access vs. refresh token type is checked; refresh tokens are stored hashed and single-use.
- **SQL injection / path traversal**: no raw string-formatted SQL anywhere; media upload filenames are UUID-based, not user-controlled; upload slugs are sanitized via regex before use in storage keys.
- **Admin media pipeline**: real Pillow decode, format allow-list, size/dimension caps, full re-encode — eliminates most upload-based attack classes (this makes H4's gap on the *customer* upload path more notable by contrast).
- **Catalog cache invalidation**: correctly called by every admin write that affects storefront-visible data.
- **Schema fundamentals**: UUID primary keys, `Numeric(10,2)` for all money (not float), timezone-aware timestamps throughout, thoughtful FK cascade choices with explanatory comments, and query-pattern-aware indexes already exist in places (e.g. composite `orders(status, created_at DESC)`).
- No hardcoded secrets/API keys found in any customer-facing or admin JS; viewport meta tags present on all 18 pages.

---

## Final assessment (by category)

1. **Functional correctness** — Undermined by the checkout price-trust bug (C1) and the refund/cancellation authorization gaps (H1/H2); everything else that was traced end-to-end (auth, cart, IDOR scoping) behaves correctly.
2. **Frontend quality** — Functional and mostly consistent, but two exploitable reflected-XSS bugs and inconsistent escaping discipline (a correct pattern exists but is applied unevenly) are real defects, not style nits.
3. **Backend quality** — Structurally sound (clean router/service separation, consistent auth scoping, sensible Decimal-based pricing), let down by a handful of insecure defaults rather than design flaws.
4. **Admin panel** — Strong at the API layer (100% auth-dependency coverage) but has the single worst finding in this audit (C4: unauthenticated attacker → admin session compromise → privilege escalation) plus a real financial-integrity gap (H1).
5. **API quality** — Reasonable REST shapes and schemas, but missing basic input constraints (`EmailStr`, `ge=0`, URL format) and poor validation-error surfacing to the admin UI.
6. **Database** — Good fundamentals (types, timestamps, cascades, some indexing awareness); missing guardrails (CHECK constraints, enum-backed status) mean correctness depends on every code path remembering to validate, which it currently doesn't (C1, H1, H2).
7. **Architecture** — Appropriately simple for current scale, but has one specific, well-identified ceiling (pre-fork DB pool) that blocks the standard next scaling step, plus caching/migration patterns that are safe *only* in a single-process deployment.
8. **Performance** — Backend shows real awareness (gzip, immutable media caching, deliberate indexes); frontend has meaningful room (53K lines of duplicated CSS, inconsistent lazy-loading, redundant full-catalog fetches on every page).
9. **Security** — The weakest category overall and where remediation should start: payment/price trust bypass, OTP-in-response by default, admin stored XSS with privilege escalation, unauthenticated admin static mount with default credentials, and zero rate limiting anywhere.
10. **Scalability** — Blocked from the first standard scaling lever (multi-worker) by a specific, fixable issue (H10); in-process caching and boot-time migrations would silently misbehave the moment that's fixed and a second instance is added, unless addressed first.
11. **Reliability** — Single VM/process/DB with no failover and a real outage window on every deploy; shallow health check would let a load balancer keep routing to a dead instance.
12. **Responsive design** — Viewport handling is correct everywhere; breakpoint coverage varies page to page and should get a manual pass on the pages with only one breakpoint.
13. **UX** — Generally coherent per page, undercut by inconsistent validation rules across forms, silent failure states (stuck admin spinners, unreadable 422 errors), and one missing delete-confirmation.
14. **Code quality** — The clearest cross-cutting theme in this whole audit: correct patterns exist (escape helpers, validation regexes, stock-restore logic, rate-limit-worthy endpoints identified) but are duplicated rather than centralized, so the same bug class recurs in the one place a copy was missed.
15. **Production readiness** — Not ready as-is, but close: the Critical findings above are each a small, targeted fix rather than a redesign. Fix C1–C6 before handling any real payments or customer data at scale; the High findings should follow shortly after; the architectural items (H9–H11) matter once you plan to scale beyond a single server.

---

## Suggested fix order

**Do first (each is small; do all before any real launch or as an emergency patch if already live):**
C1 (server-side re-pricing) · C2 (gate mock-pay) · C3 (`debug_otp=False`) · C4 (admin `onclick`/XSS pattern) · C5/C6 (booking XSS) · H1/H2 (lock refund/cancel transitions to owner + centralize stock restore) · H6 (fail-fast on default credentials, add login throttling)

**Do next:**
H3 (atomic stock decrement) · H4 (validate customer uploads) · H5 (stop depending on the quick-tunnel URL) · H7/H8 (consistent escaping + CSP) · M1 (rate limiting) · M2 (fix SSRF prefix check) · M4/M5/M6 (DB constraints)

**Before scaling beyond one server:**
H9 (Alembic) · H10 (fork-safe connection pool / PgBouncer) · H11 (load balancer + 2nd instance) · M7 (Redis for shared caching) · M8 (real health check)

**Ongoing quality/perf polish:**
Consolidate shared CSS/JS, add a shared validation module, apply `loading="lazy"` consistently, fix the admin UX papercuts (M16/M17/M19/M20), remove `gallery.html` dead code.

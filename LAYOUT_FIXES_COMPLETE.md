# Gift Product Page — Root Cause Fixes (Verified)

This replaces the earlier version of this document, which guessed at CSS class
names without checking the actual rendered DOM. That guess-based CSS file
(`css/gifts-layout-fixes.css`) has been **removed** — it targeted classes that
don't exist in the real markup and was actively fighting the correct existing
design. The fixes below were found by rendering the real page in a headless
browser, reading computed styles, and tracing a JS stack trace — not by
guessing.

## Root Cause #1: Leaked maroon background (the big one)

**File**: `css/gifts.css`, around line 12925

A block of CSS titled "EXACT CORPORATE / GIFTS CATALOG THEME" was written to
theme the **category/catalog browsing page only** (maroon background, white
sidebar). But its selectors used the blanket `body.gifts-module-route` class,
which is present on **every** gifts view (product, checkout, customise), not
just the catalog view:

```css
/* BEFORE — matched every gifts-module page */
html body.gifts-module-route,
html body.gifts-module-route main.container,   /* matches <main class="details-page container"> too! */
...
  background: #5C0930 !important;

html body.gifts-module-route .breadcrumb {       /* breadcrumb exists on product page too */
  color: rgba(255, 255, 255, 0.85) !important;   /* white text -> invisible once bg is fixed */
}
```

Since the product-detail page's `<main>` has `class="details-page container"`,
the `main.container` selector matched it and painted the whole product page
maroon, and the breadcrumb rule turned its text white — both intended only for
the catalog page.

**Fix**: scoped these 4 selectors to `body.gifts-view-category` instead of
`body.gifts-module-route` — `gifts-view-category` is a class the page's own JS
(`js/gifts.js`, `mountRoute()`) only adds when `view === 'category'`, so the
theme now applies exactly where it was designed for and nowhere else.

**Verified**: category page still renders with its maroon/white theme
unchanged; product/checkout/customise pages are now white with readable text.

## Root Cause #2: A JS crash was silently skipping half the page

**File**: `js/gifts.js`, `renderProduct()` and related functions (product view)

Three places called `document.getElementById(id)` and used the result
immediately (`.textContent = ...`, `.style...`, `.value = ...`) for elements
that don't exist in the actual product-page HTML template:

1. `purchasePrice` — no such id in the template (stale reference)
2. `previewObject` — only exists when the 3D/live-preview customizer markup
   is present, which isn't every product's fragment
3. `photoZoom` / `photoX` / `photoY` / `photoFit` / `customPhotoPreview` —
   same — customizer-only elements

A `TypeError` on any of these **stopped all subsequent code in that script
block**, which silently skipped:
- Setting the product description text (blank)
- Setting the old price / discount badge (stayed at template defaults)
- `renderGallery()` / `renderRelated()` in one case — "You May Also Like" was empty
- Registering `window.openCart`, `shareGiftProduct`, `filterCategory`, etc. —
  the wishlist/share buttons and cart drawer would throw "not defined" on click
- Populating the product-id map used to attach a real database id to cart items

**Fix**: added `null` guards (`if (el) ...` / `const el = ...; if (el) ...`)
before touching each of these elements, so missing customizer markup no
longer crashes the rest of page setup.

**Verified** (via headless Chrome): zero console errors, description text
renders, old price/discount render correctly (₹999 / 30% OFF), "You May Also
Like" renders 4 related product cards with images/prices, and
`window.openCart` / `window.shareGiftProduct` / `window.filterCategory` are
now defined.

## What was NOT changed

- `css/gifts.css`'s existing `.details-main` / `.details-gallery` /
  `.gallery-thumbs` / `.gallery-main` layout (grid: 72px thumbnail column on
  the left, main image filling the rest, 3-column row for gallery / copy /
  buy-card) was already correct — it only looked broken because of the two
  bugs above. No layout CSS needed to be added.

## How this was diagnosed

Grep alone couldn't find the maroon rule quickly (13,500-line CSS file, many
overlapping `!important` rules) and couldn't explain the missing description
text at all. The reliable method was:

1. Launch headless Chrome (`puppeteer-core` pointed at the existing local
   Chrome install — no download) against a local `python -m http.server`.
2. Walk the DOM from `#productName` up to `<body>`, reading
   `getComputedStyle(...).backgroundColor` at each level, to find exactly
   which element introduced the maroon color and its computed value
   (`rgb(92, 9, 48)` = `#5C0930`).
3. Grep the CSS for that literal hex value to find the owning rule.
4. Listen for `page.on('pageerror', ...)` to catch the swallowed
   `TypeError`s and their stack traces, which pointed at the exact
   function/line for each null-element crash.

## Testing

```powershell
# from the project root
python -m http.server 5500
```

Then visit, e.g.:
```
http://127.0.0.1:5500/gifts.html?view=product&product=Premium%20Wooden%20Photo%20Frame
http://127.0.0.1:5500/gifts.html?view=category&category=frames
```

Expect: white product page with left-hand thumbnail rail, working price/
description/related-products, no console errors; maroon category page
unchanged.

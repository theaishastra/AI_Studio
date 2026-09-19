// Shared cart-UI rendering helpers. js/shared/cart-core.js already centralizes
// the underlying 'sai_studio_cart' localStorage read/write layer; this file
// centralizes the *rendering* layer that used to be copy-pasted, byte-for-byte
// identical, in cart.js, catalog.js, contact-us-2.js, corporate.js, index-2.js,
// photography.js, booking.js, equipment-details.js, gifts.js and studio.js.
//
// Only the genuinely identical pieces live here:
//   - cldOpt(): the Cloudinary/thumbnail URL helper (identical everywhere).
//   - cartDrawerEmptyStateHTML(): the "Your cart is empty" drawer markup
//     (identical in index-2.js, contact-us-2.js and corporate.js).
//
// The per-item cart-drawer row markup was NOT merged here: it differs in real
// ways between pages (e.g. corporate.js's rows show a customization badge and
// have no remove button; index-2.js/contact-us-2.js's rows have a remove
// button and no customization badge), and each page's updateCartUI() also
// drives page-specific extras (mobile cart bar, extra badges, re-rendering
// the product grid) that don't generalize safely. Load this before any page
// script that calls cldOpt() or cartDrawerEmptyStateHTML().
(function (global) {
  function cldOpt(url) {
    // Cloudinary account has Strict Transformations enabled — any on-the-fly
    // transform (even a plain resize) 400s. No-op until that's turned off.
    // Locally-uploaded (admin Media Library) images are relative /media/<file>
    // paths served by FastAPI itself - route them through the same backend
    // origin every fetch() on this page already uses, or they resolve against
    // whatever's hosting this static page instead and 404.
    if (url && url.startsWith('/media/')) return `${window.SAI_API_BASE || "http://localhost:8000"}${url}`;
    // js/shared/thumb-map.js is a static url -> thumbnail-url lookup generated
    // ahead of time by scripts/generate_thumbnails.py (Pillow, no runtime proxy or
    // redirect). Falls back to the full-size original for anything not in it
    // (a data:/blob: URI, a localhost dev URL, or a newer image the script hasn't
    // been re-run for yet).
    if (!url || url.startsWith('data:') || url.startsWith('blob:') || /^https?:\/\/(localhost|127\.0\.0\.1)/.test(url)) return url;
    return (window.THUMB_MAP && window.THUMB_MAP[url]) || url;
  }

  function cartDrawerEmptyStateHTML() {
    return `
      <div style="text-align: center; color: #888; padding-top: 40px;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px; opacity: 0.5;">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <p>Your cart is empty</p>
      </div>
    `;
  }

  global.cldOpt = cldOpt;
  global.cartDrawerEmptyStateHTML = cartDrawerEmptyStateHTML;
})(window);

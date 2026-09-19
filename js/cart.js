
    // --- Shared Cart System (js/shared/cart-core.js - reads the same
    // 'sai_studio_cart' localStorage used site-wide). Thin wrappers so the
    // ~900 lines below that already call getCart()/saveCart() by these names
    // don't need to change, while the actual storage/sync logic lives in one
    // place shared with every other page's cart. ---
    function getCart() {
      return CartCore.getCart();
    }

    function saveCart(cart) {
      CartCore.saveCart(cart);
    }

    function escapeForAttr(str) {
      return String(str).replace(/'/g, "\\'");
    }

    function escapeHtml(str) {
      return String(str).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
      }[c]));
    }


    // Cart items are saved by other pages with whatever image path they used
    // at the time (e.g. "assets/..." or "corporate-assets/..."). This project
    // only ships a single "photography-assets/" folder, so remap any stored
    // path that points at one of those old/nonexistent folders to the one
    // that actually contains the product images.
    function resolveCartImagePath(img) {
      if (!img) return img;
      return img.replace(/^(assets|corporate-assets)\//, 'photography-assets/');
    }

    function parsePrice(str) {
      return CartCore.parsePrice(str);
    }

    function cartTotals() {
      return CartCore.cartTotals();
    }

    // An item can carry a `requirement` (set by the page that added it - gifts.js,
    // studio.js, corporate.js) describing what customization it needs, e.g.
    // { label: "Upload your photo", fields: ["photoData"], editUrl: "gifts.html?..." }.
    // It's fulfilled if ANY of those fields is present on item.customization. Pages are
    // supposed to block adding an item until this is already true - this is a defensive
    // second check so nothing incomplete can slip through to checkout.
    function itemNeedsAttention(item) {
      if (!item.requirement || !item.requirement.fields || !item.requirement.fields.length) return false;
      return !item.requirement.fields.some(f => item.customization && item.customization[f]);
    }

    function renderAttentionBanner(cart) {
      const banner = document.getElementById('attentionBanner');
      const entries = Object.entries(cart).filter(([, item]) => itemNeedsAttention(item));
      if (!entries.length) {
        banner.style.display = 'none';
        return false;
      }
      document.getElementById('attentionBannerTitle').textContent =
        `${entries.length} ${entries.length === 1 ? 'item needs' : 'items need'} your attention before checkout`;
      document.getElementById('attentionBannerList').innerHTML = entries.map(([, item]) => `
        <div class="attention-banner-row">
          <span class="abr-text"><b>${escapeHtml(item.name)}</b>${item.requirement.label}</span>
          <a class="abr-fix-btn" href="${item.requirement.editUrl || '#'}">Fix this</a>
        </div>`).join('');
      banner.style.display = 'block';
      return true;
    }

    // Cart entries are keyed by product name UNLESS the item was customized
    // (gifts.js keys those as "<name>::<timestamp>" so multiple distinct
    // customizations of the same product can coexist) - qty/remove must act
    // on the real object key, not item.name, or those rows silently no-op.
    function changeQty(key, delta) {
      CartCore.updateQty(key, delta, {}, { createIfMissing: false });
      renderCartPage();
    }

    function removeItem(key) {
      CartCore.removeItem(key);
      renderCartPage();
    }

    /* ================= SERVER-SIDE CART SYNC (logged-in customers) =================
       Guest carts live only in localStorage, same as before. Once a customer is
       logged in (js/shared/customer-api.js), the cart is also persisted to their
       account server-side, so items added before login aren't lost and the same
       cart follows them to another device/browser instead of living in just one
       browser's local storage. */

    function cartToServerItems(cart) {
      return CartCore.cartToServerItems(cart);
    }

    function serverItemsToCart(items) {
      return CartCore.serverItemsToCart(items);
    }

    function mergeCarts(localCart, serverCart) {
      return CartCore.mergeCarts(localCart, serverCart);
    }

    let cartSyncInFlight = null;

    // Pulls the account's server cart, merges it into the local one (so nothing
    // added on this device or added while logged in elsewhere is lost), saves the
    // merged result back to both localStorage and the server, then re-renders.
    function syncCartWithServer() {
      if (typeof isCustomerLoggedIn !== 'function' || !isCustomerLoggedIn()) return Promise.resolve();
      if (cartSyncInFlight) return cartSyncInFlight;
      cartSyncInFlight = (async () => {
        try {
          const serverResult = await CustomerAuth.getCart();
          const merged = mergeCarts(getCart(), serverItemsToCart(serverResult.items));
          saveCart(merged);
          await CustomerAuth.syncCart(cartToServerItems(merged));
          renderCartPage();
        } catch (e) {
          // best-effort - a failed sync shouldn't block using the cart locally
        } finally {
          cartSyncInFlight = null;
        }
      })();
      return cartSyncInFlight;
    }

    // Fire-and-forget push after a local mutation while logged in, so the
    // account's server-side cart stays current without blocking the UI on it.
    // (saveCart() above already does this on every mutation via CartCore; this
    // wrapper remains for the few call sites - e.g. right after OTP login -
    // that want an explicit push independent of a save.)
    function pushCartIfLoggedIn() {
      CartCore.pushCartIfLoggedIn();
    }

    // Saved-address book (account addresses, recommended at checkout) -----
    let savedAddresses = [];
    let selectedSavedAddressId = null;

    // Addresses are stored as one free-text line1 (see addresses.py) - split
    // it back into the form's separate D.No / Street fields the same way on
    // every read, so a round trip through "save this address" and back
    // reproduces what the customer typed.
    function addressToFormFields(addr) {
      const [dno, ...rest] = String(addr.line1 || '').split(',');
      return {
        name: addr.full_name, phone: addr.phone,
        dno: (dno || '').trim(), street: rest.join(',').trim(),
        landmark: addr.line2 || '', city: addr.city,
        state: addr.state, pincode: addr.pincode,
      };
    }

    function applyAddressToForm(fields) {
      const map = {
        custName: fields.name, custPhone: fields.phone, custDno: fields.dno, custStreet: fields.street,
        custLandmark: fields.landmark, custCity: fields.city, custState: fields.state, custPincode: fields.pincode,
      };
      Object.entries(map).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.value = value || '';
      });
    }

    function savedAddressCardHTML(addr) {
      const f = addressToFormFields(addr);
      const addressLine = [f.dno, f.street, f.landmark].filter(Boolean).join(', ');
      const selected = addr.id === selectedSavedAddressId;
      return `
        <button type="button" class="saved-address-card${selected ? ' selected' : ''}" onclick="selectSavedAddress('${escapeForAttr(addr.id)}')">
          <div class="saved-address-card-top">
            <span class="saved-address-card-label">${escapeHtml(addr.label || 'Address')}</span>
            ${addr.is_default ? '<span class="saved-address-card-default">Default</span>' : ''}
          </div>
          <div class="saved-address-card-name">${escapeHtml(addr.full_name)} &middot; ${escapeHtml(addr.phone)}</div>
          <div class="saved-address-card-text">${escapeHtml(addressLine)}, ${escapeHtml(addr.city)}, ${escapeHtml(addr.state)} - ${escapeHtml(addr.pincode)}</div>
        </button>`;
    }

    function renderSavedAddressPicker() {
      const section = document.getElementById('savedAddressSection');
      if (!section) return;
      if (!savedAddresses.length) {
        section.style.display = 'none';
        return;
      }
      section.style.display = 'block';
      document.getElementById('savedAddressList').innerHTML = savedAddresses.map(savedAddressCardHTML).join('');
    }

    // A saved card was picked - fill the form from it and hide the "save this
    // address" checkbox, since it's already in the account.
    function selectSavedAddress(id) {
      const addr = savedAddresses.find(a => a.id === id);
      if (!addr) return;
      selectedSavedAddressId = id;
      applyAddressToForm(addressToFormFields(addr));
      renderSavedAddressPicker();
      const saveRow = document.getElementById('saveAddressRow');
      if (saveRow) saveRow.style.display = 'none';
    }

    // "+ Enter a new address" (or editing any field of a selected saved
    // address) - clears the selection and, if logged in, re-offers the "save
    // this address" checkbox so the new entry can be added to the account.
    function useNewAddressForm() {
      selectedSavedAddressId = null;
      renderSavedAddressPicker();
      if (typeof isCustomerLoggedIn === 'function' && isCustomerLoggedIn()) {
        const saveRow = document.getElementById('saveAddressRow');
        if (saveRow) saveRow.style.display = 'block';
      }
    }

    // Best-effort: pull the account's saved addresses in as recommendations
    // for the delivery form (same way the cart itself gets pulled in on
    // login) - the default (or most recent) is applied automatically, the
    // rest are offered as one-click alternatives.
    async function prefillAddressFromServer() {
      if (typeof isCustomerLoggedIn !== 'function' || !isCustomerLoggedIn()) return;
      try {
        savedAddresses = await CustomerAuth.getAddresses();
        renderSavedAddressPicker();
        const primary = savedAddresses.find(a => a.is_default) || savedAddresses[0];
        if (primary) {
          selectSavedAddress(primary.id);
          saveDeliveryDetails(addressToFormFields(primary));
        } else if (typeof getCustomerPhone === 'function' && getCustomerPhone() && !document.getElementById('custPhone').value) {
          // No saved address yet, but the profile has a mobile number on file
          // (see js/shared/customer-api.js) - recommend it for the field.
          document.getElementById('custPhone').value = getCustomerPhone();
        }
      } catch (e) {
        // best-effort - keep whatever was already in the form
      }
      // Logged in with nothing selected yet (new customer, or they haven't
      // saved an address before) - offer to save whatever they type.
      if (!selectedSavedAddressId) {
        const saveRow = document.getElementById('saveAddressRow');
        if (saveRow) saveRow.style.display = 'block';
      }
    }

    // Editing the form after a saved card was applied means the customer is
    // customizing it for this order - stop treating it as "already saved".
    function wireDeliveryFormDirtyTracking() {
      ['custName', 'custPhone', 'custDno', 'custStreet', 'custLandmark', 'custCity', 'custState', 'custPincode'].forEach(id => {
        const el = document.getElementById(id);
        if (!el || el.dataset.dirtyWired) return;
        el.dataset.dirtyWired = '1';
        el.addEventListener('input', () => {
          if (selectedSavedAddressId) useNewAddressForm();
        });
        el.addEventListener('change', () => {
          if (selectedSavedAddressId) useNewAddressForm();
        });
      });
    }

    // Same normalization the backend (addresses.py find_matching_address) uses
    // to recognize "this is the same address, just re-typed" - checked here
    // first so a repeat customer (or a guest who only logs in at the final
    // step, re-entering the one real address they always use) doesn't pay for
    // a whole extra network round trip creating a row the server would have
    // deduplicated anyway. The backend check still runs regardless - this is
    // purely a latency shortcut, not the source of truth for dedup.
    function normAddr(s) { return String(s || '').replace(/\s+/g, ' ').trim().toLowerCase(); }
    function findMatchingSavedAddress(d) {
      const line1 = [d.dno, d.street].filter(Boolean).join(', ');
      return savedAddresses.find(a =>
        normAddr(a.full_name) === normAddr(d.name) &&
        normAddr(a.phone) === normAddr(d.phone) &&
        normAddr(a.line1) === normAddr(line1) &&
        normAddr(a.line2 || '') === normAddr(d.landmark || '') &&
        normAddr(a.city) === normAddr(d.city) &&
        normAddr(a.state) === normAddr(d.state) &&
        normAddr(a.pincode) === normAddr(d.pincode));
    }

    // The order's address_id (backend/app/schemas.py CheckoutIn) always has to
    // point at a real row in the address book, so every order needs one - but
    // that shouldn't mean creating a fresh duplicate every time:
    //  - picked a saved address and didn't touch it -> reuse its id, no request.
    //  - typed one that already matches a saved address -> reuse its id too.
    //  - typed a genuinely new/edited one -> save it for next time only if the
    //    "Save this address" checkbox (checked by default) is still checked;
    //    either way it becomes the order's address, but only a saved one can
    //    ever become the account default, and only when it's the very first
    //    one - a one-off checkout address should never silently displace
    //    whatever the customer already had marked default.
    async function resolveOrderAddressId(d) {
      if (selectedSavedAddressId) return selectedSavedAddressId;

      const matching = findMatchingSavedAddress(d);
      if (matching) return matching.id;

      // Note: the checkbox row can be hidden at this point (e.g. a guest who
      // only logs in at this final step never saw step 2's address picker) -
      // its *checked* state (defaults to true) still reflects intent either way.
      const checkbox = document.getElementById('custSaveAddress');
      const saveToAccount = (!checkbox || checkbox.checked)
        && typeof isCustomerLoggedIn === 'function' && isCustomerLoggedIn();

      const created = await CustomerAuth.createAddress({
        label: 'Home',
        full_name: d.name,
        phone: d.phone,
        line1: [d.dno, d.street].filter(Boolean).join(', '),
        line2: d.landmark || null,
        city: d.city,
        state: d.state,
        pincode: d.pincode,
        is_default: saveToAccount && savedAddresses.length === 0,
      });
      if (saveToAccount) savedAddresses.push(created);
      return created.id;
    }

    // Different pages store the customer's uploaded artwork under different
    // field names (corporate.js: logoData, gifts.js/studio.js: photoData), and
    // an admin-configured "Customer Input Fields" upload (Product.input_fields)
    // lands under customization.fields[fieldId] instead (single value or, for a
    // multi-file field, an array) - checked the same way my-orders.js already
    // does for a placed order, so an uploaded photo shows up here too instead
    // of only after checkout.
    function cartItemUploadedImage(item) {
      const cust = item.customization;
      if (!cust) return '';
      const direct = cust.logoData || cust.photoData || '';
      if (typeof direct === 'string' && direct.startsWith('data:image/')) return direct;
      const fields = cust.fields;
      if (fields && typeof fields === 'object') {
        for (const value of Object.values(fields)) {
          const candidates = Array.isArray(value) ? value : [value];
          const hit = candidates.find(v => typeof v === 'string' && (v.startsWith('data:image/') || /^https?:\/\//.test(v)));
          if (hit) return hit;
        }
      }
      return '';
    }

    // Different pages store the customer's custom message under different field
    // names (gifts.js: text, corporate.js: engravingText), and an admin-configured
    // text/dropdown "Customer Input Field" answer lands under
    // customization.fields[fieldId] instead - checked the same way my-orders.js
    // already does for a placed order.
    function cartItemCustomText(item) {
      const cust = item.customization;
      if (!cust) return '';
      const direct = cust.text || cust.engravingText || cust.message || cust.customText || '';
      if (typeof direct === 'string' && direct.trim()) return direct.trim();
      const fields = cust.fields;
      if (fields && typeof fields === 'object') {
        for (const value of Object.values(fields)) {
          if (typeof value === 'string' && value.trim() && !value.startsWith('data:') && !/^https?:\/\//.test(value)) {
            return value.trim();
          }
        }
      }
      return '';
    }

    function cartItemRowHTML(item, key, index) {
      const safeKey = escapeForAttr(key);
      const priceNum = parsePrice(item.price);
      const lineTotal = priceNum * item.qty;
      const uploadedImage = cartItemUploadedImage(item);
      const customText = cartItemCustomText(item);
      const lazyAttr = index === 0 ? '' : ' loading="lazy"';
      return `
        <div class="cart-item-row">
          <div class="cart-item-thumb-wrap">
            <img class="cart-item-img" src="${cldOpt(resolveCartImagePath(item.img))}" alt="${escapeHtml(item.name)}"${lazyAttr} onerror="this.style.visibility='hidden'">
          </div>
          <div class="cart-item-details">
            <h3>${escapeHtml(item.name)}</h3>
            <p>${item.price} each</p>
            ${item.customization && Object.values(item.customization).some(Boolean) ? '<span class="cart-item-customized-badge">&#10003; Customized</span>' : ''}
            ${uploadedImage || customText ? `
            <div class="cart-item-custom-preview">
              ${uploadedImage ? `
              <div class="cart-item-custom-photo-wrap">
                <img class="cart-item-custom-photo" src="${uploadedImage}" alt="Your uploaded photo" loading="lazy" title="Click to view full size" onclick="openImagePreview('${escapeForAttr(uploadedImage)}')">
                <span class="cart-item-custom-photo-label">Your photo</span>
              </div>` : ''}
              ${customText ? `<span class="cart-item-custom-text">&ldquo;${escapeHtml(customText)}&rdquo;</span>` : ''}
            </div>` : ''}
          </div>
          <div class="cart-qty-selector">
            <button class="cart-qty-btn" onclick="changeQty('${safeKey}', -1)">-</button>
            <span class="cart-qty-count">${item.qty}</span>
            <button class="cart-qty-btn" onclick="changeQty('${safeKey}', 1)">+</button>
          </div>
          <div class="cart-item-price">₹${lineTotal}</div>
          <button class="cart-remove-btn" onclick="removeItem('${safeKey}')" aria-label="Remove item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"></path>
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
            </svg>
          </button>
        </div>`;
    }

    function openImagePreview(src) {
      document.getElementById('imagePreviewOverlayImg').src = src;
      document.getElementById('imagePreviewOverlay').style.display = 'flex';
    }

    function closeImagePreview() {
      document.getElementById('imagePreviewOverlay').style.display = 'none';
      document.getElementById('imagePreviewOverlayImg').src = '';
    }

    // "Buy Now" on a product page (js/gifts.js, js/corporate.js, js/index-2.js)
    // stashes the single item here instead of the persistent cart, then sends
    // the shopper straight to this page - merge it in once on load so it's not
    // silently dropped in favour of whatever was already in the cart. A plain
    // "Proceed to Checkout" click also writes this key with source:'cart', but
    // those items are already in the persistent cart, so there's nothing to add.
    // Returns true when this load is a genuine Buy Now handoff, so the caller
    // can skip straight to the address step (see DOMContentLoaded below) -
    // false for a plain page visit or a "Proceed to Checkout" handoff (which
    // writes this same key with source:'cart', but is meant to land on the
    // cart review list as usual).
    function consumePendingBuyNow() {
      let pending;
      try { pending = JSON.parse(sessionStorage.getItem('sai_studio_checkout')); } catch (e) { pending = null; }
      sessionStorage.removeItem('sai_studio_checkout');
      if (!pending || pending.source !== 'buy-now' || !Array.isArray(pending.items)) return false;

      const cart = getCart();
      pending.items.forEach(item => {
        const key = hasCustomizationFields(item.customization) ? `${item.name}::${Date.now()}` : item.name;
        if (cart[key]) cart[key].qty += item.qty || 1;
        else cart[key] = { ...item, qty: item.qty || 1 };
      });
      saveCart(cart);
      return true;
    }

    function hasCustomizationFields(customization) {
      return !!(customization && Object.values(customization).some(v => v));
    }

    function renderCartPage() {
      const cart = getCart();
      const { items, totalQty, totalPrice } = cartTotals();
      const hasItemsSection = document.getElementById('cartHasItems');
      const emptyStateSection = document.getElementById('cartEmptyState');
      const cartBadgeEl = document.getElementById('navCartBadge');
      const bottomBadgeEl = document.getElementById('bottomNavCartBadge');

      [cartBadgeEl, bottomBadgeEl].forEach(el => {
        if (!el) return;
        el.textContent = totalQty;
        el.style.display = totalQty > 0 ? 'flex' : 'none';
      });

      currentCartStep = 1;
      document.getElementById('cartStepDetails').style.display = 'none';
      document.getElementById('cartStepPayment').style.display = 'none';
      document.getElementById('cartSuccessState').style.display = 'none';

      if (items.length === 0) {
        hasItemsSection.style.display = 'none';
        emptyStateSection.style.display = 'block';
        document.getElementById('cartSteps').style.display = 'none';
        return;
      }

      document.getElementById('cartSteps').style.display = 'flex';
      setStepIndicator(1);
      hasItemsSection.style.display = 'grid';
      emptyStateSection.style.display = 'none';

      document.getElementById('cartItemsList').innerHTML =
        Object.entries(cart).map(([key, item], index) => cartItemRowHTML(item, key, index)).join('');

      document.getElementById('cartItemCount').textContent = `${totalQty} ${totalQty === 1 ? 'item' : 'items'}`;
      document.getElementById('cartSubtotalValue').textContent = `₹${totalPrice}`;
      document.getElementById('cartTotalValue').textContent = `₹${totalPrice}`;

      const needsAttention = renderAttentionBanner(cart);
      const checkoutBtn = document.getElementById('proceedToCheckoutBtn');
      if (checkoutBtn) checkoutBtn.disabled = needsAttention;
    }

    /* ================= CHECKOUT STEP FLOW ================= */
    let currentCartStep = 1;
    let selectedCartPayment = 'cod';
    let cartLoginEmail = '';
    let cartOrder = null;
    let cartPayment = null;

    function setStepIndicator(step) {
      document.querySelectorAll('#cartSteps .cart-step').forEach(el => {
        const s = Number(el.dataset.step);
        el.classList.toggle('active', s === step);
        el.classList.toggle('done', s < step);
      });
    }

    function renderMiniList(listId, totalId) {
      const { items, totalPrice } = cartTotals();
      document.getElementById(listId).innerHTML = items.map(item => `
        <div class="cart-mini-row">
          <span class="cart-mini-name">${escapeHtml(item.name)} <span class="cart-mini-qty">&times;${item.qty}</span></span>
          <span class="cart-mini-price">₹${parsePrice(item.price) * item.qty}</span>
        </div>`).join('');
      if (totalId) document.getElementById(totalId).textContent = `₹${totalPrice}`;
    }

    // "Continue Shopping" used to always hardcode index.html - a customer who
    // opened cart.html from a specific product on gifts.html/corporate.html/
    // studio.html (to check their cart, or after Add to Cart) and then wanted
    // to keep shopping got dumped on the homepage instead of back on the
    // product they were just looking at. Going back in history instead returns
    // them to wherever they actually came from, regardless of which page that
    // was - falling back to the plain index.html link (the href stays on the
    // <a> tag) only when there's no useful same-site history to return to,
    // e.g. cart.html opened directly/first in a tab.
    function continueShoppingBack(event) {
      if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) {
        event.preventDefault();
        history.back();
        return false;
      }
      return true;
    }

    function goToCartStep(step) {
      const cart = getCart();
      const { items } = cartTotals();
      if (items.length === 0) { renderCartPage(); return; }

      // defensive: even if the "Proceed to Checkout" button were somehow re-enabled
      // or this were called directly, never let an incomplete item through to step 2/3.
      if (step > 1 && Object.values(cart).some(itemNeedsAttention)) {
        renderAttentionBanner(cart);
        document.getElementById('attentionBanner').scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      currentCartStep = step;
      document.getElementById('cartHasItems').style.display = step === 1 ? 'grid' : 'none';
      document.getElementById('cartStepDetails').style.display = step === 2 ? 'grid' : 'none';
      document.getElementById('cartStepPayment').style.display = step === 3 ? 'grid' : 'none';
      document.getElementById('cartEmptyState').style.display = 'none';
      setStepIndicator(step);

      if (step === 2) renderMiniList('cartReviewMiniList', 'cartTotalValueStep2');
      if (step === 3) enterPaymentStep();

      const anchor = document.getElementById('cartSteps');
      if (anchor) window.scrollTo({ top: anchor.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
    }

    function getDeliveryDetails() {
      return {
        name: document.getElementById('custName').value.trim(),
        phone: document.getElementById('custPhone').value.trim(),
        dno: document.getElementById('custDno').value.trim(),
        street: document.getElementById('custStreet').value.trim(),
        landmark: document.getElementById('custLandmark').value.trim(),
        city: document.getElementById('custCity').value.trim(),
        state: document.getElementById('custState').value,
        pincode: document.getElementById('custPincode').value.trim(),
      };
    }

    // Delivery details are entered in step 2, but login (step 3) is a separate
    // async OTP round-trip - if the tab gets reloaded or the user comes back to
    // check their email, the step-2 form inputs (plain DOM state) would be lost.
    // Persisting to localStorage means the address survives that gap and is
    // still there/pre-filled after login, same as the cart itself.
    const DELIVERY_DETAILS_KEY = 'sai_studio_delivery_details';

    function saveDeliveryDetails(d) {
      try { localStorage.setItem(DELIVERY_DETAILS_KEY, JSON.stringify(d)); } catch (e) {}
    }

    function loadDeliveryDetails() {
      try { return JSON.parse(localStorage.getItem(DELIVERY_DETAILS_KEY)) || null; } catch (e) { return null; }
    }

    function prefillDeliveryDetails() {
      const d = loadDeliveryDetails();
      if (!d) return;
      const fields = {
        custName: d.name, custPhone: d.phone, custDno: d.dno, custStreet: d.street,
        custLandmark: d.landmark, custCity: d.city, custState: d.state, custPincode: d.pincode,
      };
      Object.entries(fields).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el && value) el.value = value;
      });
    }

    function confirmDetailsAndContinue() {
      const d = getDeliveryDetails();
      const msgEl = document.getElementById('detailsFormMsg');
      const digitsOnly = d.phone.replace(/\D/g, '');

      let error = '';
      if (!d.name || !d.phone || !d.dno || !d.street || !d.city || !d.state || !d.pincode) {
        error = 'Please fill in all required delivery details (Landmark is optional).';
      } else if (!Validators.isValidPhone(digitsOnly)) {
        error = 'Please enter a valid 10-digit mobile number.';
      } else if (!/^\d{6}$/.test(d.pincode)) {
        error = 'Please enter a valid 6-digit pincode.';
      }

      if (error) {
        msgEl.textContent = error;
        msgEl.style.display = 'block';
        return;
      }
      msgEl.style.display = 'none';
      saveDeliveryDetails(d);
      goToCartStep(3);
    }

    /* ---------- login gate (email OTP, only asked at the final step) ---------- */

    function enterPaymentStep() {
      cartOrder = null;
      cartPayment = null;
      const loggedIn = isCustomerLoggedIn();
      document.getElementById('cartLoginGate').style.display = loggedIn ? 'none' : 'block';
      document.getElementById('cartPaymentBody').style.display = loggedIn ? 'block' : 'none';
      if (loggedIn) {
        createBackendOrder();
      } else {
        resetCartLoginGate();
      }
    }

    function resetCartLoginGate() {
      cartLoginEmail = getCustomerEmail() || '';
      document.getElementById('cartLoginEmail').value = cartLoginEmail;
      document.getElementById('cartLoginOtp').value = '';
      document.getElementById('cartLoginMsg').style.display = 'none';
      document.getElementById('cartLoginEmailStep').style.display = 'block';
      document.getElementById('cartLoginOtpStep').style.display = 'none';
    }

    function backToCartEmailStep() {
      document.getElementById('cartLoginEmailStep').style.display = 'block';
      document.getElementById('cartLoginOtpStep').style.display = 'none';
      document.getElementById('cartLoginMsg').style.display = 'none';
    }

    async function sendCartOtp() {
      const email = document.getElementById('cartLoginEmail').value.trim();
      const msgEl = document.getElementById('cartLoginMsg');
      msgEl.style.display = 'none';

      if (!Validators.isValidEmail(email)) {
        msgEl.textContent = 'Please enter a valid email address.';
        msgEl.style.display = 'block';
        return;
      }

      const btn = document.getElementById('cartSendOtpBtn');
      btn.disabled = true;
      try {
        await CustomerAuth.requestOtp(email);
        cartLoginEmail = email;
        document.getElementById('cartOtpSentTo').textContent = `(sent to ${email})`;
        document.getElementById('cartLoginEmailStep').style.display = 'none';
        document.getElementById('cartLoginOtpStep').style.display = 'block';
        document.getElementById('cartLoginOtp').focus();
      } catch (err) {
        msgEl.textContent = err.message || 'Could not send the OTP. Please try again.';
        msgEl.style.display = 'block';
      } finally {
        btn.disabled = false;
      }
    }

    async function verifyCartOtp() {
      const code = document.getElementById('cartLoginOtp').value.trim();
      const msgEl = document.getElementById('cartLoginMsg');
      msgEl.style.display = 'none';

      if (!/^\d{6}$/.test(code)) {
        msgEl.textContent = 'Please enter the 6-digit code.';
        msgEl.style.display = 'block';
        return;
      }

      const btn = document.getElementById('cartVerifyOtpBtn');
      btn.disabled = true;
      try {
        const d = getDeliveryDetails();
        await CustomerAuth.verifyOtp(cartLoginEmail, code, d.name);
        // Save what's already in the cart under the now-logged-in account. This is a
        // one-way push (not a merge) - the user already reviewed this exact cart back
        // in step 1, so login shouldn't silently add anything from another device on
        // top of what they're about to pay for.
        pushCartIfLoggedIn();
        // A guest who only logs in at this final step (step 2's address picker never
        // ran, since they weren't logged in yet) still deserves the same "reuse my
        // saved address" treatment as someone already signed in - without this,
        // resolveOrderAddressId() below has no saved-address list to match against
        // and always creates a fresh row, even for a returning customer's real
        // address (the backend's own dedup check is the real safety net, but this
        // also spares them the extra create-address round trip).
        savedAddresses = await CustomerAuth.getAddresses().catch(() => savedAddresses);
        window.SaiAuthNav?.refresh();
        document.getElementById('cartLoginGate').style.display = 'none';
        document.getElementById('cartPaymentBody').style.display = 'block';
        await createBackendOrder();
      } catch (err) {
        msgEl.textContent = err.message || 'That code didn’t work. Please try again.';
        msgEl.style.display = 'block';
      } finally {
        btn.disabled = false;
      }
    }

    /* ---------- backend order + payment ---------- */

    // The two payment-method rows have no server-backed state of their own to
    // wait on - only "Place Order" was ever disabled during order creation - so
    // a customer could pick "Pay Online" while the order was still being created,
    // then have that choice silently thrown away the moment renderPaymentStep()
    // ran and reset selectedCartPayment back to 'cod'. Locking the rows while
    // createBackendOrder() is in flight (below) closes that window.
    function setPaymentOptionsLoading(loading) {
      ['payCOD', 'payOnline'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.pointerEvents = loading ? 'none' : '';
        el.style.opacity = loading ? '.5' : '';
      });
    }

    async function createBackendOrder() {
      const msgEl = document.getElementById('cartPaymentMsg');
      const placeBtn = document.getElementById('placeCartOrderBtn');
      const loadingEl = document.getElementById('cartPaymentLoading');
      msgEl.style.display = 'none';
      placeBtn.disabled = true;
      setPaymentOptionsLoading(true);
      if (loadingEl) loadingEl.style.display = 'flex';

      try {
        const d = getDeliveryDetails();
        // Best-effort: link the phone entered in delivery details to the account
        // (email is the login identity; a clash with another account, e.g. the
        // same number used to sign up separately, shouldn't block checkout).
        // Independent of the address lookup below, so run both concurrently
        // instead of paying for two sequential round trips.
        const updateMePromise = CustomerAuth.updateMe({ name: d.name, phone: d.phone }).catch(() => {});
        const addressId = await resolveOrderAddressId(d);
        await updateMePromise;

        const { items } = cartTotals();
        const result = await CustomerAuth.checkout({
          items: items.map(item => ({
            product_id: item.product_id || null,
            title: item.name,
            price: parsePrice(item.price),
            qty: item.qty,
            image: resolveCartImagePath(item.img) || null,
            customization: item.customization || null,
          })),
          address_id: addressId,
        });

        cartOrder = result.order;
        cartPayment = result.payment;
        renderPaymentStep();
        placeBtn.disabled = false;
      } catch (err) {
        msgEl.textContent = err.message || 'Could not prepare your order. Please try again.';
        msgEl.style.display = 'block';
      } finally {
        setPaymentOptionsLoading(false);
        if (loadingEl) loadingEl.style.display = 'none';
      }
    }

    function renderPaymentStep() {
      if (!cartPayment) return;
      const amount = Math.round(cartPayment.amount);
      document.getElementById('codPriceLabel').textContent = `₹${amount}`;
      document.getElementById('onlinePriceLabel').textContent = `₹${amount}`;
      updatePaymentSelectionUI();
      renderMiniList('cartReviewMiniList2', null);
      updateFinalPayable();
    }

    function selectCartPayment(method) {
      selectedCartPayment = method;
      updatePaymentSelectionUI();
      updateFinalPayable();
    }

    function updatePaymentSelectionUI() {
      document.getElementById('payCOD').classList.toggle('selected', selectedCartPayment === 'cod');
      document.getElementById('payOnline').classList.toggle('selected', selectedCartPayment === 'online');
      document.querySelector('#placeCartOrderBtn .pco-label').textContent =
        selectedCartPayment === 'online' ? 'Pay Now' : 'Place Order (Cash on Delivery)';
    }

    function updateFinalPayable() {
      const amount = cartPayment ? Math.round(cartPayment.amount) : 0;
      document.getElementById('cartFinalPayable').textContent = `₹${amount}`;
    }

    async function placeCartOrder() {
      if (!cartOrder || !cartPayment) return;
      const msgEl = document.getElementById('cartPaymentMsg');
      const btn = document.getElementById('placeCartOrderBtn');
      msgEl.style.display = 'none';

      btn.disabled = true;
      try {
        if (selectedCartPayment === 'cod') {
          // Without this, the order stays "payment_pending" forever - indistinguishable
          // from a checkout the customer simply abandoned before paying online.
          await CustomerAuth.confirmCod(cartOrder.id);
          showCartSuccess(cartOrder.number, 'Cash on Delivery — pay when your order arrives.');
        } else if (cartPayment.mock) {
          await CustomerAuth.mockPay(cartPayment.payment_id);
          showCartSuccess(cartOrder.number, 'Payment received (test mode — no real charge was made).');
        } else {
          openRazorpayCheckout();
          return;
        }
      } catch (err) {
        msgEl.textContent = err.message || 'Payment failed. Please try again.';
        msgEl.style.display = 'block';
      } finally {
        btn.disabled = false;
      }
    }

    function openRazorpayCheckout() {
      const rzp = new Razorpay({
        key: cartPayment.razorpay_key_id,
        amount: cartPayment.amount_paise,
        currency: 'INR',
        name: 'Sai Kumar Digital Lab & Studio',
        description: cartPayment.description,
        order_id: cartPayment.razorpay_order_id,
        prefill: { contact: cartPayment.prefill_contact || '', email: cartPayment.prefill_email || '' },
        theme: { color: '#2563EB' },
        handler: async function (response) {
          const msgEl = document.getElementById('cartPaymentMsg');
          try {
            await CustomerAuth.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            showCartSuccess(cartOrder.number, 'Payment received.');
          } catch (err) {
            msgEl.textContent = err.message || 'Payment verification failed. Please contact support.';
            msgEl.style.display = 'block';
          }
        },
        modal: {
          ondismiss: function () {
            document.getElementById('placeCartOrderBtn').disabled = false;
          },
        },
      });
      rzp.open();
    }

    function showCartSuccess(orderNumber, note) {
      document.getElementById('cartHasItems').style.display = 'none';
      document.getElementById('cartStepDetails').style.display = 'none';
      document.getElementById('cartStepPayment').style.display = 'none';
      document.getElementById('cartEmptyState').style.display = 'none';
      document.getElementById('cartSteps').style.display = 'none';
      document.getElementById('cartSuccessState').style.display = 'block';
      document.getElementById('cartSuccessMsg').textContent =
        (orderNumber ? `Order ${orderNumber} placed. ` : '') + (note || 'Our team will reach out shortly.');
      [document.getElementById('navCartBadge'), document.getElementById('bottomNavCartBadge')].forEach(el => {
        if (el) el.style.display = 'none';
      });
      saveCart({});
      // The account's server-side cart (js/shared/customer-api.js CustomerAuth.getCart/
      // syncCart) is a separate copy from this browser's localStorage one - clearing
      // only the local copy left the ordered items sitting on the server, so the next
      // syncCartWithServer() (next visit to this page, or logging in on another device)
      // merged them straight back into the cart as if they'd never been ordered.
      if (typeof isCustomerLoggedIn === 'function' && isCustomerLoggedIn()) {
        CustomerAuth.clearServerCart().catch(() => {});
      }
      cartOrder = null;
      cartPayment = null;
    }

    window.addEventListener('DOMContentLoaded', () => {
      const isBuyNowHandoff = consumePendingBuyNow();
      renderCartPage();
      prefillDeliveryDetails();
      wireDeliveryFormDirtyTracking();
      // Already logged in from a previous visit (token lives in localStorage) -
      // pull in whatever's saved on the account (cart items + default address)
      // before the user starts reviewing/editing anything.
      syncCartWithServer();
      prefillAddressFromServer().then(() => {
        // Buy Now already ran its own "is everything required filled in"
        // check before handing off here (gifts.js/studio.js/corporate.js/
        // index-2.js all validate first) - so there's nothing left to review
        // on the cart list, and it goes straight to entering/picking a
        // delivery address, same place "Proceed to Checkout" leads to.
        // Waiting for prefillAddressFromServer() first means a logged-in
        // customer's saved-address picker is already populated the moment
        // step 2 appears, instead of popping in a beat later. goToCartStep(2)
        // still re-checks itemNeedsAttention on its own, so this is a fast
        // path, not a bypass, if something unexpected slipped through.
        if (isBuyNowHandoff) goToCartStep(2);
      });
    });

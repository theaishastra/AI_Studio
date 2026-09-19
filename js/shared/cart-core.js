// Single source of truth for the 'sai_studio_cart' localStorage cart, shared by
// every page that lets a visitor add/remove/change quantity (index-2.js,
// catalog.js, corporate.js, studio.js, gifts.js, contact-us-2.js,
// bulk-orders.js, cart.js). Each page used to keep its own copy of
// get/save/updateQty/removeItem - all reading/writing the same localStorage
// key but drifting slightly in behaviour (e.g. only some of them pushed a
// change to the logged-in customer's server-side cart), which is exactly the
// kind of bug that's invisible until a specific page/flow combination hits it.
// Load this before any page script that touches the cart. Drawer/UI rendering
// stays page-specific (the markup differs per page) - only the data layer
// lives here.
(function (global) {
  const STORAGE_KEY = 'sai_studio_cart';
  // Keys explicitly removed locally since the last confirmed server sync. The
  // server-side cart PUT (CustomerAuth.syncCart) is fire-and-forget - if the
  // customer navigates away (e.g. delete -> immediately go to checkout, or the
  // request is just slow) before it lands, syncCartWithServer()'s next GET/merge
  // reads the *old* server cart and, being a union merge, re-adds whatever this
  // browser doesn't have locally - resurrecting the very item just deleted, both
  // locally and back on the server. Recording the delete here means the merge
  // can recognize "this is a deletion still in flight," not "another device
  // added this," and skip re-adding it. Cleared once a push actually succeeds.
  const REMOVED_KEY = 'sai_studio_cart_removed';

  function getRemovedKeys() {
    try {
      return JSON.parse(localStorage.getItem(REMOVED_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function addRemovedKey(key) {
    const keys = getRemovedKeys();
    if (!keys.includes(key)) {
      keys.push(key);
      localStorage.setItem(REMOVED_KEY, JSON.stringify(keys));
    }
  }

  function clearRemovedKeys() {
    localStorage.removeItem(REMOVED_KEY);
  }

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function parsePrice(str) {
    return parseInt(String(str || '0').replace(/[^\d]/g, ''), 10) || 0;
  }

  function cartTotals(cart) {
    const items = Object.values(cart || getCart());
    let totalQty = 0;
    let totalPrice = 0;
    items.forEach((item) => {
      totalQty += item.qty;
      totalPrice += parsePrice(item.price) * item.qty;
    });
    return { items, totalQty, totalPrice };
  }

  function cartToServerItems(cart) {
    return Object.entries(cart).map(([key, item]) => ({
      key,
      product_id: item.product_id || null,
      name: item.name,
      price: String(item.price),
      img: item.img || null,
      qty: item.qty,
      customization: item.customization || null,
      requirement: item.requirement || null,
    }));
  }

  function serverItemsToCart(items) {
    const cart = {};
    (items || []).forEach((item) => {
      cart[item.key] = {
        product_id: item.product_id || null,
        name: item.name,
        price: item.price,
        img: item.img,
        qty: item.qty,
        customization: item.customization,
        requirement: item.requirement,
      };
    });
    return cart;
  }

  // Union merge: an item only on one side is kept as-is; an item on both sides
  // keeps the higher quantity - avoids silently dropping whichever side has
  // more without double-adding every time this runs. Items still pending
  // deletion (see REMOVED_KEY above) are excluded from "only on server side"
  // so an in-flight delete can't be resurrected by a stale server read.
  function mergeCarts(localCart, serverCart) {
    const removed = getRemovedKeys();
    const merged = { ...localCart };
    Object.entries(serverCart).forEach(([key, item]) => {
      if (removed.includes(key)) return;
      if (!merged[key]) merged[key] = item;
      else if (item.qty > merged[key].qty) merged[key] = { ...merged[key], qty: item.qty };
    });
    return merged;
  }

  // Fire-and-forget push to the account's server-side cart. Guarded so pages
  // that haven't loaded js/shared/customer-api.js (or a guest visitor) just
  // no-op instead of throwing. Clears the removed-keys tombstone only once this
  // push actually lands - the cart it just sent already reflects every pending
  // deletion, so a successful PUT means the server is caught up and future
  // merges are safe again.
  function pushCartIfLoggedIn(cart) {
    if (typeof isCustomerLoggedIn !== 'function' || !isCustomerLoggedIn()) return;
    if (typeof CustomerAuth === 'undefined') return;
    CustomerAuth.syncCart(cartToServerItems(cart || getCart())).then(clearRemovedKeys).catch(() => {});
  }

  // Every mutation funnels through here so the server push happens uniformly -
  // previously only cart.js and gifts.js remembered to push after a change,
  // so an item added while logged in from, say, the homepage or corporate.js
  // stayed local-only until the visitor happened to also open cart.html.
  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    pushCartIfLoggedIn(cart);
    return cart;
  }

  // Upsert-style +/- used by "Add to cart" buttons and quantity steppers
  // across the product-listing pages. `extra` supplies the fields needed to
  // create the row the first time (name/price/img/product_id/customization/
  // requirement); on an existing row only qty changes (customization/
  // requirement are overwritten only when explicitly passed again).
  function updateQty(key, delta, extra = {}, { createIfMissing = true } = {}) {
    const cart = getCart();
    if (!cart[key]) {
      if (!createIfMissing) return cart;
      cart[key] = {
        name: extra.name || key,
        product_id: extra.product_id || null,
        qty: 0,
        price: extra.price || '',
        img: extra.img || '',
        customization: extra.customization || null,
        requirement: extra.requirement || null,
      };
    }
    if (extra.customization) cart[key].customization = extra.customization;
    if (extra.requirement) cart[key].requirement = extra.requirement;
    cart[key].qty += delta;
    if (cart[key].qty <= 0) {
      delete cart[key];
      addRemovedKey(key);
    }
    saveCart(cart);
    return cart;
  }

  function removeItem(key) {
    const cart = getCart();
    delete cart[key];
    addRemovedKey(key);
    saveCart(cart);
    return cart;
  }

  global.CartCore = {
    STORAGE_KEY,
    getCart,
    saveCart,
    parsePrice,
    cartTotals,
    updateQty,
    removeItem,
    cartToServerItems,
    serverItemsToCart,
    mergeCarts,
    pushCartIfLoggedIn,
  };
})(window);

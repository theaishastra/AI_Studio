    const cartIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1.4"/><circle cx="18" cy="21" r="1.4"/><path d="M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6"/></svg>`;

    // ---------- Cloudinary auto-format/auto-quality helper ----------
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

    // --- Cart System (shared "sai_studio_cart" localStorage key with index.html) ---
    function getCart() {
      try {
        return JSON.parse(localStorage.getItem('sai_studio_cart')) || {};
      } catch (e) {
        return {};
      }
    }

    function saveCart(cart) {
      localStorage.setItem('sai_studio_cart', JSON.stringify(cart));
      updateCartUI();
    }

    function updateCartQty(productName, delta, priceStr = '', imgUrl = '') {
      const cart = getCart();
      if (!cart[productName]) {
        cart[productName] = { name: productName, qty: 0, price: priceStr, img: imgUrl };
      }
      cart[productName].qty += delta;
      if (cart[productName].qty <= 0) delete cart[productName];
      saveCart(cart);
    }

    function removeCartItem(productName) {
      const cart = getCart();
      delete cart[productName];
      saveCart(cart);
    }

    function updateCartUI() {
      const cart = getCart();
      const items = Object.values(cart);
      let totalQty = 0;
      let totalPrice = 0;
      items.forEach(item => {
        totalQty += item.qty;
        totalPrice += (parseInt(item.price.replace(/[^\d]/g, '')) || 0) * item.qty;
      });

      const navCartBadge = document.getElementById('navCartBadge');
      if (navCartBadge) {
        navCartBadge.textContent = totalQty;
        navCartBadge.style.display = totalQty > 0 ? 'flex' : 'none';
      }

      const drawerItemsContainer = document.getElementById('cartDrawerItems');
      const subtotalEl = document.getElementById('cartSubtotalValue');
      if (!drawerItemsContainer) return;

      if (items.length === 0) {
        drawerItemsContainer.innerHTML = `
          <div style="text-align: center; color: #888; padding-top: 40px;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px; opacity: 0.5;">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <p>Your cart is empty</p>
          </div>
        `;
        if (subtotalEl) subtotalEl.textContent = '₹0';
      } else {
        drawerItemsContainer.innerHTML = items.map(item => `
          <div class="cart-drawer-item">
            <img class="cart-drawer-item-img" src="${cldOpt(item.img)}" alt="${item.name}">
            <div class="cart-drawer-item-info">
              <h5>${item.name}</h5>
              <p>${item.price} each</p>
            </div>
            <div class="quantity-selector" style="height: 24px; min-width: 72px;">
              <button class="qty-btn" onclick="updateCartQty('${item.name}', -1, '${item.price}', '${item.img}')">-</button>
              <span class="qty-count">${item.qty}</span>
              <button class="qty-btn" onclick="updateCartQty('${item.name}', 1, '${item.price}', '${item.img}')">+</button>
            </div>
            <button class="cart-drawer-item-remove" onclick="removeCartItem('${item.name}')" title="Remove item" aria-label="Remove item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        `).join('');
        if (subtotalEl) subtotalEl.textContent = `₹${totalPrice}`;
      }
    }

    function openCartDrawer() {
      document.getElementById('cartDrawer').classList.add('open');
      document.getElementById('cartDrawerOverlay').style.display = 'block';
      updateCartUI();
    }

    function closeCartDrawer() {
      document.getElementById('cartDrawer').classList.remove('open');
      document.getElementById('cartDrawerOverlay').style.display = 'none';
    }

    function checkoutWhatsApp() {
      const cart = getCart();
      const items = Object.values(cart);
      if (items.length === 0) return;

      let message = "Hello Sai Kumar Digital Lab & Studio, I would like to place an order:\n\n";
      let total = 0;
      items.forEach(item => {
        const itemPrice = parseInt(item.price.replace(/[^\d]/g, '')) || 0;
        const subtotal = itemPrice * item.qty;
        total += subtotal;
        message += `• ${item.name} x${item.qty} - ₹${subtotal}\n`;
      });
      message += `\n*Total Order Value: ₹${total}*`;

      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/919849233501?text=${encodedMessage}`, '_blank');
    }

    // --- Wishlist + drawer ---
    // getWishlist/toggleWishItem/updateWishlistUI/openWishlistDrawer used to be
    // duplicated here. They now live in js/shared/wishlist-menu.js (loaded by
    // contact-us.html below this file), which is the one copy that gates saving
    // behind sign-in and persists the wishlist to the account.

    window.addEventListener('DOMContentLoaded', () => {
      updateCartUI();
      updateWishlistUI();
    });

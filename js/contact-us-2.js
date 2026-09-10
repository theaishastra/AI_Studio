    const cartIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1.4"/><circle cx="18" cy="21" r="1.4"/><path d="M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6"/></svg>`;

    // ---------- Cloudinary auto-format/auto-quality helper ----------
    function cldOpt(url) {
      // Cloudinary account has Strict Transformations enabled — any on-the-fly
      // transform (even a plain resize) 400s. No-op until that's turned off.
      return url;
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

    // --- Wishlist System (shared "sai_studio_wishlist" localStorage key with index.html) ---
    function getWishlist() {
      try {
        return JSON.parse(localStorage.getItem('sai_studio_wishlist')) || {};
      } catch (e) {
        return {};
      }
    }

    function saveWishlist(wishlist) {
      localStorage.setItem('sai_studio_wishlist', JSON.stringify(wishlist));
      updateWishlistUI();
    }

    function isWished(productName) {
      return !!getWishlist()[productName];
    }

    function toggleWishItem(productName, priceStr, imgUrl) {
      const wishlist = getWishlist();
      if (wishlist[productName]) {
        delete wishlist[productName];
      } else {
        wishlist[productName] = { name: productName, price: priceStr, img: imgUrl };
      }
      saveWishlist(wishlist);
      document.querySelectorAll(`.p-wish[data-name="${CSS.escape(productName)}"]`).forEach(el => {
        el.classList.toggle('active', !!wishlist[productName]);
      });
    }

    function removeWishItem(productName) {
      const wishlist = getWishlist();
      delete wishlist[productName];
      saveWishlist(wishlist);
    }

    function moveWishItemToCart(productName, priceStr, imgUrl) {
      updateCartQty(productName, 1, priceStr, imgUrl);
      removeWishItem(productName);
    }

    function updateWishlistUI() {
      const wishlist = getWishlist();
      const items = Object.values(wishlist);
      const count = items.length;

      const badge = document.getElementById('navWishlistBadge');
      if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
      }

      const drawerItemsContainer = document.getElementById('wishlistDrawerItems');
      if (!drawerItemsContainer) return;

      if (items.length === 0) {
        drawerItemsContainer.innerHTML = `
          <div style="text-align: center; color: #888; padding-top: 40px;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px; opacity: 0.5;">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
            <p>Your wishlist is empty</p>
          </div>
        `;
      } else {
        drawerItemsContainer.innerHTML = items.map(item => `
          <div class="cart-drawer-item">
            <img class="cart-drawer-item-img" src="${cldOpt(item.img)}" alt="${item.name}">
            <div class="cart-drawer-item-info">
              <h5>${item.name}</h5>
              <p>${item.price}</p>
            </div>
            <button class="cart-btn" title="Move to cart" aria-label="Move ${item.name} to cart" onclick="moveWishItemToCart('${item.name}', '${item.price}', '${item.img}')">${cartIcon}</button>
            <button class="cart-drawer-item-remove" onclick="removeWishItem('${item.name}')" title="Remove item" aria-label="Remove item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        `).join('');
      }
    }

    function openWishlistDrawer() {
      document.getElementById('wishlistDrawer').classList.add('open');
      document.getElementById('wishlistDrawerOverlay').style.display = 'block';
      updateWishlistUI();
    }

    function closeWishlistDrawer() {
      document.getElementById('wishlistDrawer').classList.remove('open');
      document.getElementById('wishlistDrawerOverlay').style.display = 'none';
    }

    window.addEventListener('DOMContentLoaded', () => {
      updateCartUI();
      updateWishlistUI();
    });

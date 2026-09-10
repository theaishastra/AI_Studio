
    // --- Shared Wishlist + Mobile Menu Drawer (site-wide) ---
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
      document.querySelectorAll(`.p-wish[data-name="${CSS.escape(productName)}"]`).forEach(el => {
        el.classList.remove('active');
      });
    }

    function moveWishItemToCart(productName, priceStr, imgUrl) {
      try {
        const cart = JSON.parse(localStorage.getItem('sai_studio_cart')) || {};
        if (cart[productName]) {
          cart[productName].qty = (cart[productName].qty || 1) + 1;
        } else {
          cart[productName] = { name: productName, price: priceStr, img: imgUrl, qty: 1 };
        }
        localStorage.setItem('sai_studio_cart', JSON.stringify(cart));
        if (typeof updateCartUI === 'function') updateCartUI();
        if (typeof updateNavCartBadge === 'function') updateNavCartBadge();
      } catch (e) {}
      removeWishItem(productName);
    }

    function updateWishlistUI() {
      const wishlist = getWishlist();
      const items = Object.values(wishlist);
      const count = items.length;

      [document.getElementById('navWishlistBadge'), document.getElementById('mobileWishlistBadge')].forEach(badge => {
        if (!badge) return;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
      });

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
            <img class="cart-drawer-item-img" src="${item.img}" alt="${item.name}">
            <div class="cart-drawer-item-info">
              <h5>${item.name}</h5>
              <p>${item.price}</p>
            </div>
            <button class="cart-drawer-item-remove" onclick="moveWishItemToCart('${item.name}', '${item.price}', '${item.img}')" title="Move to cart" aria-label="Move ${item.name} to cart">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </button>
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

    function openMobileMenuDrawer() {
      document.getElementById('mobileMenuDrawer').classList.add('open');
      document.getElementById('mobileMenuOverlay').style.display = 'block';
    }

    function closeMobileMenuDrawer() {
      document.getElementById('mobileMenuDrawer').classList.remove('open');
      document.getElementById('mobileMenuOverlay').style.display = 'none';
    }

    document.addEventListener('DOMContentLoaded', updateWishlistUI);

  /* ==========================================================================
    SAI KUMAR DIGITAL LAB & STUDIO - CORPORATE GIFTS PAGE INTERACTIVITY SCRIPT
    ========================================================================== */

  (function () {
    // Applies Cloudinary's auto-format/auto-quality transformation to any Cloudinary
    // delivery URL right before it's rendered. No-op for non-Cloudinary URLs (local
    // paths, icons8.com, data:/blob: URIs), so it's safe to wrap any image-url
    // expression with cldOpt(...) without checking the source first.
    function cldOpt(url) {
      // Cloudinary account has Strict Transformations enabled — any on-the-fly
      // transform (even a plain resize) 400s. No-op until that's turned off.
      return url;
    }

    // --- Category Page Data ---
    // --- Category Page Data (Strictly Unique Assets) ---
    let categoriesData = {};
    // --- Header Dropdown Catalog Dataset ---
    const headerSubNavCatalog = {
      occasions: {
        title: "Occasions",
        desc: "Thoughtful personalized gifts curated for Birthdays, Weddings, Anniversaries & Festivals.",
        catKey: "all",
        products: [
          { name: "Wedding Photo Album Box", price: "₹2,499", img: "https://img.magnific.com/premium-psd/beautiful-brides-wedding-photos-precious-moments_584879-3347.jpg?w=740" },
          { name: "Anniversary LED Acrylic Frame", price: "₹899", img: "https://img.magnific.com/free-photo/front-view-people-celebrating-tamil-new-year_23-2151210797.jpg?w=740" },
          { name: "Birthday Magic Photo Mug", price: "₹399", img: "https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/corporate_assets/magic_photo_mug.jpg" },
          { name: "Executive Metallic Pen Set", price: "₹499", img: "https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/corporate_assets/pen_gift_set.jpg" }
        ]
      },
      personalised: {
        title: "Personalised Gifts",
        desc: "Custom photo printed gifts, engraved crystals, and unique customized keepsakes.",
        catKey: "all",
        products: [
          { name: "Customized Photo Wall Clock", price: "₹899", img: "https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/corporate_https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/assets/photographer_banner.png" },
          { name: "3D Laser Crystal Cube", price: "₹999", img: "https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/corporate_assets/crystal_cube.jpg" },
          { name: "Personalized Steel Flask", price: "₹399", img: "https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/corporate_assets/photo_water_bottle.jpg" },
          { name: "Custom Acrylic Keychain", price: "₹149", img: "https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/corporate_assets/magic_photo_mug.jpg" }
        ]
      },
      frames: {
        title: "Photo Frames",
        desc: "Premium wooden photo frames, LED acrylic night lights, and multi-photo collage frames.",
        catKey: "mementos",
        products: [
          { name: "Warm LED Acrylic Photo Frame", price: "₹899", img: "https://img.magnific.com/free-photo/front-view-people-celebrating-tamil-new-year_23-2151210797.jpg?w=740" },
          { name: "Multi-Photo Collage Frame", price: "₹1,299", img: "https://img.magnific.com/premium-psd/beautiful-brides-wedding-photos-precious-moments_584879-3347.jpg?w=740" },
          { name: "Mosaic Portrait Frame", price: "₹1,599", img: "https://img.magnific.com/premium-psd/beautiful-brides-wedding-photos-precious-moments_584879-3347.jpg?w=740" },
          { name: "Pencil Sketch Portrait Frame", price: "₹1,899", img: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300&h=300&fit=crop&q=80" }
        ]
      },
      mugs: {
        title: "Magic Mugs & Drinkware",
        desc: "Heat-sensitive color changing ceramic magic mugs, heart handle mugs, and printed bottles.",
        catKey: "promotional",
        products: [
          { name: "Standard Color Changing Magic Mug", price: "₹399", img: "https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/corporate_assets/magic_photo_mug.jpg" },
          { name: "Heart Handle Magic Mug", price: "₹499", img: "https://img.magnific.com/premium-photo/heart-coffee-cup-gray-background_762785-30576.jpg?w=740" },
          { name: "Personalized Steel Water Bottle", price: "₹399", img: "https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/corporate_assets/photo_water_bottle.jpg" },
          { name: "Custom Ceramic Coffee Mug", price: "₹299", img: "https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/corporate_assets/magic_photo_mug.jpg" }
        ]
      },
      crystals: {
        title: "Crystal Gifts",
        desc: "3D laser engraved crystal photo cubes and rotating LED crystal light stands.",
        catKey: "mementos",
        products: [
          { name: "3D Laser Engraved Crystal Cube", price: "₹999", img: "https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/corporate_assets/crystal_cube.jpg" },
          { name: "Luminous Glass Photo Stand", price: "₹1,299", img: "https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/corporate_assets/crystal_cube.jpg" },
          { name: "Rotating LED Crystal Base Set", price: "₹1,799", img: "https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/corporate_assets/crystal_cube.jpg" },
          { name: "Heart Glass Crystal Block", price: "₹1,199", img: "https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/corporate_assets/crystal_cube.jpg" }
        ]
      },
      albums: {
        title: "Albums & Printing",
        desc: "High-definition layflat photo albums, photobooks, and professional digital studio prints.",
        catKey: "all",
        products: [
          { name: "HD Photobook Hardcover Album", price: "₹2,999", img: "https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/corporate_https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/assets/photographer_banner.png" },
          { name: "Passport Photo Print Pack", price: "₹99", img: "https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/corporate_assets/studio_camera_setup.jpg" },
          { name: "Instant Digital Print 4x6 Set", price: "₹149", img: "https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/corporate_assets/studio_camera_setup.jpg" },
          { name: "Custom Canvas Wall Print", price: "₹1,499", img: "https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/corporate_https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/assets/photographer_banner.png" }
        ]
      },
      bestsellers: {
        title: "Best Sellers",
        desc: "Top trending customized gifts loved by 10,000+ customers.",
        catKey: "all",
        products: [
          { name: "Standard Color Changing Magic Mug", price: "₹399", img: "https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/corporate_assets/magic_photo_mug.jpg" },
          { name: "Warm LED Acrylic Photo Frame", price: "₹899", img: "https://img.magnific.com/free-photo/front-view-people-celebrating-tamil-new-year_23-2151210797.jpg?w=740" },
          { name: "Personalized Steel Water Bottle", price: "₹399", img: "https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/corporate_assets/photo_water_bottle.jpg" },
          { name: "3D Laser Engraved Crystal Cube", price: "₹999", img: "https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/corporate_assets/crystal_cube.jpg" }
        ]
      }
    };

    // --- State management ---
    let currentCategory = "all";

    // --- Render Header Components ---
    function renderHeaderComponents() {
      return;
    }

    window.toggleMobileDrawer = function (open) {
      const drawer = document.getElementById('mobileNavDrawer');
      const overlay = document.getElementById('mobileNavDrawerOverlay');
      if (open) {
        if (drawer) drawer.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      } else {
        if (drawer) drawer.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    };

    function getScrollOffset() {
      if (window.innerWidth <= 767) {
        const header = document.querySelector('.mobile-sticky-header');
        if (header) {
          let h = header.getBoundingClientRect().height;
          const appSwitcher = document.querySelector('.mobile-app-switcher');
          // If app switcher is not collapsed yet, it will collapse on scroll.
          // Subtract its height so we don't undershoot.
          if (appSwitcher && !appSwitcher.classList.contains('nav-collapsed')) {
            h -= appSwitcher.getBoundingClientRect().height;
          }
          return -(h + 16); // 16px extra breathing room
        }
      } else {
        const desktopNav = document.querySelector('.desktop-nav');
        const h = desktopNav ? desktopNav.offsetHeight : 130;
        return -(h + 32); // Generous desktop breathing room
      }
      return -100; // Fallback
    }

    window.scrollToB2B = function () {
      const el = document.getElementById('b2bBanner') || document.querySelector('.b2b-banner');
      if (el) {
        const yOffset = getScrollOffset();
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    };

    window.scrollToGallery = function () {
      const el = document.getElementById('galleryGrid') || document.querySelector('.gallery-grid');
      if (el) {
        const yOffset = getScrollOffset();
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    };

    window.handleGlobalHeaderSearch = function (e) {
      const query = e.target.value.trim().toLowerCase();
      const packagesGridEl = document.getElementById('packagesGrid');
      if (!packagesGridEl) return;

      if (!query) {
        renderContent();
        return;
      }

      let allProds = [];
      Object.keys(categoriesData).forEach(k => {
        allProds = allProds.concat(categoriesData[k].products);
      });

      const filtered = allProds.filter(p => p.name.toLowerCase().includes(query) || (p.subtitle && p.subtitle.toLowerCase().includes(query)));

      if (filtered.length === 0) {
        packagesGridEl.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #64748b;">
            <h3>No products matching "${query}"</h3>
            <p style="margin-top: 8px;">Try searching for "kit", "bottle", "pen", "memento", or "mug"</p>
          </div>
        `;
      } else {
        packagesGridEl.innerHTML = filtered.map(p => {
          const cleanName = p.name.replace(/'/g, "\\'");
          return `
            <div class="pkg-card fnp-product-card" onclick="orderNowDirect('${cleanName}', '${p.price}', '${p.img}', '${p.id || ''}')">
              <div class="p-thumb">
                <img src="${cldOpt(p.img)}" alt="${p.name}" loading="lazy">
                ${p.oldPrice ? `<span class="p-discount-badge">${Math.round((1 - parsePrice(p.price) / parsePrice(p.oldPrice)) * 100)}% off</span>` : ''}
                <button type="button" class="p-wishlist-btn" aria-label="Save" onclick="event.stopPropagation(); this.classList.toggle('active')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"></path>
                  </svg>
                </button>
                <div class="pkg-card-hover-overlay">
                  <button class="order-now-hover-btn" onclick="event.stopPropagation(); orderNowDirect('${cleanName}', '${p.price}', '${p.img}', '${p.id || ''}')">
                    Order Now
                  </button>
                </div>
              </div>
              <div class="p-info">
                <span class="card-logo-badge">✨ Custom Logo Engraving</span>
                <h4 class="p-title">${p.name}</h4>
                <div class="p-price-row">
                  <span class="p-price">${p.price}</span>
                  ${p.oldPrice ? `<span class="p-old-price">${p.oldPrice}</span>` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('');
      }

      if (e.key === 'Enter') {
        const yOffset = -90;
        const y = packagesGridEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    };

    // --- Load Sidebar Items ---
    window.initSidebar = function () {
      const orderedKeys = ['sets', 'kits', 'pens', 'diaries', 'bottles', 'mementos', 'shields', 'trophies', 'promotional', 'wallets'];
      const keys = orderedKeys.filter(k => categoriesData[k]);

      // Desktop Sidebar
      let sidebarHTML = `
        <div class="sidebar-item ${currentCategory === 'all' ? 'active' : ''}" onclick="switchCategory('all')" data-key="all">
          <span class="sidebar-item-icon"><img src="https://img.icons8.com/color/96/briefcase.png" alt="All Items" loading="lazy"></span>
          <span class="sidebar-item-label">All Items</span>
        </div>
      `;
      sidebarHTML += keys.map(key => {
        const cat = categoriesData[key];
        return `
          <div class="sidebar-item ${key === currentCategory ? 'active' : ''}" onclick="switchCategory('${key}')" data-key="${key}">
            <span class="sidebar-item-icon"><img src="${cldOpt(cat.icon)}" alt="${cat.title}" loading="lazy"></span>
            <span class="sidebar-item-label">${cat.title}</span>
          </div>
        `;
      }).join('');
      const desktopSidebarEl = document.getElementById('desktopSidebar');
      if (desktopSidebarEl) desktopSidebarEl.innerHTML = sidebarHTML;

      // Mobile Scrolling Bar
      let mobileHTML = `
        <div class="mobile-cat-item ${currentCategory === 'all' ? 'active' : ''}" onclick="switchCategory('all')" data-mkey="all">
          <img src="https://img.icons8.com/color/96/briefcase.png" alt="All Items" loading="lazy">
          <span>All Items</span>
        </div>
      `;
      mobileHTML += keys.map(key => {
        const cat = categoriesData[key];
        return `
          <div class="mobile-cat-item ${key === currentCategory ? 'active' : ''}" onclick="switchCategory('${key}')" data-mkey="${key}">
            <img src="${cldOpt(cat.icon)}" alt="${cat.title}" loading="lazy">
            <span>${cat.title}</span>
          </div>
        `;
      }).join('');
      const mobileCatScrollEl = document.getElementById('mobileCatScroll');
      if (mobileCatScrollEl) mobileCatScrollEl.innerHTML = mobileHTML;
    };

    // --- Scroll Category Slider Helper ---
    window.scrollCategorySlider = function (amount) {
      const track = document.getElementById('categorySliderTrack') || document.querySelector('.slider-track');
      if (track) {
        track.scrollBy({ left: amount, behavior: 'smooth' });
      }
    };

    // --- Switch Category ---
    window.switchCategory = function (key, shouldScroll = true) {
      if (key !== 'all' && !categoriesData[key]) return;
      currentCategory = key;

      // Update sidebar & slider active classes
      document.querySelectorAll('.sidebar-item').forEach(el => {
        el.classList.toggle('active', el.dataset.key === key);
      });
      document.querySelectorAll('.mobile-cat-item').forEach(el => {
        el.classList.toggle('active', el.dataset.mkey === key);
      });

      // Update URL parameters silently
      const url = new URL(window.location);
      url.searchParams.set('category', key);
      window.history.pushState({}, '', url);

      // Render content
      renderContent();

      // Smooth scroll down directly to products catalog
      if (shouldScroll) {
        setTimeout(() => {
          const targetEl = document.getElementById('catalogContainer') || document.getElementById('packagesGrid') || document.querySelector('.content-layout');
          if (targetEl) {
            const yOffset = getScrollOffset();
            const y = targetEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
          }
        }, 50);
      }
    };

    // --- Mega Dropdown Selection & Toggle Helpers ---
    window.selectCategoryFromDropdown = function (key, event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      // Close any open click dropdowns
      document.querySelectorAll('.mega-dropdown').forEach(d => d.classList.remove('force-open'));
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('dropdown-open'));

      // Switch category and scroll to products
      window.switchCategory(key, true);
    };

    window.toggleCorporateDropdown = function (event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      const corpNavItem = document.getElementById('corporateGiftsNavItem') || document.querySelector('.nav-item.mega-right');
      if (corpNavItem) {
        const isCurrentlyOpen = corpNavItem.classList.contains('dropdown-open');
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('dropdown-open'));
        document.querySelectorAll('.mega-dropdown').forEach(d => d.classList.remove('force-open'));

        if (!isCurrentlyOpen) {
          corpNavItem.classList.add('dropdown-open');
          const dropdown = corpNavItem.querySelector('.mega-dropdown');
          if (dropdown) dropdown.classList.add('force-open');
        }
      }
    };

    // Close dropdown on clicking outside
    document.addEventListener('click', function (e) {
      const isInsideNav = e.target.closest('.category-menu-bar') || e.target.closest('.nav-tab-pill.tab-corp');
      if (!isInsideNav) {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('dropdown-open'));
        document.querySelectorAll('.mega-dropdown').forEach(d => d.classList.remove('force-open'));
      }
    });

    // --- Sort By Filter (matches Studio Services page's "Sort by" dropdown) ---
    let filterState = { sort: "popular" };

    function parsePrice(str) {
      return parseInt(String(str).replace(/[^\d]/g, '')) || 0;
    }

    function applyProductSort() {
      const grid = document.getElementById('packagesGrid');
      if (!grid) return;

      // Cache the grid's natural render order the first time it's sorted, so
      // switching back to "Popular" can restore it instead of losing it.
      if (!grid._naturalOrder) {
        grid._naturalOrder = Array.from(grid.children);
      }

      let cards = grid._naturalOrder.slice();
      if (filterState.sort === 'lowToHigh' || filterState.sort === 'highToLow') {
        const dir = filterState.sort === 'lowToHigh' ? 1 : -1;
        cards.sort((a, b) => {
          const priceA = parsePrice(a.querySelector('.p-price')?.textContent || '0');
          const priceB = parsePrice(b.querySelector('.p-price')?.textContent || '0');
          return (priceA - priceB) * dir;
        });
      }
      cards.forEach(card => grid.appendChild(card));
    }

    window.setSortFilter = function (value) {
      filterState.sort = value;
      applyProductSort();
    };

    // --- Render Content Panel ---
    window.renderContent = function () {
      const packagesGridEl = document.getElementById('packagesGrid');
      if (!packagesGridEl) return;
      packagesGridEl._naturalOrder = null; // grid content is about to change - drop the stale sort cache

      // Preserve rich static HTML product cards on 'all' view
      if (currentCategory === 'all' && packagesGridEl.children.length > 0) {
        const catTitleEl = document.getElementById('catTitle');
        const catDescEl = document.getElementById('catDesc');
        if (catTitleEl) catTitleEl.textContent = "All Corporate Gifts";
        if (catDescEl) catDescEl.textContent = "Explore our complete range of customized executive gift sets, welcome kits, corporate diaries, pens, awards, and promotional materials.";
        return;
      }

      let title = "";
      let desc = "";
      let products = [];

      if (currentCategory === 'all') {
        title = "All Corporate Gifts";
        desc = "Explore our complete range of customized executive gift sets, welcome kits, corporate diaries, pens, awards, and promotional materials.";
        const keys = Object.keys(categoriesData);
        keys.forEach(k => {
          products = products.concat(categoriesData[k].products);
        });
      } else {
        const cat = categoriesData[currentCategory];
        title = cat.title;
        desc = cat.desc;
        products = cat.products;
      }

      const catTitleEl = document.getElementById('catTitle');
      const catDescEl = document.getElementById('catDesc');
      if (catTitleEl) catTitleEl.textContent = title;
      if (catDescEl) catDescEl.textContent = desc;

      const seen = new Set();
      const uniqueProducts = [];
      products.forEach(p => {
        if (!seen.has(p.img)) {
          seen.add(p.img);
          uniqueProducts.push(p);
        }
      });

      const productsHTML = uniqueProducts.map((p) => {
        const cleanName = p.name.replace(/'/g, "\\'");
        return `
        <div class="pkg-card fnp-product-card" onclick="orderNowDirect('${cleanName}', '${p.price}', '${p.img}', '${p.id || ''}')">
          <div class="p-thumb">
            <img src="${cldOpt(p.img)}" alt="${p.name}" loading="lazy">
            ${p.oldPrice ? `<span class="p-discount-badge">${Math.round((1 - parsePrice(p.price) / parsePrice(p.oldPrice)) * 100)}% off</span>` : ''}
            <button type="button" class="p-wishlist-btn" aria-label="Save" onclick="event.stopPropagation(); this.classList.toggle('active')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"></path>
              </svg>
            </button>
            <div class="pkg-card-hover-overlay">
              <button class="order-now-hover-btn" onclick="event.stopPropagation(); orderNowDirect('${cleanName}', '${p.price}', '${p.img}', '${p.id || ''}')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Upload Logo & Order
              </button>
            </div>
          </div>
          <div class="p-info">
            <div class="pkg-card-tag-row" style="margin-bottom: 4px;">
              <span class="card-logo-badge" style="font-size: 10px; font-weight: 800; color: #A67C1E; background: rgba(197, 160, 89, 0.18); border: 1px solid rgba(197, 160, 89, 0.4); padding: 2px 8px; border-radius: 6px;">✨ Custom Logo Engraving</span>
            </div>
            <h4 class="p-title">${p.name}</h4>
            <div class="p-price-row">
              <span class="p-price">${p.price}</span>
              ${p.oldPrice ? `<span class="p-old-price">${p.oldPrice}</span>` : ''}
            </div>
          </div>
        </div>
      `;
      }).join('');
      if (packagesGridEl) packagesGridEl.innerHTML = productsHTML;
    };

    window.selectEngraveTechnique = function (btnEl, technique) {
      modalEngravingTechnique = technique;
      document.querySelectorAll('.technique-btn').forEach(b => b.classList.remove('active'));
      if (btnEl) btnEl.classList.add('active');
    };

    // FNP-style "Choose Delivery Preference" pincode check - purely a
    // frontend estimate (no delivery/serviceability backend exists), so it
    // just confirms a valid-looking pincode and refreshes the estimate text.
    window.checkModalDeliveryPincode = function () {
      const input = document.getElementById('modalPincodeInput');
      const estimateEl = document.getElementById('modalDeliveryEstimate');
      if (!input || !estimateEl) return;
      const pincode = input.value.trim();
      if (!/^\d{6}$/.test(pincode)) {
        estimateEl.textContent = 'Please enter a valid 6-digit pincode.';
        return;
      }
      const est = new Date();
      est.setDate(est.getDate() + 3);
      const estDate = est.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short' });
      estimateEl.textContent = `Delivered by ${estDate} to ${pincode}.`;
    };

    window.orderNowDirect = function (name, price, img, productId, opts = {}) {
      window.activeModalProduct = activeModalProduct = { name, price, img, id: productId || null };
      modalSelectedQty = 1;
      modalSelectedColor = "Black";
      currentModalImgIndex = 0;

      // Reset Custom Engraving & Logo Upload State
      modalEngravingText = "";
      modalUploadedLogoData = null;
      modalUploadedLogoFileName = "";
      modalEngravingTechnique = "Laser Engraved";

      const textInput = document.getElementById('engravingTextInput');
      const logoInput = document.getElementById('logoFileInput');
      const previewWrapper = document.getElementById('logoPreviewWrapper');
      const logoErrEl = document.getElementById('logoUploadError');
      if (textInput) textInput.value = "";
      if (logoInput) logoInput.value = "";
      if (previewWrapper) previewWrapper.style.display = 'none';
      if (logoErrEl) logoErrEl.style.display = 'none';

      document.querySelectorAll('.technique-btn').forEach((b, idx) => {
        b.classList.toggle('active', idx === 0);
      });

      activeModalImages = [img];

      const titleEl = document.getElementById('modalProductTitle');
      const priceEl = document.getElementById('modalProductPrice');
      const mainImgEl = document.getElementById('modalMainImg');
      const qtyNumEl = document.getElementById('modalQtyNum');
      const breadcrumbNameEl = document.getElementById('modalBreadcrumbName');
      const productCodeEl = document.getElementById('modalProductCode');
      const pincodeInputEl = document.getElementById('modalPincodeInput');
      const deliveryEstimateEl = document.getElementById('modalDeliveryEstimate');

      if (titleEl) titleEl.textContent = name;
      if (priceEl) priceEl.textContent = price;
      if (breadcrumbNameEl) breadcrumbNameEl.textContent = name;
      if (mainImgEl) mainImgEl.src = cldOpt(img);
      if (qtyNumEl) qtyNumEl.textContent = '1';
      if (productCodeEl) productCodeEl.textContent = productId ? `EXCORP${productId}` : '';
      if (pincodeInputEl) pincodeInputEl.value = '';
      if (deliveryEstimateEl) deliveryEstimateEl.textContent = 'Delivered in 2-3 business days across India.';

      const thumbsContainer = document.getElementById('modalThumbsContainer');
      if (thumbsContainer) {
        thumbsContainer.innerHTML = activeModalImages.map((tImg, idx) => `
          <button class="thumb-btn ${idx === 0 ? 'active' : ''}" onclick="setModalMainImg(${idx})">
            <img src="${cldOpt(tImg)}" alt="Thumb ${idx + 1}">
          </button>
        `).join('');
      }

      switchModalTab('description');

      const overlay = document.getElementById('productDetailOverlay');
      if (overlay) {
        overlay.style.display = 'flex';
        setTimeout(() => {
          overlay.classList.add('active');
        }, 10);
      }
      if (typeof window.updateOrderSummary === 'function') {
        window.updateOrderSummary({ name, price, img }, 1);
      }

      // Reflect the open product in the URL (?openProduct=..&openPrice=..&openImg=..&pid=..)
      // so the address bar is specific to this product, refresh/share/back-button behave
      // sanely, and the existing openProduct deep-link reader (see below) can re-open it.
      // pid is the real database id - included whenever the caller has one - so the link
      // stays unique even if two products share a display name.
      if (!opts.skipHistory) {
        const url = new URL(window.location);
        url.searchParams.set('openProduct', name);
        url.searchParams.set('openPrice', price);
        url.searchParams.set('openImg', img);
        if (productId) url.searchParams.set('pid', productId);
        else url.searchParams.delete('pid');
        window.history.pushState({ corporateProductPreview: true }, '', url);
      }
    };

    window.closeProductDetailModal = function (e) {
      if (e && e.target && e.target.id !== 'productDetailOverlay' && !e.target.classList.contains('close-modal-btn')) {
        return;
      }
      const overlay = document.getElementById('productDetailOverlay');
      if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.style.display = 'none', 300);
      }
      const params = new URLSearchParams(window.location.search);
      if (params.has('openProduct')) {
        const url = new URL(window.location);
        url.searchParams.delete('openProduct');
        url.searchParams.delete('openPrice');
        url.searchParams.delete('openImg');
        url.searchParams.delete('pid');
        window.history.replaceState({}, '', url);
      }
    };

    // Closing the modal via the browser Back button skips closeProductDetailModal() (the
    // URL has already changed by the time this fires) - just tear down the modal UI.
    window.addEventListener('popstate', () => {
      if (activeModalProduct && !new URLSearchParams(window.location.search).has('openProduct')) {
        const overlay = document.getElementById('productDetailOverlay');
        if (overlay) {
          overlay.classList.remove('active');
          setTimeout(() => overlay.style.display = 'none', 300);
        }
        window.activeModalProduct = activeModalProduct = null;
      }
    });

    window.setModalMainImg = function (index) {
      currentModalImgIndex = index;
      const mainImgEl = document.getElementById('modalMainImg');
      if (mainImgEl && activeModalImages[index]) {
        mainImgEl.src = cldOpt(activeModalImages[index]);
      }
      document.querySelectorAll('.thumb-btn').forEach((btn, idx) => {
        btn.classList.toggle('active', idx === index);
      });
    };

    window.navigateModalGallery = function (direction) {
      if (!activeModalImages.length) return;
      currentModalImgIndex = (currentModalImgIndex + direction + activeModalImages.length) % activeModalImages.length;
      setModalMainImg(currentModalImgIndex);
    };

    window.shareModalProduct = function () {
      if (!activeModalProduct) return;
      if (navigator.share) {
        navigator.share({ title: activeModalProduct.name, text: activeModalProduct.price }).catch(() => {});
      } else {
        alert(`${activeModalProduct.name} — ${activeModalProduct.price}`);
      }
    };

    window.switchModalTab = function (tabName) {
      document.querySelectorAll('.modal-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(tabName));
      });
      document.querySelectorAll('.modal-tab-pane').forEach(pane => {
        pane.classList.remove('active');
      });
      const activePane = document.getElementById('tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
      if (activePane) activePane.classList.add('active');
    };

    window.selectModalColor = function (btnEl, colorName) {
      modalSelectedColor = colorName;
      document.querySelectorAll('.color-swatch-btn').forEach(b => b.classList.remove('active'));
      if (btnEl) btnEl.classList.add('active');
    };

    window.adjustModalQty = function (delta) {
      modalSelectedQty = Math.max(1, modalSelectedQty + delta);
      const qtyNumEl = document.getElementById('modalQtyNum');
      if (qtyNumEl) qtyNumEl.textContent = modalSelectedQty;
      if (window.activeModalProduct && typeof window.updateOrderSummary === 'function') {
        window.updateOrderSummary(window.activeModalProduct, modalSelectedQty);
      }
    };

    // Every corporate product leads with the "Custom Logo & Engraving" section as its
    // primary personalization step, so a company name/text OR a logo is required
    // before the item makes sense to fulfil - the technique/color choices below it
    // are just style picks with sensible defaults and never block.
    function corporateEngravingMissing() {
      return !modalEngravingText.trim() && !modalUploadedLogoData;
    }

    function showEngravingRequiredError() {
      const msgEl = document.getElementById('engravingRequiredMsg');
      if (msgEl) {
        msgEl.style.display = 'block';
        msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      const textInput = document.getElementById('engravingTextInput');
      if (textInput) textInput.focus();
    }

    window.updateEngravingText = function (value) {
      modalEngravingText = value;
      const msgEl = document.getElementById('engravingRequiredMsg');
      if (msgEl && !corporateEngravingMissing()) msgEl.style.display = 'none';
    };

    const LOGO_MAX_SIZE_BYTES = 25 * 1024 * 1024;
    const LOGO_ALLOWED_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'pdf'];

    function formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function showLogoUploadError(msg) {
      const errEl = document.getElementById('logoUploadError');
      if (errEl) {
        errEl.textContent = msg;
        errEl.style.display = 'block';
      }
    }

    function clearLogoUploadError() {
      const errEl = document.getElementById('logoUploadError');
      if (errEl) errEl.style.display = 'none';
    }

    function processLogoFile(file) {
      clearLogoUploadError();
      if (!file) return;

      const ext = (file.name.split('.').pop() || '').toLowerCase();
      if (!LOGO_ALLOWED_EXT.includes(ext)) {
        showLogoUploadError('Unsupported file type. Please upload a PNG, JPG, SVG or PDF.');
        return;
      }
      if (file.size > LOGO_MAX_SIZE_BYTES) {
        showLogoUploadError('File is too large. Please upload something under 25MB.');
        return;
      }

      const dropzone = document.querySelector('.logo-upload-dropzone');
      if (dropzone) dropzone.classList.add('uploading');

      const reader = new FileReader();
      reader.onload = function (evt) {
        modalUploadedLogoData = evt.target.result;
        modalUploadedLogoFileName = file.name;

        const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext);
        const previewWrapper = document.getElementById('logoPreviewWrapper');
        const previewImg = document.getElementById('logoPreviewImg');
        const previewFileIcon = document.getElementById('logoPreviewFileIcon');
        const fileNameEl = document.getElementById('logoFileName');
        const fileSizeEl = document.getElementById('logoFileSize');

        if (previewImg && previewFileIcon) {
          if (isImage) {
            previewImg.src = modalUploadedLogoData;
            previewImg.style.display = 'block';
            previewFileIcon.style.display = 'none';
          } else {
            previewImg.style.display = 'none';
            previewFileIcon.style.display = 'flex';
            previewFileIcon.textContent = ext.toUpperCase();
          }
        }
        if (fileNameEl) fileNameEl.textContent = file.name;
        if (fileSizeEl) fileSizeEl.textContent = formatFileSize(file.size);
        if (previewWrapper) previewWrapper.style.display = 'flex';
        if (dropzone) dropzone.classList.remove('uploading');

        const msgEl = document.getElementById('engravingRequiredMsg');
        if (msgEl && !corporateEngravingMissing()) msgEl.style.display = 'none';
      };
      reader.onerror = function () {
        if (dropzone) dropzone.classList.remove('uploading');
        showLogoUploadError('Could not read that file. Please try again.');
      };
      reader.readAsDataURL(file);
    }

    window.handleLogoUpload = function (event) {
      const file = event.target.files && event.target.files[0];
      processLogoFile(file);
    };

    window.handleLogoDragOver = function (event) {
      event.preventDefault();
      event.currentTarget.classList.add('drag-active');
    };

    window.handleLogoDragLeave = function (event) {
      event.currentTarget.classList.remove('drag-active');
    };

    window.handleLogoDrop = function (event) {
      event.preventDefault();
      event.currentTarget.classList.remove('drag-active');
      const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      processLogoFile(file);
    };

    window.removeUploadedLogo = function (event) {
      if (event) event.stopPropagation();
      modalUploadedLogoData = null;
      modalUploadedLogoFileName = "";
      clearLogoUploadError();

      const logoInput = document.getElementById('logoFileInput');
      const previewWrapper = document.getElementById('logoPreviewWrapper');
      if (logoInput) logoInput.value = '';
      if (previewWrapper) previewWrapper.style.display = 'none';
    };

    window.addModalItemToCart = function () {
      if (!activeModalProduct) return;
      if (corporateEngravingMissing()) { showEngravingRequiredError(); return; }
      updateCartQty(
        activeModalProduct.name,
        modalSelectedQty,
        activeModalProduct.price,
        activeModalProduct.img,
        {
          engravingText: modalEngravingText,
          logoName: modalUploadedLogoFileName,
          logoData: modalUploadedLogoData,
          technique: modalEngravingTechnique,
          color: modalSelectedColor
        },
        {
          label: 'Add your company name or upload a logo',
          fields: ['engravingText', 'logoData'],
          editUrl: `corporate.html?openProduct=${encodeURIComponent(activeModalProduct.name)}&openPrice=${encodeURIComponent(activeModalProduct.price)}&openImg=${encodeURIComponent(activeModalProduct.img)}${activeModalProduct.id ? `&pid=${encodeURIComponent(activeModalProduct.id)}` : ''}`
        },
        activeModalProduct.id
      );
      closeProductDetailModal();
      // No per-page cart drawer anymore - the cart badge (updated via updateCartQty
      // above) is the confirmation; the nav cart icon goes straight to cart.html,
      // which is the one real cart everywhere on the site.
    };

    window.modalBuyNowWhatsApp = function () {
      if (!activeModalProduct) return;
      if (corporateEngravingMissing()) { showEngravingRequiredError(); return; }
      updateCartQty(
        activeModalProduct.name,
        modalSelectedQty,
        activeModalProduct.price,
        activeModalProduct.img,
        {
          engravingText: modalEngravingText,
          logoName: modalUploadedLogoFileName,
          logoData: modalUploadedLogoData,
          technique: modalEngravingTechnique,
          color: modalSelectedColor
        },
        {
          label: 'Add your company name or upload a logo',
          fields: ['engravingText', 'logoData'],
          editUrl: `corporate.html?openProduct=${encodeURIComponent(activeModalProduct.name)}&openPrice=${encodeURIComponent(activeModalProduct.price)}&openImg=${encodeURIComponent(activeModalProduct.img)}${activeModalProduct.id ? `&pid=${encodeURIComponent(activeModalProduct.id)}` : ''}`
        },
        activeModalProduct.id
      );
      closeProductDetailModal();
      checkoutWhatsApp();
    };

    // --- Cart System ---
    window.getCart = function () {
      try {
        return JSON.parse(localStorage.getItem('sai_studio_cart')) || {};
      } catch (e) {
        return {};
      }
    };

    window.saveCart = function (cart) {
      localStorage.setItem('sai_studio_cart', JSON.stringify(cart));
      updateCartUI();
    };

    window.getCartQty = function (productName) {
      const cart = getCart();
      return cart[productName] ? cart[productName].qty : 0;
    };

    window.updateCartQty = function (productName, delta, priceStr = '', imgUrl = '', customization = null, requirement = null, productId = null) {
      const cart = getCart();
      if (!cart[productName]) {
        cart[productName] = {
          name: productName,
          product_id: productId || null,
          qty: 0,
          price: priceStr,
          img: imgUrl,
          customization: customization || null,
          requirement: requirement || null
        };
      }
      if (customization) {
        cart[productName].customization = customization;
      }
      if (requirement) {
        cart[productName].requirement = requirement;
      }
      cart[productName].qty += delta;
      if (cart[productName].qty <= 0) {
        delete cart[productName];
      }
      saveCart(cart);
      renderContent();
    };

    window.updateCartUI = function () {
      const cart = getCart();
      const items = Object.values(cart);
      let totalQty = 0;
      let totalPrice = 0;
      let firstItem = null;

      items.forEach(item => {
        totalQty += item.qty;
        const priceNum = parseInt(item.price.replace(/[^\d]/g, '')) || 0;
        totalPrice += priceNum * item.qty;
        if (!firstItem) firstItem = item;
      });

      // Update Header Cart Badges
      const navBadge = document.getElementById('navCartBadge');
      if (navBadge) {
        navBadge.textContent = totalQty;
        navBadge.style.display = totalQty > 0 ? 'inline-flex' : 'none';
      }
      const cartPriceEl = document.querySelector('.nav-cart-price');
      if (cartPriceEl) {
        cartPriceEl.textContent = `${totalQty} ${totalQty === 1 ? 'item' : 'items'}`;
      }
      const globalCartBadge = document.getElementById('globalHeaderCartBadge');
      if (globalCartBadge) {
        globalCartBadge.textContent = totalQty;
      }

      // Update Mobile Floating Cart Bar (ONLY ON MOBILE SCREENS <= 768px)
      const mobileBar = document.getElementById('mobileCartBar');
      if (mobileBar) {
        if (totalQty > 0 && window.innerWidth <= 768) {
          mobileBar.style.display = 'flex';
          const barQty = document.getElementById('cartBarQty');
          if (barQty) {
            barQty.textContent = `${totalQty} ${totalQty === 1 ? 'item' : 'items'} • ₹${totalPrice}`;
          }
          const barThumb = document.getElementById('cartBarThumb');
          if (barThumb && firstItem) {
            barThumb.src = cldOpt(firstItem.img);
          }
        } else {
          mobileBar.style.display = 'none';
        }
      }

      // Update Cart Drawer Contents
      const drawerItemsContainer = document.getElementById('cartDrawerItems');
      const subtotalEl = document.getElementById('cartSubtotalValue');
      if (drawerItemsContainer) {
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
          drawerItemsContainer.innerHTML = items.map(item => {
            const cust = item.customization;
            let custBadgeHTML = '';
            if (cust && (cust.engravingText || cust.logoName)) {
              const textStr = cust.engravingText ? `Text: "${cust.engravingText}"` : '';
              const logoStr = cust.logoName ? `Logo: ${cust.logoName}` : '';
              const detailsStr = [textStr, logoStr].filter(Boolean).join(' • ');
              custBadgeHTML = `<div class="cart-customization-badge">✨ Custom ${cust.technique || 'Engraved'}: ${detailsStr}</div>`;
            }
            const cleanItemName = item.name.replace(/'/g, "\\'");
            return `
              <div class="cart-drawer-item">
                <img class="cart-drawer-item-img" src="${cldOpt(item.img)}" alt="${item.name}">
                <div class="cart-drawer-item-info">
                  <h5>${item.name}</h5>
                  <p>${item.price} each</p>
                  ${custBadgeHTML}
                </div>
                <div class="quantity-selector" style="height: 24px; min-width: 72px;">
                  <button class="qty-btn" onclick="updateCartQty('${cleanItemName}', -1, '${item.price}', '${item.img}')">-</button>
                  <span class="qty-count">${item.qty}</span>
                  <button class="qty-btn" onclick="updateCartQty('${cleanItemName}', 1, '${item.price}', '${item.img}')">+</button>
                </div>
              </div>
            `;
          }).join('');
          if (subtotalEl) subtotalEl.textContent = `₹${totalPrice}`;
        }
      }
    };

    window.openCartDrawer = function () {
      const drawer = document.getElementById('cartDrawer');
      const overlay = document.getElementById('cartDrawerOverlay');
      if (drawer) drawer.classList.add('open');
      if (overlay) overlay.style.display = 'block';
      updateCartUI();
    };

    window.closeCartDrawer = function () {
      const drawer = document.getElementById('cartDrawer');
      const overlay = document.getElementById('cartDrawerOverlay');
      if (drawer) drawer.classList.remove('open');
      if (overlay) overlay.style.display = 'none';
    };

    // --- Order Summary Dynamic Sync Engine ---
    window.updateOrderSummary = function (productOrItems, qty = 1) {
      let items = [];
      if (Array.isArray(productOrItems)) {
        items = productOrItems;
      } else if (productOrItems && typeof productOrItems === 'object') {
        items = [{
          name: productOrItems.name || 'Selected Product',
          price: productOrItems.price || '₹0',
          img: productOrItems.img || '',
          qty: qty || productOrItems.qty || 1,
          customization: productOrItems.customization || null
        }];
      } else if (window.activeModalProduct) {
        items = [{
          name: window.activeModalProduct.name,
          price: window.activeModalProduct.price,
          img: window.activeModalProduct.img,
          qty: window.modalSelectedQty || 1,
          customization: {
            engravingText: window.modalEngravingText,
            logoName: window.modalUploadedLogoFileName,
            technique: window.modalEngravingTechnique,
            color: window.modalSelectedColor
          }
        }];
      }

      if (items.length === 0) return;

      let subtotal = 0;
      items.forEach(it => {
        const unitP = parseInt(String(it.price).replace(/[^\d]/g, '')) || 0;
        subtotal += unitP * (it.qty || 1);
      });

      const deliveryFee = 50;
      const total = subtotal + deliveryFee;

      const productDetailsContainer = document.querySelector('.checkout-summary-section .product-details') || document.querySelector('.product-details');
      if (productDetailsContainer) {
        if (items.length > 1) {
          productDetailsContainer.innerHTML = items.map(it => `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; width: 100%;">
              <img src="${cldOpt(it.img || 'https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/corporate_assets/welcome_kit.jpg')}" alt="${it.name}" style="width: 56px; height: 56px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb;">
              <div style="flex: 1;">
                <h4 style="margin: 0; font-size: 13.5px; font-weight: 700; color: #1f2937;">${it.name}</h4>
                <p style="margin: 2px 0 0; font-size: 12px; color: #6b7280;">Qty: ${it.qty || 1}</p>
                ${it.customization && it.customization.engravingText ? `<span style="font-size: 11px; color: #a87126; display: block;">Custom Text: "${it.customization.engravingText}"</span>` : ''}
              </div>
              <div style="font-weight: 700; color: #1f2937; font-size: 14px;">${it.price}</div>
            </div>
          `).join('');
        } else {
          const first = items[0];
          productDetailsContainer.innerHTML = `
            <div class="product-thumb">
              <img id="checkoutProductImg" src="${cldOpt(first.img || 'https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/corporate_assets/welcome_kit.jpg')}" alt="${first.name}" style="width: 72px; height: 72px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb;">
            </div>
            <div class="product-info" style="flex: 1; margin-left: 12px;">
              <h3 id="checkoutProductName" style="margin: 0; font-size: 14px; font-weight: 700; color: #1f2937;">${first.name}</h3>
              <p class="qty" id="checkoutProductQty" style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">Qty: ${first.qty || 1}</p>
              ${first.customization && first.customization.engravingText ? `<span style="font-size: 11px; color: #a87126; display: block; margin-top: 2px;">Custom Text: "${first.customization.engravingText}"</span>` : ''}
            </div>
            <div class="product-price" id="checkoutProductPrice" style="font-weight: 700; font-size: 15px; color: #1f2937;">${first.price}</div>
          `;
        }
      }

      const subtotalEl = document.getElementById('checkoutSubtotalPrice');
      const totalEl = document.getElementById('checkoutTotalPrice');
      if (subtotalEl) subtotalEl.textContent = '₹' + subtotal.toLocaleString('en-IN');
      if (totalEl) totalEl.textContent = '₹' + total.toLocaleString('en-IN');
    };

    window.checkoutWhatsApp = function () {
      const cart = getCart();
      const items = Object.values(cart);
      
      if (items.length > 0) {
        window.activeCheckoutItems = items;
        window.updateOrderSummary(items);
      } else if (window.activeModalProduct) {
        const directItem = {
          name: window.activeModalProduct.name,
          price: window.activeModalProduct.price,
          img: window.activeModalProduct.img,
          qty: window.modalSelectedQty || 1,
          customization: {
            engravingText: window.modalEngravingText,
            logoName: window.modalUploadedLogoFileName,
            technique: window.modalEngravingTechnique,
            color: window.modalSelectedColor
          }
        };
        window.activeCheckoutItems = [directItem];
        window.updateOrderSummary([directItem]);
      } else {
        return;
      }
      
      closeCartDrawer();
      // Show the checkout form modal
      const modal = document.getElementById('checkoutFormModal');
      if (modal) {
        modal.style.display = 'flex';
      }
    };

    window.closeCheckoutModal = function () {
      const modal = document.getElementById('checkoutFormModal');
      if (modal) {
        modal.style.display = 'none';
      }
    };

    // Add submit handler for checkout form
    document.addEventListener('DOMContentLoaded', () => {
      const form = document.getElementById('orderCheckoutForm') || document.getElementById('checkoutForm');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const formData = new FormData(form);
          const customerName = formData.get('name') || document.getElementById('customerName')?.value || '';
          const phone = formData.get('phone') || document.getElementById('customerPhone')?.value || '';
          const address = formData.get('address') || document.getElementById('customerAddress')?.value || '';
          const email = formData.get('email') || document.getElementById('customerEmail')?.value || '';
          const notes = formData.get('notes') || document.getElementById('specialInstructions')?.value || '';

          let items = (window.activeCheckoutItems && window.activeCheckoutItems.length > 0)
            ? window.activeCheckoutItems
            : (window.activeModalProduct ? [{
                name: window.activeModalProduct.name,
                price: window.activeModalProduct.price,
                img: window.activeModalProduct.img,
                qty: window.modalSelectedQty || 1,
                customization: {
                  engravingText: window.modalEngravingText,
                  logoName: window.modalUploadedLogoFileName,
                  technique: window.modalEngravingTechnique,
                  color: window.modalSelectedColor
                }
              }] : Object.values(getCart()));

          if (items.length === 0) {
            alert('Please select a product first.');
            return;
          }

          let message = `Hello Sai Kumar Digital Lab & Studio, I would like to place an order:\n\n*Customer Details:*\nName: ${customerName}\nPhone: ${phone}\nAddress: ${address}\nEmail: ${email}\nNotes: ${notes}\n\n*Order Summary:*\n`;
          let subtotal = 0;
          items.forEach(item => {
            const itemPrice = parseInt(String(item.price).replace(/[^\d]/g, '')) || 0;
            const itemSub = itemPrice * (item.qty || 1);
            subtotal += itemSub;
            message += `• ${item.name} (Qty: ${item.qty || 1}) - ₹${itemSub}\n`;
            if (item.customization) {
              const c = item.customization;
              if (c.engravingText) message += `   ↳ Engraved Text: "${c.engravingText}"\n`;
              if (c.logoName) message += `   ↳ Uploaded Logo: ${c.logoName}\n`;
              if (c.technique) message += `   ↳ Technique: ${c.technique}\n`;
              if (c.color) message += `   ↳ Color: ${c.color}\n`;
            }
          });
          const deliveryFee = 50;
          const total = subtotal + deliveryFee;
          message += `\n*Subtotal: ₹${subtotal}*\n*Delivery Fee: ₹${deliveryFee}*\n*Total Amount: ₹${total}*`;

          // Try sending to backend
          try {
            await fetch('http://localhost:8000/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                product_name: items[0]?.name || "Corporate Order",
                quantity: items.reduce((acc, it) => acc + (it.qty || 1), 0),
                price: total.toString(),
                image_url: items[0]?.img || "",
                customization: { customerName, phone, email, address, notes, items }
              })
            });
          } catch(err) {
            console.warn("Backend unavailable, continuing to WhatsApp.");
          }

          const encodedMessage = encodeURIComponent(message);
          const whatsappURL = `https://wa.me/919849233501?text=${encodedMessage}`;
          window.open(whatsappURL, '_blank');
          
          closeCheckoutModal();
        });
      }
    });

    // --- 2-Up Sliding Hero Carousel (2 slides visible at once, matches Studio Services page) ---
    const HERO_SLIDES_VISIBLE = 2;
    let currentHeroSlide = 0; // logical index over the 10 real slides (the 2 clone slides are excluded)
    let heroMaxSlideIndex = 0;
    let heroSlideInterval = null;
    let isHeroTransitioning = false;

    function getHeroStepPx() {
      const track = document.getElementById('heroRailTrack');
      const first = track ? track.querySelector('.slide') : null;
      if (!track || !first) return 0;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return first.getBoundingClientRect().width + gap;
    }

    function updateHeroActiveState() {
      const slides = document.querySelectorAll('#heroRailTrack .slide');
      slides.forEach((slide, extIndex) => {
        const realIndex = extIndex - 1; // shift past the prepended clone slot
        slide.classList.toggle('active', realIndex === currentHeroSlide || realIndex === currentHeroSlide + 1);
      });

      const dotSpan = heroMaxSlideIndex + 1;
      const dotIndex = ((currentHeroSlide % dotSpan) + dotSpan) % dotSpan;
      document.querySelectorAll('.hero-ctrl .dots button').forEach((dot, i) => {
        const on = i === dotIndex;
        dot.classList.toggle('on', on);
        dot.classList.toggle('active', on);
      });
    }

    window.showHeroSlide = function (index, immediate = false) {
      const track = document.getElementById('heroRailTrack');
      const slides = document.querySelectorAll('#heroRailTrack .slide');
      if (!track || !slides.length) return;

      const realCount = slides.length - 2; // exclude the prepend/append clone slides
      heroMaxSlideIndex = Math.max(0, realCount - HERO_SLIDES_VISIBLE);
      currentHeroSlide = index;

      const extIndex = currentHeroSlide + 1; // +1 to land past the prepended clone slot
      const step = getHeroStepPx();

      if (immediate) {
        track.classList.remove('is-sliding');
        track.style.transition = 'none';
        track.style.transform = `translateX(-${extIndex * step}px)`;
        void track.offsetWidth; // Force layout
        track.style.transition = '';
        updateHeroActiveState();
        return;
      }

      if (isHeroTransitioning) return;
      isHeroTransitioning = true;

      // Enable CSS transition for smooth carousel movement
      track.classList.add('is-sliding');
      track.style.transform = `translateX(-${extIndex * step}px)`;
      updateHeroActiveState();

      const handleTransitionEnd = (e) => {
        if (e && e.target !== track) return;
        track.removeEventListener('transitionend', handleTransitionEnd);
        track.classList.remove('is-sliding');

        if (currentHeroSlide > heroMaxSlideIndex) {
          // Reached the appended clone pair - content is identical to index 0,
          // so resetting here (transition disabled) is invisible.
          track.style.transition = 'none';
          currentHeroSlide = 0;
          track.style.transform = `translateX(-${(currentHeroSlide + 1) * getHeroStepPx()}px)`;
          void track.offsetWidth; // Force layout sync
          track.style.transition = '';
        } else if (currentHeroSlide < 0) {
          // Reached the prepended clone pair - content is identical to the last
          // valid index, so resetting here is invisible.
          track.style.transition = 'none';
          currentHeroSlide = heroMaxSlideIndex;
          track.style.transform = `translateX(-${(currentHeroSlide + 1) * getHeroStepPx()}px)`;
          void track.offsetWidth;
          track.style.transition = '';
        }
        isHeroTransitioning = false;
      };

      track.addEventListener('transitionend', handleTransitionEnd);

      // Fallback safety timeout in case browser skips transitionend
      setTimeout(() => {
        if (isHeroTransitioning) {
          handleTransitionEnd({ target: track });
        }
      }, 900);
    };

    window.moveHeroSlide = function (step) {
      if (isHeroTransitioning) return;
      showHeroSlide(currentHeroSlide + step);
      resetHeroAutoplay();
    };

    window.setHeroSlide = function (dotIndex) {
      if (isHeroTransitioning) return;
      showHeroSlide(dotIndex);
      resetHeroAutoplay();
    };

    function resetHeroAutoplay() {
      if (heroSlideInterval) clearInterval(heroSlideInterval);
      heroSlideInterval = setInterval(() => {
        moveHeroSlide(1);
      }, 3800);
    }

    function pauseHeroAutoplay() {
      if (heroSlideInterval) clearInterval(heroSlideInterval);
    }

    function initSliderEvents() {
      const section = document.getElementById('heroZone') || document.getElementById('heroSliderSection');
      if (!section) return;

      section.addEventListener('mouseenter', pauseHeroAutoplay);
      section.addEventListener('mouseleave', resetHeroAutoplay);

      // Touch Swipe Support for Mobile & Tablet
      let touchStartX = 0;
      let touchEndX = 0;

      section.addEventListener('touchstart', (e) => {
        pauseHeroAutoplay();
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      section.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 40) {
          moveHeroSlide(1); // Swipe Left -> Next Slide
        } else if (touchEndX - touchStartX > 40) {
          moveHeroSlide(-1); // Swipe Right -> Prev Slide
        } else {
          resetHeroAutoplay();
        }
      }, { passive: true });

      // Initialize track at the first real slide pair
      showHeroSlide(0, true);
    }

    // Keep the 2-up carousel aligned when the viewport (and slide width) changes
    window.addEventListener('resize', () => showHeroSlide(currentHeroSlide, true));

    // Auto-start the continuous hero slider
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        initSliderEvents();
        resetHeroAutoplay();
      });
    } else {
      initSliderEvents();
      resetHeroAutoplay();
    }

    // --- Sticky Sidebar Initializer (CSS Sticky) ---
    function initStickySidebarScroll() {
      const sidebar = document.querySelector('.sidebar');
      const productsPanel = document.querySelector('.products-panel');
      if (sidebar) {
        sidebar.style.position = '';
        sidebar.style.top = '';
        sidebar.style.bottom = '';
        sidebar.classList.remove('is-fixed-sticky');
      }
      if (productsPanel) {
        productsPanel.style.marginLeft = '0px';
      }
    }

    const studioState = {
      mode: 'catalog', // 'catalog' or 'upload'
      productName: 'Smart Temperature LED Bottle',
      productImgSrc: 'https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/corporate_assets/water%20bottle%2005.jpg',
      logoX: 300,
      logoY: 260,
      logoScale: 1.0,
      logoRotate: 0,
      text: '',
      textX: 300,
      textY: 380,
      font: 'Outfit',
      textColor: '#d4af37',
      effect: 'engrave', // 'engrave', 'uv_print', 'gold_foil', 'embroidery'
      showOriginal: false,
      qty: 10,
      isDragging: false,
      activeDragItem: null, // 'logo' or 'text'
      dragOffsetX: 0,
      dragOffsetY: 0
    };

    let studioCanvas = null;
    let studioCtx = null;
    let bgImageObj = null;

    window.openAIStudioModal = function () {
      const modal = document.getElementById('aiStudioModal');
      if (!modal) return;
      modal.style.display = 'flex';

      setTimeout(() => {
        initStudioCanvas();
      }, 50);
    };

    window.closeAIStudioModal = function () {
      const modal = document.getElementById('aiStudioModal');
      if (modal) modal.style.display = 'none';
    };

    window.switchProductSource = function (source) {
      studioState.mode = source;
      const btnCatalog = document.getElementById('btnSourceCatalog');
      const btnUpload = document.getElementById('btnSourceUpload');
      const catalogPane = document.getElementById('catalogSelectView');
      const uploadPane = document.getElementById('uploadOwnView');

      if (source === 'catalog') {
        if (btnCatalog) btnCatalog.classList.add('active');
        if (btnUpload) btnUpload.classList.remove('active');
        if (catalogPane) catalogPane.style.display = 'block';
        if (uploadPane) uploadPane.style.display = 'none';
        if (!studioState.customProductImg) {
          window.selectPresetProduct('bottle', 'https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/corporate_assets/water%20bottle%2005.jpg', 'Smart Temperature LED Bottle');
        } else {
          renderCanvas();
        }
      } else {
        if (btnUpload) btnUpload.classList.add('active');
        if (btnCatalog) btnCatalog.classList.remove('active');
        if (uploadPane) uploadPane.style.display = 'block';
        if (catalogPane) catalogPane.style.display = 'none';
        if (studioState.customProductImg) {
          loadBgImage(studioState.customProductImg.src);
        } else {
          renderCanvas();
        }
      }
    };

    window.selectPresetProduct = function (key, imgSrc, name) {
      studioState.productName = name;
      studioState.productImgSrc = imgSrc;

      const nameInput = document.getElementById('studioProductNameInput');
      if (nameInput) nameInput.value = name;

      // Auto-Position Logo in Optimal Print Zone (1-Click Instant Branding)
      const printPositions = {
        bottle: { x: 300, y: 260 },
        diary: { x: 300, y: 260 },
        mug: { x: 300, y: 275 },
        keychain: { x: 300, y: 280 },
        trophy: { x: 300, y: 310 }
      };
      const pos = printPositions[key] || { x: 300, y: 260 };
      studioState.logoX = pos.x;
      studioState.logoY = pos.y;

      const prices = {
        bottle: 699,
        diary: 499,
        mug: 399,
        keychain: 149,
        trophy: 999
      };
      studioState.productBasePrice = prices[key] || 699;

      document.querySelectorAll('.preset-card').forEach(card => card.classList.remove('active'));
      if (event && event.currentTarget) event.currentTarget.classList.add('active');

      loadBgImage(imgSrc);
      window.recalculateStudioPrice();
    };

    // Visual AI Pixel Analyzer: Photo Frame & Pillow Detector with Product Whitelist
    function detectVisualFrameOrPillow(img, fileName) {
      try {
        const lowerName = (fileName || '').toLowerCase();

        // 1. ALLOWED PRODUCT WHITELIST (Instant Pass for Mugs, Bottles, T-Shirts, Diaries, Keychains, Bags, Trophies)
        const allowedKeywords = ['mug', 'cup', 'bottle', 'flask', 'tshirt', 'shirt', 'diary', 'pen', 'keychain', 'bag', 'trophy', 'box', 'gift'];
        for (const kw of allowedKeywords) {
          if (lowerName.includes(kw)) {
            return false; // Allowed! Do not reject.
          }
        }

        // 2. DISALLOWED PRODUCT BLACKLIST (Instant Reject for Pillows, Cushions, Frames)
        const forbiddenKeywords = ['pillow', 'cushion', 'frame', 'photoframe', 'wallframe', 'photo_frame', 'portrait', 'bedsheet', 'blanket', 'curtain', 'poster', 'collage', 'painting', 'wall_art', 'picture_frame'];
        for (const kw of forbiddenKeywords) {
          if (lowerName.includes(kw)) {
            return true; // Reject!
          }
        }

        // 3. VISUAL PIXEL FRAME DETECTION (For generic filenames like Screenshot)
        const isScreenshot = lowerName.includes('screenshot') || lowerName.includes('capture') || lowerName.includes('untitled');

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const w = 200;
        const h = Math.max(100, Math.round((img.height / img.width) * 200));
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);

        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        let darkBorderPixels = 0;
        let horizLines = 0;
        let vertLines = 0;

        for (let y = 10; y < h - 10; y += 4) {
          for (let x = 10; x < w - 10; x += 4) {
            const i = (y * w + x) * 4;
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            if (brightness < 60) {
              darkBorderPixels++;
            }
          }
        }

        // Horizontal & Vertical straight edge scanner (signature of photo frame borders)
        for (let y = 15; y < h - 15; y += 8) {
          let run = 0;
          for (let x = 15; x < w - 15; x += 3) {
            const i = (y * w + x) * 4;
            const b = (data[i] + data[i + 1] + data[i + 2]) / 3;
            if (b < 60) run++;
            else {
              if (run >= 5) horizLines++;
              run = 0;
            }
          }
        }

        for (let x = 15; x < w - 15; x += 8) {
          let run = 0;
          for (let y = 15; y < h - 15; y += 3) {
            const i = (y * w + x) * 4;
            const b = (data[i] + data[i + 1] + data[i + 2]) / 3;
            if (b < 60) run++;
            else {
              if (run >= 5) vertLines++;
              run = 0;
            }
          }
        }

        // Only reject if it has strong photo frame characteristics AND generic screenshot name
        if (isScreenshot && darkBorderPixels > 120 && horizLines > 4 && vertLines > 4) {
          return true;
        }

        return false;
      } catch (err) {
        return false;
      }
    }

    window.handleCustomProductUpload = function (e) {
      const file = e.target.files[0];
      if (!file) return;

      // Show Scanning UI State
      const scanTag = document.getElementById('customProductScanTag');
      const errTag = document.getElementById('customProductErrorTag');
      const infoTag = document.getElementById('customProductInfo');
      if (scanTag) scanTag.style.display = 'flex';
      if (errTag) errTag.style.display = 'none';
      if (infoTag) infoTag.style.display = 'none';

      const reader = new FileReader();
      reader.onload = function (evt) {
        const img = new Image();
        img.onload = function () {
          if (scanTag) scanTag.style.display = 'none';

          // Perform Ultra-Strict Visual AI Inspection
          const isFrameOrPillow = detectVisualFrameOrPillow(img, file.name);

          if (isFrameOrPillow) {
            const errMsg = document.getElementById('customProductErrorMsg');
            if (errMsg) {
              errMsg.textContent = `🚫 UPLOAD REJECTED (PHOTO FRAME / PILLOW DETECTED): Photo frames, pillows, and wall decor are STRICTLY NOT ALLOWED for custom branding. Please upload a clear photo of a bottle, mug, t-shirt, diary, pen, bag, or trophy.`;
            }
            if (errTag) errTag.style.display = 'flex';
            e.target.value = ''; // Reset file input
            return;
          }

          if (img.width < 200 || img.height < 200) {
            const errMsg = document.getElementById('customProductErrorMsg');
            if (errMsg) errMsg.textContent = `❌ Low Clarity / Resolution: Image must be clear and at least 200x200 pixels.`;
            if (errTag) errTag.style.display = 'flex';
            e.target.value = '';
            return;
          }

          const aspect = img.width / img.height;
          if (aspect > 2.8 || aspect < 0.35) {
            const errMsg = document.getElementById('customProductErrorMsg');
            if (errMsg) errMsg.textContent = `❌ Unclear Product Image: The uploaded image shape is unclear. Please upload a clear, centered photo of a valid product.`;
            if (errTag) errTag.style.display = 'flex';
            e.target.value = '';
            return;
          }

          // --- ACCEPTED VALID PRODUCT ---
          studioState.customProductImg = img;
          studioState.productName = 'Custom Product (' + file.name.replace(/\.[^/.]+$/, '') + ')';

          const nameInput = document.getElementById('studioProductNameInput');
          if (nameInput) nameInput.value = studioState.productName;

          const fileNameSpan = document.getElementById('customProductFileName');
          if (infoTag) infoTag.style.display = 'flex';
          if (fileNameSpan) fileNameSpan.textContent = '✓ AI Verified Product: ' + file.name;

          loadBgImage(evt.target.result);
        };
        img.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    };

    window.dismissCustomProductError = function () {
      const errTag = document.getElementById('customProductErrorTag');
      if (errTag) errTag.style.display = 'none';
    };

    window.resetCustomProduct = function () {
      studioState.customProductImg = null;
      const infoTag = document.getElementById('customProductInfo');
      const input = document.getElementById('customProductInput');
      if (infoTag) infoTag.style.display = 'none';
      if (input) input.value = '';
      window.switchProductSource('catalog');
    };

    // Automatic Logo Background Removal & AI Auto-Centering
    function removeLogoBackground(img, callback) {
      try {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        tempCtx.drawImage(img, 0, 0);

        const imgData = tempCtx.getImageData(0, 0, img.width, img.height);
        const data = imgData.data;

        // Sample corner pixels to detect solid background color
        const bgR = data[0];
        const bgG = data[1];
        const bgB = data[2];

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
          const isNearWhite = (r > 230 && g > 230 && b > 230);

          if (diff < 45 || isNearWhite) {
            data[i + 3] = 0; // Make background transparent
          }
        }

        tempCtx.putImageData(imgData, 0, 0);
        const cleanImg = new Image();
        cleanImg.onload = function () {
          callback(cleanImg);
        };
        cleanImg.src = tempCanvas.toDataURL();
      } catch (err) {
        callback(img);
      }
    }

    function calculateProductCenter() {
      if (!studioCanvas) return { x: 300, y: 270 };
      const width = studioCanvas.width;
      const height = studioCanvas.height;

      if (bgImageObj) {
        const scale = Math.min((width - 40) / bgImageObj.width, (height - 40) / bgImageObj.height);
        const nw = bgImageObj.width * scale;
        const nh = bgImageObj.height * scale;
        const nx = (width - nw) / 2;
        const ny = (height - nh) / 2;

        return {
          x: nx + nw / 2,
          y: ny + nh / 2.05 // Exact optical center of product
        };
      }
      return { x: 300, y: 270 };
    }

    window.handleStudioLogoUpload = function (e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (evt) {
        const rawImg = new Image();
        rawImg.onload = function () {
          // Run AI Auto-Background Removal & Auto-Centering
          removeLogoBackground(rawImg, function (cleanLogoImg) {
            studioState.logoImg = cleanLogoImg;

            // Automatically fix logo at EXACT CENTER of product
            const center = calculateProductCenter();
            studioState.logoX = center.x;
            studioState.logoY = center.y;
            studioState.logoScale = 1.0;
            studioState.logoRotate = 0;

            const statusSpan = document.getElementById('studioLogoStatus');
            const controlsDiv = document.getElementById('studioLogoControls');
            if (statusSpan) statusSpan.textContent = '✓ Logo Auto-Centered: ' + file.name;
            if (controlsDiv) controlsDiv.style.display = 'flex';

            renderCanvas();
            runAIDesignAudit();
          });
        };
        rawImg.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    };

    window.updateLogoScale = function (val) {
      studioState.logoScale = parseFloat(val) / 100;
      renderCanvas();
    };

    window.updateLogoRotate = function (val) {
      studioState.logoRotate = parseFloat(val);
      renderCanvas();
    };

    window.updateStudioText = function (val) {
      studioState.text = val;
      renderCanvas();
      runAIDesignAudit();
    };

    window.updateStudioFont = function (font) {
      studioState.font = font;
      renderCanvas();
    };

    window.updateStudioTextColor = function (color) {
      studioState.textColor = color;
      const hexSpan = document.getElementById('colorHexText');
      if (hexSpan) hexSpan.textContent = color.toUpperCase();
      renderCanvas();
      runAIDesignAudit();
    };

    window.setStudioEffect = function (effect, btnEl) {
      studioState.effect = effect;
      document.querySelectorAll('.tech-card').forEach(card => card.classList.remove('active'));
      if (btnEl) btnEl.classList.add('active');

      const simText = document.getElementById('aiSimText');
      const effectNames = {
        engrave: 'Laser Engraving Finish (Laser Etched Specular Metallics)',
        uv_print: 'UV Digital Print Finish (High Gloss Full Color)',
        gold_foil: 'Gold Foil Emboss Finish (Reflective Metallic Sheen)',
        embroidery: 'Embroidery Stitching Finish (Tactile Thread Texture)'
      };
      if (simText) simText.innerHTML = `AI Mockup Engine: Simulating <strong>${effectNames[effect]}</strong> on product surface`;

      renderCanvas();
      runAIDesignAudit();
    };

    window.resetCanvasTransform = function () {
      studioState.logoX = 300;
      studioState.logoY = 240;
      studioState.logoScale = 1.0;
      studioState.logoRotate = 0;
      studioState.textX = 300;
      studioState.textY = 380;

      const scaleSlider = document.getElementById('logoScaleSlider');
      const rotateSlider = document.getElementById('logoRotateSlider');
      if (scaleSlider) scaleSlider.value = 100;
      if (rotateSlider) rotateSlider.value = 0;

      renderCanvas();
    };

    window.centerCanvasDesign = function () {
      studioState.logoX = 300;
      studioState.logoY = 240;
      studioState.textX = 300;
      studioState.textY = 380;
      renderCanvas();
    };

    window.toggleBeforeAfter = function () {
      studioState.showOriginal = !studioState.showOriginal;
      const btn = document.getElementById('btnToggleCompare');
      if (btn) {
        btn.textContent = studioState.showOriginal ? '✨ Show AI Mockup' : '👁️ View Original';
      }
      renderCanvas();
    };

    function initStudioCanvas() {
      studioCanvas = document.getElementById('studioCanvas');
      if (!studioCanvas) return;
      studioCtx = studioCanvas.getContext('2d');

      // Attach Drag Listeners
      studioCanvas.addEventListener('mousedown', handleCanvasMouseDown);
      studioCanvas.addEventListener('mousemove', handleCanvasMouseMove);
      window.addEventListener('mouseup', handleCanvasMouseUp);

      studioCanvas.addEventListener('touchstart', handleCanvasTouchStart, { passive: false });
      studioCanvas.addEventListener('touchmove', handleCanvasTouchMove, { passive: false });
      window.addEventListener('touchend', handleCanvasMouseUp);

      loadBgImage(studioState.productImgSrc);
    }

    function loadBgImage(src) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () {
        bgImageObj = img;
        renderCanvas();
        runAIDesignAudit();
      };
      img.src = src;
    }

    function renderCanvas() {
      if (!studioCtx || !studioCanvas) return;
      const ctx = studioCtx;
      const width = studioCanvas.width;
      const height = studioCanvas.height;

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // 1. Render Background Product Image
      if (bgImageObj) {
        const scale = Math.min((width - 40) / bgImageObj.width, (height - 40) / bgImageObj.height);
        const nw = bgImageObj.width * scale;
        const nh = bgImageObj.height * scale;
        const nx = (width - nw) / 2;
        const ny = (height - nh) / 2;

        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 15;
        ctx.drawImage(bgImageObj, nx, ny, nw, nh);
        ctx.restore();
      } else {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, width, height);
      }

      // If "Show Original" is active, skip branding layer overlays
      if (studioState.showOriginal) return;

      // 2. Render Logo Layer with 3D Photorealistic Material Blending & Curvature
      if (studioState.logoImg) {
        ctx.save();
        ctx.translate(studioState.logoX, studioState.logoY);
        ctx.rotate((studioState.logoRotate * Math.PI) / 180);

        const baseLw = 130 * studioState.logoScale;
        const lh = (studioState.logoImg.height / studioState.logoImg.width) * baseLw;
        const lw = baseLw * 0.95; // 3D Cylindrical Surface Perspective Compression

        if (studioState.effect === 'engrave') {
          // Photorealistic Laser Etched Specular Metal/Ceramic Finish
          ctx.save();
          ctx.globalAlpha = 0.88;
          ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
          ctx.shadowBlur = 3;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1.5;
          ctx.drawImage(studioState.logoImg, -lw / 2, -lh / 2, lw, lh);

          // Specular Engraved Surface Tint
          ctx.globalCompositeOperation = "source-atop";
          const etchGrad = ctx.createLinearGradient(-lw / 2, -lh / 2, lw / 2, lh / 2);
          etchGrad.addColorStop(0, "rgba(226, 232, 240, 0.95)");
          etchGrad.addColorStop(0.5, "rgba(203, 213, 225, 0.9)");
          etchGrad.addColorStop(1, "rgba(148, 163, 184, 0.85)");
          ctx.fillStyle = etchGrad;
          ctx.fillRect(-lw / 2, -lh / 2, lw, lh);
          ctx.restore();

          // Multiply texture overlay for real ceramic/metal grain
          ctx.save();
          ctx.globalCompositeOperation = "multiply";
          ctx.globalAlpha = 0.3;
          ctx.drawImage(studioState.logoImg, -lw / 2, -lh / 2, lw, lh);
          ctx.restore();

        } else if (studioState.effect === 'gold_foil') {
          // Luxurious Metallic Gold Foil Stamping
          ctx.save();
          ctx.shadowColor = "rgba(245, 158, 11, 0.7)";
          ctx.shadowBlur = 6;
          ctx.drawImage(studioState.logoImg, -lw / 2, -lh / 2, lw, lh);

          ctx.globalCompositeOperation = "source-atop";
          const goldGrad = ctx.createLinearGradient(-lw / 2, -lh / 2, lw / 2, lh / 2);
          goldGrad.addColorStop(0, "#fef08a");
          goldGrad.addColorStop(0.3, "#f59e0b");
          goldGrad.addColorStop(0.7, "#d4af37");
          goldGrad.addColorStop(1, "#b45309");
          ctx.fillStyle = goldGrad;
          ctx.fillRect(-lw / 2, -lh / 2, lw, lh);
          ctx.restore();
        } else if (studioState.effect === 'embroidery') {
          // Stitched Thread Texture
          ctx.save();
          ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetY = 2;
          ctx.drawImage(studioState.logoImg, -lw / 2, -lh / 2, lw, lh);
          ctx.restore();
        } else {
          // UV High Gloss Digital Print (Sublimation Ceramic Gloss)
          ctx.save();
          ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetY = 2;
          ctx.drawImage(studioState.logoImg, -lw / 2, -lh / 2, lw, lh);

          ctx.globalCompositeOperation = "soft-light";
          ctx.globalAlpha = 0.4;
          const glossGrad = ctx.createLinearGradient(-lw / 2, -lh / 2, lw / 2, lh / 2);
          glossGrad.addColorStop(0, "rgba(255, 255, 255, 0.8)");
          glossGrad.addColorStop(0.5, "transparent");
          glossGrad.addColorStop(1, "rgba(0, 0, 0, 0.3)");
          ctx.fillStyle = glossGrad;
          ctx.fillRect(-lw / 2, -lh / 2, lw, lh);
          ctx.restore();
        }

        ctx.restore();
      }

      // 3. Render Custom Text Layer with Material Depth
      if (studioState.text) {
        ctx.save();
        ctx.font = `700 24px "${studioState.font}", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (studioState.effect === 'engrave') {
          ctx.shadowColor = "rgba(0,0,0,0.9)";
          ctx.shadowBlur = 3;
          ctx.shadowOffsetY = 2;
          ctx.fillStyle = "#e2e8f0";
          ctx.fillText(studioState.text, studioState.textX, studioState.textY);
        } else if (studioState.effect === 'gold_foil') {
          ctx.shadowColor = "rgba(251, 191, 36, 0.8)";
          ctx.shadowBlur = 6;
          ctx.fillStyle = "#fbbf24";
          ctx.fillText(studioState.text, studioState.textX, studioState.textY);
        } else {
          ctx.shadowColor = "rgba(0,0,0,0.4)";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetY = 2;
          ctx.fillStyle = studioState.textColor;
          ctx.fillText(studioState.text, studioState.textX, studioState.textY);
        }

        ctx.restore();
      }

      // Only draw active drag border when user is actively dragging item
      if (studioState.isDragging && studioState.logoImg) {
        ctx.save();
        ctx.strokeStyle = "rgba(251, 191, 36, 0.5)";
        ctx.lineWidth = 1;
        const lw = 130 * studioState.logoScale;
        const lh = ((studioState.logoImg.height / studioState.logoImg.width) * 130) * studioState.logoScale;
        ctx.strokeRect(studioState.logoX - lw / 2 - 4, studioState.logoY - lh / 2 - 4, lw + 8, lh + 8);
        ctx.restore();
      }
    }

    // --- Canvas Mouse/Touch Interaction ---
    function getCanvasCoords(e) {
      const rect = studioCanvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const scaleX = studioCanvas.width / rect.width;
      const scaleY = studioCanvas.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    }

    function handleCanvasMouseDown(e) {
      const coords = getCanvasCoords(e);
      // Check if clicked near logo
      if (studioState.logoImg) {
        const distLogo = Math.hypot(coords.x - studioState.logoX, coords.y - studioState.logoY);
        if (distLogo < 80) {
          studioState.isDragging = true;
          studioState.activeDragItem = 'logo';
          studioState.dragOffsetX = coords.x - studioState.logoX;
          studioState.dragOffsetY = coords.y - studioState.logoY;
          return;
        }
      }
      // Check if clicked near text
      if (studioState.text) {
        const distText = Math.hypot(coords.x - studioState.textX, coords.y - studioState.textY);
        if (distText < 60) {
          studioState.isDragging = true;
          studioState.activeDragItem = 'text';
          studioState.dragOffsetX = coords.x - studioState.textX;
          studioState.dragOffsetY = coords.y - studioState.textY;
          return;
        }
      }
    }

    function handleCanvasMouseMove(e) {
      if (!studioState.isDragging) return;
      if (e.cancelable) e.preventDefault();
      const coords = getCanvasCoords(e);

      if (studioState.activeDragItem === 'logo') {
        studioState.logoX = coords.x - studioState.dragOffsetX;
        studioState.logoY = coords.y - studioState.dragOffsetY;
      } else if (studioState.activeDragItem === 'text') {
        studioState.textX = coords.x - studioState.dragOffsetX;
        studioState.textY = coords.y - studioState.dragOffsetY;
      }

      renderCanvas();
    }

    function handleCanvasMouseUp() {
      if (studioState.isDragging) {
        studioState.isDragging = false;
        studioState.activeDragItem = null;
      }
    }

    // --- AI Quality Inspector & Auditor ---
    function runAIDesignAudit() {
      // Audit UI removed as requested
    }

    function handleCanvasTouchStart(e) {
      if (e.cancelable) e.preventDefault();
      handleCanvasMouseDown(e);
    }

    function handleCanvasTouchMove(e) {
      handleCanvasMouseMove(e);
    }

    // --- Pricing & Order Handler ---
    window.adjustStudioQty = function (delta) {
      const qtyInput = document.getElementById('studioQtyInput');
      if (!qtyInput) return;
      let newQty = parseInt(qtyInput.value || 1) + delta;
      if (newQty < 1) newQty = 1;
      qtyInput.value = newQty;
      window.recalculateStudioPrice();
    };

    window.recalculateStudioPrice = function () {
      const qtyInput = document.getElementById('studioQtyInput');
      const qty = parseInt(qtyInput ? qtyInput.value : 10) || 1;
      studioState.qty = qty;

      let unitPrice = studioState.productBasePrice;
      let discountPct = 0;

      if (qty >= 100) discountPct = 25;
      else if (qty >= 50) discountPct = 20;
      else if (qty >= 25) discountPct = 15;
      else if (qty >= 10) discountPct = 10;

      const discountedUnit = unitPrice * (1 - discountPct / 100);
      const totalPrice = Math.round(discountedUnit * qty);

      const unitSpan = document.getElementById('studioUnitPrice');
      const totalSpan = document.getElementById('studioTotalPrice');
      const discountBadge = document.getElementById('studioDiscountBadge');

      if (unitSpan) unitSpan.textContent = '₹' + unitPrice.toLocaleString('en-IN');
      if (totalSpan) totalSpan.textContent = '₹' + totalPrice.toLocaleString('en-IN');
      if (discountBadge) {
        if (discountPct > 0) {
          discountBadge.style.display = 'block';
          discountBadge.textContent = `🎉 ${discountPct}% Bulk Discount Applied!`;
        } else {
          discountBadge.style.display = 'none';
        }
      }
    };

    window.submitStudioOrder = function (action) {
      const titleInput = document.getElementById('studioProductNameInput');
      const productName = titleInput ? titleInput.value : studioState.productName;
      const qty = studioState.qty;
      const totalSpan = document.getElementById('studioTotalPrice');
      const totalPrice = totalSpan ? totalSpan.textContent : '₹' + (studioState.productBasePrice * qty);

      const mockupDataUrl = studioCanvas ? studioCanvas.toDataURL('image/png') : '';

      if (action === 'cart') {
        // Add custom item to global cart
        const customCartItem = {
          name: 'CUSTOM: ' + productName,
          price: totalPrice,
          qty: qty,
          img: mockupDataUrl || cldOpt(studioState.productImgSrc),
          technique: studioState.effect.toUpperCase() + ' BRANDED',
          isCustomDesign: true
        };

        let cart = [];
        try {
          const saved = localStorage.getItem('sai_studio_cart');
          if (saved) cart = JSON.parse(saved);
        } catch (err) { }

        cart.push(customCartItem);
        localStorage.setItem('sai_studio_cart', JSON.stringify(cart));

        alert(`✅ Custom Order Added to Cart!\n\nProduct: ${productName}\nQuantity: ${qty} pcs\nTotal: ${totalPrice}\nBranding Effect: ${studioState.effect.toUpperCase()}`);
        window.closeAIStudioModal();
      } else if (action === 'whatsapp') {
        const msg = `*NEW CUSTOM PRODUCT ORDER - SAI KUMAR DIGITAL STUDIO*\n\n` +
          `📦 *Product:* ${productName}\n` +
          `🔢 *Quantity:* ${qty} pcs\n` +
          `💰 *Estimated Total:* ${totalPrice}\n` +
          `🎨 *Branding Technique:* ${studioState.effect.toUpperCase()}\n` +
          `✏️ *Custom Name/Text:* ${studioState.text || 'None'}\n\n` +
          `_Generated via AI Custom Product Studio_`;

        const encodedMsg = encodeURIComponent(msg);
        const whatsappUrl = `https://wa.me/919876543210?text=${encodedMsg}`;
        window.open(whatsappUrl, '_blank');
      }
    };

    /**
     * Dynamically clones marquee track items for continuous seamless scrolling
     * without duplicating markup in HTML.
     */
    function initMarqueeAutoCloning() {
      const tracks = document.querySelectorAll('.category-marquee-track, .marquee-track');
      tracks.forEach(track => {
        if (track.getAttribute('data-marquee-cloned') === 'true') return;
        const children = Array.from(track.children);
        children.forEach(child => {
          const clone = child.cloneNode(true);
          clone.setAttribute('aria-hidden', 'true');
          track.appendChild(clone);
        });
        track.setAttribute('data-marquee-cloned', 'true');
      });
    }

    // --- Fetch Backend Products ---
    // Categories/products for the sidebar and per-category views come from the
    // database via GET /api/catalog/corporate. Field mapping: category name/
    // description/image map directly; each product's title/price/mrp/images/
    // description map to name/oldPrice/img+subtitle. The "All Corporate Gifts"
    // landing view keeps its existing static HTML cards (see renderContent's
    // early-return for currentCategory === 'all') - only per-category views are
    // now database-driven.
    const CORPORATE_API_BASE = window.SAI_API_BASE || "http://localhost:8000";

    async function loadProductsFromBackend() {
      try {
        const response = await fetch(`${CORPORATE_API_BASE}/api/catalog/corporate`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const built = {};
        data.categories.forEach(c => {
          built[c.id] = {
            title: c.name,
            desc: c.description || "",
            icon: c.image,
            products: (data.packages[c.id] || []).map(p => {
              const prod = {
                id: p.id,
                name: p.title,
                price: p.price,
                img: (p.images && p.images[0]) || "",
                subtitle: p.description || "",
              };
              if (p.mrp) prod.oldPrice = p.mrp;
              return prod;
            }),
          };
        });
        categoriesData = built;
      } catch (e) {
        console.error("Could not load corporate catalog from backend.", e);
        const sidebar = document.getElementById('desktopSidebar');
        if (sidebar) sidebar.innerHTML = '<div style="padding:16px;color:#b91c1c;">Could not load products right now. Please refresh the page.</div>';
      }
    }

    // --- Dynamic Desktop Navbar Height for Sticky Sidebar Offset ---
    function updateStickyHeaderOffset() {
      if (window.innerWidth > 767) {
        const desktopNav = document.querySelector('.desktop-nav');
        if (desktopNav) {
          const navHeight = desktopNav.offsetHeight;
          if (navHeight > 0) {
            document.documentElement.style.setProperty('--navbar-height', `${navHeight}px`);
          }
        }
      }
    }

    window.addEventListener('resize', updateStickyHeaderOffset);
    window.addEventListener('load', updateStickyHeaderOffset);

    function initCorporateProductAccordions() {
      document.querySelectorAll('.corporate-accordion-trigger').forEach(trigger => {
        trigger.addEventListener('click', () => {
          const item = trigger.closest('.corporate-accordion-item');
          const group = item?.parentElement;
          if (!item || !group) return;
          const shouldOpen = trigger.getAttribute('aria-expanded') !== 'true';
          group.querySelectorAll('.corporate-accordion-item').forEach(other => {
            other.classList.remove('is-open');
            other.querySelector('.corporate-accordion-trigger')?.setAttribute('aria-expanded', 'false');
          });
          if (shouldOpen) {
            item.classList.add('is-open');
            trigger.setAttribute('aria-expanded', 'true');
          }
        });
      });
      document.querySelector('.corporate-accordion-item')?.classList.add('is-open');
    }

    // --- On Load ---
    document.addEventListener('DOMContentLoaded', async () => {
      updateStickyHeaderOffset();
      initCorporateProductAccordions();
      initMarqueeAutoCloning();
      renderHeaderComponents();

      await loadProductsFromBackend();

      const urlParams = new URLSearchParams(window.location.search);
      const catParam = urlParams.get('category');
      const hasCatDeepLink = catParam && (catParam === 'all' || categoriesData[catParam]);
      if (hasCatDeepLink) {
        currentCategory = catParam;
      }

      initSidebar();
      // Without this, a ?category=<slug> deep link (from the header mega-menu, or
      // any other page's link) only marked the right sidebar item active - the
      // product grid itself still showed whatever static "All" HTML was already
      // in the page, since nothing had ever called renderContent() on page load.
      renderContent();
      // A ?category= deep link left the visitor at the top hero slider (which
      // cycles through every category, not just this one) instead of the actual
      // product grid it just rendered below - same scroll switchCategory() already
      // does when a category is picked in-page, just missing for the page-load path.
      if (hasCatDeepLink) {
        setTimeout(() => {
          const targetEl = document.getElementById('catalogContainer') || document.getElementById('packagesGrid') || document.querySelector('.content-layout');
          if (targetEl) {
            const yOffset = getScrollOffset();
            const y = targetEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: Math.max(0, y), behavior: 'auto' });
          }
        }, 50);
      }
      updateCartUI();
      initSliderEvents();
      resetHeroAutoplay();
      updateStickyHeaderOffset();

      /* deep-link support: ?openProduct=<name>&openPrice=<price>&openImg=<url>&pid=<id>
         auto-opens that exact product's detail modal (used by homepage product cards so
         clicking one opens the exact product, not just the corporate page) - orderNowDirect
         takes the product's literal name/price/img rather than looking it up, so no catalog
         match is needed here. pid just carries the real database id through if the link had
         one, so it's still there in the URL/for editUrl links built off it. */
      const openProductParam = urlParams.get('openProduct');
      if (openProductParam) {
        const price = urlParams.get('openPrice') || '';
        const img = urlParams.get('openImg') || '';
        const pid = urlParams.get('pid') || null;
        setTimeout(() => window.orderNowDirect(openProductParam, price, img, pid, { skipHistory: true }), 150);
      }

      // Mobile App Switcher Collapse on Scroll
      const appSwitcher = document.querySelector('.mobile-app-switcher');
      const headerAddress = document.querySelector('.mobile-header-address');
      if (appSwitcher) {
        let lastScrollTop = 0;
        window.addEventListener('scroll', () => {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const scrolledDown = scrollTop > lastScrollTop;

          if (scrolledDown && scrollTop > 40) {
            appSwitcher.classList.add('nav-collapsed');
            if (headerAddress) headerAddress.classList.add('nav-collapsed');
          } else if (!scrolledDown) {
            appSwitcher.classList.remove('nav-collapsed');
            if (headerAddress) headerAddress.classList.remove('nav-collapsed');
          }

          lastScrollTop = scrollTop;
        }, { passive: true });
      }
    });
  })();


    // ─── Master Catalog Data (All Categories) ───
    const CATALOG_PRODUCTS = [
      // 1. Personalized Gifts
      {
        id: 'gift-acrylic-frame',
        title: 'Custom High-Gloss Acrylic Photo Frame',
        category: 'gifts',
        type: 'frames',
        price: 699,
        origPrice: 999,
        discount: '30% OFF',
        img: 'https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/assets/led_photo_frame.jpg',
        badge: 'Best Seller',
        badgeType: 'bestseller-badge',
        speed: 'same_day',
        speedLabel: '⚡ Same Day Hyderabad',
        occasion: ['birthday', 'anniversary'],
        rating: 4.9,
        reviews: 218,
        desc: 'Sleek frameless 5mm crystal acrylic print with rich, shatterproof HD clarity. Complete with tabletop stand & wall mount fixtures.',
        features: ['5mm Ultra-Clear Acrylic', 'UV-Protected Color Guarantee', 'Scratch Resistant Coating', 'Wall Mount & Table Stand Included']
      },
      {
        id: 'gift-magic-mug',
        title: 'Color Changing Magic Photo Mug',
        category: 'gifts',
        type: 'mugs',
        price: 349,
        origPrice: 499,
        discount: '30% OFF',
        img: 'https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/assets/magic_photo_mug.jpg',
        badge: '15-Min Ready',
        badgeType: 'express-badge',
        speed: 'express_15min',
        speedLabel: '⚡ 15-Min Express Ready',
        occasion: ['birthday', 'anniversary', 'corporate'],
        rating: 4.8,
        reviews: 312,
        desc: 'Pour hot liquid to magically reveal your hidden high-definition photo! Microwave & dishwasher safe ceramic body.',
        features: ['Heat-Activated Thermal Coating', '350ml Ceramic Mug', 'Fade-Proof Sublimation', 'Ready in 15 mins at Lab']
      },
      {
        id: 'gift-crystal-cube',
        title: '3D Laser Engraved Crystal Photo Cube',
        category: 'gifts',
        type: 'frames',
        price: 1299,
        origPrice: 1899,
        discount: '32% OFF',
        img: 'https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/assets/crystal_cube.jpg',
        badge: 'Premium',
        badgeType: 'card-badge-top',
        speed: 'same_day',
        speedLabel: '🚚 Same Day Dispatch',
        occasion: ['anniversary', 'wedding'],
        rating: 5.0,
        reviews: 94,
        desc: 'Hyper-detailed 3D subsurface laser engraving inside pure K9 optical crystal. Includes free multicolor LED wooden light base.',
        features: ['K9 Optical Grade Crystal', 'True 3D Laser Micro-Engraving', 'Free RGB LED Base', 'Luxurious Velvet Gift Box']
      },
      {
        id: 'gift-custom-cushion',
        title: 'Personalized Velvet Touch Photo Cushion',
        category: 'gifts',
        type: 'canvas',
        price: 499,
        origPrice: 749,
        discount: '33% OFF',
        img: 'https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/assets/photo_cushion.jpg',
        badge: 'Trending',
        badgeType: 'card-badge-top',
        speed: 'same_day',
        speedLabel: '🚚 Same Day Ready',
        occasion: ['birthday', 'anniversary'],
        rating: 4.7,
        reviews: 145,
        desc: 'Ultra-soft plush velvet cushion with vivid edge-to-edge photo printing. Includes fluffy microfiber filler.',
        features: ['16x16 Inch Plush Velvet Fabric', 'High-Density Microfiber Filler', 'Concealed Zipper Closure', 'Machine Washable Cover']
      },
      {
        id: 'gift-water-bottle',
        title: 'Custom Insulated Stainless Steel Bottle',
        category: 'gifts',
        type: 'corporate_set',
        price: 549,
        origPrice: 799,
        discount: '31% OFF',
        img: 'https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/assets/photo_water_bottle.jpg',
        badge: 'Hot Deal',
        badgeType: 'discount-badge',
        speed: 'same_day',
        speedLabel: '⚡ Same Day Hyderabad',
        occasion: ['birthday', 'corporate'],
        rating: 4.8,
        reviews: 86,
        desc: '750ml double-walled vacuum insulated flask with laser-engraved name or full color photo print. Keeps cold 24h & hot 12h.',
        features: ['Food-Grade 304 Stainless Steel', 'Double Wall Thermal Vacuum', 'Leak-Proof Cap', 'Name / Logo Laser Engraving']
      },
      {
        id: 'gift-keychain-set',
        title: 'Double-Sided Acrylic & Metal Photo Keychain',
        category: 'gifts',
        type: 'accessories',
        price: 149,
        origPrice: 249,
        discount: '40% OFF',
        img: 'https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/gifts-assets/40-PHOTO%20KEY%20CHAINS.jpg',
        badge: 'Budget Pick',
        badgeType: 'express-badge',
        speed: 'express_15min',
        speedLabel: '⚡ 15-Min Express Ready',
        occasion: ['birthday', 'anniversary'],
        rating: 4.7,
        reviews: 180,
        desc: 'Carry special memories everywhere. Heavy-duty metallic keychain with crystal clear dual photo finish.',
        features: ['Double-Sided Photo Display', 'Scratchproof Glass Resin', 'Sturdy Metallic Ring', 'Ready in 15 mins']
      },
      {
        id: 'gift-magic-mirror-round',
        title: 'Round LED Magic Mirror Photo Frame',
        category: 'gifts',
        type: 'frames',
        price: 799,
        origPrice: 1199,
        discount: '33% OFF',
        img: 'https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/gifts-assets/34--magic%20mirror%20round.webp',
        badge: 'Trending',
        badgeType: 'card-badge-top',
        speed: 'same_day',
        speedLabel: '⚡ Same Day Dispatch',
        occasion: ['birthday', 'anniversary'],
        rating: 4.8,
        reviews: 49,
        desc: 'Functions as a stylish circular mirror that illuminates with LED lights to reveal your custom photo at the click of a switch.',
        features: ['Dual Function Mirror & Photo Light', 'Soft Glow LED Ring', 'USB & Battery Powered', 'Gift Box Packaging']
      },
      {
        id: 'gift-rotate-crystal-cube',
        title: '37-Rotate LED Crystal Photo Cube',
        category: 'gifts',
        type: 'crystal',
        price: 1899,
        origPrice: 2699,
        discount: '30% OFF',
        img: 'https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/gifts-assets/37-%20rotate%20cube-01.jpg',
        badge: 'Premium',
        badgeType: 'bestseller-badge',
        speed: 'same_day',
        speedLabel: '🚚 Same Day Ready',
        occasion: ['anniversary', 'wedding'],
        rating: 4.9,
        reviews: 43,
        desc: 'Motorized revolving LED base that spins a multi-faceted 3D crystal cube with vivid multicolored backlight effects.',
        features: ['Motorized 360° Slow Rotation', 'Multicolor RGB LED Illumination', 'Heavyweight Optical K9 Crystal', 'Power Adapter Included']
      },
      {
        id: 'gift-12photo-wall-clock',
        title: '12 Photos Acrylic Wall Clock',
        category: 'gifts',
        type: 'canvas',
        price: 1099,
        origPrice: 1599,
        discount: '31% OFF',
        img: 'https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/gifts-assets/43--12%20photos%20wall%20clock%20%281%29.jpg',
        badge: 'Hot Deal',
        badgeType: 'discount-badge',
        speed: 'same_day',
        speedLabel: '⚡ Same Day Hyderabad',
        occasion: ['anniversary', 'birthday', 'wedding'],
        rating: 4.9,
        reviews: 62,
        desc: 'Stunning high-gloss acrylic wall clock showcasing 12 of your favourite monthly memories with silent quartz sweep movement.',
        features: ['12 Distinct Memory Photo Slots', 'High-Gloss 4mm Acrylic Dial', 'Silent Sweep Quartz Clock Movement', 'Ready to Wall Mount']
      },
      {
        id: 'gift-magic-sequins-pillow',
        title: 'Swipe Magic Sequins Reversible Photo Pillow',
        category: 'gifts',
        type: 'canvas',
        price: 599,
        origPrice: 899,
        discount: '33% OFF',
        img: 'https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/gifts-assets/31-%20MAGIC%20PILLOW.jpg',
        badge: 'Fun Pick',
        badgeType: 'express-badge',
        speed: 'same_day',
        speedLabel: '🚚 Same Day Ready',
        occasion: ['birthday', 'anniversary'],
        rating: 4.7,
        reviews: 51,
        desc: 'Swipe your hand across the shimmering dual-tone sequins to reveal your custom hidden photo!',
        features: ['Reversible Dual-Tone Sequins', 'High Quality Cushion Filler Included', 'Concealed Zipper', 'Long Lasting Print Quality']
      },

      // 2. Photography Packages
      {
        id: 'photo-wedding-package',
        title: 'Grand Royal Wedding Cinematic Photography',
        category: 'photography',
        type: 'shoots',
        price: 35000,
        origPrice: 48000,
        discount: '27% OFF',
        img: 'https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/assets/wedding_photography.jpg',
        badge: 'Signature',
        badgeType: 'bestseller-badge',
        speed: 'standard',
        speedLabel: '📅 Advance Booking',
        occasion: ['anniversary', 'wedding'],
        rating: 5.0,
        reviews: 88,
        desc: 'Comprehensive 2-day traditional & candid photography, cinematic 4K teaser, full highlight film, drone coverage & premium 40-sheet album.',
        features: ['2 Senior Candid & Traditional Photographers', '4K Cinematic Teaser + 30-min Film', 'Drone Aerial Shoot Coverage', 'Free 40-Page Canvera Leather Photobook']
      },
      {
        id: 'photo-prewedding-shoot',
        title: 'Outdoor Cinematic Pre-Wedding Shoot',
        category: 'photography',
        type: 'shoots',
        price: 14999,
        origPrice: 21999,
        discount: '32% OFF',
        img: 'https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/assets/prewedding_shoot.jpg',
        badge: 'Popular',
        badgeType: 'bestseller-badge',
        speed: 'standard',
        speedLabel: '📅 Flexible Date Booking',
        occasion: ['anniversary', 'wedding'],
        rating: 4.9,
        reviews: 112,
        desc: 'Full day romantic couple session at prime Hyderabad locations or resort. 50+ edited artistic portraits + 2-min cinematic reel.',
        features: ['Full Day 6-8 Hours Couple Shoot', '50 Color-Graded High-Res Portraits', '1 Instagram Teaser Video Reel', 'Free 20x30 Inch Framed Canvas']
      },
      {
        id: 'photo-maternity-shoot',
        title: 'Maternity Glow Studio & Outdoor Shoot',
        category: 'photography',
        type: 'shoots',
        price: 7999,
        origPrice: 11999,
        discount: '33% OFF',
        img: 'https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/assets/maternity_photoshoot.jpg',
        badge: 'Trending',
        badgeType: 'card-badge-top',
        speed: 'standard',
        speedLabel: '📅 Studio / Home Setup',
        occasion: ['baby_maternity'],
        rating: 4.9,
        reviews: 76,
        desc: 'Celebrate motherhood with gentle lighting, complimentary maternity gowns & artistic couple/solo portraits in our air-conditioned studio.',
        features: ['3 Gown & Wardrobe Changes', '25 Retouched High-Res Photos', 'Air Conditioned Private Studio', 'Props & Lighting Setup Included']
      },
      {
        id: 'photo-baby-photoshoot',
        title: 'Newborn & 1st Birthday Baby Photoshoot',
        category: 'photography',
        type: 'shoots',
        price: 5999,
        origPrice: 8999,
        discount: '33% OFF',
        img: 'https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/assets/baby_photoshoot.jpg',
        badge: 'Cute Picks',
        badgeType: 'card-badge-top',
        speed: 'standard',
        speedLabel: '📅 Studio Setup',
        occasion: ['birthday', 'baby_maternity'],
        rating: 4.9,
        reviews: 95,
        desc: 'Captivating themes, sanitized baby props, baskets & miniature sets. Includes cake smash session with professional studio lighting.',
        features: ['3 Cute Themed Setups', 'Cake Smash Backdrop', 'All Sanitized Baby Props', '20 Digital Edited Photos + 1 Frame']
      },
      {
        id: 'photo-birthday-coverage',
        title: 'Birthday Party & Family Event Photography',
        category: 'photography',
        type: 'shoots',
        price: 4499,
        origPrice: 6500,
        discount: '30% OFF',
        img: 'https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/assets/birthday_photoshoot.jpg',
        badge: 'Best Value',
        badgeType: 'express-badge',
        speed: 'standard',
        speedLabel: '📅 On-Site Coverage',
        occasion: ['birthday'],
        rating: 4.8,
        reviews: 130,
        desc: '3-4 hours complete party coverage: cake cutting, guest portraits, candid moments & all raw photos delivered within 24 hours.',
        features: ['1 Professional Event Photographer', 'Unlimited High-Resolution Photos', '24-Hour Digital Album Delivery', '30 Retouched Master Shots']
      },

      // 3. Studio & Printing Services
      {
        id: 'studio-passport-photos',
        title: '15-Minute Instant Visa & Passport Photos',
        category: 'studio',
        type: 'passport',
        price: 99,
        origPrice: 150,
        discount: '34% OFF',
        img: 'https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/assets/photographer_banner.png',
        badge: '15-Min Express',
        badgeType: 'express-badge',
        speed: 'express_15min',
        speedLabel: '⚡ 15-Min Walk-in Ready',
        occasion: ['corporate'],
        rating: 5.0,
        reviews: 620,
        desc: 'Govt & Embassy compliant specifications for US Visa (2x2), Schengen, UK, Canada & Indian Passport. 8, 16 or 32 prints + softcopy.',
        features: ['Guaranteed Visa Spec Compliance', 'Skin Retouching & Backdrop Calibration', '8 / 16 / 32 Glossy Prints', 'Instant Email / WhatsApp Softcopy']
      },
      {
        id: 'studio-photo-restoration',
        title: 'Vintage Old Photo Restoration & Colorization',
        category: 'studio',
        type: 'canvas',
        price: 399,
        origPrice: 600,
        discount: '33% OFF',
        img: 'https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/assets/studio_camera_setup.jpg',
        badge: 'Lab Service',
        badgeType: 'card-badge-top',
        speed: 'same_day',
        speedLabel: '🚚 Same Day Output',
        occasion: ['anniversary'],
        rating: 4.9,
        reviews: 155,
        desc: 'Restore damaged, torn, faded, or black & white family ancestral photos into brilliant, crisp color-calibrated masterpieces.',
        features: ['Scratch & Tear Removal', 'AI + Manual Colorization', 'High-Res Optical Scanning', 'Print on Archival Paper']
      },
      {
        id: 'studio-photobook-album',
        title: 'Premium Flush Mount Hardcover Photobook',
        category: 'studio',
        type: 'canvas',
        price: 1999,
        origPrice: 2999,
        discount: '33% OFF',
        img: 'https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/assets/customized_gifts_card.jpg',
        badge: 'Top Quality',
        badgeType: 'bestseller-badge',
        speed: 'standard',
        speedLabel: '📦 2-3 Days Dispatch',
        occasion: ['anniversary', 'wedding', 'birthday'],
        rating: 4.9,
        reviews: 110,
        desc: 'Lay-flat seamless 12x18 inch album with velvet matte lamination, gilded edges & leatherette presentation briefcase.',
        features: ['Seamless 180° Layflat Binding', 'Non-Tear Waterproof Synthetic Pages', 'Velvet Matte / Gloss Lamination', 'Free Designer Layout Service']
      },

      // 4. Corporate Hampers & B2B
      {
        id: 'corp-welcome-kit',
        title: 'Executive Employee Onboarding Welcome Kit',
        category: 'corporate',
        type: 'corporate_set',
        price: 899,
        origPrice: 1299,
        discount: '30% OFF',
        img: 'https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/assets/welcome_kit.jpg',
        badge: 'Corporate Pick',
        badgeType: 'bestseller-badge',
        speed: 'standard',
        speedLabel: '🚚 Bulk Dispatch 24-48h',
        occasion: ['corporate'],
        rating: 4.9,
        reviews: 64,
        desc: 'Includes custom logo PU leather diary, metal stylus pen, stainless steel bottle & 16GB OTG pendrive in magnetic gift box.',
        features: ['Custom Company Logo Screen / Foil Print', 'Magnetic Closure Gift Box', 'Premium 4-in-1 Tech & Stationery', 'Tiered Bulk Discounts Available']
      },
      {
        id: 'corp-diary-set',
        title: 'Luxury Leather Diary & Engraved Metal Pen Set',
        category: 'corporate',
        type: 'corporate_set',
        price: 499,
        origPrice: 750,
        discount: '33% OFF',
        img: 'https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/assets/executive_diary_set.jpg',
        badge: 'Fast Moving',
        badgeType: 'card-badge-top',
        speed: 'same_day',
        speedLabel: '⚡ Same Day Hyderabad',
        occasion: ['corporate'],
        rating: 4.8,
        reviews: 130,
        desc: 'Undated daily organizer with card slots, pen loop & matte black rollerball pen engraved with individual recipient names.',
        features: ['A5 PU Leather Diary with Bookmark', 'Laser Engraved Rollerball Pen', 'Individual Name Customization', 'Kraft Gift Packaging']
      },
      {
        id: 'corp-award-trophy',
        title: 'Custom Laser-Cut Acrylic & Wooden Trophy',
        category: 'corporate',
        type: 'awards',
        price: 649,
        origPrice: 950,
        discount: '31% OFF',
        img: 'https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/assets/award_trophy.jpg',
        badge: 'Recognition',
        badgeType: 'card-badge-top',
        speed: 'same_day',
        speedLabel: '⚡ 24h Express Ready',
        occasion: ['corporate'],
        rating: 4.9,
        reviews: 90,
        desc: 'Prestigious corporate excellence award with gold foil lettering, heavy crystal base & precision laser-cut logo silhouette.',
        features: ['Laser Cut Acrylic Silhouette', 'Heavyweight Solid Wood Base', 'Gold / Silver Foil Engraving', 'Any Custom Shape or Logo']
      },
      {
        id: 'corp-memento-shield',
        title: 'Solid Brass & Polished Teak Memento Shield',
        category: 'corporate',
        type: 'awards',
        price: 799,
        origPrice: 1199,
        discount: '33% OFF',
        img: 'https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/assets/memento_shield.jpg',
        badge: 'Traditional',
        badgeType: 'card-badge-top',
        speed: 'same_day',
        speedLabel: '⚡ Same Day Hyderabad',
        occasion: ['corporate'],
        rating: 4.9,
        reviews: 48,
        desc: 'Traditional VIP honor memento shield for guests, speakers, school annual days & retirement celebrations.',
        features: ['Gloss Polished Teak Wood Shield', 'Etched Brass Plate with Red Velvet Inlay', 'Tabletop Kickstand & Wall Bracket', 'Customized Text in English/Telugu/Hindi']
      },
      {
        id: 'corp-hamper-deluxe',
        title: 'Festive Luxury Corporate Celebration Hamper',
        category: 'corporate',
        type: 'corporate_set',
        price: 1499,
        origPrice: 2200,
        discount: '32% OFF',
        img: 'https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/assets/corporate_hamper.jpg',
        badge: 'Festive Special',
        badgeType: 'bestseller-badge',
        speed: 'standard',
        speedLabel: '📦 Bulk Ready',
        occasion: ['corporate', 'birthday'],
        rating: 5.0,
        reviews: 42,
        desc: 'Includes custom branded temperature bottle, brass diya / aroma candle, dry fruits jar, custom diary & handwritten greeting card.',
        features: ['Custom Ribbon & Branded Tag', 'Gourmet California Almonds Jar', 'Smart LED Temperature Bottle', 'Aroma Candle + Luxury Box']
      }
    ];

    // product.title/desc for API-sourced entries (mapApiProductToCatalogItem below)
    // come from the admin-entered catalog, unlike every other product field on this
    // page which is either a hardcoded literal here or a constant the mapper assigns
    // itself - escape before templating either into innerHTML.
    function escCatalogHtml(s) {
      const d = document.createElement('div');
      d.textContent = s == null ? '' : String(s);
      return d.innerHTML;
    }

    // ─── Live Catalog Data (keeps search/filters in sync with admin-added products) ───
    // CATALOG_PRODUCTS above is the curated starter set; this fetches every active
    // product from the real database and merges in anything not already listed, so a
    // product an admin adds later is searchable/filterable here without a code change.
    const CATALOG_API_BASE = window.SAI_API_BASE || "http://localhost:8000";
    const CATALOG_FALLBACK_IMG = 'https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/assets/customized_gifts_card.jpg';

    function mapApiProductToCatalogItem(p) {
      const price = Math.round(p.price);
      const origPrice = p.mrp ? Math.round(p.mrp) : undefined;
      const discount = origPrice && origPrice > price ? `${Math.round((1 - price / origPrice) * 100)}% OFF` : undefined;
      const category = ['gifts', 'photography', 'studio', 'corporate'].includes(p.page_slug) ? p.page_slug : 'gifts';
      return {
        id: p.id,
        title: p.title,
        category,
        type: p.category_slug || 'other',
        price,
        origPrice: origPrice || price,
        discount,
        img: (p.images && p.images[0]) || CATALOG_FALLBACK_IMG,
        badge: 'New Arrival',
        badgeType: 'card-badge-top',
        speed: 'standard',
        speedLabel: '📦 2-3 Days Standard',
        occasion: [],
        rating: 0,
        reviews: 0,
        desc: p.description || (p.category_name ? `${p.category_name} from Sai Kumar Digital Lab & Studio.` : ''),
        features: []
      };
    }

    // Pill counts in the HTML are static placeholders - recompute them from whatever
    // CATALOG_PRODUCTS actually holds so they stay accurate after the live merge below.
    function updateCategoryPillCounts() {
      const counts = { gifts: 0, photography: 0, studio: 0, corporate: 0 };
      CATALOG_PRODUCTS.forEach(p => { if (counts[p.category] !== undefined) counts[p.category]++; });
      const setCount = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      setCount('countAll', CATALOG_PRODUCTS.length);
      setCount('countGifts', counts.gifts);
      setCount('countPhoto', counts.photography);
      setCount('countStudio', counts.studio);
      setCount('countCorp', counts.corporate);
    }

    function mergeLiveCatalogProducts() {
      return fetch(`${CATALOG_API_BASE}/api/products?page_size=1000`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          const existingIds = new Set(CATALOG_PRODUCTS.map(p => p.id));
          (data.items || []).forEach(p => {
            if (existingIds.has(p.id)) return;
            CATALOG_PRODUCTS.push(mapApiProductToCatalogItem(p));
            existingIds.add(p.id);
          });
          updateCategoryPillCounts();
          renderCatalog();
        })
        .catch(err => console.error('Could not load live catalog products:', err));
    }

    // ─── State Management ───
    let currentCategory = 'all';
    let currentSort = 'featured';
    let currentLayout = 'grid';
    let searchQuery = '';
    let selectedSubTypes = [];
    let selectedSpeeds = [];
    let selectedOccasions = [];
    let minRating = 0;
    let maxPrice = 60000;
    let activeQuickViewItem = null;
    let modalQuantity = 1;

    // ─── LocalStorage Shared Cart Functions (js/shared/cart-core.js) ───
    function getStoredCart() {
      return CartCore.getCart();
    }

    function saveStoredCart(cart) {
      CartCore.saveCart(cart);
      updateCartBadge();
      renderCartDrawerItems();
    }

    function updateCartBadge() {
      const cart = getStoredCart();
      const count = Object.values(cart).reduce((sum, item) => sum + (item.qty || 1), 0);
      const headerCartBadge = document.getElementById('navCartBadge');
      if (headerCartBadge) {
        headerCartBadge.textContent = count;
        headerCartBadge.style.display = count > 0 ? 'flex' : 'none';
      }
      const bottomNavCartBadge = document.getElementById('bottomNavCartBadge');
      if (bottomNavCartBadge) {
        bottomNavCartBadge.textContent = count;
        bottomNavCartBadge.style.display = count > 0 ? 'flex' : 'none';
      }
    }

    // ─── Toast Notifications ───
    function showToast(message, icon = 'check_circle') {
      const container = document.getElementById('toastContainer');
      const toast = document.createElement('div');
      toast.className = 'toast-message';
      toast.innerHTML = `<span class="material-symbols-outlined">${icon}</span><span>${message}</span>`;
      container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, 3200);
    }

    // ─── Filter & Render Logic ───
    function getFilteredProducts() {
      return CATALOG_PRODUCTS.filter(item => {
        // Main Category filter
        if (currentCategory !== 'all' && item.category !== currentCategory) return false;

        // Sub Type filter
        if (selectedSubTypes.length > 0 && !selectedSubTypes.includes(item.type)) return false;

        // Delivery Speed
        if (selectedSpeeds.length > 0 && !selectedSpeeds.includes(item.speed)) return false;

        // Occasion
        if (selectedOccasions.length > 0) {
          const matchOccasion = selectedOccasions.some(occ => item.occasion && item.occasion.includes(occ));
          if (!matchOccasion) return false;
        }

        // Min Rating
        if (item.rating < minRating) return false;

        // Max Price
        if (item.price > maxPrice) return false;

        // Live Search Query
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchDesc = item.desc.toLowerCase().includes(q);
          const matchCat = item.category.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchCat) return false;
        }

        return true;
      });
    }

    function sortProducts(items) {
      const sorted = [...items];
      if (currentSort === 'price-low') {
        sorted.sort((a, b) => a.price - b.price);
      } else if (currentSort === 'price-high') {
        sorted.sort((a, b) => b.price - a.price);
      } else if (currentSort === 'rating') {
        sorted.sort((a, b) => b.rating - a.rating);
      } else if (currentSort === 'newest') {
        sorted.reverse();
      }
      return sorted;
    }

    const CATALOG_IMG_FALLBACK = 'https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/assets/customized_gifts_card.jpg';

    function wireCatalogImageLoading(root) {
      if (!window.SkLoading) return;
      root.querySelectorAll('.card-thumb-wrap img, .drawer-item-thumb img').forEach(img => {
        const wrap = img.closest('.card-thumb-wrap') || img.closest('.drawer-item-thumb');
        window.SkLoading.wireImage(img, { wrap, fallback: CATALOG_IMG_FALLBACK });
      });
    }

    function renderCatalog() {
      const grid = document.getElementById('productGrid');
      const filtered = getFilteredProducts();
      const sorted = sortProducts(filtered);
      const wishlist = getWishlist();  // js/shared/wishlist-menu.js

      // Update Result Counts
      document.getElementById('resultsCountText').textContent = `Showing ${sorted.length} item${sorted.length === 1 ? '' : 's'}`;
      renderActiveFilterChips();

      if (sorted.length === 0) {
        grid.innerHTML = `
          <div class="no-products-found">
            <span class="material-symbols-outlined empty-icon">search_off</span>
            <h3>No Products Found</h3>
            <p>We couldn't find any products matching your selected filters or search terms.</p>
            <button class="btn-hero-primary" onclick="resetAllFilters()" style="margin: 0 auto;">Reset All Filters</button>
          </div>
        `;
        return;
      }

      grid.innerHTML = sorted.map(product => {
        const isWishlisted = !!wishlist[product.id];
        const isShootingOrService = product.category === 'photography';
        const actionBtnLabel = isShootingOrService ? 'Book Shoot' : 'Add to Cart';
        const actionBtnIcon = isShootingOrService ? 'calendar_month' : 'add_shopping_cart';

        return `
          <div class="product-card" id="card-${product.id}">
            <div class="card-thumb-wrap">
              <span class="card-badge-top ${product.badgeType || ''}">${product.badge}</span>
              <button class="wishlist-heart-btn ${isWishlisted ? 'is-active' : ''}" 
                onclick="toggleWishlist('${product.id}')" 
                title="${isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}">
                <span class="material-symbols-outlined">${isWishlisted ? 'favorite' : 'favorite_border'}</span>
              </button>
              <img src="${cldOpt(product.img)}" alt="${escCatalogHtml(product.title)}" loading="lazy" onerror="this.onerror=null;this.src='https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/assets/customized_gifts_card.jpg'">
              <button class="quick-view-overlay-btn" onclick="openQuickViewModal('${product.id}')">
                <span class="material-symbols-outlined" style="font-size: 16px;">visibility</span>
                <span>Quick View</span>
              </button>
            </div>

            <div class="card-body">
              <div class="card-meta-line">
                <span class="card-category-pill">${product.category}</span>
              </div>

              <h3 class="card-title" title="${escCatalogHtml(product.title)}">${escCatalogHtml(product.title)}</h3>
              <p class="card-desc">${escCatalogHtml(product.desc)}</p>

              <div class="card-delivery-info ${product.speed === 'express_15min' ? 'express' : ''}">
                <span class="material-symbols-outlined" style="font-size: 15px;">local_shipping</span>
                <span>${product.speedLabel}</span>
              </div>

              <div class="card-bottom-row">
                <div class="price-box">
                  <span class="price-current">₹${product.price.toLocaleString('en-IN')}</span>
                  <div class="price-original-wrap">
                    <span class="price-original">₹${product.origPrice.toLocaleString('en-IN')}</span>
                    <span class="price-discount-percent">${product.discount}</span>
                  </div>
                </div>

                <button class="btn-card-action" onclick="handleCardAction('${product.id}')">
                  <span class="material-symbols-outlined" style="font-size: 16px;">${actionBtnIcon}</span>
                  <span>${actionBtnLabel}</span>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
      wireCatalogImageLoading(grid);
    }

    function renderActiveFilterChips() {
      const container = document.getElementById('activeFilterChips');
      const chips = [];

      if (currentCategory !== 'all') {
        chips.push({ label: `Category: ${currentCategory}`, remove: () => selectMainCategory('all') });
      }
      if (searchQuery.trim()) {
        chips.push({ label: `Search: "${searchQuery}"`, remove: clearCatalogSearch });
      }
      if (maxPrice < 60000) {
        chips.push({ label: `Under ₹${maxPrice}`, remove: () => handlePriceSliderChange(60000) });
      }
      if (minRating > 0) {
        chips.push({ label: `${minRating}★ & Above`, remove: () => handleRatingFilter(0) });
      }
      selectedSubTypes.forEach(t => {
        chips.push({ label: `Type: ${t}`, remove: () => toggleFilter('type', t) });
      });
      selectedSpeeds.forEach(s => {
        chips.push({ label: `Speed: ${s}`, remove: () => toggleFilter('speed', s) });
      });
      selectedOccasions.forEach(o => {
        chips.push({ label: `Occasion: ${o}`, remove: () => toggleFilter('occasion', o) });
      });

      container.innerHTML = chips.map(c => `
        <span class="filter-chip-tag">
          <span>${c.label}</span>
          <span class="material-symbols-outlined remove-chip" onclick="(${c.remove.toString()})()">close</span>
        </span>
      `).join('');
    }

    // ─── Interaction Handlers ───
    // Dynamically measures the sticky site header so the jump to the catalog
    // section clears it instead of landing partly hidden underneath.
    function getCatalogScrollOffset() {
      const header = document.querySelector('.site-header');
      return (header ? header.offsetHeight : 0) + 12;
    }

    // Brings the products grid into view instead of leaving the visitor at the
    // intro hero above it - used both for in-page category clicks and for a
    // ?category= deep link landing here from another page.
    function scrollToCatalogSection(behavior) {
      const target = document.getElementById('catalogSection');
      if (!target) return;
      const y = target.getBoundingClientRect().top + window.pageYOffset - getCatalogScrollOffset();
      window.scrollTo({ top: Math.max(0, y), behavior: behavior || 'smooth' });
    }

    function selectMainCategory(cat, scrollBehavior = 'smooth') {
      currentCategory = cat;
      document.querySelectorAll('.cat-pill').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === cat);
      });
      renderCatalog();
      scrollToCatalogSection(scrollBehavior);
    }

    function toggleFilter(filterType, value) {
      if (filterType === 'type') {
        if (selectedSubTypes.includes(value)) {
          selectedSubTypes = selectedSubTypes.filter(v => v !== value);
        } else {
          selectedSubTypes.push(value);
        }
      } else if (filterType === 'speed') {
        if (selectedSpeeds.includes(value)) {
          selectedSpeeds = selectedSpeeds.filter(v => v !== value);
        } else {
          selectedSpeeds.push(value);
        }
      } else if (filterType === 'occasion') {
        if (selectedOccasions.includes(value)) {
          selectedOccasions = selectedOccasions.filter(v => v !== value);
        } else {
          selectedOccasions.push(value);
        }
      }
      renderCatalog();
    }

    function handlePriceSliderChange(val) {
      maxPrice = parseInt(val, 10);
      document.getElementById('maxPriceInput').value = maxPrice;
      document.getElementById('priceRangeSlider').value = maxPrice;
      renderCatalog();
    }

    function handlePriceInputChange(val) {
      maxPrice = Math.max(100, Math.min(60000, parseInt(val, 10) || 60000));
      document.getElementById('priceRangeSlider').value = maxPrice;
      renderCatalog();
    }

    function handleRatingFilter(ratingVal) {
      minRating = ratingVal;
      renderCatalog();
    }

    function handleSortChange(sortVal) {
      currentSort = sortVal;
      renderCatalog();
    }

    function setLayoutView(mode) {
      currentLayout = mode;
      const grid = document.getElementById('productGrid');
      const btnGrid = document.getElementById('btnGridView');
      const btnList = document.getElementById('btnListView');

      if (mode === 'list') {
        grid.classList.add('list-view');
        btnList.classList.add('active');
        btnGrid.classList.remove('active');
      } else {
        grid.classList.remove('list-view');
        btnGrid.classList.add('active');
        btnList.classList.remove('active');
      }
    }

    function resetAllFilters() {
      currentCategory = 'all';
      currentSort = 'featured';
      searchQuery = '';
      selectedSubTypes = [];
      selectedSpeeds = [];
      selectedOccasions = [];
      minRating = 0;
      maxPrice = 60000;

      if (searchInput) searchInput.value = '';
      if (searchClear) searchClear.style.display = 'none';
      document.getElementById('priceRangeSlider').value = 60000;
      document.getElementById('maxPriceInput').value = 60000;
      document.getElementById('sortSelect').value = 'featured';

      document.querySelectorAll('#filterSidebar input[type="checkbox"]').forEach(cb => cb.checked = false);
      const allRatingsRadio = document.querySelector('input[name="ratingFilter"][value="0"]');
      if (allRatingsRadio) allRatingsRadio.checked = true;

      document.querySelectorAll('.cat-pill').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === 'all');
      });

      renderCatalog();
      showToast('All filters have been reset.');
    }

    // ─── Search Handlers ───
    const searchInput = document.getElementById('catalogGlobalSearch');
    const searchClear = document.getElementById('searchClearBtn');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (searchClear) searchClear.style.display = searchQuery.length > 0 ? 'block' : 'none';
        renderCatalog();
      });
    }

    function clearCatalogSearch() {
      searchQuery = '';
      if (searchInput) searchInput.value = '';
      if (searchClear) searchClear.style.display = 'none';
      renderCatalog();
    }

    // Maps this page's own hardcoded photography product ids to the category
    // keys js/booking.js understands (see its CAT_LABELS), so "Book Shoot"
    // opens the booking flow pre-filled for the exact package that was clicked
    // instead of always falling back to booking.js's hardcoded default.
    const BOOKING_CATEGORY_BY_PRODUCT_ID = {
      'photo-wedding-package': 'wedding',
      'photo-prewedding-shoot': 'prewedding',
      'photo-maternity-shoot': 'maternity',
      'photo-baby-photoshoot': 'baby',
      'photo-birthday-coverage': 'birthday',
    };

    // ─── Card Actions & Cart Sync ───
    function handleCardAction(productId) {
      const product = CATALOG_PRODUCTS.find(p => p.id === productId);
      if (!product) return;

      if (product.category === 'photography') {
        // Direct to booking flow, pre-filled with this product's own details.
        const bookingParams = new URLSearchParams({
          category: BOOKING_CATEGORY_BY_PRODUCT_ID[product.id] || 'wedding',
          package: product.title,
          tier: 'standard',
          price: `₹${product.price}`,
          feats: (product.features || []).join('|'),
        });
        window.location.href = `booking.html?${bookingParams.toString()}`;
      } else {
        // Add to cart directly
        addItemToCart(product.title, `₹${product.price}`, product.img, 1);
        showToast(`"${product.title}" added to cart!`, 'shopping_bag');
      }
    }

    function addItemToCart(productName, priceStr, imgUrl, qty = 1) {
      CartCore.updateQty(productName, qty, { name: productName, price: priceStr, img: imgUrl });
      updateCartBadge();
      renderCartDrawerItems();
    }

    // Saving is gated behind sign-in (see js/shared/wishlist-menu.js) - if the
    // shopper isn't signed in this opens the sign-in modal instead, and the
    // toggle + toast + re-render run once they verify.
    function toggleWishlist(productId) {
      const product = CATALOG_PRODUCTS.find(p => p.id === productId);
      if (!product) return;

      toggleWishItem(product.title, `₹${product.price}`, product.img, {
        key: product.id,
        product_id: product.id,
        // Baked in now so the wishlist drawer can send the customer straight back
        // to this exact product later, from any page/device - see the matching
        // ?openProduct=<id> deep-link reader in the DOMContentLoaded handler below.
        url: `catalog.html?openProduct=${encodeURIComponent(product.id)}`,
        onDone: () => renderCatalog(),
      });
    }

    // ─── Quick View Modal ───
    function openQuickViewModal(productId) {
      const product = CATALOG_PRODUCTS.find(p => p.id === productId);
      if (!product) return;

      activeQuickViewItem = product;
      modalQuantity = 1;

      const modalImg = document.getElementById('modalImg');
      // Reset the fade-in/onerror wiring on every open, not just once - it's the
      // same <img> element reused across products, and SkLoading.wireImage() is a
      // one-time (data-sk-img-wired) hookup that would otherwise ignore every
      // product opened after the first.
      delete modalImg.dataset.skImgWired;
      modalImg.classList.remove('sk-img-loaded');
      modalImg.src = cldOpt(product.img);
      if (window.SkLoading) window.SkLoading.wireImage(modalImg, { wrap: modalImg.closest('.modal-main-img-box') || modalImg.parentElement, fallback: CATALOG_IMG_FALLBACK });
      document.getElementById('modalTitle').textContent = product.title;
      document.getElementById('modalCategory').textContent = product.category;
      document.getElementById('modalTagBadge').textContent = product.badge;
      document.getElementById('modalPrice').textContent = `₹${product.price.toLocaleString('en-IN')}`;
      document.getElementById('modalOrigPrice').textContent = `₹${product.origPrice.toLocaleString('en-IN')}`;
      document.getElementById('modalDiscount').textContent = product.discount;
      document.getElementById('modalDesc').textContent = product.desc;
      document.getElementById('modalQtyDisplay').textContent = modalQuantity;
      document.getElementById('modalCustomText').value = '';

      const featuresList = document.getElementById('modalFeatures');
      featuresList.innerHTML = (product.features || []).map(f => `
        <li>
          <span class="material-symbols-outlined">check_circle</span>
          <span>${f}</span>
        </li>
      `).join('');

      document.getElementById('quickViewModal').classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    function closeQuickViewModal() {
      document.getElementById('quickViewModal').classList.remove('is-open');
      document.body.style.overflow = '';
      activeQuickViewItem = null;
    }

    function adjustModalQty(delta) {
      modalQuantity = Math.max(1, modalQuantity + delta);
      document.getElementById('modalQtyDisplay').textContent = modalQuantity;
    }

    function addModalItemToCart() {
      if (!activeQuickViewItem) return;
      const customNote = document.getElementById('modalCustomText').value.trim();
      const displayName = customNote ? `${activeQuickViewItem.title} (${customNote})` : activeQuickViewItem.title;

      addItemToCart(displayName, `₹${activeQuickViewItem.price}`, activeQuickViewItem.img, modalQuantity);
      showToast(`Added ${modalQuantity}x "${activeQuickViewItem.title}" to cart!`, 'shopping_cart');
      closeQuickViewModal();
    }

    // ─── Cart Drawer Functions ───
    function toggleCartDrawer() {
      const drawer = document.getElementById('cartDrawer');
      const overlay = document.getElementById('cartDrawerOverlay');
      const isOpen = drawer.classList.contains('is-open');

      if (isOpen) {
        drawer.classList.remove('is-open');
        overlay.classList.remove('is-open');
        document.body.style.overflow = '';
      } else {
        renderCartDrawerItems();
        drawer.classList.add('is-open');
        overlay.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      }
    }

    function renderCartDrawerItems() {
      const list = document.getElementById('cartDrawerItemsList');
      const subtotalEl = document.getElementById('drawerSubtotal');
      const cart = getStoredCart();
      const items = Object.values(cart);

      if (items.length === 0) {
        list.innerHTML = `
          <div style="text-align: center; padding: 40px 10px; color: var(--text-muted);">
            <span class="material-symbols-outlined" style="font-size: 48px; color: var(--secondary); margin-bottom: 8px;">production_quantity_limits</span>
            <h4 style="font-size: 16px; font-weight: 700; color: var(--primary); margin-bottom: 4px;">Your Cart is Empty</h4>
            <p style="font-size: 13px;">Add custom frames, mugs, or shoots from the catalogue to get started.</p>
          </div>
        `;
        subtotalEl.textContent = '₹0';
        return;
      }

      let total = 0;
      list.innerHTML = items.map(item => {
        const numPrice = parseInt((item.price || '0').replace(/[^0-9]/g, ''), 10) || 0;
        const itemTotal = numPrice * (item.qty || 1);
        total += itemTotal;

        return `
          <div class="drawer-item-row">
            <div class="drawer-item-thumb">
              <img src="${cldOpt(item.img || 'https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/assets/customized_gifts_card.jpg')}" alt="${item.name}" loading="lazy" onerror="this.onerror=null;this.src='https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/assets/customized_gifts_card.jpg'">
            </div>
            <div class="drawer-item-info">
              <h4 class="drawer-item-name" title="${item.name}">${item.name}</h4>
              <div class="drawer-item-price">${item.price}</div>
              <div class="drawer-item-stepper">
                <button class="drawer-qty-btn" onclick="updateDrawerQty('${item.name}', -1)">−</button>
                <span class="drawer-item-qty">${item.qty}</span>
                <button class="drawer-qty-btn" onclick="updateDrawerQty('${item.name}', 1)">+</button>
              </div>
            </div>
            <span class="material-symbols-outlined drawer-remove-btn" onclick="removeDrawerItem('${item.name}')" title="Remove">delete</span>
          </div>
        `;
      }).join('');
      wireCatalogImageLoading(list);

      subtotalEl.textContent = `₹${total.toLocaleString('en-IN')}`;
    }

    function updateDrawerQty(name, delta) {
      CartCore.updateQty(name, delta, {}, { createIfMissing: false });
      updateCartBadge();
      renderCartDrawerItems();
    }

    function removeDrawerItem(name) {
      CartCore.removeItem(name);
      updateCartBadge();
      renderCartDrawerItems();
      showToast(`Removed "${name}" from cart.`, 'delete');
    }

    // ─── Bulk Quote Modal ───
    function openBulkQuoteModal(productName = '') {
      if (productName) {
        document.getElementById('quoteProductInput').value = productName;
      }
      document.getElementById('bulkQuoteModal').classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    function closeBulkQuoteModal() {
      document.getElementById('bulkQuoteModal').classList.remove('is-open');
      document.body.style.overflow = '';
    }

    function handleBulkQuoteSubmit(e) {
      e.preventDefault();
      closeBulkQuoteModal();
      showToast('Thank you! Your bulk quotation request has been received. Our team will contact you within 2 hours.', 'task_alt');
    }

    function handleModalBackdropClick(e) {
      if (e.target.classList.contains('modal-backdrop')) {
        closeQuickViewModal();
        closeBulkQuoteModal();
      }
    }

    // ─── PDF / Printable Catalogue Trigger ───
    function downloadPdfCatalogue() {
      showToast('Preparing high-resolution PDF catalogue for print / download...', 'print');
      setTimeout(() => {
        window.print();
      }, 500);
    }

    // ─── Initialize on DOM Load ───
    document.addEventListener('DOMContentLoaded', () => {
      // Check for URL query params (e.g. ?category=photography)
      const urlParams = new URLSearchParams(window.location.search);
      const paramCat = urlParams.get('category');
      const paramSearch = urlParams.get('search');

      updateCategoryPillCounts();
      if (paramCat && ['gifts', 'photography', 'studio', 'corporate'].includes(paramCat)) {
        selectMainCategory(paramCat, 'auto');
      } else {
        renderCatalog();
      }
      const liveCatalogReady = mergeLiveCatalogProducts();

      if (paramSearch) {
        searchQuery = paramSearch;
        searchInput.value = paramSearch;
        searchClear.style.display = 'block';
        renderCatalog();
        scrollToCatalogSection('auto');
      }

      // Deep-link support: ?openProduct=<id> auto-opens that exact product's
      // quick view modal - used by the wishlist drawer (see js/shared/wishlist-menu.js)
      // and the nav search dropdown (js/shared/search.js) so clicking a saved/searched
      // item lands on the exact product, not just the catalog's top-level grid. Waits
      // on the live merge first since a search-driven id only exists in the database,
      // not in the curated CATALOG_PRODUCTS starter set.
      const openProductParam = urlParams.get('openProduct');
      if (openProductParam) {
        liveCatalogReady.then(() => setTimeout(() => openQuickViewModal(openProductParam), 50));
      }

      updateCartBadge();
    });

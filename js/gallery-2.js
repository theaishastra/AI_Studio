    /* DATA REGISTRY */
    const CATEGORIES = [
      { id: "wedding", icon: "💍", name: "Wedding Photography", tagline: "Capture your sacred moments with timeless elegance & cinematic grandeur." },
      { id: "prewedding", icon: "💑", name: "Pre-Wedding", tagline: "Romantic storytelling at breathtaking locations." },
      { id: "maternity", icon: "🤰", name: "Maternity Shoot", tagline: "Celebrate the grace & beauty of new beginnings." },
      { id: "baby", icon: "👶", name: "Baby Shoot", tagline: "Adorable themed setups for your precious little one." },
      { id: "birthday", icon: "🎂", name: "Birthday Photography", tagline: "Joyous candid captures for milestones & celebrations." },
      { id: "event", icon: "🎉", name: "Event Photography", tagline: "Comprehensive coverage for corporate & cultural events." },
      { id: "outdoor", icon: "🏞️", name: "Outdoor Photography", tagline: "Scenic natural light portraits in lush outdoor settings." },
      { id: "drone", icon: "🛸", name: "Drone Videography", tagline: "Breathtaking 4K aerial shots and venue sweeps." },
      { id: "video", icon: "🎥", name: "Videography", tagline: "Movie-quality documentary & cinematic event film." },
      { id: "album", icon: "📔", name: "Album Designing", tagline: "Luxury lay-flat photobooks with leather & foil embossing." },
      { id: "housewarming", icon: "🏠", name: "House Warming", tagline: "Traditional puja & family celebrations captured with warmth." },
      { id: "sareefunction", icon: "🥻", name: "Saree Function", tagline: "Graceful traditional ritual photography & portraits." },
      { id: "traditionalphoto", icon: "🪔", name: "Traditional Photography", tagline: "Classic ritual coverage with crisp lighting and focus." },
      { id: "cinematicvideo", icon: "🎬", name: "Cinematic Videography", tagline: "4K widescreen cinema motion picture production." },
      { id: "ledscreens", icon: "💡", name: "LED Screens", tagline: "High-definition live visual display setups." }
    ];

    const FOLIO = {
      wedding: ["Mandap Ceremony", "Bride Portrait", "Candid Rituals", "Couple Golden Hour", "Reception Stage", "Baraat Entry", "Ring Exchange", "Family Group Shot"],
      prewedding: ["Sunset Silhouette", "Beach Couple", "Heritage Fort", "Flower Field", "Cafe Candid", "Rainy Day Shoot"],
      maternity: ["Studio Glow", "Garden Session", "Partner Portrait", "Silhouette Bump", "Gown Series", "Family Frame"],
      baby: ["Prop Theme Setup", "Studio Newborn", "Sibling Frame", "Milestone Cake", "Bathtub Theme", "Cozy Wrap"],
      birthday: ["Cake Cutting", "Candid Laughs", "Balloon Decor", "Theme Party", "Family Frame", "Photo Booth"],
      event: ["Stage Coverage", "Crowd Candid", "Corporate Event", "Award Moment", "Cultural Show", "Aerial View"],
      outdoor: ["Scenic Portrait", "Lake View", "City Skyline", "Nature Trail", "Golden Hour", "Drone Wide"],
      drone: ["Aerial Wedding", "Top-Down Shot", "Panorama Sweep", "Venue Flyover", "4K Cinematic", "Sunset Aerial"],
      video: ["Highlight Reel", "Cinematic Frame", "Documentary", "Titles & Score", "4K Coverage", "Same-Day Edit"],
      album: ["Lay-Flat Spread", "Leather Cover", "Gold Embossing", "Photobook Set", "Canvas Print", "Luxury Box"],
      housewarming: ["Puja Rituals", "Ceremony Frame", "Family Portrait", "Decor Detail", "Candid Guests", "Venue Drone"],
      sareefunction: ["Saree Draping Ceremony", "Traditional Rituals", "Family Blessings", "Candid Moments", "Decor Details", "Group Portrait"],
      traditionalphoto: ["Puja & Mantras", "Stage Group Shot", "Ritual Details", "Traditional Couple", "Family Blessings", "Candid Guests"],
      cinematicvideo: ["4K Teaser Reel", "Gimbal Motion Shot", "Color Graded Frame", "Cinematic Audio", "Drone Sweeps", "Feature Film"],
      ledscreens: ["LED Wall Stage", "Live Switcher Feed", "Crisp Visual Output", "Dual Wall Setup", "Outdoor Display", "Event Stage Rigs"]
    };

    const PORTFOLIO_FILES = {
      wedding: ["wedding-1.png", "wedding-2.png", "wedding-3.png", "wedding-4.png", "wedding-5.png", "wedding-6.png", "wedding-7.png", "wedding-8.png"],
      prewedding: ["pre-wedding-1.png", "pre-wedding-2.png", "pre-wedding-3.png", "pre-wedding-4.png", "pre-wedding-5.png", "pre-wedding-6.png"],
      maternity: ["maternity-1.png", "maternity-2.png", "maternity-3.png", "maternity_4.jpg", "maternity_5.jpg", "maternity_6.jpg"],
      baby: ["baby_1.jpg", "baby_2.jpg", "baby_3.jpg", "baby_4.jpg", "baby_5.jpg", "baby_6.jpg"],
      birthday: ["birthday_1.jpg", "birthday_2.jpg", "birthday_3.jpg", "birthday_4.jpg", "birthday_5.jpg", "birthday_6.jpg"],
      event: ["event_1.jpg", "event_2.jpg", "event_3.jpg", "event_4.jpg", "event_5.jpg", "event_6.jpg"],
      outdoor: ["outdoor_1.jpg", "outdoor_2.jpg", "outdoor_3.jpg", "outdoor_4.jpg", "outdoor_5.jpg", "outdoor_6.jpg"],
      drone: ["drone_1.jpg", "drone_2.jpg", "drone_3.jpg", "drone_4.jpg", "drone_5.jpg", "drone_6.jpg"],
      video: ["video_1.jpg", "video_2.jpg", "video_3.jpg", "video_4.jpg", "video_5.jpg", "video_6.jpg"],
      album: ["album_1.jpg", "album_2.jpg", "album_3.jpg", "album_4.jpg", "album_5.jpg", "album_6.jpg"],
      housewarming: ["housewarming_1.jpg", "housewarming_2.jpg", "housewarming_3.jpg", "housewarming_4.jpg", "housewarming_5.jpg", "housewarming_6.jpg"],
      sareefunction: ["saree-ceremony-1..png", "saree-ceremony-2.png", "saree-ceremony-3.png", "saree-ceremony-4.png", "saree-ceremony-5.png", "saree-ceremony-6.png"],
      traditionalphoto: ["traditional-photography-1.png", "traditional-photography-2.png", "traditional-photography-3.png", "traditional-photography-4.png", "traditional-photography-5.png", "traditional-photography-6.png"],
      cinematicvideo: ["cinematic-videography-1.png", "cinematic-videography-2.png", "cinematic-videography-3.png", "cinematic-videography-4.png", "cinematic-videography-5.png", "cinematic-videography-6.png"],
      ledscreens: ["led-screens-1.png", "led-screens-2.png", "led-screens-3.png", "led-screens-4.png", "led-screens-5.png", "led-screens-6.png"]
    };

    const PACKAGES = {
      wedding: [
        { tier: "Standard", title: "Standard Wedding Photography", price: "₹24,999", feat: ["1 Professional Photographer", "1 Professional Videographer", "150+ High-Res Edited Photos", "Standard Digital Delivery", "1 Event Day Coverage"] },
        { tier: "Premium", title: "Premium Wedding Photography", price: "₹44,999", featured: true, feat: ["2 Professional Photographers", "1 Cinematic Videographer", "300+ High-Res Edited Photos", "Cinematic Highlight Teaser", "Premium Photo Album Book", "Drone Shoot Included"] },
        { tier: "Platinum", title: "Platinum Wedding Photography", price: "₹74,999", feat: ["2 Premium Photographers", "2 Cinematic Videographers", "500+ High-Res Edited Photos", "Full Cinematic Film Coverage", "2 Premium Lay-Flat Albums", "Crane & Drone Video Coverage", "Complementary Pre-Wedding Shoot"] }
      ],
      prewedding: [
        { tier: "Standard", title: "Standard Pre-Wedding Photography", price: "₹19,999", feat: ["4 Hours Outdoor Shoot", "1 Scenic Location", "30 High-Res Edited Photos", "Full Digital Album Delivery", "Outfit Changes Allowed (Max 2)"] },
        { tier: "Premium", title: "Premium Pre-Wedding Photography", price: "₹34,999", featured: true, feat: ["Full Day Shoot (8 Hours)", "2 Premium Locations", "60 High-Res Edited Photos", "2-Minute Cinematic Love Teaser", "Shoot Props & Helper Assist"] },
        { tier: "Platinum", title: "Platinum Pre-Wedding Photography", price: "₹54,999", feat: ["Full Day Shoot (10 Hours)", "3 Premium/Exotic Locations", "100 High-Res Edited Photos", "4-Minute Cinematic Love Film", "Outfit Styling & Makeup Artist", "Drone Shots Included"] }
      ],
      maternity: [
        { tier: "Standard", title: "Standard Maternity Shoot", price: "₹8,999", feat: ["3 Hours Studio/Garden Session", "Outfit Changes Allowed (Max 2)", "25 High-Res Edited Photos", "Digital High-Res Delivery"] },
        { tier: "Premium", title: "Premium Maternity Shoot", price: "₹17,999", featured: true, feat: ["Outdoor & Indoor Studio Sessions", "3 Premium Maternity Gowns Provided", "Professional Hair & Makeup Artist", "Premium Canvas Print (16x20)"] },
        { tier: "Platinum", title: "Platinum Maternity Shoot", price: "₹27,999", feat: ["Full Day Outdoor + Studio Session", "5 Premium Maternity Gowns Provided", "Professional Hair & Makeup Artist", "Partner & Family Portraits Included", "Premium Canvas Print (24x36)", "Cinematic Maternity Video Reel"] }
      ],
      baby: [
        { tier: "Standard", title: "Standard Baby Shoot", price: "₹6,999", feat: ["2 Hours Studio Session", "2 Customized Props & Themes", "15 High-Res Edited Photos", "Digital High-Res Delivery"] },
        { tier: "Premium", title: "Premium Baby Shoot", price: "₹12,999", featured: true, feat: ["4 Hours Studio Session", "4 Customized Props & Themes", "30 High-Res Edited Photos", "Family Portrait Portion Included", "Hardcover Baby Photobook"] },
        { tier: "Platinum", title: "Platinum Baby Shoot", price: "₹19,999", feat: ["Full Day Studio Session", "6 Customized Props & Themes", "50 High-Res Edited Photos", "Family Portrait Session Included", "Premium Hardcover Baby Photobook", "Cinematic Baby Milestone Video"] }
      ],
      birthday: [
        { tier: "Standard", title: "Standard Birthday Photography", price: "₹7,999", feat: ["3 Hours Party Coverage", "Traditional + Candid Photos", "100+ High-Res Digital Delivery", "Fast 3-Day Turnaround"] },
        { tier: "Premium", title: "Premium Birthday Photography", price: "₹14,999", featured: true, feat: ["Full Birthday Event Video", "2 Photographers (Candid/Traditional)", "Premium Birthday Album Book", "Animated Digital Invites"] },
        { tier: "Platinum", title: "Platinum Birthday Photography", price: "₹22,999", feat: ["Full Day Event Coverage", "3 Photographers + 1 Videographer", "Cinematic Highlight Film", "Premium Birthday Album Book", "Drone Shots for Outdoor Parties", "Same-Day Photo Booth Prints"] }
      ],
      event: [
        { tier: "Standard", title: "Standard Event Coverage", price: "₹13,999", feat: ["4 Hours Event Coverage", "Traditional + Candid Coverage", "200+ High-Res Digital Delivery", "Digital Album Download Link"] },
        { tier: "Premium", title: "Premium Event Coverage", price: "₹24,999", featured: true, feat: ["8 Hours Event Coverage", "2 Professional Photographers", "Event Video Coverage Included", "Printed Hardcover Album Link"] },
        { tier: "Platinum", title: "Platinum Event Coverage", price: "₹39,999", feat: ["Full Day + Evening Coverage", "3 Professional Photographers", "Cinematic Event Highlight Film", "Drone Aerial Coverage Included", "Premium Printed Hardcover Album", "Same-Day Photo Highlights Reel"] }
      ],
      outdoor: [
        { tier: "Standard", title: "Standard Outdoor Photography", price: "₹4,999", feat: ["2 Hours Outdoor Session", "1 Selected Scenic Location", "20 High-Res Edited Photos", "Full Digital Album Delivery"] },
        { tier: "Premium", title: "Premium Outdoor Photography", price: "₹9,999", featured: true, feat: ["4 Hours Shoot", "Up to 2 Locations", "45 High-Res Edited Photos", "Premium Lay-Flat Album Book", "Drone Shots Included"] },
        { tier: "Platinum", title: "Platinum Outdoor Photography", price: "₹16,999", feat: ["Full Day Shoot (6 Hours)", "Up to 3 Premium Locations", "75 High-Res Edited Photos", "Premium Lay-Flat Album Book", "Drone Shots Included", "Professional Styling Assistance"] }
      ],
      drone: [
        { tier: "Standard", title: "Standard Aerial Coverage", price: "₹7,999", feat: ["2 Hours Drone Shoot", "High-Resolution Aerial Photos", "4K Video RAW Footage Clips", "1 Edited Aerial Video Teaser"] },
        { tier: "Premium", title: "Premium Aerial Production", price: "₹14,999", featured: true, feat: ["Full Day Aerial Coverage", "Cinematic Aerial Videography", "Color Graded & Edited Footage", "3D Mapping/Panoramas"] },
        { tier: "Platinum", title: "Platinum Aerial Production", price: "₹24,999", feat: ["Full Day Multi-Location Coverage", "2 Licensed Drone Pilots", "4K Cinematic Aerial Film", "3D Mapping & Panoramas", "Color Graded Highlight Reel", "Same-Day Raw Footage Delivery"] }
      ]
    };

    /* Cloudinary auto-format/auto-quality transform: purely size-reducing (no resize/crop),
       safe to wrap any URL — no-ops for non-Cloudinary URLs or already-transformed ones. */
    function cldOpt(url) {
      // Cloudinary account has Strict Transformations enabled — any on-the-fly
      // transform (even a plain resize) 400s. No-op until that's turned off.
      return url;
    }

    let activeCategory = "wedding";
    let activeLightboxIndex = 0;

    /* INIT & URL SEARCH PARAMS */
    window.addEventListener("DOMContentLoaded", () => {
      const urlParams = new URLSearchParams(window.location.search);
      const catParam = urlParams.get("category");
      const itemParam = urlParams.get("item");

      if (catParam && CATEGORIES.some(c => c.id === catParam)) {
        activeCategory = catParam;
      }

      renderTabs();
      loadCategoryView(activeCategory);

      if (itemParam !== null) {
        const idx = parseInt(itemParam, 10);
        if (!isNaN(idx)) {
          openLightbox(idx);
        }
      }
    });

    function renderTabs() {
      const container = document.getElementById("tabsContainer");
      container.innerHTML = CATEGORIES.map(c => `
        <div class="tab-pill ${c.id === activeCategory ? 'active' : ''}" onclick="selectCategory('${c.id}')">
          <span>${c.icon}</span>
          <span>${c.name}</span>
        </div>
      `).join("");
    }

    function selectCategory(catId) {
      activeCategory = catId;
      renderTabs();
      loadCategoryView(activeCategory);
      // update URL without reloading page
      const newUrl = window.location.pathname + '?category=' + encodeURIComponent(catId);
      window.history.pushState({ path: newUrl }, '', newUrl);
    }

    function loadCategoryView(catId) {
      const catMeta = CATEGORIES.find(c => c.id === catId) || CATEGORIES[0];
      const photos = FOLIO[catId] || FOLIO.wedding;
      const files = PORTFOLIO_FILES[catId] || PORTFOLIO_FILES.wedding;

      // Update Hero
      document.getElementById("heroBadge").textContent = `${catMeta.icon} ${catMeta.name.toUpperCase()}`;
      document.getElementById("heroTitle").textContent = `${catMeta.name} Portfolio`;
      document.getElementById("heroDesc").textContent = catMeta.tagline;
      document.getElementById("statPhotos").textContent = `${files.length}+`;

      // Update Section Head
      document.getElementById("photoCountTag").textContent = `${files.length} Photos Available`;

      // Update Photo Grid
      const grid = document.getElementById("galleryGrid");
      grid.innerHTML = photos.map((caption, idx) => {
        const filename = files[idx % files.length];
        const imgSrc = cldOpt(`https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/Photography_assets/assets/portfolio/${filename}`);
        return `
          <div class="photo-card" onclick="openLightbox(${idx})">
            <div class="photo-thumb-wrap">
              <img class="photo-img" src="${imgSrc}" alt="${caption}" loading="lazy" onerror="this.onerror=null;this.src='https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/Photography_assets/assets/portfolio/wedding-1.png'">
              <div class="photo-overlay">
                <div class="overlay-top">
                  <span class="zoom-badge">🔍 Click to Expand</span>
                </div>
                <div class="overlay-bottom">
                  <div class="photo-title-hover">${caption}</div>
                  <button type="button" class="btn-quick-book" onclick="event.stopPropagation(); bookFromPhoto(${idx})">
                    ⚡ Book Now
                  </button>
                </div>
              </div>
            </div>
            <div class="photo-body">
              <div>
                <div class="photo-title">${caption}</div>
                <div class="photo-sub">Sai Kumar Studio</div>
              </div>
              <span style="font-size:16px; color:var(--maroon);">↗</span>
            </div>
          </div>
        `;
      }).join("");

      // Update Packages
      const pkgTitle = document.getElementById("pkgCategoryTitle");
      pkgTitle.textContent = `Explore ${catMeta.name} Packages & Pricing`;

      const pkgs = PACKAGES[catId] || PACKAGES.wedding;
      const pkgGrid = document.getElementById("pkgCardsGrid");
      pkgGrid.innerHTML = pkgs.map((p, i) => `
        <div class="pkg-card ${p.featured ? 'featured' : ''}">
          ${p.featured ? '<div class="featured-tag">⭐ Most Popular</div>' : ''}
          <div>
            <div class="pkg-tier-label">${p.tier} Package</div>
            <h3 class="pkg-card-title">${p.title}</h3>
            <ul class="pkg-feature-list">
              ${p.feat.map(f => `<li>${f}</li>`).join("")}
            </ul>
          </div>
          <div class="pkg-card-footer">
            <div class="pkg-price-val">${p.price}</div>
            <button class="btn-book-pkg" onclick="goBookingPackage('${catId}', ${i})">
              Book Package Now →
            </button>
          </div>
        </div>
      `).join("");
    }

    /* LIGHTBOX LOGIC */
    function openLightbox(index) {
      const files = PORTFOLIO_FILES[activeCategory] || PORTFOLIO_FILES.wedding;
      const captions = FOLIO[activeCategory] || FOLIO.wedding;
      const catMeta = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0];

      activeLightboxIndex = index % files.length;
      const filename = files[activeLightboxIndex];
      const caption = captions[activeLightboxIndex % captions.length];
      const imgSrc = cldOpt(`https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/Photography_assets/assets/portfolio/${filename}`);

      document.getElementById("lightboxImg").src = imgSrc;
      document.getElementById("lightboxCatTag").textContent = catMeta.name.toUpperCase();
      document.getElementById("lightboxTitle").textContent = caption;

      document.getElementById("lightboxModal").classList.add("active");
      document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
      document.getElementById("lightboxModal").classList.remove("active");
      document.body.style.overflow = "";
    }

    function closeLightboxOnBg(e) {
      if (e.target.id === "lightboxModal") {
        closeLightbox();
      }
    }

    function navigateLightbox(dir) {
      const files = PORTFOLIO_FILES[activeCategory] || PORTFOLIO_FILES.wedding;
      let newIdx = activeLightboxIndex + dir;
      if (newIdx < 0) newIdx = files.length - 1;
      if (newIdx >= files.length) newIdx = 0;
      openLightbox(newIdx);
    }

    // Keyboard controls
    document.addEventListener("keydown", (e) => {
      const modal = document.getElementById("lightboxModal");
      if (!modal.classList.contains("active")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") navigateLightbox(-1);
      if (e.key === "ArrowRight") navigateLightbox(1);
    });

    /* BOOKING ACTIONS */
    function bookCurrentCategory() {
      const pkgs = PACKAGES[activeCategory] || PACKAGES.wedding;
      const defaultPkg = pkgs[0];
      const params = new URLSearchParams({
        category: activeCategory,
        package: defaultPkg.title,
        tier: defaultPkg.tier.toLowerCase(),
        price: defaultPkg.price,
        feats: defaultPkg.feat.join("|")
      });
      window.location.href = `booking.html?${params.toString()}`;
    }

    function bookFromPhoto(photoIdx) {
      bookCurrentCategory();
    }

    function bookFromLightbox() {
      bookCurrentCategory();
    }

    function goBookingPackage(catId, pkgIdx) {
      const pkgs = PACKAGES[catId] || PACKAGES.wedding;
      const p = pkgs[pkgIdx] || pkgs[0];
      const params = new URLSearchParams({
        category: catId,
        package: p.title,
        tier: p.tier.toLowerCase(),
        price: p.price,
        feats: p.feat.join("|")
      });
      window.location.href = `booking.html?${params.toString()}`;
    }

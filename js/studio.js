let categoriesData = {};

let currentCategory = "all";
let searchQuery = "";

// Applies Cloudinary's auto-format/auto-quality transformation to any Cloudinary
// delivery URL right before it's rendered. No-op for non-Cloudinary URLs (local
// paths, icons8.com, data:/blob: URIs), so it's safe to wrap any image-url
// expression with cldOpt(...) without checking the source first.
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

/* ================= DESKTOP FILTER BAR STATE ================= */
const categoryDefaultTurnaround = {
  photo_printing: "30 min",
  photo_lamination: "20 min",
  photo_restoration: "1 day",
  photo_portrait: "1 hour",
  id_card_printing: "45 min",
  certificate_printing: "30 min",
  scanning: "20 min",
  cd_dvd_copying: "1 hour"
};

/* ================= DESKTOP HERO CAROUSEL (SLIDES PER SERVICE) ================= */
const heroBadgesHTML = `
  <div class="hero-banner-badges">
    <span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 6v6l4 2"></path>
      </svg>
      24H Delivery
    </span>
    <span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2l2.6 6.6 7 .5-5.4 4.5 1.8 6.9L12 16.9 5.9 20.5l1.8-6.9L2.3 9.1l7-.5z"></path>
      </svg>
      Premium Quality
    </span>
    <span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
      Secure Payment
    </span>
  </div>
`;

const heroSlideBanners = {
  photo_printing: { src: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/studio_assets/slide-images/photo_printing.png", bg: "#7a0f3d" },
  photo_lamination: { src: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/studio_assets/slide-images/photo-lamination.png", bg: "#64b5f6" },
  photo_restoration: { src: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/studio_assets/slide-images/photo-restoration.png", bg: "#9acb9a" },
  photo_portrait: { src: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/studio_assets/slide-images/photo-editing.png", bg: "#fce9cc" },
  id_card_printing: { src: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/studio_assets/slide-images/id-card-printing.png", bg: "#0c2b18" },
  certificate_printing: { src: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/studio_assets/slide-images/certificate-printing.png", bg: "#1a1408" },
  scanning: { src: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/studio_assets/slide-images/scanning.png", bg: "#c81e2c" },
  cd_dvd_copying: { src: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/studio_assets/slide-images/cd-dvd-copying.png", bg: "#d7edb0" },
  xerox_printing: { src: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/legacy/ChatGPT_Image_Aug_31_2026_11_00_54_PM.png", bg: "#f7ede0" }
};

function getHeroSlides() {
  const slides = [{
    key: "all",
    title: "Studio Services",
    desc: "One-stop solution for all your photography and printing needs. Professional quality, fast delivery and affordable prices.",
    img: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/assets/studio_camera_setup.jpg",
    banner: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/studio_assets/slide-images/all-services.png",
    bannerBg: "#f7ede0"
  }];
  Object.keys(categoriesData).forEach(key => {
    const cat = categoriesData[key];
    const bannerInfo = heroSlideBanners[key];
    const bannerSrc = (bannerInfo && typeof bannerInfo === 'object') ? bannerInfo.src : bannerInfo;
    const bannerBg = (bannerInfo && typeof bannerInfo === 'object') ? bannerInfo.bg : null;
    slides.push({ key, title: cat.title, desc: cat.desc, img: cat.icon, banner: bannerSrc, bannerBg: bannerBg });
  });
  return slides;
}

const HERO_SLIDES_VISIBLE = 2;
const HERO_SLIDE_GAP = 16;

let heroSlides = [];
let heroSlideIndex = 0;
let heroMaxIndex = 0;
let heroCarouselTimer = null;
let heroTransitioning = false;

function renderHeroSlideHTML(slide, eager) {
  const lazyAttr = eager ? '' : ' loading="lazy"';
  return slide.banner ? `
    <div class="hero-slide hero-slide-banner" onclick="switchCategory('${slide.key}')" style="${slide.bannerBg ? `background-color: ${slide.bannerBg};` : ''}">
      <img src="${cldOpt(slide.banner)}" alt="${slide.title}"${lazyAttr} style="${slide.bannerBg ? `background: ${slide.bannerBg};` : ''}">
    </div>
  ` : `
    <div class="hero-slide" onclick="switchCategory('${slide.key}')">
      <div class="hero-banner-text">
        <h1>${slide.title}</h1>
        <p>${slide.desc}</p>
        ${heroBadgesHTML}
      </div>
      <div class="hero-banner-image">
        <img src="${cldOpt(slide.img)}" alt="${slide.title}"${lazyAttr}>
      </div>
    </div>
  `;
}

function buildHeroCarousel() {
  heroSlides = getHeroSlides();
  const track = document.getElementById('heroCarouselTrack');
  const dots = document.getElementById('heroCarouselDots');
  if (!track || !dots) return;

  heroMaxIndex = Math.max(0, heroSlides.length - HERO_SLIDES_VISIBLE);

  // Clone the tail before the first real slide and the head after the last real
  // slide so stepping past either end can keep sliding in the same direction —
  // the clone visually duplicates the real slide it wraps to, so the reset back
  // to the real index (done with transitions disabled) is imperceptible.
  const extendedSlides = [
    ...heroSlides.slice(-HERO_SLIDES_VISIBLE),
    ...heroSlides,
    ...heroSlides.slice(0, HERO_SLIDES_VISIBLE)
  ];
  track.innerHTML = extendedSlides.map((slide, i) =>
    renderHeroSlideHTML(slide, i >= HERO_SLIDES_VISIBLE && i < HERO_SLIDES_VISIBLE * 2)
  ).join('');

  dots.innerHTML = Array.from({ length: heroMaxIndex + 1 }, (_, i) => `
    <span class="hero-dot ${i === 0 ? 'active' : ''}" onclick="event.stopPropagation(); goToHeroSlide(${i}, true)"></span>
  `).join('');

  if (!track.dataset.transitionBound) {
    track.addEventListener('transitionend', handleHeroTransitionEnd);
    track.dataset.transitionBound = '1';
  }

  heroSlideIndex = 0;
  heroTransitioning = false;
  track.style.transition = 'none';
  updateHeroCarouselPosition();
  void track.offsetHeight;
  track.style.transition = '';
  startHeroAutoplay();
}

function updateHeroCarouselPosition() {
  const track = document.getElementById('heroCarouselTrack');
  const firstSlide = track ? track.querySelector('.hero-slide') : null;
  if (!track || !firstSlide) return;
  const step = firstSlide.getBoundingClientRect().width + HERO_SLIDE_GAP;
  const extIndex = heroSlideIndex + HERO_SLIDES_VISIBLE;
  track.style.transform = `translateX(-${extIndex * step}px)`;

  const dotSpan = heroMaxIndex + 1;
  const dotIndex = ((heroSlideIndex % dotSpan) + dotSpan) % dotSpan;
  document.querySelectorAll('.hero-dot').forEach((d, i) => d.classList.toggle('active', i === dotIndex));
}

function goToHeroSlide(i, userInitiated) {
  if (!heroSlides.length) return;
  heroTransitioning = false;
  heroSlideIndex = i;
  updateHeroCarouselPosition();
  if (userInitiated) startHeroAutoplay();
}

function stepHeroSlide(direction, userInitiated) {
  if (!heroSlides.length || heroTransitioning) return;
  heroTransitioning = true;
  heroSlideIndex += direction;
  updateHeroCarouselPosition();
  if (userInitiated) startHeroAutoplay();
}

function handleHeroTransitionEnd(e) {
  if (e.target !== e.currentTarget || e.propertyName !== 'transform') return;
  heroTransitioning = false;
  const track = e.currentTarget;

  if (heroSlideIndex >= heroSlides.length) {
    // Reached the appended clone of the first slide(s) — content is identical
    // to index 0, so resetting here (transition disabled) is invisible.
    track.style.transition = 'none';
    heroSlideIndex = 0;
    updateHeroCarouselPosition();
    void track.offsetHeight;
    track.style.transition = '';
  } else if (heroSlideIndex <= -HERO_SLIDES_VISIBLE) {
    // Reached the prepended clone of the last slide(s) — content is identical
    // to heroMaxIndex, so resetting here is invisible.
    track.style.transition = 'none';
    heroSlideIndex = heroMaxIndex;
    updateHeroCarouselPosition();
    void track.offsetHeight;
    track.style.transition = '';
  }
}

function heroCarouselNext() {
  stepHeroSlide(1, true);
}

function heroCarouselPrev() {
  stepHeroSlide(-1, true);
}

function startHeroAutoplay() {
  clearInterval(heroCarouselTimer);
  heroCarouselTimer = setInterval(() => stepHeroSlide(1, false), 4000);
}

let filterState = { sort: "popular" };

function setSortFilter(value) {
  filterState.sort = value;
  renderContent();
}

function applyFilters(packages) {
  let result = packages.slice();

  if (filterState.sort === "lowToHigh") {
    result.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
  } else if (filterState.sort === "highToLow") {
    result.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
  }

  return result;
}

function initSidebar() {
  const keys = Object.keys(categoriesData);

  // Desktop Sidebar
  let sidebarHTML = `
    <div class="sidebar-item ${currentCategory === 'all' ? 'active' : ''}" onclick="switchCategory('all', false)" data-key="all">
      <img src="https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/studio_assets/side-bar-icons/all-services.png" alt="All Studio Services">
      <span>All Services</span>
    </div>
  `;
  sidebarHTML += keys.map(key => {
    const cat = categoriesData[key];
    return `
      <div class="sidebar-item ${key === currentCategory ? 'active' : ''}" onclick="switchCategory('${key}', false)" data-key="${key}">
        <img src="${cldOpt(cat.icon)}" alt="${cat.title}">
        <span>${cat.title}</span>
      </div>
    `;
  }).join('');
  document.getElementById('desktopSidebar').innerHTML = `<div class="sidebar-sticky-inner">${sidebarHTML}</div>`;

  // Mobile Scrolling Bar
  let mobileHTML = `
    <div class="mobile-cat-item ${currentCategory === 'all' ? 'active' : ''}" onclick="switchCategory('all', false)" data-mkey="all">
      <img src="https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/studio_assets/side-bar-icons/all-services.png" alt="All Studio Services">
      <span>All Services</span>
    </div>
  `;
  mobileHTML += keys.map(key => {
    const cat = categoriesData[key];
    return `
      <div class="mobile-cat-item ${key === currentCategory ? 'active' : ''}" onclick="switchCategory('${key}', false)" data-mkey="${key}">
        <img src="${cldOpt(cat.icon)}" alt="${cat.title}">
        <span>${cat.title}</span>
      </div>
    `;
  }).join('');
  document.getElementById('mobileCatScroll').innerHTML = mobileHTML;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function buildCategoryMegaMenus() {
  document.querySelectorAll('.menu-mega-dropdown').forEach(dd => {
    const key = dd.dataset.megaKey;
    const cat = categoriesData[key];
    if (!cat) return;

    const linksHTML = cat.packages.map(pkg => `
      <a href="javascript:void(0)" class="mega-link" data-mega-name="${escapeHtml(pkg.name)}">
        ${escapeHtml(pkg.name)}
        ${pkg.badge ? `<span class="mega-badge">${escapeHtml(pkg.badge)}</span>` : ''}
      </a>
    `).join('');

    const banner = heroSlideBanners[key];
    const startingPrice = Math.min(...cat.packages.map(p => parsePrice(p.price)));

    dd.innerHTML = `
      <div class="mega-col">
        <h4>${escapeHtml(cat.title)}</h4>
        ${linksHTML}
      </div>
      <a href="javascript:void(0)" class="mega-promo" data-mega-viewall>
        <img src="${cldOpt(banner ? banner.src : cat.icon)}" alt="${escapeHtml(cat.title)}" loading="lazy">
        <div class="mega-promo-text">
          <strong>${escapeHtml(cat.title)}</strong>
          <span>Starting at &#8377;${startingPrice}</span>
        </div>
      </a>
    `;

    dd.addEventListener('click', (e) => {
      const link = e.target.closest('.mega-link');
      const viewAll = e.target.closest('[data-mega-viewall]');
      if (link) {
        switchCategory(key);
        const idx = currentPackages.findIndex(p => p.name === link.dataset.megaName);
        if (idx >= 0) openProductPreview(idx);
      } else if (viewAll) {
        switchCategory(key);
      }
    });
  });
}

// Dynamically measures the sticky header (same idea as corporate.js's
// getScrollOffset()) so the jump to categoryHeader clears it instead of
// landing partly hidden underneath.
function getStudioScrollOffset() {
  const header = document.querySelector('.header-sticky-wrap');
  return (header ? header.offsetHeight : 0) + 12;
}

// Brings the selected category's title/packages into view instead of leaving
// the visitor at the hero carousel above it (which cycles through every
// category, not just the one just selected).
function scrollToStudioCategory(behavior) {
  const target = document.getElementById('categoryHeader');
  if (!target) return;
  const y = target.getBoundingClientRect().top + window.pageYOffset - getStudioScrollOffset();
  window.scrollTo({ top: Math.max(0, y), behavior: behavior || 'smooth' });
}

function switchCategory(key, syncTopNav = true) {
  if (key !== 'all' && !categoriesData[key]) return;
  currentCategory = key;

  document.querySelectorAll('.sidebar-item').forEach(el => {
    el.classList.toggle('active', el.dataset.key === key);
  });
  document.querySelectorAll('.mobile-cat-item').forEach(el => {
    el.classList.toggle('active', el.dataset.mkey === key);
  });
  if (syncTopNav) {
    document.querySelectorAll('.menu-cat-link').forEach(el => {
      el.classList.toggle('active', el.dataset.key === key);
    });
  }

  const url = new URL(window.location);
  url.searchParams.set('category', key);
  window.history.pushState({}, '', url);

  renderContent();
  scrollToStudioCategory('smooth');
}

function renderContent() {
  let title = "";
  let desc = "";
  let packages = [];

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    const keys = Object.keys(categoriesData);
    keys.forEach(k => {
      packages = packages.concat(categoriesData[k].packages.map(p => ({ ...p, _catKey: k })));
    });
    packages = packages.filter(pkg =>
      pkg.name.toLowerCase().includes(q) || pkg.subtitle.toLowerCase().includes(q)
    );
    title = `Search results for "${searchQuery}"`;
    desc = packages.length
      ? `${packages.length} service${packages.length === 1 ? '' : 's'} found matching your search.`
      : "No services matched your search. Try a different keyword.";
  } else if (currentCategory === 'all') {
    title = "All Studio Services";
    desc = "Discover our comprehensive suite of quick passport photos, document prints, photo enlargements, photocopying, scanning, lamination, and graphic design.";
    const keys = Object.keys(categoriesData);
    keys.forEach(k => {
      packages = packages.concat(categoriesData[k].packages.map(p => ({ ...p, _catKey: k })));
    });
  } else {
    const cat = categoriesData[currentCategory];
    title = cat.title;
    desc = cat.desc;
    packages = cat.packages.map(p => ({ ...p, _catKey: currentCategory }));
  }

  packages = applyFilters(packages);

  // Header
  document.getElementById('catTitle').textContent = title;
  document.getElementById('catDesc').textContent = desc;

  // Packages
  currentPackages = packages;
  const packagesHTML = packages.map((pkg, idx) => {
    return `
    <div class="pkg-card">
      <div class="pkg-image-wrap" onclick="openProductPreview(${idx})">
        <img class="pkg-image" src="${cldOpt(pkg.img)}" alt="${pkg.name}" loading="lazy">
        ${pkg.tag ? `<span class="pkg-badge">${escapeHtml(pkg.tag)}</span>` : ''}
        ${pkg.badge ? `<span class="pkg-ribbon pkg-ribbon-${pkg.badge.toLowerCase()}">${pkg.badge}</span>` : ''}
        <button type="button" class="pkg-wishlist-btn" aria-label="Save" onclick="event.stopPropagation(); this.classList.toggle('active')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"></path>
          </svg>
        </button>
      </div>
      <div class="pkg-body" onclick="openProductPreview(${idx})">
        <h3>${pkg.name}</h3>
        <div class="pkg-meta-row">
          ${pkg.oldPrice
            ? `<span class="pkg-price">${pkg.price}</span>
               <span class="pkg-old-price">${pkg.oldPrice}</span>
               <span class="pkg-discount-badge">${Math.round((1 - parsePrice(pkg.price) / parsePrice(pkg.oldPrice)) * 100)}% off</span>`
            : `<span class="pkg-price">${pkg.price}</span>`}
        </div>
      </div>
    </div>
  `;
  }).join('');
  document.getElementById('packagesGrid').innerHTML = packagesHTML;
}

function orderNowFromCard(idx) {
  const pkg = currentPackages[idx];
  if (!pkg) return;
  if (pkg.requiresPhotoUpload || (pkg.input_fields && pkg.input_fields.length)) {
    openProductPreview(idx);
    return;
  }
  addToStudioCart(pkg.name, pkg.price, pkg.img, null, null, pkg.id);
  location.href = 'cart.html';
}

/* ================= PRODUCT PREVIEW MODAL ================= */
let currentPackages = [];
let activePreviewPkg = null;
let activePreviewImgIdx = 0;
let activePreviewQtyOption = null;
let activePreviewPurpose = "";
let activePreviewPhotoFile = null;
let activePreviewItemQty = 1;

function openProductPreview(idx, opts = {}) {
  const pkg = currentPackages[idx];
  if (!pkg) return;
  activePreviewPkg = pkg;
  activePreviewImgIdx = 0;
  activePreviewItemQty = 1;
  document.getElementById('previewItemQty').textContent = '1';

  const images = pkg.images && pkg.images.length ? pkg.images : [pkg.img];
  const highlights = pkg.highlights && pkg.highlights.length
    ? pkg.highlights
    : ["High-Quality Output", "Premium Paper Stock", "Quick Studio Handover"];

  const catTitle = document.getElementById('catTitle').textContent;
  document.getElementById('previewBreadcrumb').innerHTML =
    `<a href="javascript:void(0)" onclick="closeProductPreview()">Home</a> / ${catTitle} / ${pkg.name}`;

  document.getElementById('previewTitle').textContent = pkg.name;
  document.getElementById('previewSubtitle').textContent = pkg.subtitle;
  document.getElementById('previewDescriptionContent').textContent = pkg.subtitle;
  document.getElementById('previewPrice').textContent = pkg.price;
  document.getElementById('previewActionPrice').textContent = pkg.price;

  const oldPriceEl = document.getElementById('previewOldPrice');
  const discountEl = document.getElementById('previewDiscountPercent');
  if (pkg.oldPrice) {
    oldPriceEl.textContent = pkg.oldPrice;
    oldPriceEl.style.display = 'inline';
    const oldNum = parsePrice(pkg.oldPrice);
    const newNum = parsePrice(pkg.price);
    const percentOff = Math.round((1 - newNum / oldNum) * 100);
    discountEl.textContent = `${percentOff}% off`;
    discountEl.style.display = 'inline';
  } else {
    oldPriceEl.style.display = 'none';
    discountEl.style.display = 'none';
  }

  renderPreviewOptions(pkg);

  const galleryEl = document.getElementById('previewGallery');
  galleryEl.innerHTML = images.map((img, i) => `
    <img src="${cldOpt(img)}" class="preview-slide" alt="${pkg.name} view ${i + 1}">
  `).join('');

  document.getElementById('previewDots').innerHTML = images.map((img, i) => `
    <span class="preview-dot ${i === 0 ? 'active' : ''}" onclick="scrollPreviewTo(${i})"></span>
  `).join('');
  document.getElementById('previewDots').style.display = images.length > 1 ? 'flex' : 'none';

  document.getElementById('previewThumbRail').innerHTML = images.map((img, i) => `
    <img src="${cldOpt(img)}" class="preview-thumb ${i === 0 ? 'active' : ''}" onclick="scrollPreviewTo(${i})" alt="${pkg.name} thumbnail ${i + 1}">
  `).join('');

  galleryEl.scrollLeft = 0;
  galleryEl.onscroll = handlePreviewGalleryScroll;

  document.getElementById('previewHighlights').innerHTML = highlights.map(h => `<li>${h}</li>`).join('');

  const est = new Date();
  est.setDate(est.getDate() + (pkg.deliveryDays || 3));
  const estStr = est.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short' });
  document.getElementById('previewDeliveryEst').textContent = `Delivery by ${estStr}`;

  document.getElementById('productPreviewModal').classList.add('open');
  document.body.style.overflow = 'hidden';

  // Reflect the open product in the URL (?category=..&openProduct=..&pid=..) so the
  // address bar is specific to this product, refresh/share/back-button behave sanely,
  // and the existing deep-link reader (see DOMContentLoaded below) can re-open it. pid
  // is the real database id - included whenever the catalog gave us one - so the link
  // stays unique even if two products share a display name.
  if (!opts.skipHistory) {
    const url = new URL(window.location);
    url.searchParams.set('category', currentCategory);
    url.searchParams.set('openProduct', pkg.name);
    if (pkg.id) url.searchParams.set('pid', pkg.id);
    else url.searchParams.delete('pid');
    window.history.pushState({ studioProductPreview: true }, '', url);
  }
}

function renderPreviewOptions(pkg) {
  activePreviewQtyOption = null;
  activePreviewPurpose = "";
  activePreviewPhotoFile = null;

  const optionsWrap = document.getElementById('previewOptions');
  const qtyGroup = document.getElementById('previewQtyGroup');
  const purposeGroup = document.getElementById('previewPurposeGroup');
  const uploadGroup = document.getElementById('previewUploadGroup');
  const qtySelect = document.getElementById('previewQtySelect');
  const purposeSelect = document.getElementById('previewPurposeSelect');
  const uploadInput = document.getElementById('previewPhotoUpload');
  const uploadFilename = document.getElementById('previewUploadFilename');

  uploadInput.value = '';
  uploadFilename.textContent = '';
  [qtyGroup, purposeGroup, uploadGroup].forEach(g => g.classList.remove('field-error'));

  // Quantity/purpose (with per-option pricing) now live in pkg.input_fields, rendered
  // generically below - this group only still covers the legacy requiresPhotoUpload flag.
  qtyGroup.style.display = 'none';
  purposeGroup.style.display = 'none';
  const hasUpload = !!pkg.requiresPhotoUpload;
  optionsWrap.style.display = hasUpload ? 'flex' : 'none';
  uploadGroup.style.display = hasUpload ? 'flex' : 'none';

  const customFieldsWrap = document.getElementById('previewCustomFields');
  if (customFieldsWrap && window.ProductFields) {
    ProductFields.renderProductFields(customFieldsWrap, pkg);
    const price = ProductFields.getSelectedPrice(customFieldsWrap, pkg);
    const priceText = (price || price === 0) ? `₹${price}` : pkg.price;
    document.getElementById('previewPrice').textContent = priceText;
    document.getElementById('previewActionPrice').textContent = priceText;
  }
}

function initStudioProductAccordions() {
  document.querySelectorAll('.preview-accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.preview-accordion-item');
      const group = item?.parentElement;
      if (!item || !group) return;
      const shouldOpen = trigger.getAttribute('aria-expanded') !== 'true';
      group.querySelectorAll('.preview-accordion-item').forEach(other => {
        other.classList.remove('is-open');
        other.querySelector('.preview-accordion-trigger')?.setAttribute('aria-expanded', 'false');
      });
      if (shouldOpen) {
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });
  document.querySelector('.preview-accordion-item')?.classList.add('is-open');
}

function handlePreviewQtyChange(select) {
  if (!activePreviewPkg || !activePreviewPkg.quantityOptions) return;
  const opt = activePreviewPkg.quantityOptions.find(o => o.value === select.value);
  if (!opt) return;
  activePreviewQtyOption = opt;
  document.getElementById('previewPrice').textContent = `₹${opt.price}`;
  document.getElementById('previewActionPrice').textContent = `₹${opt.price}`;
}

function handlePreviewPurposeChange(select) {
  activePreviewPurpose = select.value;
  if (activePreviewPurpose) {
    document.getElementById('previewPurposeGroup').classList.remove('field-error');
  }
}

function handlePreviewPhotoUpload(input) {
  activePreviewPhotoFile = input.files && input.files[0] ? input.files[0] : null;
  document.getElementById('previewUploadFilename').textContent = activePreviewPhotoFile ? activePreviewPhotoFile.name : '';
  if (activePreviewPhotoFile) {
    document.getElementById('previewUploadGroup').classList.remove('field-error');
  }
}

function validatePreviewOptions() {
  if (!activePreviewPkg) return false;
  let valid = true;
  const missing = [];

  if (activePreviewPkg.requiresPhotoUpload && !activePreviewPhotoFile) {
    document.getElementById('previewUploadGroup').classList.add('field-error');
    missing.push('photo upload');
    valid = false;
  }

  if (!valid) {
    alert(`Please choose ${missing.join(' and ')} before continuing.`);
    return false;
  }

  const customFieldsWrap = document.getElementById('previewCustomFields');
  if (customFieldsWrap && window.ProductFields) {
    const fieldErrors = ProductFields.validateProductFields(customFieldsWrap, activePreviewPkg);
    if (fieldErrors.length) {
      alert(fieldErrors.join('\n'));
      return false;
    }
  }

  return valid;
}

// Reads the currently selected value of every single-select dropdown Customer
// Question (quantity/purpose/etc, in sort order) straight from the rendered
// controls, so the cart line's display name keeps the "(16 Photos – 4x6)" style
// suffix it always had, now driven by input_fields instead of the old
// quantityOptions/purposeOptions-specific state.
function previewDropdownSelections() {
  const wrap = document.getElementById('previewCustomFields');
  if (!wrap || !activePreviewPkg) return [];
  return (activePreviewPkg.input_fields || [])
    .filter(f => f.type === 'dropdown' && !f.multi_select)
    .slice().sort((a, b) => (a.sort || 0) - (b.sort || 0))
    .map(f => document.getElementById(`${wrap.id}_${f.id}`)?.value || '')
    .filter(Boolean);
}

function buildPreviewCartName() {
  const parts = [activePreviewPkg.name];
  const details = previewDropdownSelections();
  if (details.length) parts.push(`(${details.join(' – ')})`);
  return parts.join(' ');
}

function handlePreviewGalleryScroll() {
  const galleryEl = document.getElementById('previewGallery');
  const slideWidth = galleryEl.clientWidth;
  if (!slideWidth) return;
  const idx = Math.round(galleryEl.scrollLeft / slideWidth);
  if (idx === activePreviewImgIdx) return;
  activePreviewImgIdx = idx;
  document.querySelectorAll('.preview-dot').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });
  document.querySelectorAll('.preview-thumb').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });
}

function scrollPreviewTo(i) {
  const galleryEl = document.getElementById('previewGallery');
  galleryEl.scrollTo({ left: i * galleryEl.clientWidth, behavior: 'smooth' });
}

function sharePreviewProduct() {
  if (!activePreviewPkg) return;
  if (navigator.share) {
    navigator.share({ title: activePreviewPkg.name, text: activePreviewPkg.subtitle }).catch(() => {});
  } else {
    alert(`${activePreviewPkg.name} — ${activePreviewPkg.price}`);
  }
}

function adjustPreviewItemQty(delta) {
  activePreviewItemQty = Math.max(1, Math.min(99, activePreviewItemQty + delta));
  document.getElementById('previewItemQty').textContent = activePreviewItemQty;
}

function closeProductPreview() {
  document.getElementById('productPreviewModal').classList.remove('open');
  document.body.style.overflow = '';
  activePreviewPkg = null;

  if (new URLSearchParams(window.location.search).has('openProduct')) {
    const url = new URL(window.location);
    url.searchParams.delete('openProduct');
    url.searchParams.delete('pid');
    window.history.replaceState({}, '', url);
  }
}

// Closing the modal via the browser Back button lands here instead of closeProductPreview()
// (the URL has already changed by the time this fires) - just tear down the modal UI/state.
window.addEventListener('popstate', () => {
  if (activePreviewPkg && !new URLSearchParams(window.location.search).has('openProduct')) {
    document.getElementById('productPreviewModal').classList.remove('open');
    document.body.style.overflow = '';
    activePreviewPkg = null;
  }
});

// Reads the validated upload (if this package needs one) into a data URL so it can be
// stored on the cart item - File objects themselves aren't JSON-serializable for
// localStorage. Resolves to null for packages with no photo requirement.
function readActivePreviewPhoto() {
  if (!activePreviewPkg || !activePreviewPkg.requiresPhotoUpload || !activePreviewPhotoFile) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(activePreviewPhotoFile);
  });
}

// Returns { fields: {fieldId: value}, fieldLabels: {fieldId: label} } so the
// order-detail views (admin/js/orders.js, js/my-orders.js) can show a real
// label instead of the raw field id - or null if this product has none.
async function collectPreviewCustomFields() {
  const wrap = document.getElementById('previewCustomFields');
  if (!wrap || !window.ProductFields || !activePreviewPkg) return null;
  const fields = await ProductFields.collectProductFields(wrap, activePreviewPkg);
  if (!Object.keys(fields).length) return null;
  const fieldLabels = Object.fromEntries((activePreviewPkg.input_fields || []).map(f => [f.id, f.label]));
  return { fields, fieldLabels };
}

// The item's price, taking into account a priced Customer Questions dropdown
// (e.g. Studio's old quantity picker) if this product has one selected -
// falls back to the package's own price otherwise.
function currentPreviewPrice() {
  const wrap = document.getElementById('previewCustomFields');
  const price = wrap && window.ProductFields ? ProductFields.getSelectedPrice(wrap, activePreviewPkg) : null;
  return (price || price === 0) ? `₹${price}` : activePreviewPkg.price;
}

async function previewAddToCart() {
  if (!activePreviewPkg) return;
  if (!validatePreviewOptions()) return;
  const price = currentPreviewPrice();
  const photoData = await readActivePreviewPhoto();
  const custom = await collectPreviewCustomFields();
  const customization = (photoData || custom) ? { ...(photoData ? { photoData } : {}), ...(custom || {}) } : null;
  const requirement = activePreviewPkg.requiresPhotoUpload
    ? { label: 'Upload your photo', fields: ['photoData'], editUrl: `studio.html?category=${currentCategory}&openProduct=${encodeURIComponent(activePreviewPkg.name)}${activePreviewPkg.id ? `&pid=${encodeURIComponent(activePreviewPkg.id)}` : ''}` }
    : null;
  addToStudioCart(buildPreviewCartName(), price, activePreviewPkg.img, customization, requirement, activePreviewPkg.id, activePreviewItemQty);
  showCartToast();
}

let cartToastTimer = null;

function showCartToast() {
  const toast = document.getElementById('cartToast');
  if (!toast) return;
  toast.classList.add('show');
  clearTimeout(cartToastTimer);
  cartToastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function goToCartFromToast() {
  location.href = 'cart.html';
}

async function previewBuyNow() {
  if (!activePreviewPkg) return;
  if (!validatePreviewOptions()) return;
  const price = currentPreviewPrice();
  const photoData = await readActivePreviewPhoto();
  const custom = await collectPreviewCustomFields();
  const customization = (photoData || custom) ? { ...(photoData ? { photoData } : {}), ...(custom || {}) } : null;
  const requirement = activePreviewPkg.requiresPhotoUpload
    ? { label: 'Upload your photo', fields: ['photoData'], editUrl: `studio.html?category=${currentCategory}&openProduct=${encodeURIComponent(activePreviewPkg.name)}${activePreviewPkg.id ? `&pid=${encodeURIComponent(activePreviewPkg.id)}` : ''}` }
    : null;
  addToStudioCart(buildPreviewCartName(), price, activePreviewPkg.img, customization, requirement, activePreviewPkg.id, activePreviewItemQty);
  closeProductPreview();
  location.href = 'cart.html';
}

/* ================= SITE-WIDE CART (shared 'sai_studio_cart' key — same one used by
   cart.js, catalog.js, corporate.js, gifts.js, bulk-orders.js, index-2.js, so items
   added here show up in the same cart everywhere else on the site) ================= */
function getStudioCart() {
  try {
    return JSON.parse(localStorage.getItem('sai_studio_cart')) || {};
  } catch (e) {
    return {};
  }
}

function saveStudioCart(cart) {
  localStorage.setItem('sai_studio_cart', JSON.stringify(cart));
  updateStudioCartBadge();
}

function addToStudioCart(name, price, img, customization, requirement, productId, qty) {
  const cart = getStudioCart();
  if (!cart[name]) {
    cart[name] = { name, product_id: productId || null, qty: 0, price, img, customization: customization || null, requirement: requirement || null };
  }
  if (customization) cart[name].customization = customization;
  if (requirement) cart[name].requirement = requirement;
  cart[name].qty += qty || 1;
  saveStudioCart(cart);
}

function updateStudioCartBadge() {
  const cart = getStudioCart();
  const items = Object.values(cart);
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);

  const navCartBadge = document.getElementById('navCartBadge');
  if (navCartBadge) {
    if (totalQty > 0) {
      navCartBadge.textContent = totalQty;
      navCartBadge.style.display = 'flex';
    } else {
      navCartBadge.style.display = 'none';
    }
  }

  const bottomCartBadge = document.getElementById('bottomNavCartBadge');
  if (bottomCartBadge) {
    if (totalQty > 0) {
      bottomCartBadge.textContent = totalQty;
      bottomCartBadge.style.display = 'flex';
    } else {
      bottomCartBadge.style.display = 'none';
    }
  }
}

/* ================= CHECKOUT FLOW (CART / REVIEW / PAYMENT) ================= */
let selectedPaymentMethod = 'cod';

function findPackageByName(name) {
  const keys = Object.keys(categoriesData);
  for (const k of keys) {
    const found = categoriesData[k].packages.find(p => p.name === name);
    if (found) return found;
  }
  return null;
}

function parsePrice(str) {
  return parseInt(String(str).replace(/[^\d]/g, '')) || 0;
}

function computeCartTotals() {
  const cart = getStudioCart();
  const items = Object.values(cart);
  let productTotal = 0;
  let discountTotal = 0;

  items.forEach(item => {
    const pkg = findPackageByName(item.name);
    const unitPrice = parsePrice(item.price);
    const unitOld = pkg && pkg.oldPrice ? parsePrice(pkg.oldPrice) : unitPrice;
    productTotal += unitOld * item.qty;
    discountTotal += (unitOld - unitPrice) * item.qty;
  });

  const orderTotal = productTotal - discountTotal;
  return { items, productTotal, discountTotal, orderTotal };
}

function openCheckout() {
  const { items } = computeCartTotals();
  if (items.length === 0) {
    alert('Your cart is empty. Add a product first to check out.');
    return;
  }
  document.getElementById('checkoutOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  goToCheckoutStep(1);
}

function closeCheckout() {
  document.getElementById('checkoutOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function goToCheckoutStep(step) {
  document.querySelectorAll('.checkout-step').forEach(el => el.classList.remove('active'));
  document.getElementById('checkoutStep' + step).classList.add('active');

  if (step === 1) renderCheckoutCartStep();
  if (step === 2) renderCheckoutReviewStep();
  if (step === 3) renderCheckoutPaymentStep();
}

function renderPriceDetails(suffix) {
  const { items, productTotal, discountTotal, orderTotal } = computeCartTotals();
  const itemCountEl = document.getElementById('checkoutItemCount' + suffix);
  if (itemCountEl) itemCountEl.textContent = items.length;

  const productPriceEl = document.getElementById('checkoutProductPrice' + suffix);
  if (productPriceEl) productPriceEl.textContent = `₹${productTotal}`;

  const discountEl = document.getElementById('checkoutTotalDiscount' + suffix);
  if (discountEl) discountEl.textContent = `- ₹${discountTotal}`;

  const orderTotalEl = document.getElementById('checkoutOrderTotal' + suffix);
  if (orderTotalEl) orderTotalEl.textContent = `₹${orderTotal}`;

  const footerPriceEl = document.getElementById('checkoutFooterPrice' + suffix);
  if (footerPriceEl) footerPriceEl.textContent = `₹${orderTotal}`;

  return { items, productTotal, discountTotal, orderTotal };
}

function cartItemRowHTML(item, withActions) {
  return `
    <div class="checkout-cart-item">
      <img src="${cldOpt(item.img)}" alt="${item.name}" class="checkout-item-img">
      <div class="checkout-item-info">
        <p class="checkout-item-name">${item.name}</p>
        <p class="checkout-item-price">${item.price}</p>
        ${withActions ? `
          <div class="checkout-qty-stepper">
            <button type="button" onclick="event.stopPropagation(); adjustCartQty('${item.name.replace(/'/g, "\\'")}', -1)">−</button>
            <span>${item.qty}</span>
            <button type="button" onclick="event.stopPropagation(); adjustCartQty('${item.name.replace(/'/g, "\\'")}', 1)">+</button>
          </div>
        ` : `<p class="checkout-item-qty">Qty: ${item.qty}</p>`}
      </div>
      ${withActions ? `
        <button type="button" class="checkout-item-remove" onclick="removeCartItem('${item.name.replace(/'/g, "\\'")}')" aria-label="Remove">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      ` : ''}
    </div>
  `;
}

function renderCheckoutCartStep() {
  const { items } = computeCartTotals();
  document.getElementById('checkoutCartItems').innerHTML = items.map(item => cartItemRowHTML(item, true)).join('');
  renderPriceDetails('1');
}

function adjustCartQty(name, delta) {
  const cart = getStudioCart();
  if (!cart[name]) return;
  cart[name].qty += delta;
  if (cart[name].qty <= 0) delete cart[name];
  saveStudioCart(cart);
  renderCheckoutCartStep();
}

function removeCartItem(name) {
  const cart = getStudioCart();
  delete cart[name];
  saveStudioCart(cart);
  renderCheckoutCartStep();
  const { items } = computeCartTotals();
  if (items.length === 0) closeCheckout();
}

function renderCheckoutReviewStep() {
  const { items } = computeCartTotals();
  document.getElementById('checkoutReviewItems').innerHTML = items.map(item => cartItemRowHTML(item, false)).join('');
  renderPriceDetails('2');

  // Slowest item in the cart sets the order's delivery estimate.
  const maxDeliveryDays = items.reduce((max, item) => {
    const pkg = findPackageByName(item.name);
    return Math.max(max, (pkg && pkg.deliveryDays) || 3);
  }, 3);
  const est = new Date();
  est.setDate(est.getDate() + maxDeliveryDays);
  const estStr = est.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short' });
  document.getElementById('checkoutDeliveryEst').textContent = `Estimated Delivery by ${estStr}`;
}

function confirmReviewAndContinue() {
  const name = document.getElementById('checkoutName').value.trim();
  const phone = document.getElementById('checkoutPhone').value.trim();
  const address = document.getElementById('checkoutAddress').value.trim();
  if (!name || !phone || !address) {
    alert('Please fill in your name, phone number, and delivery address to continue.');
    return;
  }
  goToCheckoutStep(3);
}

function renderCheckoutPaymentStep() {
  const totals = renderPriceDetails('3');
  const codPrice = totals.orderTotal;
  const onlineDiscount = Math.round(codPrice * 0.05);
  const onlinePrice = codPrice - onlineDiscount;

  document.getElementById('paymentCodPrice').textContent = `₹${codPrice}`;
  document.getElementById('paymentOnlineOldPrice').textContent = `₹${codPrice}`;
  document.getElementById('paymentOnlinePrice').textContent = `₹${onlinePrice}`;
  document.getElementById('paymentSaveBadge').textContent = `Save ₹${onlineDiscount}`;

  selectedPaymentMethod = 'cod';
  updatePaymentSelectionUI();
  updateCheckoutFooterForPayment(codPrice, onlinePrice);
}

function selectPaymentMethod(method) {
  selectedPaymentMethod = method;
  updatePaymentSelectionUI();

  const codPrice = parsePrice(document.getElementById('paymentCodPrice').textContent);
  const onlinePrice = parsePrice(document.getElementById('paymentOnlinePrice').textContent);
  updateCheckoutFooterForPayment(codPrice, onlinePrice);
}

function updatePaymentSelectionUI() {
  document.getElementById('paymentCOD').classList.toggle('selected', selectedPaymentMethod === 'cod');
  document.getElementById('paymentOnline').classList.toggle('selected', selectedPaymentMethod === 'online');
}

function updateCheckoutFooterForPayment(codPrice, onlinePrice) {
  const finalPrice = selectedPaymentMethod === 'online' ? onlinePrice : codPrice;
  document.getElementById('checkoutFooterPrice3').textContent = `₹${finalPrice}`;
}

function placeOrder() {
  const name = document.getElementById('checkoutName').value.trim();
  closeCheckout();
  saveStudioCart({});
  document.getElementById('modalMessage').textContent = name
    ? `Thank you, ${name}! Your order has been placed. We will contact you shortly to confirm delivery.`
    : 'Thank you! Your order has been placed. We will contact you shortly to confirm delivery.';
  document.getElementById('successModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('successModal').style.display = 'none';
}

function setActiveBottomNav(el) {
  document.querySelectorAll('.bottom-nav-item').forEach(item => item.classList.remove('active'));
  el.classList.add('active');
}

// Categories/packages come from GET /api/catalog/studio (the database) instead of the
// hardcoded categoriesData literal this page used to ship. Field mapping: category
// name/description/image map directly; each package's title/price/mrp/images/feat map
// to name/oldPrice/img+images/highlights, and the fields with no dedicated database
// column yet (tag/badge/turnaround/quantityOptions/purposeOptions/requiresPhotoUpload)
// travel in the product's `extra` JSON column, which the admin panel edits as raw JSON.
const STUDIO_API_BASE = window.SAI_API_BASE || "http://localhost:8000";

async function loadStudioCatalog() {
  const res = await fetch(`${STUDIO_API_BASE}/api/catalog/studio`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  const built = {};
  data.categories.forEach(c => {
    built[c.id] = {
      title: c.name,
      desc: c.description || "",
      icon: c.image,
      packages: (data.packages[c.id] || []).map(p => {
        const extra = p.extra || {};
        // "Turnaround: ..." / "Quantity options: ..." bullets were baked into feat[]
        // by the original data seed before extra.turnaround/quantityOptions existed -
        // drop them here since that same info now renders properly from extra below.
        const highlights = (p.feat || []).filter(f => !/^(Turnaround|Quantity options):/i.test(f));
        const pkg = {
          id: p.id,
          name: p.title,
          subtitle: p.description || "",
          price: p.price,
          img: (p.images && p.images[0]) || "",
          images: p.images || [],
          highlights,
        };
        if (p.mrp) pkg.oldPrice = p.mrp;
        if (extra.tag) pkg.tag = extra.tag;
        if (extra.badge) pkg.badge = extra.badge;
        if (extra.turnaround) pkg.turnaround = extra.turnaround;
        if (extra.requiresPhotoUpload) pkg.requiresPhotoUpload = extra.requiresPhotoUpload;
        pkg.input_fields = p.input_fields || [];
        pkg.deliveryDays = p.delivery_days || null;
        return pkg;
      }),
    };
  });
  categoriesData = built;
}

window.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadStudioCatalog();
  } catch (err) {
    console.error("Failed to load the studio catalog:", err);
    const sidebar = document.getElementById('desktopSidebar');
    if (sidebar) sidebar.innerHTML = '<div style="padding:16px;color:#b91c1c;">Could not load services right now. Please refresh the page.</div>';
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get('category');
  const hasCatDeepLink = catParam && (catParam === 'all' || categoriesData[catParam]);
  if (hasCatDeepLink) {
    currentCategory = catParam;
  }

  initSidebar();
  document.querySelectorAll('.menu-cat-link').forEach(el => {
    el.classList.toggle('active', el.dataset.key === currentCategory);
  });
  buildCategoryMegaMenus();
  buildHeroCarousel();
  renderContent();
  initStudioProductAccordions();
  updateStudioCartBadge();

  // Priced Customer Questions dropdown (e.g. a quantity picker) - keep the modal's
  // displayed price live as the customer changes their selection, same as the old
  // dedicated quantity-select handler used to.
  document.getElementById('previewCustomFields')?.addEventListener('pf:pricechange', (e) => {
    if (!activePreviewPkg) return;
    const price = e.detail && (e.detail.price || e.detail.price === 0) ? e.detail.price : null;
    const text = price !== null ? `₹${price}` : activePreviewPkg.price;
    document.getElementById('previewPrice').textContent = text;
    document.getElementById('previewActionPrice').textContent = text;
  });

  // A ?category= deep link (header mega-menu, homepage cards, ...) should land on
  // that category's title/packages, not the hero carousel above it - same place
  // switchCategory() itself scrolls to when picked in-page.
  if (hasCatDeepLink) {
    scrollToStudioCategory('auto');
  }

  /* deep-link support: ?category=<key>&openProduct=<package name>&pid=<id> auto-opens
     that package's preview modal (used by homepage product cards so clicking one opens
     the exact product, not just its category page). pid is matched first since it's the
     real database id and can't collide between products - openProduct name is only the
     fallback for older links that predate pid. */
  const openProductParam = urlParams.get('openProduct');
  const pidParam = urlParams.get('pid');
  if (openProductParam || pidParam) {
    const idx = pidParam
      ? currentPackages.findIndex(p => String(p.id) === pidParam)
      : currentPackages.findIndex(p => p.name === openProductParam);
    if (idx !== -1) {
      setTimeout(() => openProductPreview(idx, { skipHistory: true }), 150);
    }
  }

  window.addEventListener('resize', updateHeroCarouselPosition);

  const searchInputs = [
    document.getElementById('mobileSearchInput'),
    document.getElementById('desktopSearchInput')
  ].filter(Boolean);

  searchInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      searchInputs.forEach(other => {
        if (other !== e.target) other.value = searchQuery;
      });
      renderContent();
    });
  });

  const scrollContainer = document.querySelector('.main-content');
  const appSwitcher = document.querySelector('.mobile-app-switcher');
  const headerAddress = document.querySelector('.mobile-header-address');
  if (scrollContainer && appSwitcher) {
    let lastScrollTop = 0;
    scrollContainer.addEventListener('scroll', () => {
      const scrollTop = scrollContainer.scrollTop;
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

(function initMobilePromoSlider() {
  function init() {
    const track = document.getElementById('studioPromoTrack');
    const dots = document.querySelectorAll('#studioPromoDots .promo-hero-dot');
    if (!track || !dots.length) return;

    const slideCount = 4;
    const totalSlots = slideCount + 2;
    const slotWidth = 100 / totalSlots;
    let pos = 1;
    let timer;

    function goTo(p, animate) {
      track.style.transition = animate === false ? 'none' : 'transform .7s cubic-bezier(.65,0,.35,1)';
      track.style.transform = 'translateX(-' + (p * slotWidth) + '%)';
      const realIndex = ((p - 1) % slideCount + slideCount) % slideCount;
      dots.forEach((d, di) => d.classList.toggle('active', di === realIndex));
    }

    function next() {
      pos++;
      goTo(pos);
    }

    track.addEventListener('transitionend', (e) => {
      if (e.target !== track || e.propertyName !== 'transform') return;
      if (pos >= totalSlots - 1) {
        pos = 1;
        goTo(pos, false);
      } else if (pos <= 0) {
        pos = slideCount;
        goTo(pos, false);
      }
    });

    function startAutoplay() {
      clearInterval(timer);
      timer = setInterval(next, 3000);
    }

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        pos = parseInt(dot.dataset.i, 10) + 1;
        goTo(pos);
        startAutoplay();
      });
    });

    goTo(pos, false);
    startAutoplay();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

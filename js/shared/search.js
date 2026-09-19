/*
  Sai Kumar Digital Lab & Studio — Nav Search Autosuggest
  Self-contained: injects its own styles + dropdown markup. Include once per page,
  after the desktop nav's ".nav-search-bar input" exists in the DOM.
*/
(function () {
  "use strict";

  var CATALOG = [
    { name: "Wedding Photography", category: "Photography", url: "photography.html?category=wedding" },
    { name: "Pre-Wedding Shoot", category: "Photography", url: "photography.html?category=prewedding" },
    { name: "Birthday Photography", category: "Photography", url: "photography.html?category=birthday" },
    { name: "Event Photography", category: "Photography", url: "photography.html?category=event" },
    { name: "Maternity Shoot", category: "Photography", url: "photography.html?category=maternity" },
    { name: "Baby Shoot", category: "Photography", url: "photography.html?category=baby" },
    { name: "Outdoor Photography", category: "Photography", url: "photography.html?category=outdoor" },
    { name: "Drone Photography", category: "Photography", url: "photography.html?category=drone" },
    { name: "Videography", category: "Photography", url: "photography.html?category=video" },
    { name: "Album Designing", category: "Photography", url: "photography.html?category=album" },
    { name: "House Warming", category: "Photography", url: "photography.html?category=housewarming" },
    { name: "Saree Function", category: "Photography", url: "photography.html?category=sareefunction" },
    { name: "Candid Photography", category: "Photography", url: "photography.html?category=candidphoto" },
    { name: "Traditional Photography", category: "Photography", url: "photography.html?category=traditionalphoto" },
    { name: "Traditional Videography", category: "Photography", url: "photography.html?category=traditionalvideo" },
    { name: "Cinematic Videography", category: "Photography", url: "photography.html?category=cinematicvideo" },
    { name: "LED Screens", category: "Photography", url: "photography.html?category=ledscreens" },

    { name: "Acrylic Frames", category: "Customised Gift Shop", url: "gifts.html?view=category&category=frames&search=acrylic" },
    { name: "Wooden Frames", category: "Customised Gift Shop", url: "gifts.html?view=category&category=frames&search=wooden" },
    { name: "Crystal Frames", category: "Customised Gift Shop", url: "gifts.html?view=category&category=frames&search=crystal" },
    { name: "LED Frames", category: "Customised Gift Shop", url: "gifts.html?view=category&category=frames&search=led" },
    { name: "Neon Frames", category: "Customised Gift Shop", url: "gifts.html?view=category&category=frames&search=neon" },
    { name: "QR Voice Frames", category: "Customised Gift Shop", url: "gifts.html?view=category&category=frames&search=qr" },
    { name: "Collage Frames", category: "Customised Gift Shop", url: "gifts.html?view=category&category=frames&search=collage" },
    { name: "Mosaic Frames", category: "Customised Gift Shop", url: "gifts.html?view=category&category=frames&search=mosaic" },
    { name: "Pencil Sketch Frames", category: "Customised Gift Shop", url: "gifts.html?view=category&category=frames&search=sketch" },
    { name: "Magic Mugs", category: "Customised Gift Shop", url: "gifts.html?view=category&category=drinkware&search=magic" },
    { name: "Heart Handle Mugs", category: "Customised Gift Shop", url: "gifts.html?view=category&category=drinkware&search=heart" },
    { name: "Photo Water Bottles", category: "Customised Gift Shop", url: "gifts.html?view=category&category=drinkware&search=bottle" },
    { name: "Heart Pillow", category: "Customised Gift Shop", url: "gifts.html?view=category&category=pillows&search=heart" },
    { name: "Magic Pillow", category: "Customised Gift Shop", url: "gifts.html?view=category&category=pillows&search=magic" },
    { name: "Kids Pillow", category: "Customised Gift Shop", url: "gifts.html?view=category&category=pillows&search=kids" },
    { name: "Book Pillow", category: "Customised Gift Shop", url: "gifts.html?view=category&category=pillows" },
    { name: "Crystal Cubes", category: "Customised Gift Shop", url: "gifts.html?view=category&category=crystal&search=cube" },
    { name: "Crystal Photo Stand", category: "Customised Gift Shop", url: "gifts.html?view=category&category=crystal&search=stand" },
    { name: "Rotate LED Crystal", category: "Customised Gift Shop", url: "gifts.html?view=category&category=crystal&search=rotat" },
    { name: "Wall Clocks", category: "Customised Gift Shop", url: "gifts.html?view=category&category=clocks" },
    { name: "Fridge Magnets", category: "Customised Gift Shop", url: "gifts.html?view=category&category=decor&search=magnet" },
    { name: "Kiddy Banks", category: "Customised Gift Shop", url: "gifts.html?view=category&category=decor&search=kiddy" },
    { name: "Keychains", category: "Customised Gift Shop", url: "gifts.html?view=category&category=accessories&search=keychain" },
    { name: "Wallets", category: "Customised Gift Shop", url: "gifts.html?view=category&category=accessories&search=wallet" },
    { name: "Diaries", category: "Customised Gift Shop", url: "gifts.html?view=category&category=accessories&search=diary" },

    { name: "Photo Printing", category: "Studio Services", url: "studio.html?category=photo_printing" },
    { name: "Passport Size Photos", category: "Studio Services", url: "studio.html?category=photo_printing" },
    { name: "Canvas Printing", category: "Studio Services", url: "studio.html?category=xerox_printing" },
    { name: "ID Card Printing", category: "Studio Services", url: "studio.html?category=id_card_printing" },
    { name: "Certificate Printing", category: "Studio Services", url: "studio.html?category=certificate_printing" },
    { name: "Photo Restoration", category: "Studio Services", url: "studio.html?category=photo_restoration" },
    { name: "Photo Editing", category: "Studio Services", url: "studio.html?category=photo_portrait" },
    { name: "Background Removal", category: "Studio Services", url: "studio.html?category=photo_portrait" },
    { name: "Photo Lamination", category: "Studio Services", url: "studio.html?category=photo_lamination" },
    { name: "Scanning", category: "Studio Services", url: "studio.html?category=scanning" },
    { name: "CD/DVD Copying", category: "Studio Services", url: "studio.html?category=cd_dvd_copying" },

    { name: "Corporate Gift Sets", category: "Corporate Gifts", url: "corporate.html?category=sets" },
    { name: "Employee Welcome Kits", category: "Corporate Gifts", url: "corporate.html?category=kits" },
    { name: "Promotional Gifts", category: "Corporate Gifts", url: "corporate.html?category=promotional" },
    { name: "Customized Branding", category: "Corporate Gifts", url: "corporate.html" },
    { name: "Mementos", category: "Corporate Gifts", url: "corporate.html?category=mementos" },
    { name: "Shields", category: "Corporate Gifts", url: "corporate.html?category=shields" },
    { name: "Trophies", category: "Corporate Gifts", url: "corporate.html?category=trophies" },
    { name: "Awards", category: "Corporate Gifts", url: "corporate.html?category=trophies" },
    { name: "Name Plates", category: "Corporate Gifts", url: "corporate.html" },
    { name: "Pens", category: "Corporate Gifts", url: "corporate.html?category=pens" },
    { name: "Diaries", category: "Corporate Gifts", url: "corporate.html?category=diaries" },
    { name: "Water Bottles", category: "Corporate Gifts", url: "corporate.html?category=bottles" }
  ];

  // Curated CATALOG above only covers the site's core service menu, not the live
  // product catalog - a product an admin adds later has no entry here and would
  // never surface in this dropdown on ANY page (this file is shared by every
  // page's header). Fetching the live list once and appending it fixes that
  // without touching the curated entries above (categories/services that aren't
  // literal database products, e.g. "Photo Editing").
  var SEARCH_API_BASE = window.SAI_API_BASE || "http://localhost:8000";
  var PAGE_LABELS = { gifts: "Customised Gift Shop", photography: "Photography", studio: "Studio Services", corporate: "Corporate Gifts" };
  var liveProductsLoaded = false;

  function loadLiveProducts() {
    if (liveProductsLoaded) return;
    liveProductsLoaded = true;
    fetch(SEARCH_API_BASE + "/api/products?page_size=1000")
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        (data.items || []).forEach(function (p) {
          CATALOG.push({
            name: p.title,
            category: PAGE_LABELS[p.page_slug] || p.category_name || "Catalog",
            // catalog.html merges every live product into its own list on load
            // (see js/catalog.js) and supports this exact deep-link param.
            url: "catalog.html?openProduct=" + encodeURIComponent(p.id)
          });
        });
      })
      .catch(function (err) {
        console.error("Could not load live products for search:", err);
      });
  }

  var css =
    ".sk-search-suggest{position:absolute;top:calc(100% + 8px);left:0;right:0;background:#fff;border-radius:14px;"
    // 200 used to sit under several pages' sticky category-nav bars (up to
    // z-index 1300+ - e.g. gifts.html's .category-menu-bar at 1005), so the
    // dropdown rendered visibly behind the nav instead of over it. This is
    // shared by every page's header search box, so it needs to clear the
    // highest nav/header stacking context any of them use.
    + "box-shadow:0 16px 40px rgba(0,0,0,.14);border:1px solid #f1f1f1;overflow:hidden;z-index:5000;display:none;max-height:360px;overflow-y:auto;}"
    + "\n.sk-search-suggest.open{display:block;}"
    + "\n.sk-search-row{display:flex;align-items:center;gap:10px;padding:10px 16px;cursor:pointer;text-decoration:none;color:inherit;}"
    + "\n.sk-search-row:hover,.sk-search-row.active{background:#f8f8f8;}"
    + "\n.sk-search-row-name{font-size:14px;font-weight:600;color:#161616;}"
    + "\n.sk-search-row-name mark{background:none;color:var(--orange,#F97316);font-weight:800;}"
    + "\n.sk-search-row-cat{margin-left:auto;font-size:11px;font-weight:700;color:#8a8a8a;white-space:nowrap;}"
    + "\n.sk-search-empty{padding:14px 16px;font-size:13px;color:#6b6b6b;}"
    + "\n.sk-search-empty a{color:var(--orange,#F97316);font-weight:700;text-decoration:none;}"
    + "\n.sk-search-empty a:hover{text-decoration:underline;}";

  function injectStyles() {
    var style = document.createElement("style");
    style.id = "sk-search-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function highlight(name, query) {
    var re = new RegExp("(" + escapeRegExp(query) + ")", "ig");
    return name.replace(re, "<mark>$1</mark>");
  }

  function filterCatalog(query) {
    var q = query.trim().toLowerCase();
    if (!q) return [];
    var starts = [], contains = [];
    CATALOG.forEach(function (item) {
      var n = item.name.toLowerCase();
      var c = item.category.toLowerCase();
      if (n.indexOf(q) === 0) {
        starts.push(item);
      } else if (n.indexOf(q) !== -1 || c.indexOf(q) !== -1) {
        contains.push(item);
      }
    });
    return starts.concat(contains).slice(0, 8);
  }

  function setup(input) {
    var container = input.closest(".nav-search-container") || input.closest(".mobile-search-container") || input.parentElement;
    if (!container) return;
    var cs = window.getComputedStyle(container);
    if (cs.position === "static") container.style.position = "relative";

    var panel = document.createElement("div");
    panel.className = "sk-search-suggest";
    container.appendChild(panel);

    var activeIndex = -1;
    var currentItems = [];

    function close() {
      panel.classList.remove("open");
      panel.innerHTML = "";
      activeIndex = -1;
      currentItems = [];
    }

    function go(item) {
      window.location.href = item.url;
    }

    function render(query) {
      currentItems = filterCatalog(query);
      activeIndex = -1;

      if (!query.trim()) {
        close();
        return;
      }

      if (currentItems.length === 0) {
        panel.innerHTML =
          '<div class="sk-search-empty">No matches for "' + query.replace(/</g, "&lt;") + '". Try '
          + '<a href="photography.html">Photography</a>, <a href="gifts.html">Gift Shop</a>, '
          + '<a href="studio.html">Studio Services</a> or <a href="corporate.html">Corporate Gifts</a>.</div>';
        panel.classList.add("open");
        return;
      }

      panel.innerHTML = currentItems.map(function (item, i) {
        return '<a href="' + item.url + '" class="sk-search-row" data-index="' + i + '">'
          + '<span class="sk-search-row-name">' + highlight(item.name, query.trim()) + '</span>'
          + '<span class="sk-search-row-cat">' + item.category + '</span>'
          + '</a>';
      }).join("");
      panel.classList.add("open");

      Array.prototype.forEach.call(panel.querySelectorAll(".sk-search-row"), function (row) {
        row.addEventListener("mouseenter", function () {
          activeIndex = Number(row.getAttribute("data-index"));
          updateActive();
        });
        row.addEventListener("click", function (e) {
          e.preventDefault();
          go(currentItems[Number(row.getAttribute("data-index"))]);
        });
      });
    }

    function updateActive() {
      Array.prototype.forEach.call(panel.querySelectorAll(".sk-search-row"), function (row) {
        row.classList.toggle("active", Number(row.getAttribute("data-index")) === activeIndex);
      });
    }

    input.addEventListener("input", function () {
      render(input.value);
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        // With suggestions showing, Enter goes to the highlighted one (or the top
        // one if the shopper never arrowed down) - previously this did nothing at
        // all unless an item was explicitly highlighted first.
        if (panel.classList.contains("open") && currentItems.length > 0) {
          e.preventDefault();
          go(currentItems[activeIndex >= 0 ? activeIndex : 0]);
          return;
        }
        // No suggestions to jump to (empty query matched nothing, or dropdown
        // isn't open) - fall back to the full catalog search instead of silently
        // swallowing the keypress.
        if (input.value.trim()) {
          e.preventDefault();
          close();
          window.goToCatalogSearch(input.value);
        }
        return;
      }
      if (!panel.classList.contains("open") || currentItems.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, currentItems.length - 1);
        updateActive();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        updateActive();
      } else if (e.key === "Escape") {
        close();
        input.blur();
      }
    });

    input.addEventListener("focus", function () {
      if (input.value.trim()) render(input.value);
    });

    document.addEventListener("click", function (e) {
      if (!container.contains(e.target)) close();
    });
  }

  function init() {
    injectStyles();
    loadLiveProducts();
    var inputs = document.querySelectorAll(".nav-search-bar input, .mobile-search-bar input");
    Array.prototype.forEach.call(inputs, setup);
  }

  // Shared fallback for any page's search box that has nowhere of its own to filter
  // into (gifts.html/photography.html/studio.html's mobile search bar - see those
  // pages' markup) - sends the shopper to catalog.html's full, live-data-backed
  // search/filter grid instead of doing nothing when Enter is pressed.
  window.goToCatalogSearch = function (query) {
    query = (query || "").trim();
    if (!query) return;
    window.location.href = "catalog.html?search=" + encodeURIComponent(query);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

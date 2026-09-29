let CURRENT_PAGE_SLUG = null;
let CURRENT_CATEGORY_ID = null;
let PAGES_CACHE = [];

routes.dashboard = renderDashboard;
routes.categories = renderCategories;
routes.products = renderProducts;

// ==================================================================== dashboard

async function renderDashboard() {
  const view = document.getElementById("view");
  view.innerHTML = `<header class="page-head"><h1>Dashboard</h1></header><div class="cards" id="cards">${LOADING}</div>`;
  const cardsEl = document.getElementById("cards");
  const s = await Api.summary();
  // See the note in coupons.js: the container was captured before the await, so
  // it may already be detached if the admin navigated away mid-load.
  if (!cardsEl) return;
  cardsEl.innerHTML =
    card(s.pages, "Site Pages") +
    card(s.categories, "Categories") +
    card(s.products, "Products / Packages") +
    card(s.coupons, "Active Coupons") +
    card(s.bookings_pending, "Pending Bookings") +
    card(s.bookings_total, "Total Bookings") +
    card(s.orders_pending, "Pending Orders") +
    card(s.orders_total, "Total Orders") +
    card(fmtINR(s.revenue), "Revenue") +
    // Enquiries are only actionable if someone knows they arrived - the
    // notification email is best-effort, so the count belongs here too.
    card(s.enquiries_unread ?? 0, "Unread Enquiries");
}

// ==================================================================== categories

async function renderCategories(params) {
  const view = document.getElementById("view");
  const pages = await Api.pages();
  PAGES_CACHE = pages;
  if (!pages.length) {
    view.innerHTML = `<header class="page-head"><h1>Categories</h1></header>
      <div class="empty-state">No site pages available.</div>`;
    return;
  }
  // Lets a link elsewhere in the admin (e.g. the Media Library's "used in" list on
  // a non-deletable image) jump straight to the right page's category list instead
  // of landing on whichever page this tab happened to be on last.
  const pageParam = params?.get ? params.get("page") : null;
  if (pageParam && pages.some(p => p.slug === pageParam)) CURRENT_PAGE_SLUG = pageParam;
  else if (!CURRENT_PAGE_SLUG || !pages.some(p => p.slug === CURRENT_PAGE_SLUG)) CURRENT_PAGE_SLUG = pages[0].slug;

  // Loaded up front (not just on the Products & Packages tab) so the "+ Add
  // Service" / "+ Add Product" buttons below can offer every section from
  // every page in their own dropdown, without the admin first navigating
  // to a category and only then to Products & Packages.
  window._ALL_CATS = await allCategoriesAcrossPages(pages);

  view.innerHTML = `
    <header class="page-head">
      <h1>Categories</h1>
      <div class="btn-row">
        <button class="btn secondary" id="addServiceBtn">+ Add Service</button>
        <button class="btn secondary" id="addProductBtn">+ Add Product</button>
        <button class="btn" id="addCatBtn">+ Add Category</button>
      </div>
    </header>
    <div class="toolbar">
      <select id="pageSelect">${pages.map(p => `<option value="${esc(p.slug)}" ${p.slug === CURRENT_PAGE_SLUG ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select>
    </div>
    <div id="catTableWrap"></div>
  `;
  document.getElementById("pageSelect").addEventListener("change", (e) => { CURRENT_PAGE_SLUG = e.target.value; loadCatTable(); });
  document.getElementById("addCatBtn").addEventListener("click", () => openCategoryForm());
  document.getElementById("addServiceBtn").addEventListener("click", () => openQuickAddProduct("service"));
  document.getElementById("addProductBtn").addEventListener("click", () => openQuickAddProduct("product"));
  await loadCatTable();
}

// Photography's categories are all booking services; every other page's
// categories are all physical goods - there's no mixed page today. So
// "Add Service" only makes sense against Photography's sections and "Add
// Product" only against everyone else's - offering the other page's sections
// would let the admin file e.g. a "ships to customer" product under Wedding
// Photography, which the storefront has no sane way to show.
function categoriesForType(allCats, type) {
  return allCats.filter(c => (c.pageSlug === "photography") === (type === "service"));
}

// Entry point for the Categories page's "+ Add Service" / "+ Add Product"
// buttons: same product form as Products & Packages, just opened without
// first requiring the admin to select a category there. Guards against the
// (rare) case of zero matching categories existing yet, since the form's own
// "Section" dropdown would otherwise have nothing to offer.
function openQuickAddProduct(type) {
  if (!categoriesForType(window._ALL_CATS || [], type).length) {
    alert(type === "service"
      ? "No Photography categories yet — add one on the Photography page first."
      : "No product categories yet — add one on the Studio, Corporate, or Gifts page first.");
    return;
  }
  openProductForm(null, { type });
}

async function loadCatTable() {
  const wrap = document.getElementById("catTableWrap");
  wrap.innerHTML = LOADING;
  const cats = await Api.categories(CURRENT_PAGE_SLUG);
  window._CATS_CACHE = cats;
  if (!cats.length) {
    wrap.innerHTML = `<div class="empty-state">No categories yet on this page.</div>`;
    return;
  }
  wrap.innerHTML = `
    <table>
      <thead><tr><th class="drag-col"></th><th class="table-thumb-col"></th><th></th><th>Name</th><th>Slug</th><th>Group</th><th>In Hero</th><th>Status</th><th>Sort</th><th></th></tr></thead>
      <tbody id="catTableBody">
        ${cats.map(c => `
          <tr draggable="true" data-id="${esc(c.id)}">
            <td class="drag-col"><span class="drag-handle" title="Drag to reorder">⠿</span></td>
            <td class="table-thumb-col">${c.thumb_image_url
              ? `<img class="table-thumb" src="${esc(mediaUrl(c.thumb_image_url))}" alt="" onerror="this.outerHTML='<div class=&quot;table-thumb-empty&quot;></div>'">`
              : `<div class="table-thumb-empty"></div>`}</td>
            <td>${esc(c.icon || "")}</td>
            <td>${esc(c.name)}</td>
            <td>${esc(c.slug)}</td>
            <td>${CURRENT_PAGE_SLUG === "photography" ? (c.group_label === "Videography" ? "Videography" : "Photography") : "—"}</td>
            <td>${c.show_in_hero ? "✓" : ""}</td>
            <td><span class="badge ${c.is_active ? "on" : "off"}">${c.is_active ? "Active" : "Hidden"}</span></td>
            <td>${c.sort}</td>
            <td class="actions">
              <button class="btn secondary" onclick="openCategoryForm('${c.id}')">Edit</button>
              <button class="btn secondary" onclick="openCategoryMedia('${c.id}')">Photos</button>
              <button class="btn secondary" onclick="location.hash='#/products?cat=${c.id}'">Packages</button>
              <button class="btn danger" onclick="removeCategory('${c.id}', this)">Delete</button>
            </td>
          </tr>`).join("")}
      </tbody>
    </table>
  `;
  initTableRowDragReorder(document.getElementById("catTableBody"), async (ids) => {
    const page = PAGES_CACHE.find(p => p.slug === CURRENT_PAGE_SLUG);
    try {
      await Api.reorderCategories(page.id, ids);
    } catch (err) {
      alert(`Could not save the new order: ${err.message}`);
    }
    loadCatTable();
  });
}

function openCategoryForm(id) {
  const cat = id ? window._CATS_CACHE.find(c => c.id === id) : null;
  const page = PAGES_CACHE.find(p => p.slug === CURRENT_PAGE_SLUG);
  // The Photography page's sidebar/"All Services" grid splits into two fixed
  // sections - "Photography" and "Videography" - decided entirely by this
  // field being the literal string "Videography" or not (see js/photography.js
  // sidebarPhotographyIds/sidebarVideographyIds). A free-text box for that
  // meant an admin could type anything - a typo, different capitalization,
  // etc. - and the category would silently land in "Photography" instead
  // with no error. No other page reads this field at all, so it only needs
  // to exist, as a real choice, here.
  const isPhotography = page.slug === "photography";
  openModal(`
    <h2>${cat ? "Edit" : "Add"} Category</h2>
    <p class="sub" style="color:var(--text-dim);font-size:12px;margin-top:0;">Page: ${esc(page.name)}</p>
    <div id="formMsg"></div>
    <form id="catForm">
      <div class="form-section-title">Basic info</div>
      <div class="two-col">
        <div><label>Slug</label><input id="f_slug" value="${esc(cat?.slug || "")}" required>
          <div class="form-hint">Must be unique within the "${esc(page.name)}" page. Used in the site URL, e.g. <code>?category=${esc(cat?.slug || "your-slug")}</code>.</div>
        </div>
        <div><label>Icon (emoji)</label><input id="f_icon" value="${esc(cat?.icon || "")}"></div>
      </div>
      <label>Name</label><input id="f_name" value="${esc(cat?.name || "")}" required>
      <label>Description</label><textarea id="f_description" rows="2">${esc(cat?.description || "")}</textarea>

      <div class="form-section-title">Sidebar &amp; "All Services" card</div>
      <div class="form-hint" style="margin-bottom:8px;">This image is the small thumbnail shown in the page sidebar and on the "All Services" overview grid. It is NOT the hero carousel banner below.</div>
      <div class="img-field-row">
        <div class="img-field-col">
          <label>Thumbnail image URL</label>
          <input id="f_thumb" value="${esc(cat?.thumb_image_url || "")}">
        </div>
        <img id="f_thumb_preview" class="field-img-preview" src="${esc(cat?.thumb_image_url || "")}" alt="" onerror="this.classList.add('empty');this.removeAttribute('src')">
      </div>

      <div class="form-section-title">Homepage hero carousel</div>
      <label class="inline" style="margin-top:0;"><input type="checkbox" id="f_hero" ${cat?.show_in_hero ? "checked" : ""}> Show this category as a slide in the homepage hero carousel</label>
      <div class="form-hint" style="margin-bottom:8px;">These two fields only matter if the checkbox above is on — they control the full-width banner slide, not the sidebar thumbnail.</div>
      <div class="img-field-row">
        <div class="img-field-col">
          <label>Hero banner image URL</label>
          <input id="f_hero_img" value="${esc(cat?.hero_image_url || "")}">
        </div>
        <img id="f_hero_preview" class="field-img-preview" src="${esc(cat?.hero_image_url || "")}" alt="" onerror="this.classList.add('empty');this.removeAttribute('src')">
      </div>
      <label>Hero tagline</label><input id="f_tagline" value="${esc(cat?.hero_tagline || "")}">

      <div class="form-section-title">Portfolio</div>
      <label>Portfolio section title</label><input id="f_folio_title" value="${esc(cat?.folio_title || "")}" placeholder='e.g. "Wedding Photography Portfolio"'>

      <div class="form-section-title">Display settings</div>
      <div class="two-col">
        ${isPhotography ? `
        <div><label>Sidebar section</label>
          <select id="f_group">
            <option value="Photography" ${cat?.group_label !== "Videography" ? "selected" : ""}>Photography</option>
            <option value="Videography" ${cat?.group_label === "Videography" ? "selected" : ""}>Videography</option>
          </select>
        </div>` : ""}
        <div><label>Sort order</label><input id="f_sort" type="number" value="${cat?.sort ?? 0}"></div>
      </div>
      <label class="inline"><input type="checkbox" id="f_active" ${!cat || cat.is_active ? "checked" : ""}> Active (visible on site)</label>
      <div class="modal-actions">
        <button type="button" class="btn secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn">${cat ? "Save" : "Create"}</button>
      </div>
    </form>
  `);
  document.getElementById("f_thumb").addEventListener("input", (e) => {
    const img = document.getElementById("f_thumb_preview");
    img.classList.remove("empty");
    img.src = e.target.value.trim();
  });
  document.getElementById("f_hero_img").addEventListener("input", (e) => {
    const img = document.getElementById("f_hero_preview");
    img.classList.remove("empty");
    img.src = e.target.value.trim();
  });
  document.getElementById("catForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const data = {
      page_id: page.id,
      slug: document.getElementById("f_slug").value.trim(),
      name: document.getElementById("f_name").value.trim(),
      icon: document.getElementById("f_icon").value.trim() || null,
      description: document.getElementById("f_description").value.trim() || null,
      thumb_image_url: document.getElementById("f_thumb").value.trim() || null,
      hero_image_url: document.getElementById("f_hero_img").value.trim() || null,
      hero_tagline: document.getElementById("f_tagline").value.trim() || null,
      folio_title: document.getElementById("f_folio_title").value.trim() || null,
      group_label: isPhotography ? document.getElementById("f_group").value : (cat?.group_label || null),
      sort: parseInt(document.getElementById("f_sort").value || "0", 10),
      show_in_hero: document.getElementById("f_hero").checked,
      is_active: document.getElementById("f_active").checked,
    };
    try {
      await withBusy(btn, cat ? "Saving…" : "Creating…", () =>
        cat ? Api.updateCategory(cat.id, data) : Api.createCategory(data));
      closeModal();
      loadCatTable();
    } catch (err) {
      document.getElementById("formMsg").innerHTML = `<div class="msg error">${esc(err.message)}</div>`;
    }
  });
}

async function removeCategory(id, btn) {
  const cat = window._CATS_CACHE.find(c => c.id === id);
  if (!confirm(`Delete category "${cat?.name}"? This also deletes its packages and photos.`)) return;
  try { await withBusy(btn, "Deleting…", () => Api.deleteCategory(id)); loadCatTable(); }
  catch (err) { alert(err.message); }
}

async function openCategoryMedia(id) {
  const cat = window._CATS_CACHE.find(c => c.id === id);
  const media = await Api.categoryMedia(id);
  const page = PAGES_CACHE.find(p => p.id === cat.page_id);
  renderMediaModal({
    title: `Portfolio Photos — ${esc(cat.name)}`,
    media,
    kind: "portfolio",
    addFn: (data) => Api.addCategoryMedia(id, data),
    afterChange: loadCatTable,
    categoryId: cat.id,
    pageId: cat.page_id,
    pageSlug: page?.slug,
    categorySlug: cat.slug,
  });
}

// ==================================================================== products

async function renderProducts(params) {
  const view = document.getElementById("view");
  const catParam = params?.get ? params.get("cat") : null;
  if (catParam) CURRENT_CATEGORY_ID = catParam;

  const pages = await Api.pages();
  const allCats = await allCategoriesAcrossPages(pages);
  window._ALL_CATS = allCats;
  if (!allCats.length) {
    view.innerHTML = `<header class="page-head"><h1>Products & Packages</h1></header>
      <div class="empty-state">No categories yet — add one under Categories first.</div>`;
    return;
  }
  if (!CURRENT_CATEGORY_ID || !allCats.some(c => c.id === CURRENT_CATEGORY_ID)) CURRENT_CATEGORY_ID = allCats[0].id;

  view.innerHTML = `
    <header class="page-head">
      <h1>Products & Packages</h1>
      <button class="btn" id="addProdBtn">+ Add Product</button>
    </header>
    <div class="toolbar">
      <select id="catSelect">${allCats.map(c => `<option value="${c.id}" ${c.id === CURRENT_CATEGORY_ID ? "selected" : ""}>${esc(c.pageName)} — ${esc(c.name)}</option>`).join("")}</select>
    </div>
    <div id="prodTableWrap"></div>
  `;
  document.getElementById("catSelect").addEventListener("change", (e) => { CURRENT_CATEGORY_ID = e.target.value; loadProdTable(); });
  document.getElementById("addProdBtn").addEventListener("click", () => openProductForm());
  await loadProdTable();
}

async function loadProdTable() {
  const wrap = document.getElementById("prodTableWrap");
  wrap.innerHTML = LOADING;
  const res = await Api.products(CURRENT_CATEGORY_ID);
  const products = res.items;
  window._PRODUCTS_CACHE = products;
  if (!products.length) {
    wrap.innerHTML = `<div class="empty-state">No products/packages in this category yet.</div>`;
    return;
  }
  wrap.innerHTML = `
    <table>
      <thead><tr><th class="drag-col"></th><th class="table-thumb-col"></th><th>Tier</th><th>Title</th><th>Price</th><th>Media</th><th>Status</th><th>Sort</th><th></th></tr></thead>
      <tbody id="prodTableBody">
        ${products.map(p => `
          <tr draggable="true" data-id="${esc(p.id)}">
            <td class="drag-col"><span class="drag-handle" title="Drag to reorder">⠿</span></td>
            <td class="table-thumb-col">${(p.media || []).find(m => !isVideoMedia(m))
              ? `<img class="table-thumb" src="${esc(mediaUrl(p.media.find(m => !isVideoMedia(m)).url))}" alt="" onerror="this.outerHTML='<div class=&quot;table-thumb-empty&quot;></div>'">`
              : `<div class="table-thumb-empty"></div>`}</td>
            <td>${esc(p.tier || "—")}</td>
            <td>${esc(p.title)}</td>
            <td>${fmtINR(p.price)}</td>
            <td>${p.media.length}${(p.media || []).some(isVideoMedia) ? " ▶" : ""}</td>
            <td><span class="badge ${p.is_active ? "on" : "off"}">${p.is_active ? "Active" : "Hidden"}</span></td>
            <td>${p.sort}</td>
            <td class="actions">
              <button class="btn secondary" onclick="openProductForm('${p.id}')">Edit</button>
              <button class="btn secondary" onclick="openProductMedia('${p.id}')">Photos/Video</button>
              <button class="btn danger" onclick="removeProduct('${p.id}', this)">Delete</button>
            </td>
          </tr>`).join("")}
      </tbody>
    </table>
  `;
  initTableRowDragReorder(document.getElementById("prodTableBody"), async (ids) => {
    try {
      await Api.setArrange(CURRENT_CATEGORY_ID, ids);
    } catch (err) {
      alert(`Could not save the new order: ${err.message}`);
    }
    loadProdTable();
  });
}

// Extra-JSON keys that have a dedicated, friendlier control elsewhere in this form.
// Whatever is left over after removing these is what shows up in the "Advanced settings" box.
function extraForAdvancedBox(extra) {
  const known = new Set(["events"]);
  const rest = {};
  Object.entries(extra || {}).forEach(([k, v]) => { if (!known.has(k)) rest[k] = v; });
  return rest;
}
function slugify(s) {
  return (s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// allCats grouped under an <optgroup> per site page, so the "Section"
// dropdown reads as "Photography > Wedding Photography" instead of one long
// flat list an admin has to hunt through.
function categorySectionOptionsHTML(allCats, selectedId) {
  const byPage = new Map();
  allCats.forEach(c => {
    if (!byPage.has(c.pageName)) byPage.set(c.pageName, []);
    byPage.get(c.pageName).push(c);
  });
  return Array.from(byPage.entries()).map(([pageName, cats]) => `
    <optgroup label="${esc(pageName)}">
      ${cats.map(c => `<option value="${c.id}" ${c.id === selectedId ? "selected" : ""}>${esc(c.name)}</option>`).join("")}
    </optgroup>`).join("");
}

/* ---------------------------------------------------------------- dropdown
   option entries.

   A "Customer questions" dropdown's options are edited in one of two ways: as
   lines of text ("9X9 = 1699 / 1999 @2"), which is compact and quick to paste,
   or - once the admin wants a picture on each option - as a list of rows with a
   name, a price, a was-price, a picture and a gallery photo number.

   Both editors, and the saved field itself, are read and written through the
   one neutral shape these helpers produce: a list of
   { name, price, mrp, photo, image, raw }, with every field kept as the raw
   string the admin typed. Nothing here validates or converts to numbers - that
   happens once, in collectInputFields(), so the two editors cannot drift into
   disagreeing about what "10X10 = " means. `image` is the only member the text
   form cannot express, and `raw` is the original line (text editor only) so an
   error message can quote what was actually typed. */

function parseOptionLine(line, priced) {
  const raw = line;
  let photo = "";
  // "@N" at the very end points that option at this product's Nth photo.
  // Stripped first, so it works the same on a priced line and a plain one.
  // Anchored to the end and digits-only, so an "@" inside a label is left alone.
  const at = line.match(/\s*@\s*(\d+)\s*$/);
  if (at) {
    photo = at[1];
    line = line.slice(0, at.index).trim();
  }
  // Only a priced dropdown splits on "=" - an unpriced option is free to be
  // called "A = B", and always could be.
  if (!priced) return { name: line, price: "", mrp: "", photo, image: null, raw };
  const eq = line.lastIndexOf("=");
  if (eq === -1) return { name: line, price: "", mrp: "", photo, image: null, raw };
  // Split on the slash only on the price side, never on the label side, so an
  // option called "A4 / A5" keeps its name.
  const [priceText, mrpText] = line.slice(eq + 1).split("/");
  return {
    name: line.slice(0, eq).trim(),
    price: (priceText || "").trim(),
    mrp: (mrpText === undefined ? "" : mrpText.trim()),
    photo,
    image: null,
    raw,
  };
}

// The inverse of parseOptionLine, so switching editors (or re-opening a saved
// product) shows the same thing that was typed.
function optionEntriesToText(entries, priced) {
  return entries.map(e => {
    let line = e.name;
    if (priced && e.price !== "") line += ` = ${e.price}${e.mrp !== "" ? ` / ${e.mrp}` : ""}`;
    if (e.photo !== "") line += ` @${e.photo}`;
    return line;
  }).join("\n");
}

// Entries for a field as it came back from the API.
function dropdownEntries(field) {
  const priced = !!(field?.option_prices && Object.keys(field.option_prices).length);
  const prices = field?.option_prices || {};
  const mrps = field?.option_mrps || {};
  const photos = field?.option_images || {};
  const images = field?.option_image_urls || {};
  const str = (v) => (v || v === 0 ? String(v) : "");
  return (field?.options || []).map(o => ({
    name: o,
    price: priced ? str(prices[o]) : "",
    mrp: str(mrps[o]),
    photo: str(photos[o]),
    image: images[o] || null,
    raw: null,
  }));
}

function openProductForm(id, opts = {}) {
  const p = id ? window._PRODUCTS_CACHE.find(x => x.id === id) : null;
  const allCats = window._ALL_CATS || [];
  // Only a brand-new product opened with an explicit opts.type (the Categories
  // page's quick-add buttons) restricts the Section list - the generic
  // "+ Add Product" button and editing an existing product still offer every
  // section, since by then admin intent isn't just "one or the other".
  const restrictToType = !p && opts.type ? opts.type : null;
  const selectableCats = restrictToType ? categoriesForType(allCats, restrictToType) : allCats;
  const initialCategoryId = p ? p.category_id : (opts.categoryId || CURRENT_CATEGORY_ID);
  let cat = selectableCats.find(c => c.id === initialCategoryId) || selectableCats[0] || allCats[0];
  // Gifts/Corporate/Studio are entirely physical goods (ship to the customer,
  // track stock) - only Photography is booking-based. Defaulting a brand-new
  // product's Type to match its section means the Stock/Delivery days/Address-
  // change fields just below are visible right away instead of the admin
  // having to know to flip this dropdown first. An explicit opts.type (the
  // Categories page's "+ Add Service" / "+ Add Product" buttons) wins over
  // that page-based guess, since the admin already told us which one they want.
  const defaultType = cat.pageSlug === "photography" ? "service" : "product";
  const initialType = p ? p.type : (opts.type || defaultType);
  const modalTitle = p ? "Edit Product / Package" : opts.type === "service" ? "Add Service" : opts.type === "product" ? "Add Product" : "Add Product / Package";
  openModal(`
    <h2>${modalTitle}</h2>
    <div id="formMsg"></div>
    <form id="prodForm">
      <div class="form-section-title">Section</div>
      <label>Which page &amp; category does this belong to?</label>
      <select id="f_category">${categorySectionOptionsHTML(selectableCats, cat.id)}</select>
      <div class="form-hint" style="margin-bottom:8px;">Saving adds it straight into this section — no need to visit it separately first.</div>

      <div class="form-section-title">Basic info</div>
      <div class="two-col">
        <div><label>Tier (Standard / Premium / Platinum, or blank)</label><input id="f_tier" value="${esc(p?.tier || "")}"></div>
        <div><label>Type</label>
          <select id="f_type">
            <option value="service" ${initialType === "service" ? "selected" : ""}>Service (booking)</option>
            <option value="product" ${initialType === "product" ? "selected" : ""}>Product (physical, ships to customer)</option>
          </select>
        </div>
      </div>
      <label>Title</label><input id="f_title" value="${esc(p?.title || "")}" required>
      <label>Web address <span class="form-hint">— fills in automatically from the title; only change it if you need a specific link</span></label>
      <input id="f_slug" value="${esc(p?.slug || "")}" required>
      <label>Description</label><textarea id="f_desc" rows="2">${esc(p?.description || "")}</textarea>

      <div class="form-section-title">Pricing</div>
      <div class="two-col">
        <div><label>Price (₹)</label><input id="f_price" type="number" step="1" value="${p?.price ?? ""}" required></div>
        <div><label>Original price before discount <span class="form-hint">(₹, optional — shown crossed out)</span></label><input id="f_mrp" type="number" step="1" value="${p?.mrp ?? ""}"></div>
      </div>
      <label>Advance / deposit amount (₹, optional)</label><input id="f_advance" type="number" step="1" value="${p?.advance_amount ?? ""}">
      <div id="physicalOnlyFields" class="two-col">
        <div><label>Stock available</label><input id="f_stock" type="number" value="${p?.stock ?? ""}"></div>
        <div><label>Delivery days <span class="form-hint">(optional — shown to the customer as "Delivery by ..." on the product page; leave blank to use the site-wide default of 3 days)</span></label>
          <input id="f_delivery_days" type="number" min="0" step="1" value="${p?.delivery_days ?? ""}" placeholder="e.g. 3"></div>
        <div><label>Address-change window after ordering <span class="form-hint">(hours, optional — leave blank to use the site-wide default in Settings)</span></label>
          <input id="f_addr_window" type="number" min="0" step="1" value="${p?.address_change_window_hours ?? ""}" placeholder="e.g. 24"></div>
      </div>

      <div class="form-section-title">What's included</div>
      <label style="margin-top:0;">Features / inclusions <span class="form-hint">(one per line — shown as a checklist to the customer)</span></label>
      <textarea id="f_features" rows="5">${esc((p?.features || []).join("\n"))}</textarea>

      <label>Search keywords <span class="form-hint">(comma-separated — extra words shoppers might search that do not appear in the title/description, e.g. "coffee cup, birthday gift")</span></label>
      <input id="f_keywords" value="${esc((p?.search_keywords || []).join(", "))}">

      <div class="form-section-title">Customer questions</div>
      <label style="margin-top:0;">Extra questions on this product's order form <span class="form-hint">— e.g. upload a photo, pick from a dropdown, free text. Tick "Required" to block the customer from adding it to cart until they answer. This is the only place to set that up — it works the same on Studio, Corporate and Gifts.</span></label>
      <div id="inputFieldsPhotoWarning" class="form-warning" style="${cat.pageSlug === "photography" ? "" : "display:none;"}">
        Photography products are enquiry/booking-only — they have no cart or customise panel,
        so questions added here are never shown to the customer and never collected.
        Use <b>Events &amp; team details</b> below for photography instead.
      </div>
      <div id="inputFieldsRows" class="field-builder"></div>
      <button type="button" class="btn secondary add-field-btn" id="addFieldBtn">+ Add Field</button>

      <div id="eventsSectionWrap" style="${cat.pageSlug === "photography" ? "" : "display:none;"}">
        <div class="form-section-title">Events &amp; team details</div>
        <label style="margin-top:0;">Table shown on the product page <span class="form-hint">— leave empty to auto-generate from the features above</span></label>
        <div id="eventsRows"></div>
        <button type="button" class="btn secondary" id="addEventRowBtn" style="margin-top:6px;">+ Add Row</button>
      </div>

      <details class="advanced-details">
        <summary>Advanced settings <span class="form-hint">(rarely needed — for one-off custom fields only; everything above already covers the common cases)</span></summary>
        <textarea id="f_extra" rows="4" style="font-family:monospace;font-size:12px;" placeholder="{}">${esc(JSON.stringify(extraForAdvancedBox(p?.extra), null, 2))}</textarea>
      </details>

      <div class="form-section-title">Visibility</div>
      <label class="inline"><input type="checkbox" id="f_active" ${!p || p.is_active ? "checked" : ""}> Active (visible on site)</label>
      <label>Sort order <span class="form-hint">— lower numbers show first</span></label><input id="f_sort" type="number" value="${p?.sort ?? 0}">
      <div class="modal-actions">
        <button type="button" class="btn secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn">${p ? "Save" : "Create"}</button>
      </div>
    </form>
  `, true);

  // ---- Web address auto-fill from title (until the admin edits it directly) ----
  let slugDirty = !!p;
  const slugInput = document.getElementById("f_slug");
  const titleInput = document.getElementById("f_title");
  slugInput.addEventListener("input", () => { slugDirty = true; });
  titleInput.addEventListener("input", () => { if (!slugDirty) slugInput.value = slugify(titleInput.value); });

  // ---- Show stock / address-change window only for physical products ----
  const typeSelect = document.getElementById("f_type");
  const physicalWrap = document.getElementById("physicalOnlyFields");
  const syncPhysicalFields = () => { physicalWrap.style.display = typeSelect.value === "product" ? "grid" : "none"; };
  typeSelect.addEventListener("change", syncPhysicalFields);
  syncPhysicalFields();

  // The admin picked Type explicitly (either by hand, or by clicking "+ Add
  // Service" / "+ Add Product" on the Categories page) means the Section
  // dropdown switching pages below should stop guessing Type for them.
  let typeDirty = !!p || !!opts.type;
  typeSelect.addEventListener("change", () => { typeDirty = true; });

  // ---- Section (category) picker drives Type's default guess and whether
  // Events & team details (photography-only) is shown ----
  const categorySelect = document.getElementById("f_category");
  const eventsSectionWrap = document.getElementById("eventsSectionWrap");
  categorySelect.addEventListener("change", () => {
    const newCat = allCats.find(c => c.id === categorySelect.value);
    if (!newCat) return;
    cat = newCat;
    eventsSectionWrap.style.display = cat.pageSlug === "photography" ? "" : "none";
    const photoFieldWarning = document.getElementById("inputFieldsPhotoWarning");
    if (photoFieldWarning) photoFieldWarning.style.display = cat.pageSlug === "photography" ? "" : "none";
    if (!typeDirty) {
      typeSelect.value = cat.pageSlug === "photography" ? "service" : "product";
      syncPhysicalFields();
    }
  });

  // ---- Customer Input Fields (Product.input_fields) ----
  const FIELD_TYPES = {
    upload: { icon: "📤", label: "Upload" },
    dropdown: { icon: "▾", label: "Dropdown" },
    text: { icon: "✎", label: "Text" },
  };
  const fieldsWrap = document.getElementById("inputFieldsRows");
  let _fieldRowSeq = 0;

  function fieldTypePanelHTML(row, type) {
    if (type === "upload") {
      const multiple = row?.multiple ?? false;
      return `
        <div class="field-type-panel fp-upload">
          <div class="fr-upload-mode">
            <label><input type="radio" name="fr_upload_mode_${row?._rid ?? ""}" class="fr_upload_single" ${!multiple ? "checked" : ""}> Single file</label>
            <label><input type="radio" name="fr_upload_mode_${row?._rid ?? ""}" class="fr_upload_multiple" ${multiple ? "checked" : ""}> Multiple files</label>
          </div>
          <div class="fr_max_files_wrap" style="display:${multiple ? "block" : "none"};max-width:180px;">
            <label>Maximum files</label>
            <input type="number" class="fr_max_files" min="2" max="10" value="${row?.max_files && row.max_files >= 2 ? row.max_files : 3}">
          </div>
        </div>`;
    }
    if (type === "dropdown") {
      const priced = !!(row?.option_prices && Object.keys(row.option_prices).length);
      // A dropdown whose options carry their own picture is edited as a list of
      // rows instead of as lines of text - see the "Options with pictures" block
      // further down for why.
      const rich = !!(row?.option_image_urls && Object.keys(row.option_image_urls).length);
      const optionsText = optionEntriesToText(dropdownEntries(row), priced);
      return `
        <div class="field-type-panel fp-dropdown">
          <label class="inline" style="font-weight:400;margin-bottom:6px;"><input type="checkbox" class="fr_priced" ${priced ? "checked" : ""}> This dropdown sets the price (e.g. quantity or size options each at their own price)</label>
          <label class="inline" style="font-weight:400;margin-bottom:10px;"><input type="checkbox" class="fr_rich" ${rich ? "checked" : ""}> Show a picture on each option (e.g. colours, fabrics, frame styles)</label>

          <div class="fr-opt-simple" style="${rich ? "display:none;" : ""}">
            <label class="fr_options_label">Options (one per line)</label>
            <textarea class="fr_options" rows="3" placeholder="${priced ? "8 Photos = 130&#10;16 Photos = 200&#10;32 Photos = 250" : "4x6&#10;5x7&#10;Passport Size"}">${esc(optionsText)}</textarea>
            <div class="form-hint fr_priced_hint" style="${priced ? "" : "display:none;"}">Add a struck-through &quot;was&quot; price by writing <b>Label = Price / WasPrice</b> — e.g. <b>16 Photos = 200 / 299</b>. It is shown on that option's tile on the product page and nowhere else; the customer is always charged the first number.</div>
            <div class="form-hint">Optionally end any line with <b>@</b> and a photo number to show that photo when the option is picked — e.g. <b>9X9 = 1699 @2</b> shows photo 2. The number is the one printed on each tile in this product's <b>Photos &amp; Video</b> dialog; videos are not numbered and do not count. Leave <b>@</b> off and the gallery stays put, which is how every option behaves today. Re-ordering the photos re-numbers them, so check the tiles again afterwards.</div>
          </div>

          <div class="fr-opt-rich" style="${rich ? "" : "display:none;"}">
            <div class="opt-rows"></div>
            <button type="button" class="btn secondary fr_add_opt">+ Add option</button>
            <div class="form-hint" style="margin-top:8px;">Each option becomes one tile on the product page, showing its picture, its name and — when this dropdown sets the price — its price. Ticking this box off again keeps the names and prices but drops the pictures.</div>
            <div class="form-hint"><b>Gallery photo #</b> is a separate, optional extra: it swaps the <i>big</i> product image to one of this product's own <b>Photos &amp; Video</b> when the option is picked. Leave it blank and the gallery stays put.</div>
          </div>

          <label class="inline" style="font-weight:400;"><input type="checkbox" class="fr_multi_select" ${row?.multi_select ? "checked" : ""} ${priced ? "disabled" : ""}> Allow selecting multiple options</label>
        </div>`;
    }
    return `
      <div class="field-type-panel fp-text">
        <label>Placeholder (optional)</label>
        <input class="fr_placeholder" value="${esc(row?.placeholder || "")}" placeholder="e.g. Any special instructions?">
        <label style="margin-top:8px;">Maximum characters the customer may type</label>
        <input type="number" class="fr_max_length" min="1" max="5000" style="max-width:180px;"
               value="${Number(row?.max_length) > 0 ? Number(row.max_length) : 500}">
      </div>`;
  }

  function refreshFieldTypeUI(rowEl, row) {
    rowEl.querySelectorAll(".type-checkbox").forEach(chip => {
      chip.classList.toggle("active", chip.dataset.type === row.type);
      chip.querySelector("input").checked = chip.dataset.type === row.type;
    });
    rowEl.querySelector(".field-type-panel-wrap").innerHTML = fieldTypePanelHTML(row, row.type);
    wireUploadModeToggle(rowEl);
    wireRichOptions(rowEl, row);
    wireDropdownPricedToggle(rowEl);
  }

  function wireUploadModeToggle(rowEl) {
    const single = rowEl.querySelector(".fr_upload_single");
    const multiple = rowEl.querySelector(".fr_upload_multiple");
    const maxWrap = rowEl.querySelector(".fr_max_files_wrap");
    if (!single || !multiple) return;
    [single, multiple].forEach(radio => radio.addEventListener("change", () => {
      if (maxWrap) maxWrap.style.display = multiple.checked ? "block" : "none";
    }));
  }

  function wireDropdownPricedToggle(rowEl) {
    const priced = rowEl.querySelector(".fr_priced");
    const optionsBox = rowEl.querySelector(".fr_options");
    const multiSelect = rowEl.querySelector(".fr_multi_select");
    const label = rowEl.querySelector(".fr_options_label");
    const pricedHint = rowEl.querySelector(".fr_priced_hint");
    if (!priced || !optionsBox) return;
    const sync = () => {
      const on = priced.checked;
      optionsBox.placeholder = on ? "8 Photos = 130 / 199\n16 Photos = 200\n32 Photos = 250 / 349" : "4x6\n5x7\nPassport Size";
      if (label) label.textContent = on ? "Options — one per line, as \"Label = Price\"" : "Options (one per line)";
      if (pricedHint) pricedHint.style.display = on ? "" : "none";
      if (multiSelect) { multiSelect.disabled = on; if (on) multiSelect.checked = false; }
      // The rich editor's Price / Was price columns only mean anything while
      // this dropdown is the thing setting the item's price.
      rowEl.querySelectorAll(".opt-priced-only").forEach(cell => { cell.style.display = on ? "" : "none"; });
    };
    priced.addEventListener("change", sync);
    sync();
  }

  /* ---------------------------------------------------------------- Options
     with pictures.

     A dropdown's options are variants a shopper compares, and for some of them
     - colours, fabrics, frame styles - the picture IS the option; a row of
     text tiles reading "Maroon / Navy / Bottle Green" tells a customer far less
     than three swatches would. option_images already existed but only points at
     one of the product's OWN gallery photos, which a colour swatch has no
     business being (nobody wants ten swatch close-ups in the main gallery), and
     a picture is not something the "Label = Price @N" line syntax could ever
     express anyway.

     So ticking "Show a picture on each option" swaps the textarea for a row per
     option - picture, name, price, was-price, gallery photo # - and each
     picture is uploaded straight to the Media Library, exactly as the Photos
     dialog does it. Everything else about the field is unchanged: the same
     options/option_prices/option_mrps/option_images are produced either way, and
     the new option_image_urls is simply absent on every product that does not
     use this, which is what keeps the storefront's existing tiles untouched. */

  // Matches MAX_SIZE in backend/app/services/media.py. A UX nicety only - the
  // backend is what actually enforces it - but it saves a 20MB round trip that
  // was always going to be rejected.
  const MAX_OPTION_IMAGE_BYTES = 20 * 1024 * 1024;
  const MAX_DROPDOWN_OPTIONS = 50; // must match ProductInputFieldIn.options' max_length

  function optionRowHTML(entry, priced) {
    const img = entry.image
      ? `<img class="opt-pic-img" src="${esc(mediaUrl(entry.image))}" alt="">`
      : `<span class="opt-pic-img is-empty"></span>`;
    return `
      <div class="opt-pic">
        ${img}
        <input type="file" accept="image/*" class="opt_pic_input" hidden>
        <button type="button" class="opt-pic-btn">${entry.image ? "Replace" : "Upload"}</button>
        <button type="button" class="opt-pic-clear" style="${entry.image ? "" : "display:none;"}">Remove</button>
        <span class="opt-pic-status"></span>
      </div>
      <div class="opt-fields">
        <div class="opt-cell opt-cell-name">
          <label>Option name</label>
          <input class="opt_name" value="${esc(entry.name)}" placeholder="e.g. Maroon">
        </div>
        <div class="opt-cell opt-priced-only" style="${priced ? "" : "display:none;"}">
          <label>Price (₹)</label>
          <input class="opt_price" type="number" step="1" min="0" value="${esc(entry.price)}">
        </div>
        <div class="opt-cell opt-priced-only" style="${priced ? "" : "display:none;"}">
          <label>Was price (₹)</label>
          <input class="opt_mrp" type="number" step="1" min="0" value="${esc(entry.mrp)}" placeholder="optional">
        </div>
        <div class="opt-cell opt-cell-photo">
          <label>Gallery photo #</label>
          <input class="opt_photo" type="number" min="1" step="1" value="${esc(entry.photo)}" placeholder="—">
        </div>
      </div>
      <div class="opt-actions">
        <button type="button" class="opt_up" title="Move up">▲</button>
        <button type="button" class="opt_down" title="Move down">▼</button>
        <button type="button" class="opt_remove" title="Remove option">×</button>
      </div>`;
  }

  // The uploaded picture lives on the row element rather than in an <input>:
  // it is never typed, only set by an upload or cleared, and keeping it out of
  // the form means nothing can half-edit it into an invalid URL.
  function setOptionPicture(optRow, url) {
    optRow.dataset.image = url || "";
    const pic = optRow.querySelector(".opt-pic-img");
    const clear = optRow.querySelector(".opt-pic-clear");
    const btn = optRow.querySelector(".opt-pic-btn");
    const next = document.createElement(url ? "img" : "span");
    next.className = `opt-pic-img${url ? "" : " is-empty"}`;
    if (url) { next.src = mediaUrl(url); next.alt = ""; }
    pic.replaceWith(next);
    clear.style.display = url ? "" : "none";
    btn.textContent = url ? "Replace" : "Upload";
  }

  async function uploadOptionPicture(optRow, file) {
    const status = optRow.querySelector(".opt-pic-status");
    if (!file.type.startsWith("image/")) {
      status.textContent = "Pictures only — pick a JPG, PNG or WebP.";
      return;
    }
    if (file.size > MAX_OPTION_IMAGE_BYTES) {
      status.textContent = `Over ${MAX_OPTION_IMAGE_BYTES / (1024 * 1024)}MB — pick a smaller picture.`;
      return;
    }
    status.textContent = "Uploading… 0%";
    const fd = new FormData();
    fd.append("file", file);
    // Files it alongside the rest of this product's media in R2 (see
    // upload_media_library_asset()) instead of one flat folder - organization
    // only, nothing queries the key path.
    if (cat?.pageSlug) fd.append("page_slug", cat.pageSlug);
    if (cat?.slug) fd.append("category_slug", cat.slug);
    try {
      const uploaded = await Api.uploadMediaWithProgress(fd, (pct) => {
        // 100% means the bytes have all been SENT, not that the upload is done -
        // the server still has to re-encode the image, store it and write the
        // row, which is the slowest part of this on a distant database. Saying
        // "Uploading… 100%" through all of that reads as a picture that has
        // silently failed, so the wait gets a label of its own.
        status.textContent = pct >= 100 ? "Processing…" : `Uploading… ${pct}%`;
      });
      setOptionPicture(optRow, uploaded.url);
      status.textContent = "";
    } catch (err) {
      status.textContent = err.message;
    }
  }

  function addOptionRow(rowsWrap, entry, priced) {
    const optRow = document.createElement("div");
    optRow.className = "opt-row";
    optRow.dataset.image = entry.image || "";
    optRow.innerHTML = optionRowHTML(entry, priced);
    rowsWrap.appendChild(optRow);

    const fileInput = optRow.querySelector(".opt_pic_input");
    optRow.querySelector(".opt-pic-btn").addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      fileInput.value = "";
      if (file) uploadOptionPicture(optRow, file);
    });
    optRow.querySelector(".opt-pic-clear").addEventListener("click", () => {
      // Only unlinks it from this option - the picture stays in the Media
      // Library, the same as removing a photo from a product's gallery.
      setOptionPicture(optRow, "");
      optRow.querySelector(".opt-pic-status").textContent = "";
    });
    optRow.querySelector(".opt_remove").addEventListener("click", () => {
      optRow.remove();
      refreshOptRowsEmptyState(rowsWrap);
    });
    optRow.querySelector(".opt_up").addEventListener("click", () => {
      const prev = optRow.previousElementSibling;
      if (prev && prev.classList.contains("opt-row")) rowsWrap.insertBefore(optRow, prev);
    });
    optRow.querySelector(".opt_down").addEventListener("click", () => {
      const next = optRow.nextElementSibling;
      if (next && next.classList.contains("opt-row")) rowsWrap.insertBefore(next, optRow);
    });
    refreshOptRowsEmptyState(rowsWrap);
    return optRow;
  }

  function refreshOptRowsEmptyState(rowsWrap) {
    const empty = rowsWrap.querySelector(".opt-rows-empty");
    if (rowsWrap.querySelector(".opt-row")) {
      if (empty) empty.remove();
    } else if (!empty) {
      const note = document.createElement("div");
      note.className = "opt-rows-empty";
      note.textContent = "No options yet — add one below.";
      rowsWrap.appendChild(note);
    }
  }

  function renderOptRows(rowEl, entries, priced) {
    const rowsWrap = rowEl.querySelector(".opt-rows");
    if (!rowsWrap) return;
    rowsWrap.innerHTML = "";
    entries.forEach(entry => addOptionRow(rowsWrap, entry, priced));
    refreshOptRowsEmptyState(rowsWrap);
  }

  // What the rows currently hold, in the same shape parseOptionLine() produces.
  function readRichEntries(rowEl) {
    return Array.from(rowEl.querySelectorAll(".opt-row")).map(optRow => ({
      name: optRow.querySelector(".opt_name").value.trim(),
      price: optRow.querySelector(".opt_price").value.trim(),
      mrp: optRow.querySelector(".opt_mrp").value.trim(),
      photo: optRow.querySelector(".opt_photo").value.trim(),
      image: optRow.dataset.image || null,
      raw: null,
    }));
  }

  function readSimpleEntries(rowEl, priced) {
    return (rowEl.querySelector(".fr_options")?.value || "")
      .split("\n").map(s => s.trim()).filter(Boolean)
      .map(line => parseOptionLine(line, priced));
  }

  // Whichever editor is on screen is the one that holds the truth.
  function readDropdownEntries(rowEl, priced) {
    return rowEl.querySelector(".fr_rich")?.checked
      // A row left completely blank is an unfinished "+ Add option" click, not
      // an option the admin forgot to name.
      ? readRichEntries(rowEl).filter(e => e.name || e.price || e.mrp || e.photo || e.image)
      : readSimpleEntries(rowEl, priced);
  }

  function wireRichOptions(rowEl, row) {
    const richToggle = rowEl.querySelector(".fr_rich");
    if (!richToggle) return;
    const simpleWrap = rowEl.querySelector(".fr-opt-simple");
    const richWrap = rowEl.querySelector(".fr-opt-rich");
    const rowsWrap = rowEl.querySelector(".opt-rows");
    const priced = () => !!rowEl.querySelector(".fr_priced")?.checked;

    // Pictures the admin has already attached, remembered across a toggle off
    // and back on: unticking the box is easy to do by accident, and re-uploading
    // a dozen swatches because of it would be a miserable way to find that out.
    // They are still dropped on save while the box is unticked - that is what
    // the hint under the editor promises - but only on save.
    rowEl.__optionImages = {};
    dropdownEntries(row).forEach(e => { if (e.image) rowEl.__optionImages[e.name] = e.image; });

    if (richToggle.checked) renderOptRows(rowEl, dropdownEntries(row), priced());

    richToggle.addEventListener("change", () => {
      if (richToggle.checked) {
        // Carry the typed lines over, re-attaching any picture whose option
        // still has the same name.
        const entries = readSimpleEntries(rowEl, priced())
          .map(e => ({ ...e, image: rowEl.__optionImages[e.name] || null }));
        renderOptRows(rowEl, entries, priced());
      } else {
        const entries = readRichEntries(rowEl).filter(e => e.name);
        entries.forEach(e => { if (e.image) rowEl.__optionImages[e.name] = e.image; });
        const box = rowEl.querySelector(".fr_options");
        if (box) box.value = optionEntriesToText(entries, priced());
      }
      simpleWrap.style.display = richToggle.checked ? "none" : "";
      richWrap.style.display = richToggle.checked ? "" : "none";
    });

    rowEl.querySelector(".fr_add_opt").addEventListener("click", () => {
      if (rowsWrap.querySelectorAll(".opt-row").length >= MAX_DROPDOWN_OPTIONS) return;
      const added = addOptionRow(rowsWrap, { name: "", price: "", mrp: "", photo: "", image: null }, priced());
      added.querySelector(".opt_name").focus();
    });
  }

  function addFieldRow(field) {
    const rid = `fr${++_fieldRowSeq}`;
    const row = {
      _rid: rid,
      id: field?.id || null,
      type: field?.type || "upload",
      label: field?.label || "",
      required: field?.required ?? false,
      help_text: field?.help_text || "",
      multiple: field?.multiple ?? false,
      max_files: field?.max_files ?? 3,
      options: field?.options || [],
      multi_select: field?.multi_select ?? false,
      placeholder: field?.placeholder || "",
      max_length: Number(field?.max_length) > 0 ? Number(field.max_length) : 500,
      option_prices: field?.option_prices || null,
      option_mrps: field?.option_mrps || null,
      option_images: field?.option_images || null,
      option_image_urls: field?.option_image_urls || null,
    };
    const div = document.createElement("div");
    div.className = "field-row";
    div.dataset.rid = rid;
    div.innerHTML = `
      <div class="field-row-top">
        <div class="fr-label">
          <label style="margin-bottom:4px;">Field heading (shown to the customer)</label>
          <input class="fr_label" value="${esc(row.label)}" placeholder="e.g. Upload your photo" required>
        </div>
        <div class="field-row-side">
          <label class="field-row-required"><input type="checkbox" class="fr_required" ${row.required ? "checked" : ""}> Required</label>
          <div class="field-row-order">
            <button type="button" class="fr_up" title="Move up">▲</button>
            <button type="button" class="fr_down" title="Move down">▼</button>
          </div>
          <button type="button" class="field-row-remove" title="Remove field">×</button>
        </div>
      </div>
      <div class="type-checkbox-group">
        ${Object.entries(FIELD_TYPES).map(([type, meta]) => `
          <label class="type-checkbox ${type === row.type ? "active" : ""}" data-type="${type}">
            <input type="checkbox" ${type === row.type ? "checked" : ""}>
            <span class="tc-icon">${meta.icon}</span> ${meta.label}
          </label>`).join("")}
      </div>
      <div class="field-type-panel-wrap">${fieldTypePanelHTML(row, row.type)}</div>
      <div class="fr-help-text" style="margin-top:8px;">
        <label style="font-weight:400;">Help text (optional)</label>
        <input class="fr_help_text" value="${esc(row.help_text)}" placeholder="Small note shown under the field">
      </div>
    `;
    div.__field = row;
    fieldsWrap.appendChild(div);
    wireUploadModeToggle(div);
    wireRichOptions(div, row);
    wireDropdownPricedToggle(div);

    div.querySelectorAll(".type-checkbox").forEach(chip => {
      chip.addEventListener("click", (e) => {
        e.preventDefault();
        row.type = chip.dataset.type;
        refreshFieldTypeUI(div, row);
      });
    });
    div.querySelector(".field-row-remove").addEventListener("click", () => div.remove());
    div.querySelector(".fr_up").addEventListener("click", () => {
      const prev = div.previousElementSibling;
      if (prev) fieldsWrap.insertBefore(div, prev);
    });
    div.querySelector(".fr_down").addEventListener("click", () => {
      const next = div.nextElementSibling;
      if (next) fieldsWrap.insertBefore(next, div);
    });
  }

  (p?.input_fields || []).slice().sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)).forEach(addFieldRow);
  document.getElementById("addFieldBtn").addEventListener("click", () => addFieldRow());

  function collectInputFields() {
    const input_fields = [];
    const errors = [];
    Array.from(fieldsWrap.querySelectorAll(".field-row")).forEach((row, index) => {
      const type = row.querySelector(".type-checkbox.active")?.dataset.type || "text";
      const label = row.querySelector(".fr_label").value.trim();
      if (!label) { errors.push(`Field #${index + 1} needs a heading.`); return; }
      const field = {
        id: row.__field.id || `f_${Math.random().toString(36).slice(2, 10)}`,
        type,
        label,
        required: row.querySelector(".fr_required").checked,
        help_text: row.querySelector(".fr_help_text").value.trim(),
        sort: index,
        multiple: false,
        max_files: 1,
        options: [],
        multi_select: false,
      };
      // The backend rejects these characters in a label/option/placeholder
      // (schemas.py's _UNSAFE_TEXT_CHARS) because they get rendered into the
      // storefront product page - caught here so staff see why, instead of a
      // raw 422 from the API.
      const UNSAFE = /["<>]/;
      if (UNSAFE.test(label)) errors.push(`Field heading "${label}" cannot contain double quotes or angle brackets.`);
      if (UNSAFE.test(field.help_text)) errors.push(`Help text for "${label}" cannot contain double quotes or angle brackets.`);
      if (type === "text") {
        field.placeholder = row.querySelector(".fr_placeholder")?.value.trim() || "";
        field.max_length = Math.max(1, Math.min(5000, parseInt(row.querySelector(".fr_max_length")?.value || "500", 10) || 500));
        if (UNSAFE.test(field.placeholder)) errors.push(`Placeholder for "${label}" cannot contain double quotes or angle brackets.`);
      }
      if (type === "upload") {
        field.multiple = !!row.querySelector(".fr_upload_multiple")?.checked;
        field.max_files = field.multiple ? Math.max(2, Math.min(10, parseInt(row.querySelector(".fr_max_files")?.value || "3", 10))) : 1;
      } else if (type === "dropdown") {
        const priced = !!row.querySelector(".fr_priced")?.checked;
        const rich = !!row.querySelector(".fr_rich")?.checked;
        // Both editors hand back the same { name, price, mrp, photo, image }
        // shape, so everything below - the numbers, the ordering, the error
        // wording - is written once and behaves identically in either.
        const entries = readDropdownEntries(row, priced);
        const option_prices = {};
        const option_mrps = {};
        const option_images = {};
        const option_image_urls = {};
        const seen = new Set();
        // Quotes what was actually typed when the text editor is in use, and
        // falls back to the option's name in the row editor, where there is no
        // "line" to point at.
        const where = (entry) => entry.raw || entry.name;
        entries.forEach(entry => {
          const name = entry.name;
          if (!name) {
            errors.push(entry.raw
              ? `Dropdown field "${label}": "${entry.raw}" has no option name.`
              : `Dropdown field "${label}": an option has no name.`);
            return;
          }
          // Every map below is keyed by the option's name, so two options
          // sharing one would silently overwrite each other's price/picture.
          if (seen.has(name)) {
            errors.push(`Dropdown field "${label}": "${name}" is listed twice — each option needs its own name.`);
            return;
          }
          seen.add(name);
          field.options.push(name);

          if (priced) {
            const price = Number(entry.price);
            if (entry.price === "" || Number.isNaN(price) || price < 0) {
              errors.push(rich
                ? `Dropdown field "${label}": "${name}" needs a price.`
                : `Dropdown field "${label}": "${where(entry)}" should look like "Label = Price" (or "Label = Price / WasPrice").`);
            } else {
              option_prices[name] = price;
              if (entry.mrp !== "") {
                const mrp = Number(entry.mrp);
                if (Number.isNaN(mrp)) {
                  errors.push(`Dropdown field "${label}": the was-price for "${name}" is not a number.`);
                } else if (mrp <= price) {
                  // Caught here rather than silently dropped by the storefront
                  // (which hides a was-price that isn't above the real one) so
                  // the admin finds out now instead of wondering why it never
                  // appears.
                  errors.push(`Dropdown field "${label}": the was-price for "${name}" must be higher than the price.`);
                } else {
                  option_mrps[name] = mrp;
                }
              }
            }
          }

          if (entry.photo !== "") {
            const photo = parseInt(entry.photo, 10);
            if (!Number.isFinite(photo) || photo < 1) {
              errors.push(`Dropdown field "${label}": the photo number for "${name}" must be 1 or more.`);
            } else {
              option_images[name] = photo;
            }
          }

          // Only while the box is ticked - see wireRichOptions(). Unticking it
          // is how an admin removes every picture at once.
          if (rich && entry.image) option_image_urls[name] = entry.image;
        });
        field.multi_select = priced ? false : !!row.querySelector(".fr_multi_select")?.checked;
        field.option_prices = priced ? option_prices : null;
        // Left null rather than {} when nothing is set, so a product that never
        // used one of these reads exactly as it did before the feature existed.
        field.option_mrps = Object.keys(option_mrps).length ? option_mrps : null;
        field.option_images = Object.keys(option_images).length ? option_images : null;
        field.option_image_urls = Object.keys(option_image_urls).length ? option_image_urls : null;
        if (!field.options.length) errors.push(`Dropdown field "${label}" needs at least one option.`);
        if (field.options.length > MAX_DROPDOWN_OPTIONS) errors.push(`Dropdown field "${label}" has ${field.options.length} options — the most allowed is ${MAX_DROPDOWN_OPTIONS}.`);
        field.options.filter(o => UNSAFE.test(o)).forEach(o =>
          errors.push(`Dropdown option "${o}" cannot contain double quotes or angle brackets.`));
      }
      input_fields.push(field);
    });
    return { input_fields, errors };
  }

  // ---- Events & Team Details rows (extra.events, photography categories only) ----
  const eventsWrap = document.getElementById("eventsRows");
  function addEventRow(row) {
    const div = document.createElement("div");
    div.className = "two-col event-row";
    div.style.cssText = "display:grid;grid-template-columns:1.2fr 1.6fr 0.6fr auto;gap:8px;align-items:start;margin-bottom:6px;";
    div.innerHTML = `
      <input class="ev_event" placeholder="Event / date (e.g. Wedding Photography)" value="${esc(row?.event || "")}">
      <textarea class="ev_team" rows="2" placeholder="1 Photographer&#10;1 Videographer">${esc(row?.team || "")}</textarea>
      <input class="ev_total" type="number" placeholder="Total" value="${row?.total ?? ""}">
      <button type="button" class="btn danger" onclick="this.closest('.event-row').remove()">×</button>
    `;
    eventsWrap.appendChild(div);
  }
  if (eventsWrap) {
    (p?.extra?.events || []).forEach(addEventRow);
    document.getElementById("addEventRowBtn").addEventListener("click", () => addEventRow());
  }

  document.getElementById("prodForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const num = (v) => (v === "" || v === null ? null : Number(v));
    let extra = {};
    const extraRaw = document.getElementById("f_extra").value.trim();
    if (extraRaw) {
      try { extra = JSON.parse(extraRaw); }
      catch (err) {
        document.getElementById("formMsg").innerHTML = `<div class="msg error">Advanced options must be valid JSON: ${esc(err.message)}</div>`;
        return;
      }
    }
    if (eventsWrap) {
      const events = Array.from(eventsWrap.querySelectorAll(".event-row")).map(row => ({
        event: row.querySelector(".ev_event").value.trim(),
        team: row.querySelector(".ev_team").value.trim(),
        total: row.querySelector(".ev_total").value.trim() ? Number(row.querySelector(".ev_total").value) : null,
      })).filter(r => r.event || r.team || r.total !== null);
      if (events.length) extra.events = events;
      else delete extra.events;
    }
    const { input_fields, errors: fieldErrors } = collectInputFields();
    if (fieldErrors.length) {
      document.getElementById("formMsg").innerHTML = `<div class="msg error">${fieldErrors.map(esc).join("<br>")}</div>`;
      return;
    }
    const categoryId = document.getElementById("f_category").value;
    const data = {
      category_id: categoryId,
      tier: document.getElementById("f_tier").value.trim() || null,
      title: document.getElementById("f_title").value.trim(),
      slug: document.getElementById("f_slug").value.trim(),
      description: document.getElementById("f_desc").value.trim(),
      type: document.getElementById("f_type").value,
      price: Number(document.getElementById("f_price").value),
      mrp: num(document.getElementById("f_mrp").value),
      advance_amount: num(document.getElementById("f_advance").value),
      stock: num(document.getElementById("f_stock").value),
      delivery_days: num(document.getElementById("f_delivery_days").value),
      address_change_window_hours: num(document.getElementById("f_addr_window").value),
      features: document.getElementById("f_features").value.split("\n").map(s => s.trim()).filter(Boolean),
      search_keywords: document.getElementById("f_keywords").value.split(",").map(s => s.trim()).filter(Boolean),
      is_active: document.getElementById("f_active").checked,
      sort: parseInt(document.getElementById("f_sort").value || "0", 10),
      extra,
      input_fields,
    };
    try {
      const btn = e.target.querySelector('button[type="submit"]');
      await withBusy(btn, p ? "Saving…" : "Creating…", () =>
        p ? Api.updateProduct(p.id, data) : Api.createProduct({ ...data, media: [] }));
      closeModal();
      afterProductSaved(categoryId);
    } catch (err) {
      document.getElementById("formMsg").innerHTML = `<div class="msg error">${esc(err.message)}</div>`;
    }
  });
}

// After a create/save, land the admin on that section's product list — the
// "Section" dropdown may not match whatever was selected in Products &
// Packages (or that page may not even be open yet, if this form was opened
// from the Categories page's "+ Add Service" / "+ Add Product" buttons).
function afterProductSaved(categoryId) {
  CURRENT_CATEGORY_ID = categoryId;
  const catSelect = document.getElementById("catSelect");
  if (catSelect) {
    catSelect.value = categoryId;
    loadProdTable();
  } else {
    location.hash = `#/products?cat=${categoryId}`;
  }
}

async function removeProduct(id, btn) {
  const p = window._PRODUCTS_CACHE.find(x => x.id === id);
  if (!confirm(`Delete "${p?.title}"?`)) return;
  try { await withBusy(btn, "Deleting…", () => Api.deleteProduct(id)); loadProdTable(); }
  catch (err) { alert(err.message); }
}

function openProductMedia(id) {
  const p = window._PRODUCTS_CACHE.find(x => x.id === id);
  // Products tab caches categories in window._ALL_CATS (every page's categories,
  // flattened, each already carrying pageSlug/pageName - see allCategoriesAcrossPages
  // in core.js), not window._CATS_CACHE - that one only gets populated by the
  // Categories tab and is scoped to whichever single page was selected there.
  const cat = (window._ALL_CATS || []).find(c => c.id === p.category_id);
  renderMediaModal({
    title: `Photos &amp; Video — ${esc(p.title)}`,
    media: p.media,
    kind: "package",
    addFn: (data) => Api.addProductMedia(id, data),
    afterChange: loadProdTable,
    categoryId: p.category_id,
    pageId: cat?.page_id,
    pageSlug: cat?.pageSlug,
    categorySlug: cat?.slug,
  });
}

// ==================================================================== shared media modal

// A product's gallery can hold short videos alongside its photos; a category
// portfolio can't (the storefront renders those only as <img>, and the API
// rejects a video there - see add_category_media in backend/app/routers/admin.py).
// What the upload endpoint accepts is decided by the file's magic bytes, not this
// attribute - `accept` only filters the OS file picker.
const MEDIA_VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime";
const MEDIA_VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;
// Must match MAX_VIDEO_SIZE in backend/app/services/media.py. Like the item cap
// above, this is a UX nicety - the backend is what actually enforces it.
const MAX_VIDEO_UPLOAD_BYTES = 25 * 1024 * 1024;
const MEDIA_THUMB_FALLBACK = "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2290%22 height=%2290%22><rect width=%2290%22 height=%2290%22 fill=%22%23e8e0d8%22/></svg>";

// A row's own media_type is authoritative once it has been through the API; the
// extension check is the fallback for a URL the admin has only just pasted.
function isVideoMedia(m) {
  if (!m) return false;
  if (m.media_type) return m.media_type === "video";
  return MEDIA_VIDEO_EXT.test(m.url || "");
}

function mediaTypeForUrl(url) {
  return MEDIA_VIDEO_EXT.test(url || "") ? "video" : "image";
}

// One gallery tile's inner markup. preload="metadata" on purpose: a modal listing
// ten of these should fetch ten headers, not ten whole clips.
function mediaThumbMarkup(m) {
  if (isVideoMedia(m)) {
    return `<video src="${esc(mediaUrl(m.url))}" muted playsinline preload="metadata"></video>
      <span class="media-video-badge" title="Video">▶</span>`;
  }
  return `<img src="${esc(mediaUrl(m.url))}" onerror="this.src='${MEDIA_THUMB_FALLBACK}'">`;
}

function renderMediaModal({ title, media, kind = "portfolio", addFn, afterChange, categoryId, pageId, pageSlug, categorySlug }) {
  // MAX_MEDIA_PER_ENTITY must match backend/app/routers/admin.py's
  // MAX_MEDIA_PER_ENTITY - this is only a UX nicety (blocking/trimming
  // selections before they hit the network); the backend is what actually
  // enforces the cap, since this modal has three independent add paths
  // (upload, library picker, add-by-URL) that all need to agree on the count.
  const MAX_MEDIA_PER_ENTITY = 10;
  // Videos share the product's one 10-item gallery budget rather than getting a
  // slot of their own - the storefront shows them in the same thumbnail rail, so
  // the cap that keeps that rail sane has to cover both.
  const allowVideo = kind === "package";
  const ITEMS = allowVideo ? "photos/videos" : "photos";
  const mediaCountNow = () => document.getElementById("mediaList").querySelectorAll(".media-item").length;
  const remainingSlots = () => Math.max(0, MAX_MEDIA_PER_ENTITY - mediaCountNow());
  const updateCountLabel = () => {
    const label = document.getElementById("mediaCountLabel");
    if (label) label.textContent = `${mediaCountNow()} of ${MAX_MEDIA_PER_ENTITY} ${ITEMS} used`;
  };

  openModal(`
    <h2>${title}</h2>
    <div id="formMsg"></div>
    <p id="mediaCountLabel" style="color:var(--text-dim);font-size:12px;margin:0 0 6px;">${media.length} of ${MAX_MEDIA_PER_ENTITY} ${ITEMS} used</p>
    ${media.length > 1 ? `<p style="color:var(--text-dim);font-size:12px;margin:0 0 6px;">Drag to reorder — the first one is used as the main/cover image${allowVideo ? ", so keep a photo first (a video can't be a cover)" : ""}.</p>` : ""}
    <div class="media-list" id="mediaList">
      ${media.map((m, i) => `
        <div class="media-item${i === 0 ? " is-main" : ""}${isVideoMedia(m) ? " is-video" : ""}" draggable="true" data-id="${esc(m.id)}">
          ${allowVideo ? `<span class="media-photo-no" title="Photo number — end a dropdown option with @ and this number to show this photo when that option is picked"></span>` : ""}
          ${mediaThumbMarkup(m)}
          <button title="Remove" onclick="removeMedia('${m.id}', this)">×</button>
          ${m.alt ? `<div class="cap">${esc(m.alt)}</div>` : ""}
        </div>`).join("") || `<div style="color:var(--text-dim);font-size:13px;">No ${ITEMS} yet.</div>`}
    </div>
    <form id="mediaUploadForm" style="margin-top:16px;">
      <label>Upload ${ITEMS} <span class="form-hint">(up to ${MAX_MEDIA_PER_ENTITY} total per product/category — choose your files, then click Upload${allowVideo ? ". Videos: MP4, WebM or MOV, up to 25MB each" : ""})</span></label>
      <input type="file" id="m_file" accept="${allowVideo ? `image/*,${MEDIA_VIDEO_ACCEPT}` : "image/*"}" multiple>
      <div id="m_fileChosenList" style="color:var(--text-dim);font-size:12px;margin:6px 0;"></div>
      <button type="button" class="btn" id="m_fileUploadBtn" disabled>Upload</button>
      <span id="mediaUploadStatus" style="color:var(--text-dim);font-size:12px;"></span>
    </form>
    <p style="color:var(--text-dim);font-size:12px;margin:12px 0 4px;">— or choose from the Media Library —</p>
    <button type="button" class="btn secondary" id="openLibraryPickerBtn">📁 Choose from Media Library</button>
    <div id="mediaLibraryPicker" style="display:none;margin-top:10px;"></div>
    <p style="color:var(--text-dim);font-size:12px;margin:14px 0 4px;">— or paste ${allowVideo ? "image/video" : "image"} link(s) instead —</p>
    <form id="mediaForm">
      <label>${allowVideo ? "Image/video" : "Image"} URL(s) <span class="form-hint">(paste one, or several separated by commas${allowVideo ? " — a .mp4/.webm/.mov link is saved as a video" : ""})</span></label><input id="m_url" placeholder="https://pub-xxxx.r2.dev/one.jpg, https://pub-xxxx.r2.dev/two.jpg">
      <label>Caption ${kind === "portfolio" ? "(shown under the photo)" : "(optional)"} <span class="form-hint">${kind === "portfolio" ? "" : "— applied to every URL above if you pasted more than one"}</span></label><input id="m_alt">
      <div class="modal-actions">
        <button type="button" class="btn secondary" onclick="closeModal()">Close</button>
        <button type="submit" class="btn">Add by URL</button>
      </div>
    </form>
  `);
  let chosenFiles = [];
  const fileInput = document.getElementById("m_file");
  const fileUploadBtn = document.getElementById("m_fileUploadBtn");
  const fileChosenList = document.getElementById("m_fileChosenList");

  fileInput.addEventListener("change", (e) => {
    const formMsg = document.getElementById("formMsg");
    formMsg.innerHTML = "";
    let files = Array.from(e.target.files || []);
    const remaining = remainingSlots();
    if (remaining <= 0) {
      formMsg.innerHTML = `<div class="msg error">This already has the maximum of ${MAX_MEDIA_PER_ENTITY} ${ITEMS} - remove one before adding more.</div>`;
      e.target.value = "";
      files = [];
    } else if (files.length > remaining) {
      formMsg.innerHTML = `<div class="msg error">You picked ${files.length} files, but only ${remaining} slot${remaining === 1 ? "" : "s"} left (max ${MAX_MEDIA_PER_ENTITY} total) - only the first ${remaining} will be uploaded.</div>`;
      files = files.slice(0, remaining);
    }
    // Caught here rather than after a 25MB round trip that the backend would only
    // then reject - the file size is known the moment it is picked.
    const oversized = files.filter(f => f.type.startsWith("video/") && f.size > MAX_VIDEO_UPLOAD_BYTES);
    if (oversized.length) {
      formMsg.innerHTML = `<div class="msg error">${oversized.map(f => esc(f.name)).join(", ")} — video${oversized.length === 1 ? " is" : "s are"} over the ${MAX_VIDEO_UPLOAD_BYTES / (1024 * 1024)}MB limit. Trim or re-export shorter/smaller and try again.</div>`;
      files = files.filter(f => !oversized.includes(f));
    }
    chosenFiles = files;
    fileChosenList.textContent = files.length
      ? `${files.length} file${files.length === 1 ? "" : "s"} chosen: ${files.map(f => f.name).join(", ")}`
      : "";
    fileUploadBtn.disabled = files.length === 0;
  });

  fileUploadBtn.addEventListener("click", async () => {
    const files = chosenFiles;
    if (!files.length) return;
    const status = document.getElementById("mediaUploadStatus");
    const formMsg = document.getElementById("formMsg");
    formMsg.innerHTML = "";
    fileUploadBtn.disabled = true;

    const listEl = document.getElementById("mediaList");
    const emptyState = listEl.querySelector(":scope > div:only-child");
    if (files.length && emptyState && !emptyState.classList.contains("media-item")) emptyState.remove();

    const failures = [];
    // Sequential, not Promise.all - each is its own real network upload (not
    // just a fast DB write like the multi-select library picker below), so
    // running them in parallel would fight over the same connection/bandwidth
    // with no way to show a meaningful "N of {MAX_MEDIA_PER_ENTITY}" progress for any single one.
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const label = files.length > 1 ? `Uploading ${i + 1} of ${files.length}: ${file.name}` : `Uploading ${file.name}`;
      status.textContent = `${label}… 0%`;
      try {
        const fd = new FormData();
        fd.append("file", file);
        // Files this photo under media_library/<page>/<category>/... in R2 instead of
        // one flat folder, when we know which product/category this upload is for -
        // organization only, the app's own queries never read the key path (see
        // upload_media_library_asset()'s docstring in services/storage.py).
        if (pageSlug) fd.append("page_slug", pageSlug);
        if (categorySlug) fd.append("category_slug", categorySlug);
        const uploaded = await Api.uploadMediaWithProgress(fd, (pct) => {
          status.textContent = `${label}… ${pct}%`;
        });
        // media_type comes back from the upload endpoint, which decided it from the
        // file's actual magic bytes - trusted over anything guessed from the name.
        const mediaType = uploaded.media_type || mediaTypeForUrl(uploaded.url);
        const added = await addFn({ url: uploaded.url, alt: uploaded.alt || "", kind, media_type: mediaType, sort: media.length + i });
        // Append the new photo straight into the grid instead of closing the
        // modal after every single file - previously the admin had to reopen
        // this same "Photos" dialog from scratch for each additional photo.
        const item = document.createElement("div");
        item.className = `media-item${mediaType === "video" ? " is-video" : ""}`;
        item.draggable = true;
        item.dataset.id = (added && added.id) || "";
        item.innerHTML = `
          ${allowVideo ? `<span class="media-photo-no"></span>` : ""}
          ${mediaThumbMarkup({ url: uploaded.url, media_type: mediaType })}
          <button title="Remove" onclick="removeMedia('${(added && added.id) || ""}', this)">×</button>
        `;
        listEl.appendChild(item);
        media.push({ id: added && added.id, url: uploaded.url, alt: uploaded.alt || "", media_type: mediaType });
        refreshMainBadge(listEl);
        refreshPhotoNumbers(listEl);
        updateCountLabel();
      } catch (err) {
        failures.push(`${file.name}: ${err.message}`);
      }
    }

    status.textContent = "";
    fileInput.value = "";
    chosenFiles = [];
    fileChosenList.textContent = "";
    fileUploadBtn.disabled = true;
    if (failures.length) {
      formMsg.innerHTML = `<div class="msg error">${failures.length} of ${files.length} file(s) failed to upload:<br>${failures.map(esc).join("<br>")}</div>`;
    }
    // Left open on purpose (unlike the single-photo flow before) so the admin
    // can see every photo they just added and keep going - afterChange()
    // still refreshes the underlying product/category list in the background.
    afterChange();
  });
  document.getElementById("mediaForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formMsg = document.getElementById("formMsg");
    formMsg.innerHTML = "";
    let urls = document.getElementById("m_url").value.split(",").map(u => u.trim()).filter(Boolean);
    if (!urls.length) {
      formMsg.innerHTML = `<div class="msg error">Enter a${allowVideo ? "n image or video" : "n image"} URL, or use "Choose Files" / the Media Library above instead.</div>`;
      return;
    }
    if (!allowVideo && urls.some(u => mediaTypeForUrl(u) === "video")) {
      formMsg.innerHTML = `<div class="msg error">Videos can only be added to a product's photos, not a category portfolio.</div>`;
      return;
    }
    const remaining = remainingSlots();
    if (remaining <= 0) {
      formMsg.innerHTML = `<div class="msg error">This already has the maximum of ${MAX_MEDIA_PER_ENTITY} ${ITEMS} - remove one before adding more.</div>`;
      return;
    }
    if (urls.length > remaining) {
      formMsg.innerHTML = `<div class="msg error">You pasted ${urls.length} links, but only ${remaining} slot${remaining === 1 ? "" : "s"} left (max ${MAX_MEDIA_PER_ENTITY} total) - only the first ${remaining} will be added.</div>`;
      urls = urls.slice(0, remaining);
    }
    const alt = document.getElementById("m_alt").value.trim();
    const btn = e.target.querySelector('button[type="submit"]');
    const failures = [];
    await withBusy(btn, "Adding…", async () => {
      for (let i = 0; i < urls.length; i++) {
        try {
          // A pasted link never went through the upload endpoint, so the extension
          // is all there is to go on - hence the .mp4/.webm/.mov hint in the label.
          await addFn({ url: urls[i], alt, kind, media_type: mediaTypeForUrl(urls[i]), sort: media.length + i });
        } catch (err) {
          failures.push(`${urls[i]}: ${err.message}`);
        }
      }
    });
    if (failures.length) {
      formMsg.innerHTML = `<div class="msg error">${failures.length} of ${urls.length} link(s) failed to add:<br>${failures.map(esc).join("<br>")}</div>`;
      afterChange();
      return;
    }
    closeModal();
    afterChange();
  });

  initMediaDragReorder(document.getElementById("mediaList"));
  refreshPhotoNumbers(document.getElementById("mediaList"));

  // ---- Choose from Media Library ----
  let libraryLoaded = false;
  document.getElementById("openLibraryPickerBtn").addEventListener("click", async () => {
    const picker = document.getElementById("mediaLibraryPicker");
    const opening = picker.style.display === "none";
    // "" not "block": the stylesheet lays this out as a flex column so only the
    // tile grid scrolls (see #mediaLibraryPicker in admin.css), and an inline
    // display would override that.
    picker.style.display = opening ? "" : "none";
    if (opening && !libraryLoaded) {
      libraryLoaded = true;
      await loadMediaLibraryPicker(picker, kind, media, addFn, afterChange, { categoryId, pageId, MAX_MEDIA_PER_ENTITY, remainingSlots });
    }
  });
}

// Scope tabs the picker offers, in order. "category"/"page" only show up when this
// modal actually has that context (a product/category's own picker) - the standalone
// Media Library page still gets the plain "all images" list it always has, since it
// has no product/category to scope to. Defaulting to the narrowest available scope
// is what actually fixes the picker fetching the whole site's media (up to 2000 rows)
// on every open - most of the time the image you want was already used right here.
function _mediaPickerScopes({ categoryId, pageId }) {
  const scopes = [];
  if (categoryId) scopes.push({ key: "category", label: "This category" });
  if (pageId) scopes.push({ key: "page", label: "This page" });
  scopes.push({ key: "all", label: "All images" });
  return scopes;
}

async function loadMediaLibraryPicker(picker, kind, media, addFn, afterChange, { categoryId, pageId, MAX_MEDIA_PER_ENTITY, remainingSlots } = {}) {
  const scopes = _mediaPickerScopes({ categoryId, pageId });
  let activeScope = scopes[0].key;
  const cache = {}; // scope key -> fetched items, so switching tabs back and forth doesn't re-fetch

  // A category portfolio can't take a video (the API rejects it), so don't offer
  // one here - the product picker shows the full library, videos included.
  const allowVideo = kind === "package";

  const fetchScope = async (scopeKey) => {
    if (cache[scopeKey]) return cache[scopeKey];
    const args = scopeKey === "category" ? { categoryId } : scopeKey === "page" ? { pageId } : {};
    const all = await Api.mediaLibrary(args);
    const items = allowVideo ? all : all.filter(m => !isVideoMedia(m));
    cache[scopeKey] = items;
    return items;
  };

  const renderTabs = () => scopes.length > 1 ? `
    <div class="media-picker-tabs" style="display:flex;gap:6px;margin-bottom:8px;">
      ${scopes.map(s => `<button type="button" class="btn secondary media-picker-tab${s.key === activeScope ? " active" : ""}" data-scope="${s.key}" style="padding:4px 10px;font-size:12px;${s.key === activeScope ? "font-weight:600;" : ""}">${esc(s.label)}</button>`).join("")}
    </div>` : "";

  const renderScope = async (scopeKey) => {
    activeScope = scopeKey;
    picker.innerHTML = `${renderTabs()}<div style="color:var(--text-dim);font-size:12px;">Loading library…</div>`;
    let items;
    try {
      items = await fetchScope(scopeKey);
    } catch (err) {
      picker.innerHTML = `${renderTabs()}<div class="msg error">${esc(err.message)}</div>`;
      bindTabs();
      return;
    }
    if (!items.length) {
      const emptyMsg = scopeKey === "all"
        ? "No images in the library yet — upload one above, or add one from the Media Library page."
        : "No images used here yet — try a wider scope above, or upload one.";
      picker.innerHTML = `${renderTabs()}<div style="color:var(--text-dim);font-size:12px;">${emptyMsg}</div>`;
      bindTabs();
      return;
    }
    // Selection is scoped to this tab's item pool - switching "This category" /
    // "This page" / "All images" starts a fresh selection rather than trying to
    // carry ids across pools that may not even overlap.
    const selectedIds = new Set();

    picker.innerHTML = `
      ${renderTabs()}
      <input type="text" id="libraryPickerSearch" placeholder="Search by caption…" style="margin-bottom:8px;">
      <div class="media-picker-grid" id="libraryPickerGrid"></div>
      <div id="libraryPickerActions" style="display:flex;align-items:center;gap:10px;">
        <span id="libraryPickerCount" style="font-size:12px;color:var(--text-dim);">0 selected</span>
        <button type="button" class="btn" id="libraryPickerAddBtn" disabled>Add Selected</button>
      </div>
    `;
    bindTabs();

    const addBtn = document.getElementById("libraryPickerAddBtn");
    const countEl = document.getElementById("libraryPickerCount");
    const updateActionBar = () => {
      countEl.textContent = `${selectedIds.size} selected`;
      addBtn.disabled = selectedIds.size === 0;
      addBtn.textContent = selectedIds.size > 1 ? `Add ${selectedIds.size} Items` : "Add Selected";
    };

    const renderGrid = (filter) => {
      const q = (filter || "").trim().toLowerCase();
      const filtered = q ? items.filter(m => (m.alt || "").toLowerCase().includes(q)) : items;
      const grid = document.getElementById("libraryPickerGrid");
      grid.innerHTML = filtered.map(m => `
        <button type="button" class="media-picker-tile${selectedIds.has(m.id) ? " selected" : ""}" title="${esc(m.alt || (isVideoMedia(m) ? "Use this video" : "Use this photo"))}" data-id="${m.id}" style="position:relative;${selectedIds.has(m.id) ? "outline:3px solid var(--accent,#c0392b);outline-offset:-3px;" : ""}">
          ${isVideoMedia(m)
            ? `<video src="${esc(mediaUrl(m.url))}" muted playsinline preload="metadata"></video><span class="media-video-badge" title="Video">▶</span>`
            : `<img src="${esc(mediaUrl(m.thumb_url || m.url))}" loading="lazy" onerror="this.src='${esc(mediaUrl(m.url))}'">`}
          ${selectedIds.has(m.id) ? `<span class="media-picker-check" style="position:absolute;top:4px;right:4px;background:var(--accent,#c0392b);color:#fff;border-radius:50%;width:20px;height:20px;font-size:13px;line-height:20px;">✓</span>` : ""}
        </button>
      `).join("") || `<div style="color:var(--text-dim);font-size:12px;">No matches.</div>`;
      grid.querySelectorAll(".media-picker-tile").forEach(tile => {
        // A click toggles selection instead of adding immediately - lets an admin
        // pick several photos (e.g. a product's whole carousel) in one pass
        // instead of reopening the picker per image.
        tile.addEventListener("click", () => {
          const id = tile.dataset.id;
          if (selectedIds.has(id)) {
            selectedIds.delete(id);
          } else {
            if (selectedIds.size >= remainingSlots()) {
              document.getElementById("formMsg").innerHTML =
                `<div class="msg error">Only ${remainingSlots()} slot${remainingSlots() === 1 ? "" : "s"} left (max ${MAX_MEDIA_PER_ENTITY} total) - deselect one first.</div>`;
              return;
            }
            document.getElementById("formMsg").innerHTML = "";
            selectedIds.add(id);
          }
          renderGrid(document.getElementById("libraryPickerSearch").value);
          updateActionBar();
        });
      });
    };
    renderGrid("");
    updateActionBar();
    document.getElementById("libraryPickerSearch").addEventListener("input", (e) => renderGrid(e.target.value));

    addBtn.addEventListener("click", async () => {
      let chosen = items.filter(m => selectedIds.has(m.id));
      if (!chosen.length) return;
      chosen = chosen.slice(0, remainingSlots());
      addBtn.disabled = true;
      addBtn.textContent = "Adding…";
      const failures = [];
      // Sequential, not Promise.all - each add is its own POST that the admin API
      // commits independently, and sort must increment in the order shown so a
      // multi-select keeps a predictable carousel order instead of a race.
      for (let i = 0; i < chosen.length; i++) {
        try {
          await addFn({ url: chosen[i].url, alt: chosen[i].alt || "", kind,
                        media_type: isVideoMedia(chosen[i]) ? "video" : "image", sort: media.length + i });
        } catch (err) {
          failures.push(chosen[i]);
        }
      }
      if (failures.length) {
        addBtn.disabled = false;
        addBtn.textContent = "Add Selected";
        document.getElementById("formMsg").innerHTML =
          `<div class="msg error">${failures.length} of ${chosen.length} photo(s) failed to add - try again.</div>`;
        // Drop the ones that succeeded from the selection, leave the failed ones
        // selected so the admin can just click "Add Selected" again to retry.
        const failedIds = new Set(failures.map(f => f.id));
        [...selectedIds].forEach(id => { if (!failedIds.has(id)) selectedIds.delete(id); });
        renderGrid(document.getElementById("libraryPickerSearch").value);
        updateActionBar();
        afterChange();
        return;
      }
      closeModal();
      afterChange();
    });
  };

  function bindTabs() {
    picker.querySelectorAll(".media-picker-tab").forEach(btn => {
      btn.addEventListener("click", () => { if (btn.dataset.scope !== activeScope) renderScope(btn.dataset.scope); });
    });
  }

  await renderScope(activeScope);
}

async function removeMedia(id, btnEl) {
  if (!confirm("Delete this photo?")) return;
  try {
    await withBusy(btnEl, "×", () => Api.deleteMedia(id));
    const listEl = btnEl.closest(".media-list");
    btnEl.closest(".media-item").remove();
    if (listEl) { refreshMainBadge(listEl); refreshPhotoNumbers(listEl); }
  } catch (err) { alert(err.message); }
}

// Keeps the "Main" badge on whichever photo is currently first in the grid -
// called after every append/remove/drag-reorder since any of those can change
// which photo is first.
function refreshMainBadge(listEl) {
  listEl.querySelectorAll(".media-item").forEach((el, i) => el.classList.toggle("is-main", i === 0));
}

// Stamps each tile with the number an option's "@N" suffix refers to (see the
// dropdown field's hint). Videos are skipped rather than numbered, because the
// storefront gallery shows every photo before any video - so "@2" has to mean
// the 2nd photo however the two are interleaved in this grid. Re-run after every
// append/remove/drag-reorder, or the numbers describe the previous order.
function refreshPhotoNumbers(listEl) {
  if (!listEl) return;
  let n = 0;
  listEl.querySelectorAll(".media-item").forEach((el) => {
    const badge = el.querySelector(".media-photo-no");
    if (!badge) return;
    if (el.classList.contains("is-video")) {
      badge.textContent = "";
      badge.style.display = "none";
      return;
    }
    badge.textContent = String(++n);
    badge.style.display = "";
  });
}

// Native HTML5 drag-and-drop row reordering for a <tbody> - the Categories
// and Products & Packages tables' "Sort" column used to mean typing a number
// and guessing; dragging the ⠿ handle up/down is the same "move on drop, not
// dragover" mechanics as initMediaDragReorder below (relocating the dragged
// node mid-drag can make a browser treat the source as detached and cancel
// the gesture), just keyed on row top/bottom instead of tile left/right.
// Calls onReorder(ids) with every row's data-id, top to bottom, once a drop
// actually moves something - the caller persists it and repaints from the
// server's response, so this never needs to touch the underlying data array.
function initTableRowDragReorder(tbodyEl, onReorder) {
  if (!tbodyEl) return;
  let draggingEl = null;

  tbodyEl.addEventListener("dragstart", (e) => {
    const row = e.target.closest("tr[draggable='true']");
    if (!row) return;
    draggingEl = row;
    row.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", row.dataset.id || "");
  });

  tbodyEl.addEventListener("dragover", (e) => {
    if (!draggingEl) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  });

  tbodyEl.addEventListener("drop", (e) => {
    e.preventDefault();
    if (!draggingEl) return;
    const target = e.target.closest("tr");
    if (target && target !== draggingEl) {
      const box = target.getBoundingClientRect();
      const after = e.clientY > box.top + box.height / 2;
      if (after) target.after(draggingEl); else target.before(draggingEl);
    }
  });

  tbodyEl.addEventListener("dragend", () => {
    if (!draggingEl) return;
    draggingEl.classList.remove("dragging");
    draggingEl = null;
    const ids = Array.from(tbodyEl.querySelectorAll("tr[data-id]")).map(row => row.dataset.id);
    onReorder(ids);
  });
}

// Native HTML5 drag-and-drop reordering for a Photos modal's thumbnail grid.
// Uses event delegation on the container so it keeps working for photos
// appended later in the same modal session (upload / media-library picks),
// not just the ones present when the modal first opened. On drop, persists
// the new order via Api.reorderMedia (sort = index) and keeps the closure's
// `media` array in sync so subsequently-added photos get the right sort index.
//
// The actual DOM move happens once, on "drop" - not repeatedly during
// "dragover" - because relocating the dragged node mid-drag (via
// insertBefore/after) makes some browsers treat the source node as detached
// and cancel the gesture outright, so nothing visibly moves. "dragover" only
// tracks which tile you're currently over and highlights it; "drop" (which
// also needs its own preventDefault - without one, dropping just does the
// browser's default no-op instead of triggering our reorder) commits it.
function initMediaDragReorder(listEl) {
  if (!listEl) return;
  let draggingEl = null;
  let overEl = null;

  const clearOver = () => {
    if (overEl) overEl.classList.remove("drag-over");
    overEl = null;
  };

  listEl.addEventListener("dragstart", (e) => {
    const item = e.target.closest(".media-item");
    if (!item) return;
    draggingEl = item;
    item.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", item.dataset.id || "");
  });

  listEl.addEventListener("dragover", (e) => {
    if (!draggingEl) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const target = e.target.closest(".media-item");
    if (!target || target === draggingEl) return;
    if (target !== overEl) {
      clearOver();
      overEl = target;
      overEl.classList.add("drag-over");
    }
  });

  listEl.addEventListener("drop", (e) => {
    e.preventDefault();
    if (!draggingEl) return;
    const target = e.target.closest(".media-item");
    clearOver();
    if (target && target !== draggingEl) {
      const box = target.getBoundingClientRect();
      const after = e.clientX > box.left + box.width / 2;
      if (after) target.after(draggingEl); else target.before(draggingEl);
    }
  });

  listEl.addEventListener("dragend", async () => {
    if (!draggingEl) return;
    draggingEl.classList.remove("dragging");
    draggingEl = null;
    clearOver();
    refreshMainBadge(listEl);
    refreshPhotoNumbers(listEl);
    const ids = Array.from(listEl.querySelectorAll(".media-item")).map(el => el.dataset.id).filter(Boolean);
    if (!ids.length) return;
    try {
      await Api.reorderMedia(ids);
    } catch (err) {
      document.getElementById("formMsg").innerHTML = `<div class="msg error">Could not save the new photo order: ${esc(err.message)}</div>`;
    }
  });
}

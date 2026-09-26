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
  cardsEl.innerHTML =
    card(s.pages, "Site Pages") +
    card(s.categories, "Categories") +
    card(s.products, "Products / Packages") +
    card(s.coupons, "Active Coupons") +
    card(s.bookings_pending, "Pending Bookings") +
    card(s.bookings_total, "Total Bookings") +
    card(s.orders_pending, "Pending Orders") +
    card(s.orders_total, "Total Orders") +
    card(fmtINR(s.revenue), "Revenue");
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

  view.innerHTML = `
    <header class="page-head">
      <h1>Categories</h1>
      <button class="btn" id="addCatBtn">+ Add Category</button>
    </header>
    <div class="toolbar">
      <select id="pageSelect">${pages.map(p => `<option value="${esc(p.slug)}" ${p.slug === CURRENT_PAGE_SLUG ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select>
    </div>
    <div id="catTableWrap"></div>
  `;
  document.getElementById("pageSelect").addEventListener("change", (e) => { CURRENT_PAGE_SLUG = e.target.value; loadCatTable(); });
  document.getElementById("addCatBtn").addEventListener("click", () => openCategoryForm());
  await loadCatTable();
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
      <thead><tr><th></th><th>Name</th><th>Slug</th><th>Group</th><th>In Hero</th><th>Status</th><th>Sort</th><th></th></tr></thead>
      <tbody>
        ${cats.map(c => `
          <tr>
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
              <button class="btn secondary" onclick="location.hash='#/arrange?cat=${c.id}'">Arrange</button>
              <button class="btn danger" onclick="removeCategory('${c.id}', this)">Delete</button>
            </td>
          </tr>`).join("")}
      </tbody>
    </table>
  `;
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
      <thead><tr><th>Tier</th><th>Title</th><th>Price</th><th>Photos</th><th>Status</th><th>Sort</th><th></th></tr></thead>
      <tbody>
        ${products.map(p => `
          <tr>
            <td>${esc(p.tier || "—")}</td>
            <td>${esc(p.title)}</td>
            <td>${fmtINR(p.price)}</td>
            <td>${p.media.length}</td>
            <td><span class="badge ${p.is_active ? "on" : "off"}">${p.is_active ? "Active" : "Hidden"}</span></td>
            <td>${p.sort}</td>
            <td class="actions">
              <button class="btn secondary" onclick="openProductForm('${p.id}')">Edit</button>
              <button class="btn secondary" onclick="openProductMedia('${p.id}')">Photos</button>
              <button class="btn danger" onclick="removeProduct('${p.id}', this)">Delete</button>
            </td>
          </tr>`).join("")}
      </tbody>
    </table>
  `;
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

function openProductForm(id) {
  const p = id ? window._PRODUCTS_CACHE.find(x => x.id === id) : null;
  const cat = window._ALL_CATS.find(c => c.id === CURRENT_CATEGORY_ID);
  // Gifts/Corporate/Studio are entirely physical goods (ship to the customer,
  // track stock) - only Photography is booking-based. Defaulting a brand-new
  // product's Type to match its page means the Stock/Delivery days/Address-
  // change fields just below are visible right away instead of the admin
  // having to know to flip this dropdown first.
  const defaultType = cat.pageSlug === "photography" ? "service" : "product";
  openModal(`
    <h2>${p ? "Edit" : "Add"} Product / Package</h2>
    <p style="color:var(--text-dim);font-size:12px;margin-top:0;">Category: ${esc(cat.pageName)} — ${esc(cat.name)}</p>
    <div id="formMsg"></div>
    <form id="prodForm">
      <div class="form-section-title">Basic info</div>
      <div class="two-col">
        <div><label>Tier (Standard / Premium / Platinum, or blank)</label><input id="f_tier" value="${esc(p?.tier || "")}"></div>
        <div><label>Type</label>
          <select id="f_type">
            <option value="service" ${(p ? p.type === "service" : defaultType === "service") ? "selected" : ""}>Service (booking)</option>
            <option value="product" ${(p ? p.type === "product" : defaultType === "product") ? "selected" : ""}>Product (physical, ships to customer)</option>
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

      <div class="form-section-title">Customer questions</div>
      <label style="margin-top:0;">Extra questions on this product's order form <span class="form-hint">— e.g. upload a photo, pick from a dropdown, free text. Tick "Required" to block the customer from adding it to cart until they answer. This is the only place to set that up — it works the same on every page (Studio, Corporate, Gifts, Photography).</span></label>
      <div id="inputFieldsRows" class="field-builder"></div>
      <button type="button" class="btn secondary add-field-btn" id="addFieldBtn">+ Add Field</button>

      ${cat.pageSlug === "photography" ? `
      <div class="form-section-title">Events &amp; team details</div>
      <label style="margin-top:0;">Table shown on the product page <span class="form-hint">— leave empty to auto-generate from the features above</span></label>
      <div id="eventsRows"></div>
      <button type="button" class="btn secondary" id="addEventRowBtn" style="margin-top:6px;">+ Add Row</button>
      ` : ""}

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
      const optionsText = priced
        ? (row.options || []).map(o => `${o} = ${row.option_prices[o] ?? ""}`).join("\n")
        : (row?.options || []).join("\n");
      return `
        <div class="field-type-panel fp-dropdown">
          <label class="inline" style="font-weight:400;margin-bottom:6px;"><input type="checkbox" class="fr_priced" ${priced ? "checked" : ""}> This dropdown sets the price (e.g. quantity or size options each at their own price)</label>
          <label class="fr_options_label">Options (one per line)</label>
          <textarea class="fr_options" rows="3" placeholder="${priced ? "8 Photos = 130&#10;16 Photos = 200&#10;32 Photos = 250" : "4x6&#10;5x7&#10;Passport Size"}">${esc(optionsText)}</textarea>
          <label class="inline" style="font-weight:400;"><input type="checkbox" class="fr_multi_select" ${row?.multi_select ? "checked" : ""} ${priced ? "disabled" : ""}> Allow selecting multiple options</label>
        </div>`;
    }
    return `
      <div class="field-type-panel fp-text">
        <label>Placeholder (optional)</label>
        <input class="fr_placeholder" value="${esc(row?.placeholder || "")}" placeholder="e.g. Any special instructions?">
      </div>`;
  }

  function refreshFieldTypeUI(rowEl, row) {
    rowEl.querySelectorAll(".type-checkbox").forEach(chip => {
      chip.classList.toggle("active", chip.dataset.type === row.type);
      chip.querySelector("input").checked = chip.dataset.type === row.type;
    });
    rowEl.querySelector(".field-type-panel-wrap").innerHTML = fieldTypePanelHTML(row, row.type);
    wireUploadModeToggle(rowEl);
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
    if (!priced || !optionsBox) return;
    const sync = () => {
      const on = priced.checked;
      optionsBox.placeholder = on ? "8 Photos = 130\n16 Photos = 200\n32 Photos = 250" : "4x6\n5x7\nPassport Size";
      if (label) label.textContent = on ? "Options — one per line, as \"Label = Price\"" : "Options (one per line)";
      if (multiSelect) { multiSelect.disabled = on; if (on) multiSelect.checked = false; }
    };
    priced.addEventListener("change", sync);
    sync();
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
      option_prices: field?.option_prices || null,
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
      if (type === "upload") {
        field.multiple = !!row.querySelector(".fr_upload_multiple")?.checked;
        field.max_files = field.multiple ? Math.max(2, Math.min(10, parseInt(row.querySelector(".fr_max_files")?.value || "3", 10))) : 1;
      } else if (type === "dropdown") {
        const lines = (row.querySelector(".fr_options")?.value || "").split("\n").map(s => s.trim()).filter(Boolean);
        const priced = !!row.querySelector(".fr_priced")?.checked;
        if (priced) {
          const option_prices = {};
          lines.forEach(line => {
            const eq = line.lastIndexOf("=");
            const opt = (eq === -1 ? line : line.slice(0, eq)).trim();
            const price = eq === -1 ? NaN : Number(line.slice(eq + 1).trim());
            if (!opt || Number.isNaN(price)) { errors.push(`Dropdown field "${label}": "${line}" should look like "Label = Price".`); return; }
            field.options.push(opt);
            option_prices[opt] = price;
          });
          field.option_prices = option_prices;
          field.multi_select = false;
        } else {
          field.options = lines;
          field.multi_select = !!row.querySelector(".fr_multi_select")?.checked;
        }
        if (!field.options.length) errors.push(`Dropdown field "${label}" needs at least one option.`);
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
    const data = {
      category_id: CURRENT_CATEGORY_ID,
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
      loadProdTable();
    } catch (err) {
      document.getElementById("formMsg").innerHTML = `<div class="msg error">${esc(err.message)}</div>`;
    }
  });
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
    title: `Photos — ${esc(p.title)}`,
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

function renderMediaModal({ title, media, kind = "portfolio", addFn, afterChange, categoryId, pageId, pageSlug, categorySlug }) {
  // MAX_MEDIA_PER_ENTITY must match backend/app/routers/admin.py's
  // MAX_MEDIA_PER_ENTITY - this is only a UX nicety (blocking/trimming
  // selections before they hit the network); the backend is what actually
  // enforces the cap, since this modal has three independent add paths
  // (upload, library picker, add-by-URL) that all need to agree on the count.
  const MAX_MEDIA_PER_ENTITY = 5;
  const mediaCountNow = () => document.getElementById("mediaList").querySelectorAll(".media-item").length;
  const remainingSlots = () => Math.max(0, MAX_MEDIA_PER_ENTITY - mediaCountNow());
  const updateCountLabel = () => {
    const label = document.getElementById("mediaCountLabel");
    if (label) label.textContent = `${mediaCountNow()} of ${MAX_MEDIA_PER_ENTITY} photos used`;
  };

  openModal(`
    <h2>${title}</h2>
    <div id="formMsg"></div>
    <p id="mediaCountLabel" style="color:var(--text-dim);font-size:12px;margin:0 0 6px;">${media.length} of ${MAX_MEDIA_PER_ENTITY} photos used</p>
    ${media.length > 1 ? `<p style="color:var(--text-dim);font-size:12px;margin:0 0 6px;">Drag photos to reorder — the first one is used as the main/cover image.</p>` : ""}
    <div class="media-list" id="mediaList">
      ${media.map((m, i) => `
        <div class="media-item${i === 0 ? " is-main" : ""}" draggable="true" data-id="${esc(m.id)}">
          <img src="${esc(mediaUrl(m.url))}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2290%22 height=%2290%22><rect width=%2290%22 height=%2290%22 fill=%22%23e8e0d8%22/></svg>'">
          <button title="Remove" onclick="removeMedia('${m.id}', this)">×</button>
          ${m.alt ? `<div class="cap">${esc(m.alt)}</div>` : ""}
        </div>`).join("") || `<div style="color:var(--text-dim);font-size:13px;">No photos yet.</div>`}
    </div>
    <form id="mediaUploadForm" style="margin-top:16px;">
      <label>Upload photos <span class="form-hint">(up to 5 total per product/category — choose your files, then click Upload)</span></label>
      <input type="file" id="m_file" accept="image/*" multiple>
      <div id="m_fileChosenList" style="color:var(--text-dim);font-size:12px;margin:6px 0;"></div>
      <button type="button" class="btn" id="m_fileUploadBtn" disabled>Upload</button>
      <span id="mediaUploadStatus" style="color:var(--text-dim);font-size:12px;"></span>
    </form>
    <p style="color:var(--text-dim);font-size:12px;margin:12px 0 4px;">— or choose from the Media Library —</p>
    <button type="button" class="btn secondary" id="openLibraryPickerBtn">📁 Choose from Media Library</button>
    <div id="mediaLibraryPicker" style="display:none;margin-top:10px;"></div>
    <p style="color:var(--text-dim);font-size:12px;margin:14px 0 4px;">— or paste image link(s) instead —</p>
    <form id="mediaForm">
      <label>Image URL(s) <span class="form-hint">(paste one, or several separated by commas)</span></label><input id="m_url" placeholder="https://pub-xxxx.r2.dev/one.jpg, https://pub-xxxx.r2.dev/two.jpg">
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
      formMsg.innerHTML = `<div class="msg error">This already has the maximum of ${MAX_MEDIA_PER_ENTITY} photos - remove one before adding more.</div>`;
      e.target.value = "";
      files = [];
    } else if (files.length > remaining) {
      formMsg.innerHTML = `<div class="msg error">You picked ${files.length} photos, but only ${remaining} slot${remaining === 1 ? "" : "s"} left (max ${MAX_MEDIA_PER_ENTITY} total) - only the first ${remaining} will be uploaded.</div>`;
      files = files.slice(0, remaining);
    }
    chosenFiles = files;
    fileChosenList.textContent = files.length
      ? `${files.length} photo${files.length === 1 ? "" : "s"} chosen: ${files.map(f => f.name).join(", ")}`
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
    // with no way to show a meaningful "N of 5" progress for any single one.
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
        const added = await addFn({ url: uploaded.url, alt: uploaded.alt || "", kind, sort: media.length + i });
        // Append the new photo straight into the grid instead of closing the
        // modal after every single file - previously the admin had to reopen
        // this same "Photos" dialog from scratch for each additional photo.
        const item = document.createElement("div");
        item.className = "media-item";
        item.draggable = true;
        item.dataset.id = (added && added.id) || "";
        item.innerHTML = `
          <img src="${esc(mediaUrl(uploaded.url))}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2290%22 height=%2290%22><rect width=%2290%22 height=%2290%22 fill=%22%23e8e0d8%22/></svg>'">
          <button title="Remove" onclick="removeMedia('${(added && added.id) || ""}', this)">×</button>
        `;
        listEl.appendChild(item);
        media.push({ id: added && added.id, url: uploaded.url, alt: uploaded.alt || "" });
        refreshMainBadge(listEl);
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
      formMsg.innerHTML = `<div class="msg error">${failures.length} of ${files.length} photo(s) failed to upload:<br>${failures.map(esc).join("<br>")}</div>`;
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
      formMsg.innerHTML = `<div class="msg error">Enter an image URL, or use "Choose Files" / the Media Library above instead.</div>`;
      return;
    }
    const remaining = remainingSlots();
    if (remaining <= 0) {
      formMsg.innerHTML = `<div class="msg error">This already has the maximum of ${MAX_MEDIA_PER_ENTITY} photos - remove one before adding more.</div>`;
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
          await addFn({ url: urls[i], alt, kind, sort: media.length + i });
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

  // ---- Choose from Media Library ----
  let libraryLoaded = false;
  document.getElementById("openLibraryPickerBtn").addEventListener("click", async () => {
    const picker = document.getElementById("mediaLibraryPicker");
    const opening = picker.style.display === "none";
    picker.style.display = opening ? "block" : "none";
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

  const fetchScope = async (scopeKey) => {
    if (cache[scopeKey]) return cache[scopeKey];
    const args = scopeKey === "category" ? { categoryId } : scopeKey === "page" ? { pageId } : {};
    const items = await Api.mediaLibrary(args);
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
      <div id="libraryPickerActions" style="display:flex;align-items:center;gap:10px;margin-top:10px;">
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
      addBtn.textContent = selectedIds.size > 1 ? `Add ${selectedIds.size} Photos` : "Add Selected";
    };

    const renderGrid = (filter) => {
      const q = (filter || "").trim().toLowerCase();
      const filtered = q ? items.filter(m => (m.alt || "").toLowerCase().includes(q)) : items;
      const grid = document.getElementById("libraryPickerGrid");
      grid.innerHTML = filtered.map(m => `
        <button type="button" class="media-picker-tile${selectedIds.has(m.id) ? " selected" : ""}" title="${esc(m.alt || "Use this photo")}" data-id="${m.id}" style="position:relative;${selectedIds.has(m.id) ? "outline:3px solid var(--accent,#c0392b);outline-offset:-3px;" : ""}">
          <img src="${esc(mediaUrl(m.thumb_url || m.url))}" loading="lazy" onerror="this.src='${esc(mediaUrl(m.url))}'">
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
          await addFn({ url: chosen[i].url, alt: chosen[i].alt || "", kind, sort: media.length + i });
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
    if (listEl) refreshMainBadge(listEl);
  } catch (err) { alert(err.message); }
}

// Keeps the "Main" badge on whichever photo is currently first in the grid -
// called after every append/remove/drag-reorder since any of those can change
// which photo is first.
function refreshMainBadge(listEl) {
  listEl.querySelectorAll(".media-item").forEach((el, i) => el.classList.toggle("is-main", i === 0));
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
    const ids = Array.from(listEl.querySelectorAll(".media-item")).map(el => el.dataset.id).filter(Boolean);
    if (!ids.length) return;
    try {
      await Api.reorderMedia(ids);
    } catch (err) {
      document.getElementById("formMsg").innerHTML = `<div class="msg error">Could not save the new photo order: ${esc(err.message)}</div>`;
    }
  });
}

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

async function renderCategories() {
  const view = document.getElementById("view");
  const pages = await Api.pages();
  PAGES_CACHE = pages;
  if (!pages.length) {
    view.innerHTML = `<header class="page-head"><h1>Categories</h1></header>
      <div class="empty-state">No site pages available.</div>`;
    return;
  }
  if (!CURRENT_PAGE_SLUG || !pages.some(p => p.slug === CURRENT_PAGE_SLUG)) CURRENT_PAGE_SLUG = pages[0].slug;

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
            <td>${esc(c.group_label || "—")}</td>
            <td>${c.show_in_hero ? "✓" : ""}</td>
            <td><span class="badge ${c.is_active ? "on" : "off"}">${c.is_active ? "Active" : "Hidden"}</span></td>
            <td>${c.sort}</td>
            <td class="actions">
              <button class="btn secondary" onclick="openCategoryForm('${c.id}')">Edit</button>
              <button class="btn secondary" onclick="openCategoryMedia('${c.id}')">Photos</button>
              <button class="btn secondary" onclick="location.hash='#/products?cat=${c.id}'">Packages</button>
              <button class="btn secondary" onclick="location.hash='#/arrange?cat=${c.id}'">Arrange</button>
              <button class="btn danger" onclick="removeCategory('${c.id}')">Delete</button>
            </td>
          </tr>`).join("")}
      </tbody>
    </table>
  `;
}

function openCategoryForm(id) {
  const cat = id ? window._CATS_CACHE.find(c => c.id === id) : null;
  const page = PAGES_CACHE.find(p => p.slug === CURRENT_PAGE_SLUG);
  openModal(`
    <h2>${cat ? "Edit" : "Add"} Category</h2>
    <p class="sub" style="color:var(--text-dim);font-size:12px;margin-top:0;">Page: ${esc(page.name)}</p>
    <div id="formMsg"></div>
    <form id="catForm">
      <div class="two-col">
        <div><label>Slug (unique on this page)</label><input id="f_slug" value="${esc(cat?.slug || "")}" required></div>
        <div><label>Icon (emoji)</label><input id="f_icon" value="${esc(cat?.icon || "")}"></div>
      </div>
      <label>Name</label><input id="f_name" value="${esc(cat?.name || "")}" required>
      <label>Description</label><textarea id="f_description" rows="2">${esc(cat?.description || "")}</textarea>
      <label>Thumbnail image URL (sidebar / "All Services" card)</label><input id="f_thumb" value="${esc(cat?.thumb_image_url || "")}">
      <label>Hero banner image URL</label><input id="f_hero_img" value="${esc(cat?.hero_image_url || "")}">
      <label>Hero tagline</label><input id="f_tagline" value="${esc(cat?.hero_tagline || "")}">
      <label>Portfolio section title</label><input id="f_folio_title" value="${esc(cat?.folio_title || "")}" placeholder='e.g. "Wedding Photography Portfolio"'>
      <div class="two-col">
        <div><label>Sidebar group label</label><input id="f_group" value="${esc(cat?.group_label || "")}" placeholder="Functions / Equipment"></div>
        <div><label>Sort order</label><input id="f_sort" type="number" value="${cat?.sort ?? 0}"></div>
      </div>
      <label class="inline"><input type="checkbox" id="f_hero" ${cat?.show_in_hero ? "checked" : ""}> Show in hero carousel</label>
      <label class="inline"><input type="checkbox" id="f_active" ${!cat || cat.is_active ? "checked" : ""}> Active (visible on site)</label>
      <div class="modal-actions">
        <button type="button" class="btn secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn">${cat ? "Save" : "Create"}</button>
      </div>
    </form>
  `);
  document.getElementById("catForm").addEventListener("submit", async (e) => {
    e.preventDefault();
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
      group_label: document.getElementById("f_group").value.trim() || null,
      sort: parseInt(document.getElementById("f_sort").value || "0", 10),
      show_in_hero: document.getElementById("f_hero").checked,
      is_active: document.getElementById("f_active").checked,
    };
    try {
      if (cat) await Api.updateCategory(cat.id, data);
      else await Api.createCategory(data);
      closeModal();
      loadCatTable();
    } catch (err) {
      document.getElementById("formMsg").innerHTML = `<div class="msg error">${esc(err.message)}</div>`;
    }
  });
}

async function removeCategory(id) {
  const cat = window._CATS_CACHE.find(c => c.id === id);
  if (!confirm(`Delete category "${cat?.name}"? This also deletes its packages and photos.`)) return;
  try { await Api.deleteCategory(id); loadCatTable(); }
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
              <button class="btn danger" onclick="removeProduct('${p.id}')">Delete</button>
            </td>
          </tr>`).join("")}
      </tbody>
    </table>
  `;
}

// Extra-JSON keys that have a dedicated, friendlier control elsewhere in this form.
// Whatever is left over after removing these is what shows up in the "Advanced settings" box.
const STUDIO_EXTRA_KEYS = ["tag", "badge", "turnaround", "qtyLabel", "quantityOptions", "purposeLabel", "purposeOptions", "requiresPhotoUpload"];
function extraForAdvancedBox(extra, pageSlug) {
  const known = new Set(["events"]);
  if (pageSlug === "studio") STUDIO_EXTRA_KEYS.forEach(k => known.add(k));
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
  const isStudio = cat.pageSlug === "studio";
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
            <option value="service" ${!p || p.type === "service" ? "selected" : ""}>Service (booking)</option>
            <option value="product" ${p?.type === "product" ? "selected" : ""}>Product (physical, ships to customer)</option>
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
        <div><label>Address-change window after ordering <span class="form-hint">(hours, optional — leave blank to use the site-wide default in Settings)</span></label>
          <input id="f_addr_window" type="number" min="0" step="1" value="${p?.address_change_window_hours ?? ""}" placeholder="e.g. 24"></div>
      </div>

      <div class="form-section-title">What's included</div>
      <label style="margin-top:0;">Features / inclusions <span class="form-hint">(one per line — shown as a checklist to the customer)</span></label>
      <textarea id="f_features" rows="5">${esc((p?.features || []).join("\n"))}</textarea>

      <div class="form-section-title">Customer questions</div>
      <label style="margin-top:0;">Extra questions on this product's order form <span class="form-hint">— e.g. upload a photo, pick from a dropdown, free text</span></label>
      <div id="inputFieldsRows" class="field-builder"></div>
      <button type="button" class="btn secondary add-field-btn" id="addFieldBtn">+ Add Field</button>

      ${cat.pageSlug === "photography" ? `
      <div class="form-section-title">Events &amp; team details</div>
      <label style="margin-top:0;">Table shown on the product page <span class="form-hint">— leave empty to auto-generate from the features above</span></label>
      <div id="eventsRows"></div>
      <button type="button" class="btn secondary" id="addEventRowBtn" style="margin-top:6px;">+ Add Row</button>
      ` : ""}

      ${isStudio ? `
      <div class="form-section-title">Order options (Studio page)</div>
      <div class="two-col">
        <div><label>Card badge text <span class="form-hint">(optional, e.g. "Pack of 8")</span></label><input id="f_tag" value="${esc(p?.extra?.tag || "")}"></div>
        <div><label>Turnaround time <span class="form-hint">(optional, e.g. "20 min")</span></label><input id="f_turnaround" value="${esc(p?.extra?.turnaround || "")}"></div>
      </div>
      <div class="studio-checkrow">
        <label><input type="checkbox" id="f_popular" ${p?.extra?.badge === "Popular" ? "checked" : ""}> Show a "Popular" ribbon on this card</label>
        <label><input type="checkbox" id="f_requires_photo" ${p?.extra?.requiresPhotoUpload ? "checked" : ""}> Customer must upload a photo to order this</label>
      </div>

      <label style="margin-top:0;">Quantity / pack options <span class="form-hint">(optional — offer this product at a few different quantities or sizes, each at its own price)</span></label>
      <input id="f_qty_label" style="margin-bottom:8px;" placeholder="Field label shown to customer, e.g. Photo Quantity" value="${esc(p?.extra?.qtyLabel || "")}">
      <div id="qtyOptionsRows"></div>
      <button type="button" class="btn secondary" id="addQtyOptionBtn" style="margin-bottom:14px;">+ Add Option</button>

      <label style="margin-top:0;">Size / purpose choices <span class="form-hint">(optional — a simple list the customer picks from, e.g. print sizes; one per line)</span></label>
      <input id="f_purpose_label" style="margin-bottom:8px;" placeholder="Field label shown to customer, e.g. Printing &amp; Frame Size" value="${esc(p?.extra?.purposeLabel || "")}">
      <textarea id="f_purpose_options" rows="3" placeholder="4 x 6&#10;5 x 7&#10;8 x 10">${esc((p?.extra?.purposeOptions || []).join("\n"))}</textarea>
      ` : ""}

      <details class="advanced-details">
        <summary>Advanced settings <span class="form-hint">(rarely needed — for one-off custom fields only; everything above already covers the common cases)</span></summary>
        <textarea id="f_extra" rows="4" style="font-family:monospace;font-size:12px;" placeholder="{}">${esc(JSON.stringify(extraForAdvancedBox(p?.extra, cat.pageSlug), null, 2))}</textarea>
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
      return `
        <div class="field-type-panel fp-dropdown">
          <label>Options (one per line)</label>
          <textarea class="fr_options" rows="3" placeholder="4x6&#10;5x7&#10;Passport Size">${esc((row?.options || []).join("\n"))}</textarea>
          <label class="inline" style="font-weight:400;"><input type="checkbox" class="fr_multi_select" ${row?.multi_select ? "checked" : ""}> Allow selecting multiple options</label>
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
        field.options = (row.querySelector(".fr_options")?.value || "").split("\n").map(s => s.trim()).filter(Boolean);
        field.multi_select = !!row.querySelector(".fr_multi_select")?.checked;
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

  // ---- Quantity / pack options (extra.quantityOptions, Studio page only) ----
  const qtyWrap = document.getElementById("qtyOptionsRows");
  function addQtyOptionRow(opt) {
    const div = document.createElement("div");
    div.className = "qty-opt-row";
    div.innerHTML = `
      <input class="qo_label" placeholder="Option shown to customer, e.g. 8 Photos" value="${esc(opt?.label || "")}">
      <input class="qo_price" type="number" step="1" placeholder="Price ₹" value="${opt?.price ?? ""}">
      <button type="button" class="studio-opt-remove" title="Remove option">×</button>
    `;
    div.querySelector(".studio-opt-remove").addEventListener("click", () => div.remove());
    qtyWrap.appendChild(div);
  }
  if (qtyWrap) {
    (p?.extra?.quantityOptions || []).forEach(addQtyOptionRow);
    document.getElementById("addQtyOptionBtn").addEventListener("click", () => addQtyOptionRow());
  }
  function collectQtyOptions(errors) {
    if (!qtyWrap) return [];
    const opts = [];
    Array.from(qtyWrap.querySelectorAll(".qty-opt-row")).forEach((row) => {
      const label = row.querySelector(".qo_label").value.trim();
      const priceRaw = row.querySelector(".qo_price").value;
      if (!label && priceRaw === "") return;
      if (!label || priceRaw === "") { errors.push(`Quantity option needs both a label and a price.`); return; }
      opts.push({ label, value: label, price: Number(priceRaw) });
    });
    return opts;
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
    if (isStudio) {
      const tag = document.getElementById("f_tag").value.trim();
      if (tag) extra.tag = tag; else delete extra.tag;
      if (document.getElementById("f_popular").checked) extra.badge = "Popular"; else delete extra.badge;
      const turnaround = document.getElementById("f_turnaround").value.trim();
      if (turnaround) extra.turnaround = turnaround; else delete extra.turnaround;
      if (document.getElementById("f_requires_photo").checked) extra.requiresPhotoUpload = true; else delete extra.requiresPhotoUpload;

      const qtyOptions = collectQtyOptions(fieldErrors);
      const qtyLabel = document.getElementById("f_qty_label").value.trim();
      if (qtyOptions.length) { extra.quantityOptions = qtyOptions; if (qtyLabel) extra.qtyLabel = qtyLabel; else delete extra.qtyLabel; }
      else { delete extra.quantityOptions; delete extra.qtyLabel; }

      const purposeOptions = document.getElementById("f_purpose_options").value.split("\n").map(s => s.trim()).filter(Boolean);
      const purposeLabel = document.getElementById("f_purpose_label").value.trim();
      if (purposeOptions.length) { extra.purposeOptions = purposeOptions; if (purposeLabel) extra.purposeLabel = purposeLabel; else delete extra.purposeLabel; }
      else { delete extra.purposeOptions; delete extra.purposeLabel; }
    }
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
      address_change_window_hours: num(document.getElementById("f_addr_window").value),
      features: document.getElementById("f_features").value.split("\n").map(s => s.trim()).filter(Boolean),
      is_active: document.getElementById("f_active").checked,
      sort: parseInt(document.getElementById("f_sort").value || "0", 10),
      extra,
      input_fields,
    };
    try {
      if (p) await Api.updateProduct(p.id, data);
      else await Api.createProduct({ ...data, media: [] });
      closeModal();
      loadProdTable();
    } catch (err) {
      document.getElementById("formMsg").innerHTML = `<div class="msg error">${esc(err.message)}</div>`;
    }
  });
}

async function removeProduct(id) {
  const p = window._PRODUCTS_CACHE.find(x => x.id === id);
  if (!confirm(`Delete "${p?.title}"?`)) return;
  try { await Api.deleteProduct(id); loadProdTable(); }
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
  openModal(`
    <h2>${title}</h2>
    <div id="formMsg"></div>
    <div class="media-list" id="mediaList">
      ${media.map(m => `
        <div class="media-item">
          <img src="${esc(mediaUrl(m.url))}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2290%22 height=%2290%22><rect width=%2290%22 height=%2290%22 fill=%22%23e8e0d8%22/></svg>'">
          <button title="Remove" onclick="removeMedia('${m.id}', this)">×</button>
          ${m.alt ? `<div class="cap">${esc(m.alt)}</div>` : ""}
        </div>`).join("") || `<div style="color:var(--text-dim);font-size:13px;">No photos yet.</div>`}
    </div>
    <form id="mediaUploadForm" style="margin-top:16px;">
      <label>Upload a photo</label>
      <input type="file" id="m_file" accept="image/*">
      <span id="mediaUploadStatus" style="color:var(--text-dim);font-size:12px;"></span>
    </form>
    <p style="color:var(--text-dim);font-size:12px;margin:12px 0 4px;">— or choose from the Media Library —</p>
    <button type="button" class="btn secondary" id="openLibraryPickerBtn">📁 Choose from Media Library</button>
    <div id="mediaLibraryPicker" style="display:none;margin-top:10px;"></div>
    <p style="color:var(--text-dim);font-size:12px;margin:14px 0 4px;">— or add by URL —</p>
    <form id="mediaForm">
      <label>Image URL</label><input id="m_url" required placeholder="https://pub-xxxx.r2.dev/...">
      <label>Caption ${kind === "portfolio" ? "(shown under the photo)" : "(optional)"}</label><input id="m_alt">
      <div class="modal-actions">
        <button type="button" class="btn secondary" onclick="closeModal()">Close</button>
        <button type="submit" class="btn">Add Photo</button>
      </div>
    </form>
  `);
  document.getElementById("m_file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const status = document.getElementById("mediaUploadStatus");
    status.textContent = "Uploading…";
    try {
      const fd = new FormData();
      fd.append("file", file);
      // Files this photo under media_library/<page>/<category>/... in R2 instead of
      // one flat folder, when we know which product/category this upload is for -
      // organization only, the app's own queries never read the key path (see
      // upload_media_library_asset()'s docstring in services/storage.py).
      if (pageSlug) fd.append("page_slug", pageSlug);
      if (categorySlug) fd.append("category_slug", categorySlug);
      const uploaded = await Api.uploadMedia(fd);
      await addFn({ url: uploaded.url, alt: uploaded.alt || "", kind, sort: media.length });
      closeModal();
      afterChange();
    } catch (err) {
      status.textContent = "";
      document.getElementById("formMsg").innerHTML = `<div class="msg error">${esc(err.message)}</div>`;
    }
  });
  document.getElementById("mediaForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await addFn({
        url: document.getElementById("m_url").value.trim(),
        alt: document.getElementById("m_alt").value.trim(),
        kind,
        sort: media.length,
      });
      closeModal();
      afterChange();
    } catch (err) {
      document.getElementById("formMsg").innerHTML = `<div class="msg error">${esc(err.message)}</div>`;
    }
  });

  // ---- Choose from Media Library ----
  let libraryLoaded = false;
  document.getElementById("openLibraryPickerBtn").addEventListener("click", async () => {
    const picker = document.getElementById("mediaLibraryPicker");
    const opening = picker.style.display === "none";
    picker.style.display = opening ? "block" : "none";
    if (opening && !libraryLoaded) {
      libraryLoaded = true;
      await loadMediaLibraryPicker(picker, kind, media, addFn, afterChange, { categoryId, pageId });
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

async function loadMediaLibraryPicker(picker, kind, media, addFn, afterChange, { categoryId, pageId } = {}) {
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
          if (selectedIds.has(id)) selectedIds.delete(id);
          else selectedIds.add(id);
          renderGrid(document.getElementById("libraryPickerSearch").value);
          updateActionBar();
        });
      });
    };
    renderGrid("");
    updateActionBar();
    document.getElementById("libraryPickerSearch").addEventListener("input", (e) => renderGrid(e.target.value));

    addBtn.addEventListener("click", async () => {
      const chosen = items.filter(m => selectedIds.has(m.id));
      if (!chosen.length) return;
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
  try {
    await Api.deleteMedia(id);
    btnEl.closest(".media-item").remove();
  } catch (err) { alert(err.message); }
}

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
      <div class="empty-state">No site pages yet. <a href="#" id="firstPageLink">Create one</a> to start adding categories.</div>`;
    document.getElementById("firstPageLink").addEventListener("click", (e) => { e.preventDefault(); openPageForm(); });
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
      <button class="btn secondary" id="addPageBtn">+ New Page</button>
    </div>
    <div id="catTableWrap"></div>
  `;
  document.getElementById("pageSelect").addEventListener("change", (e) => { CURRENT_PAGE_SLUG = e.target.value; loadCatTable(); });
  document.getElementById("addCatBtn").addEventListener("click", () => openCategoryForm());
  document.getElementById("addPageBtn").addEventListener("click", () => openPageForm());
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
  renderMediaModal({
    title: `Portfolio Photos — ${esc(cat.name)}`,
    media,
    kind: "portfolio",
    addFn: (data) => Api.addCategoryMedia(id, data),
    afterChange: loadCatTable,
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
      <thead><tr><th>Tier</th><th>Title</th><th>Price</th><th>Photos</th><th>Featured</th><th>Status</th><th>Sort</th><th></th></tr></thead>
      <tbody>
        ${products.map(p => `
          <tr>
            <td>${esc(p.tier || "—")}</td>
            <td>${esc(p.title)}</td>
            <td>${fmtINR(p.price)}</td>
            <td>${p.media.length}</td>
            <td>${p.is_featured ? `<span class="badge featured">★ Featured</span>` : ""}</td>
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

function openProductForm(id) {
  const p = id ? window._PRODUCTS_CACHE.find(x => x.id === id) : null;
  const cat = window._ALL_CATS.find(c => c.id === CURRENT_CATEGORY_ID);
  openModal(`
    <h2>${p ? "Edit" : "Add"} Product / Package</h2>
    <p style="color:var(--text-dim);font-size:12px;margin-top:0;">Category: ${esc(cat.pageName)} — ${esc(cat.name)}</p>
    <div id="formMsg"></div>
    <form id="prodForm">
      <div class="two-col">
        <div><label>Tier (Standard / Premium / Platinum, or blank)</label><input id="f_tier" value="${esc(p?.tier || "")}"></div>
        <div><label>Type</label>
          <select id="f_type">
            <option value="service" ${!p || p.type === "service" ? "selected" : ""}>Service (booking)</option>
            <option value="product" ${p?.type === "product" ? "selected" : ""}>Product (physical)</option>
          </select>
        </div>
      </div>
      <label>Title</label><input id="f_title" value="${esc(p?.title || "")}" required>
      <label>Slug (unique)</label><input id="f_slug" value="${esc(p?.slug || "")}" required>
      <label>Description</label><textarea id="f_desc" rows="2">${esc(p?.description || "")}</textarea>
      <div class="two-col">
        <div><label>Price (₹)</label><input id="f_price" type="number" step="1" value="${p?.price ?? ""}" required></div>
        <div><label>MRP / strike-through price (₹, optional)</label><input id="f_mrp" type="number" step="1" value="${p?.mrp ?? ""}"></div>
      </div>
      <div class="two-col">
        <div><label>Advance / deposit amount (₹, optional)</label><input id="f_advance" type="number" step="1" value="${p?.advance_amount ?? ""}"></div>
        <div><label>Stock (physical products only)</label><input id="f_stock" type="number" value="${p?.stock ?? ""}"></div>
      </div>
      <label>Features / inclusions (one per line)</label>
      <textarea id="f_features" rows="5">${esc((p?.features || []).join("\n"))}</textarea>
      ${cat.pageSlug === "photography" ? `
      <label>Events &amp; Team Details (table shown on the product page — leave empty to auto-generate from the features above)</label>
      <div id="eventsRows"></div>
      <button type="button" class="btn secondary" id="addEventRowBtn" style="margin-top:6px;">+ Add Row</button>
      ` : ""}
      <label>Advanced options (raw JSON - e.g. quantity/purpose options, photo-upload requirement)</label>
      <textarea id="f_extra" rows="4" style="font-family:monospace;font-size:12px;" placeholder='{"quantityOptions":[{"label":"Pack of 8","value":8,"price":999}],"requiresPhotoUpload":true}'>${esc(JSON.stringify(p?.extra || {}, null, 2))}</textarea>
      <div class="two-col">
        <div><label class="inline"><input type="checkbox" id="f_featured" ${p?.is_featured ? "checked" : ""}> Featured ("Most Booked" badge)</label></div>
        <div><label class="inline"><input type="checkbox" id="f_active" ${!p || p.is_active ? "checked" : ""}> Active (visible on site)</label></div>
      </div>
      <label>Sort order</label><input id="f_sort" type="number" value="${p?.sort ?? 0}">
      <div class="modal-actions">
        <button type="button" class="btn secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn">${p ? "Save" : "Create"}</button>
      </div>
    </form>
  `);

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
      features: document.getElementById("f_features").value.split("\n").map(s => s.trim()).filter(Boolean),
      is_featured: document.getElementById("f_featured").checked,
      is_active: document.getElementById("f_active").checked,
      sort: parseInt(document.getElementById("f_sort").value || "0", 10),
      extra,
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
  renderMediaModal({
    title: `Photos — ${esc(p.title)}`,
    media: p.media,
    kind: "package",
    addFn: (data) => Api.addProductMedia(id, data),
    afterChange: loadProdTable,
  });
}

// ==================================================================== shared media modal

function renderMediaModal({ title, media, kind = "portfolio", addFn, afterChange }) {
  openModal(`
    <h2>${title}</h2>
    <div id="formMsg"></div>
    <div class="media-list" id="mediaList">
      ${media.map(m => `
        <div class="media-item">
          <img src="${esc(m.url)}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2290%22 height=%2290%22><rect width=%2290%22 height=%2290%22 fill=%22%23e8e0d8%22/></svg>'">
          <button title="Remove" onclick="removeMedia('${m.id}', this)">×</button>
          ${m.alt ? `<div class="cap">${esc(m.alt)}</div>` : ""}
        </div>`).join("") || `<div style="color:var(--text-dim);font-size:13px;">No photos yet.</div>`}
    </div>
    <form id="mediaForm" style="margin-top:16px;">
      <label>Image URL</label><input id="m_url" required placeholder="https://res.cloudinary.com/...">
      <label>Caption ${kind === "portfolio" ? "(shown under the photo)" : "(optional)"}</label><input id="m_alt">
      <div class="modal-actions">
        <button type="button" class="btn secondary" onclick="closeModal()">Close</button>
        <button type="submit" class="btn">Add Photo</button>
      </div>
    </form>
  `);
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
}

async function removeMedia(id, btnEl) {
  try {
    await Api.deleteMedia(id);
    btnEl.closest(".media-item").remove();
  } catch (err) { alert(err.message); }
}

// ==================================================================== new page form (used from categories view)

function openPageForm() {
  openModal(`
    <h2>New Site Page</h2>
    <div id="formMsg"></div>
    <form id="pageForm">
      <label>Slug (e.g. "corporate", "gifts")</label><input id="p_slug" required>
      <label>Display name</label><input id="p_name" required>
      <div class="modal-actions">
        <button type="button" class="btn secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn">Create</button>
      </div>
    </form>
  `);
  document.getElementById("pageForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await Api.createPage({
        slug: document.getElementById("p_slug").value.trim(),
        name: document.getElementById("p_name").value.trim(),
      });
      closeModal();
      CURRENT_PAGE_SLUG = document.getElementById("p_slug")?.value?.trim();
      renderCategories();
    } catch (err) {
      document.getElementById("formMsg").innerHTML = `<div class="msg error">${esc(err.message)}</div>`;
    }
  });
}

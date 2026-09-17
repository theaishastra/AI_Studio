routes.homepage = renderHomepage;

async function renderHomepage() {
  const view = document.getElementById("view");
  view.innerHTML = `
    <header class="page-head">
      <h1>Homepage Builder</h1>
      <div>
        <button class="btn secondary" id="resetHomepageBtn">Reset to automatic</button>
        <button class="btn" id="saveHomepageBtn">Save & Freeze Layout</button>
      </div>
    </header>
    <p style="color:var(--text-dim);font-size:13px;">Drag to reorder, use the checkbox to hide an item. Nothing is picked automatically — check the items you want shown.</p>
    <h3>Featured Categories</h3>
    <div id="homeCategories"></div>
    <h3 style="margin-top:24px;">Featured Products</h3>
    <div id="homeProducts"></div>
  `;
  const data = await Api.homepage();

  const categoryItems = workingList(data.all.categories, data.layout.category_ids, () => false);
  const productItems = workingList(data.all.products, data.layout.product_ids, () => false);

  renderDraggableList(document.getElementById("homeCategories"), categoryItems, { showToggle: true });
  renderDraggableList(document.getElementById("homeProducts"), productItems, { showToggle: true });

  window._HOME_CATS = categoryItems;
  window._HOME_PRODS = productItems;

  document.getElementById("saveHomepageBtn").addEventListener("click", async () => {
    try {
      await Api.setHomepage({
        category_ids: window._HOME_CATS.filter(i => i.on !== false).map(i => i.id),
        product_ids: window._HOME_PRODS.filter(i => i.on !== false).map(i => i.id),
      });
      alert("Homepage layout saved.");
    } catch (err) { alert(err.message); }
  });

  document.getElementById("resetHomepageBtn").addEventListener("click", async () => {
    if (!confirm("Reset the homepage to automatic ordering?")) return;
    try { await Api.resetHomepage(); renderHomepage(); }
    catch (err) { alert(err.message); }
  });
}

// Merges the backend's `all` list with the saved order: saved ids first (in saved
// order, shown), then anything not yet curated appended with `on` decided by
// `defaultOn` when nothing has been saved yet, or hidden by default once curation exists.
function workingList(allItems, savedIds, defaultOn) {
  const bySavedOrder = [];
  const seen = new Set();
  savedIds.forEach(id => {
    const item = allItems.find(i => i.id === id);
    if (item) { bySavedOrder.push({ ...item, on: true }); seen.add(id); }
  });
  allItems.forEach(item => {
    if (!seen.has(item.id)) {
      bySavedOrder.push({ ...item, on: savedIds.length ? false : defaultOn(item) });
    }
  });
  return bySavedOrder;
}

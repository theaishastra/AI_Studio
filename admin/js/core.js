let CURRENT_USER = null;
const routes = {};

async function boot() {
  if (!getToken()) { location.href = "index.html"; return; }
  try {
    CURRENT_USER = await Api.me();
  } catch (e) {
    return; // api.js already redirects to login on 401
  }
  document.getElementById("userEmail").textContent = CURRENT_USER.email;
  document.body.classList.toggle("is-owner", CURRENT_USER.role === "owner");
  document.getElementById("logoutLink").addEventListener("click", (e) => { e.preventDefault(); logout(); });
  window.addEventListener("hashchange", route);
  applyBrandTheme();
  route();
}

/* Lets the owner's Settings > Branding colors re-theme the admin UI itself
   (not just documentation) — falls back to the CSS defaults when unset. */
async function applyBrandTheme() {
  try {
    const all = await Api.allSettings();
    const b = all.branding || {};
    const root = document.documentElement.style;
    if (b.primary_color) root.setProperty("--accent", b.primary_color);
    if (b.accent_color) root.setProperty("--accent-2", b.accent_color);
  } catch (e) { /* non-fatal — keep CSS defaults */ }
}

function logout() { clearToken(); location.href = "index.html"; }

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [path, qs] = raw.split("?");
  return { path: path || "dashboard", params: new URLSearchParams(qs || "") };
}

function route() {
  const { path, params } = parseHash();
  document.querySelectorAll(".sidebar nav a").forEach(a => a.classList.toggle("active", a.dataset.route === path));
  (routes[path] || routes.dashboard)(params);
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function openModal(html, wide) {
  closeModal();
  const bg = document.createElement("div");
  bg.className = "modal-backdrop";
  bg.id = "modalBackdrop";
  bg.innerHTML = `<div class="modal${wide ? " modal-wide" : ""}">${html}</div>`;
  bg.addEventListener("click", (e) => { if (e.target === bg) closeModal(); });
  document.body.appendChild(bg);
}
function closeModal() { document.getElementById("modalBackdrop")?.remove(); }

/* Fetches every site page's categories concurrently instead of one page at a
   time (Products & Arrange both need "categories across every page" in one
   flat list) — with N pages this is one round-trip's worth of latency instead
   of N sequential ones, which matters a lot on a slow/remote DB connection. */
async function allCategoriesAcrossPages(pages) {
  const perPage = await Promise.all(pages.map(p => Api.categories(p.slug)));
  const allCats = [];
  perPage.forEach((cats, i) => cats.forEach(c => allCats.push({ ...c, pageName: pages[i].name, pageSlug: pages[i].slug })));
  return allCats;
}

function card(num, lbl) {
  return `<div class="card"><div class="num">${num}</div><div class="lbl">${lbl}</div></div>`;
}

/* Shared inline loading indicator — an actual spinner reads as "busy, wait"
   more clearly than static "Loading…" text, especially on the DB's slower
   round-trips. Used via ${LOADING} inside a template literal, or assigned
   directly (`wrap.innerHTML = LOADING`) where there's no surrounding markup. */
const LOADING = `<div class="loading"><span class="spinner"></span> Loading…</div>`;

function fmtINR(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

/* Forces every admin timestamp to a detailed IST 12-hour rendering, regardless
   of the viewing staff member's own browser/OS timezone — e.g. "03 Sep 2026,
   04:32 PM IST". Asia/Kolkata has no DST, so the "IST" suffix is always correct. */
function fmtIST(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const formatted = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  }).format(d);
  return `${formatted.replace(/\s?(am|pm)$/i, (m) => m.toUpperCase())} IST`;
}

/* Date-only variant (still forced to IST) for tables that only need the day. */
function fmtISTDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric",
  }).format(d);
}

/* Shared drag-reorder list used by homepage.js and arrange.js. Renders `items`
   (each needs an `id`, `title`/`name`, `image`, optional `price`, optional `on`)
   into `containerEl` with drag handles + up/down buttons + an optional "Show"
   checkbox (when `showToggle` is true). Calls `onChange(newItemsArray)` after
   every reorder/toggle so the caller can keep its own state in sync. */
function renderDraggableList(containerEl, items, { showToggle = false, onChange } = {}) {
  let dragIdx = null;

  function move(from, to) {
    if (to < 0 || to >= items.length) return;
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    paint();
    onChange && onChange(items);
  }

  function paint() {
    containerEl.innerHTML = items.map((item, i) => `
      <div class="drag-row ${showToggle && item.on === false ? "off" : ""}" draggable="true" data-idx="${i}">
        <span class="drag-handle">⠿</span>
        ${item.image ? `<img src="${esc(item.image)}" class="drag-thumb" onerror="this.style.visibility='hidden'">` : ""}
        <span class="drag-title">${esc(item.title || item.name || "")}</span>
        ${item.price != null ? `<span class="drag-price">${fmtINR(item.price)}</span>` : ""}
        <span class="drag-actions">
          <button type="button" class="btn secondary" data-move="-1" data-idx="${i}">↑</button>
          <button type="button" class="btn secondary" data-move="1" data-idx="${i}">↓</button>
          ${showToggle ? `<label class="inline"><input type="checkbox" data-toggle="${i}" ${item.on !== false ? "checked" : ""}> Show</label>` : ""}
        </span>
      </div>`).join("") || `<div class="empty-state">Nothing to arrange yet.</div>`;

    containerEl.querySelectorAll("[data-move]").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.idx);
        move(i, i + Number(btn.dataset.move));
      });
    });
    if (showToggle) {
      containerEl.querySelectorAll("[data-toggle]").forEach(cb => {
        cb.addEventListener("change", () => {
          items[Number(cb.dataset.toggle)].on = cb.checked;
          containerEl.querySelector(`.drag-row[data-idx="${cb.dataset.toggle}"]`).classList.toggle("off", !cb.checked);
          onChange && onChange(items);
        });
      });
    }
    containerEl.querySelectorAll(".drag-row").forEach(row => {
      row.addEventListener("dragstart", () => { dragIdx = Number(row.dataset.idx); });
      row.addEventListener("dragover", (e) => e.preventDefault());
      row.addEventListener("drop", (e) => {
        e.preventDefault();
        const to = Number(row.dataset.idx);
        if (dragIdx === null || dragIdx === to) return;
        move(dragIdx, to);
        dragIdx = null;
      });
    });
  }

  paint();
}

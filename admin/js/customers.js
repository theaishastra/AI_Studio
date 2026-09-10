routes.customers = renderCustomers;

async function renderCustomers() {
  const view = document.getElementById("view");
  view.innerHTML = `
    <header class="page-head"><h1>Customers</h1></header>
    <div class="toolbar"><input id="customerSearch" placeholder="Search name, email, or phone…" style="max-width:320px;"></div>
    <div id="customersWrap">${LOADING}</div>
  `;
  let timer;
  document.getElementById("customerSearch").addEventListener("input", (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => loadCustomers(e.target.value.trim()), 300);
  });
  await loadCustomers();
}

async function loadCustomers(q) {
  const wrap = document.getElementById("customersWrap");
  const res = await Api.customers(q);
  if (!res.items.length) {
    wrap.innerHTML = `<div class="empty-state">No customers ${q ? "match that search" : "yet"}.</div>`;
    return;
  }
  wrap.innerHTML = `
    <table>
      <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Spend</th><th>Joined</th><th>Last Login</th></tr></thead>
      <tbody>
        ${res.items.map(c => `
          <tr>
            <td>${esc(c.name || "—")}</td>
            <td>${esc(c.email)}</td>
            <td>${esc(c.phone || "—")}</td>
            <td>${c.orders}</td>
            <td>${fmtINR(c.spend)}</td>
            <td>${fmtIST(c.joined)}</td>
            <td>${c.last_login ? fmtIST(c.last_login) : "—"}</td>
          </tr>`).join("")}
      </tbody>
    </table>
    <p style="color:var(--text-dim);font-size:12px;margin-top:8px;">${res.total} total</p>
  `;
}

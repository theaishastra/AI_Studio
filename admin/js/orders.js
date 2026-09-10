routes.orders = renderOrders;

const ORDER_STATUSES = ["created", "payment_pending", "cod_confirmed", "paid", "in_production", "shipped", "delivered", "cancelled", "refunded"];

async function renderOrders() {
  const view = document.getElementById("view");
  view.innerHTML = `
    <header class="page-head"><h1>Orders</h1><a class="btn secondary" href="${API_BASE}/api/admin/reports/orders.csv" target="_blank">Export CSV</a></header>
    <div class="toolbar">
      <select id="orderStatusFilter">
        <option value="">All statuses</option>
        ${ORDER_STATUSES.map(s => `<option value="${s}">${s.replace("_", " ")}</option>`).join("")}
      </select>
    </div>
    <div id="ordersWrap">${LOADING}</div>
  `;
  document.getElementById("orderStatusFilter").addEventListener("change", (e) => loadOrders(e.target.value));
  await loadOrders();
}

async function loadOrders(statusFilter) {
  const wrap = document.getElementById("ordersWrap");
  const orders = await Api.orders(statusFilter);
  window._ORDERS_CACHE = orders;
  if (!orders.length) {
    wrap.innerHTML = `<div class="empty-state">No orders yet.</div>`;
    return;
  }
  wrap.innerHTML = `
    <table>
      <thead><tr><th>Order #</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Created</th><th></th></tr></thead>
      <tbody>
        ${orders.map(o => `
          <tr>
            <td><b>${esc(o.number)}</b></td>
            <td>${o.items.length} item${o.items.length === 1 ? "" : "s"}</td>
            <td>${fmtINR(o.total)}</td>
            <td><span class="badge ${o.payments.some(p => p.status === "captured") ? "on" : "off"}">${o.status === "cod_confirmed" ? "cod" : (o.payments[0]?.status || "—")}</span></td>
            <td><select onchange="updateOrderStatus('${o.id}', this.value)">
              ${ORDER_STATUSES.map(s => `<option value="${s}" ${s === o.status ? "selected" : ""}>${s.replace("_", " ")}</option>`).join("")}
            </select></td>
            <td>${fmtIST(o.created_at)}</td>
            <td class="actions">
              <button class="btn secondary" onclick="viewOrder('${o.id}')">View</button>
              ${o.status === "paid" ? `<button class="btn danger owner-only" onclick="refundOrder('${o.id}')">Refund</button>` : ""}
            </td>
          </tr>`).join("")}
      </tbody>
    </table>
  `;
  document.body.classList.toggle("is-owner", CURRENT_USER.role === "owner");
}

async function updateOrderStatus(id, status) {
  try { await Api.updateOrderStatus(id, status); }
  catch (err) { alert(err.message); renderOrders(); }
}

function viewOrder(id) {
  const o = window._ORDERS_CACHE.find(x => x.id === id);
  openModal(`
    <h2>Order ${esc(o.number)}</h2>
    <p style="color:var(--text-dim);font-size:12px;">Placed ${fmtIST(o.created_at)}</p>
    <table>
      <thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Line Total</th></tr></thead>
      <tbody>
        ${o.items.map(i => `
          <tr>
            <td>${esc(i.product_snapshot?.title || "—")}</td>
            <td>${i.qty}</td>
            <td>${fmtINR(i.unit_price)}</td>
            <td>${fmtINR(i.unit_price * i.qty)}</td>
          </tr>`).join("")}
      </tbody>
    </table>
    <p style="margin-top:12px;">Subtotal: ${fmtINR(o.subtotal)}<br>
    Discount: ${fmtINR(o.discount)}${o.coupon_code ? ` (${esc(o.coupon_code)})` : ""}<br>
    <b>Total: ${fmtINR(o.total)}</b></p>
    <div class="modal-actions">
      <button type="button" class="btn secondary" onclick="closeModal()">Close</button>
    </div>
  `);
}

async function refundOrder(id) {
  if (!confirm("Refund this order via Razorpay? This will restock physical items.")) return;
  try { await Api.refundOrder(id); loadOrders(); }
  catch (err) { alert(err.message); }
}

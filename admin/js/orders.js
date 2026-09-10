routes.orders = renderOrders;

const ORDER_STATUSES = ["created", "payment_pending", "cod_confirmed", "paid", "in_production", "shipped", "delivered", "cancelled", "refunded"];

const CANCELLATION_REASON_LABELS = {
  changed_mind: "Changed their mind",
  found_better_price: "Found a better price elsewhere",
  ordered_by_mistake: "Ordered by mistake",
  delivery_time_too_long: "Delivery time too long",
  product_defect_expected: "Expects a product defect",
  duplicate_order: "Accidental duplicate order",
  other: "Other",
};

let _ordersTab = "orders";

async function renderOrders() {
  const view = document.getElementById("view");
  view.innerHTML = `
    <header class="page-head"><h1>Orders</h1><a class="btn secondary" href="${API_BASE}/api/admin/reports/orders.csv" target="_blank">Export CSV</a></header>
    <div class="tabs" id="ordersTabs"></div>
    <div id="ordersTabBody">${LOADING}</div>
  `;
  await renderOrdersTabs();
}

async function renderOrdersTabs() {
  const tabsWrap = document.getElementById("ordersTabs");
  let pendingCancel = 0, pendingAddr = 0;
  try {
    const summary = await Api.summary();
    pendingCancel = summary.cancellation_requests_pending || 0;
    pendingAddr = summary.address_change_requests_pending || 0;
  } catch (e) { /* non-fatal — tab still works without the badge count */ }

  const tabs = [
    { key: "orders", label: "All Orders" },
    { key: "cancellations", label: "Cancellation Requests", badge: pendingCancel },
    { key: "address-changes", label: "Address Change Requests", badge: pendingAddr },
  ];
  tabsWrap.innerHTML = tabs.map(t => `
    <button type="button" class="tab-btn ${t.key === _ordersTab ? "active" : ""}" data-tab="${t.key}">
      ${esc(t.label)}${t.badge ? `<span class="tab-badge">${t.badge}</span>` : ""}
    </button>`).join("");
  tabsWrap.querySelectorAll("[data-tab]").forEach(btn => {
    btn.addEventListener("click", () => { _ordersTab = btn.dataset.tab; renderOrdersTabBody(); });
  });
  await renderOrdersTabBody();
}

async function renderOrdersTabBody() {
  document.querySelectorAll("#ordersTabs .tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === _ordersTab));
  const body = document.getElementById("ordersTabBody");
  body.innerHTML = LOADING;
  if (_ordersTab === "orders") await renderOrdersTable(body);
  else if (_ordersTab === "cancellations") await renderCancellationRequests(body);
  else await renderAddressChangeRequests(body);
}

async function renderOrdersTable(body) {
  body.innerHTML = `
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
      <thead><tr><th>Order #</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Requests</th><th>Created</th><th></th></tr></thead>
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
            <td>${orderRequestBadges(o)}</td>
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

function orderRequestBadges(o) {
  const bits = [];
  if ((o.cancellation_requests || []).some(r => r.status === "pending")) bits.push(`<span class="badge req-pending">Cancel pending</span>`);
  if ((o.address_change_requests || []).some(r => r.status === "pending")) bits.push(`<span class="badge req-pending">Address pending</span>`);
  return bits.join(" ") || "—";
}

async function updateOrderStatus(id, status) {
  try { await Api.updateOrderStatus(id, status); }
  catch (err) { alert(err.message); renderOrdersTabBody(); }
}

// Different storefront pages save the customer's uploaded artwork/photo and
// custom message under different customization field names (gifts.js:
// photoData/text, corporate.js: logoData/engravingText) — this picks
// whichever is present so the order detail shows it regardless of which page
// the item was ordered from.
function orderItemUploadedImage(customization) {
  if (!customization) return "";
  const data = customization.logoData || customization.photoData || "";
  return typeof data === "string" && data.startsWith("data:image/") ? data : "";
}

function orderItemCustomText(customization) {
  if (!customization) return "";
  const text = customization.text || customization.engravingText || customization.message || customization.customText || "";
  return typeof text === "string" ? text.trim() : "";
}

function trackingTimelineHTML(order) {
  const events = order.tracking_events || [];
  if (!events.length) return `<p class="odg-empty">No tracking updates yet.</p>`;
  return `<div class="tracking-timeline">
    ${events.map(ev => `
      <div class="tracking-event">
        <span class="tracking-dot"></span>
        <div class="tracking-event-body">
          <div class="tracking-event-head"><b>${esc(ev.title)}</b><span>${fmtIST(ev.created_at)}</span></div>
          ${ev.description ? `<p>${esc(ev.description)}</p>` : ""}
          ${ev.location ? `<span class="tracking-loc">${esc(ev.location)}</span>` : ""}
        </div>
      </div>`).join("")}
  </div>`;
}

function pendingRequestHTML(order) {
  const cancel = (order.cancellation_requests || []).find(r => r.status === "pending");
  const addr = (order.address_change_requests || []).find(r => r.status === "pending");
  let html = "";
  if (cancel) {
    html += `
      <div class="request-card">
        <div class="request-card-head"><b>Cancellation requested</b><span class="badge req-pending">Pending</span></div>
        <p>Reason: ${esc(CANCELLATION_REASON_LABELS[cancel.reason] || cancel.reason)}${cancel.note ? ` — “${esc(cancel.note)}”` : ""}</p>
        <div class="modal-actions" style="justify-content:flex-start;">
          <button type="button" class="btn" onclick="decideRequest('cancellation', '${cancel.id}', 'approve')">Approve (cancel order)</button>
          <button type="button" class="btn secondary" onclick="decideRequest('cancellation', '${cancel.id}', 'reject')">Reject</button>
        </div>
      </div>`;
  }
  if (addr) {
    const a = addr.requested_address;
    html += `
      <div class="request-card">
        <div class="request-card-head"><b>Address change requested</b><span class="badge req-pending">Pending</span></div>
        <p>${esc(a.full_name)} &middot; ${esc(a.phone)}<br>
        ${esc(a.line1)}${a.line2 ? `, ${esc(a.line2)}` : ""}, ${esc(a.city)}, ${esc(a.state)} - ${esc(a.pincode)}</p>
        ${addr.note ? `<p class="odg-empty">Note: ${esc(addr.note)}</p>` : ""}
        <div class="modal-actions" style="justify-content:flex-start;">
          <button type="button" class="btn" onclick="decideRequest('address', '${addr.id}', 'approve')">Approve (update address)</button>
          <button type="button" class="btn secondary" onclick="decideRequest('address', '${addr.id}', 'reject')">Reject</button>
        </div>
      </div>`;
  }
  return html;
}

async function decideRequest(kind, id, action) {
  const label = action === "approve" ? "Approve" : "Reject";
  let adminNote = "";
  if (action === "reject") {
    adminNote = prompt(`Reason for the customer (optional) — ${label} this request:`) || "";
  } else if (!confirm(`${label} this request?`)) {
    return;
  }
  try {
    if (kind === "cancellation") await Api.decideCancellationRequest(id, action, adminNote);
    else await Api.decideAddressChangeRequest(id, action, adminNote);
    closeModal();
    renderOrdersTabs();
  } catch (err) {
    alert(err.message);
  }
}

function viewOrder(id) {
  const o = window._ORDERS_CACHE.find(x => x.id === id);
  const c = o.customer;
  const a = o.address;
  const payment = o.payments[o.payments.length - 1];
  openModal(`
    <div class="order-modal-head">
      <div>
        <h2>Order ${esc(o.number)}</h2>
        <p class="order-modal-meta">Placed ${fmtIST(o.created_at)}</p>
      </div>
      <span class="order-status-badge order-status-${esc(o.status)}">${esc(o.status.replace("_", " "))}</span>
    </div>

    ${pendingRequestHTML(o)}

    <div class="order-section">
      <div class="order-detail-grid">
        <div class="odg-col">
          <h3>Customer</h3>
          ${c ? `
          <p>${esc(c.name || "—")}<br>
          ${esc(c.email)}<br>
          ${esc(c.phone || "—")}</p>` : `<p class="odg-empty">No customer on file.</p>`}
        </div>
        <div class="odg-col">
          <h3>Delivery Address</h3>
          ${a ? `
          <p>${esc(a.full_name)} &middot; ${esc(a.phone)}<br>
          ${esc(a.line1)}${a.line2 ? `, ${esc(a.line2)}` : ""}<br>
          ${esc(a.city)}, ${esc(a.state)} - ${esc(a.pincode)}</p>
          ${o.delivery_slot ? `<p class="odg-slot">Delivery slot: ${esc(o.delivery_slot)}</p>` : ""}` : `<p class="odg-empty">No address on file.</p>`}
        </div>
      </div>
    </div>

    <div class="order-section">
      <h3 class="order-section-title">Items <span class="count">(${o.items.length})</span></h3>
      <div class="order-items-detail">
        ${o.items.map(i => {
          const snap = i.product_snapshot || {};
          const customization = snap.customization || null;
          const uploadedImage = orderItemUploadedImage(customization);
          const customText = orderItemCustomText(customization);
          return `
          <div class="order-item-detail-row">
            <img class="oid-thumb" src="${esc(snap.image || "")}" alt="" onerror="this.style.visibility='hidden'">
            <div class="oid-body">
              <div class="oid-title-row">
                <b>${esc(snap.title || "—")}</b>
                <span class="mono">${i.product_id ? `Product ID: ${esc(i.product_id)}` : "Custom item (no catalog ID)"}</span>
              </div>
              <div class="oid-pricing">${i.qty} × ${fmtINR(i.unit_price)} = <b>${fmtINR(i.unit_price * i.qty)}</b></div>
              ${uploadedImage || customText ? `
              <div class="oid-custom">
                ${uploadedImage ? `<img class="oid-upload" src="${uploadedImage}" alt="Customer's uploaded photo" title="Click to view full size" onclick="openImageZoom(this.src)">` : ""}
                ${customText ? `<span class="oid-text">Custom text: &ldquo;${esc(customText)}&rdquo;</span>` : ""}
              </div>` : ""}
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>

    <div class="order-section">
      <h3 class="order-section-title">Order Summary</h3>
      <div class="order-summary-card">
        <div class="order-summary-row"><span>Subtotal</span><span>${fmtINR(o.subtotal)}</span></div>
        <div class="order-summary-row"><span>Discount${o.coupon_code ? ` (${esc(o.coupon_code)})` : ""}</span><span>-${fmtINR(o.discount)}</span></div>
        <div class="order-summary-row total"><span>Total</span><span>${fmtINR(o.total)}</span></div>
        ${payment ? `
        <div class="order-summary-payment">
          <span>Payment status</span>
          <b>${esc(payment.status)}${payment.razorpay_payment_id ? ` &middot; ${esc(payment.razorpay_payment_id)}` : ""}</b>
        </div>` : ""}
      </div>
    </div>

    <div class="order-section">
      <h3 class="order-section-title">Shipment &amp; Tracking</h3>
      ${(o.carrier || o.tracking_number || o.expected_delivery) ? `
      <div class="tracking-current">
        ${o.carrier ? `<span>Carrier: <b>${esc(o.carrier)}</b></span>` : ""}
        ${o.tracking_number ? `<span>Tracking #: <b>${esc(o.tracking_number)}</b></span>` : ""}
        ${o.expected_delivery ? `<span>Expected: <b>${esc(o.expected_delivery)}</b></span>` : ""}
        ${o.tracking_url ? `<span><a href="${esc(o.tracking_url)}" target="_blank" rel="noopener">Track shipment &rarr;</a></span>` : ""}
      </div>` : ""}
      <form id="trackingForm" class="tracking-form">
        <div class="two-col">
          <div><label>Carrier</label><input id="tk_carrier" value="${esc(o.carrier || "")}" placeholder="e.g. BlueDart, Delhivery"></div>
          <div><label>Tracking number</label><input id="tk_number" value="${esc(o.tracking_number || "")}"></div>
        </div>
        <div class="two-col">
          <div><label>Tracking URL (optional)</label><input id="tk_url" value="${esc(o.tracking_url || "")}" placeholder="https://..."></div>
          <div><label>Expected delivery</label><input id="tk_eta" type="date" value="${o.expected_delivery || ""}"></div>
        </div>
        <label>Add a timeline update (optional)</label>
        <div class="two-col">
          <input id="tk_event_title" placeholder="e.g. Out for delivery">
          <input id="tk_event_location" placeholder="Location (optional)">
        </div>
        <textarea id="tk_event_desc" rows="2" placeholder="Note shown to the customer (optional)"></textarea>
        <div class="modal-actions" style="justify-content:flex-start;">
          <button type="submit" class="btn">Save Tracking Update</button>
          <span class="save-msg" id="trackingMsg"></span>
        </div>
      </form>
      ${trackingTimelineHTML(o)}
    </div>

    <div class="modal-actions">
      <button type="button" class="btn secondary" onclick="closeModal()">Close</button>
    </div>
  `, true);

  document.getElementById("trackingForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
      carrier: document.getElementById("tk_carrier").value.trim() || null,
      tracking_number: document.getElementById("tk_number").value.trim() || null,
      tracking_url: document.getElementById("tk_url").value.trim() || null,
      expected_delivery: document.getElementById("tk_eta").value || null,
      event_title: document.getElementById("tk_event_title").value.trim() || null,
      event_description: document.getElementById("tk_event_desc").value.trim(),
      event_location: document.getElementById("tk_event_location").value.trim() || null,
    };
    const msg = document.getElementById("trackingMsg");
    try {
      await Api.updateOrderTracking(o.id, data);
      closeModal();
      renderOrdersTabs();
    } catch (err) {
      msg.textContent = err.message;
    }
  });
}

function openImageZoom(src) {
  openModal(`
    <img src="${esc(src)}" alt="" style="width:100%;border-radius:8px;display:block;">
    <div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Close</button></div>
  `);
}

async function refundOrder(id) {
  if (!confirm("Refund this order via Razorpay? This will restock physical items.")) return;
  try { await Api.refundOrder(id); loadOrders(); }
  catch (err) { alert(err.message); }
}

/* ---------- cancellation / address-change request tabs ---------- */

async function renderCancellationRequests(body) {
  const reqs = await Api.cancellationRequests();
  if (!reqs.length) {
    body.innerHTML = `<div class="empty-state">No cancellation requests.</div>`;
    return;
  }
  body.innerHTML = `
    <table>
      <thead><tr><th>Order #</th><th>Customer</th><th>Reason</th><th>Note</th><th>Status</th><th>Raised</th><th></th></tr></thead>
      <tbody>
        ${reqs.map(r => `
          <tr>
            <td><b>${esc(r.order_number || "—")}</b></td>
            <td>${esc(r.customer_name || r.customer_email || "—")}</td>
            <td>${esc(CANCELLATION_REASON_LABELS[r.reason] || r.reason)}</td>
            <td>${esc(r.note || "—")}</td>
            <td><span class="badge ${r.status === "pending" ? "req-pending" : r.status === "approved" ? "on" : "off"}">${esc(r.status)}</span></td>
            <td>${fmtIST(r.created_at)}</td>
            <td class="actions">
              ${r.status === "pending" ? `
                <button class="btn" onclick="decideRequest('cancellation', '${r.id}', 'approve')">Approve</button>
                <button class="btn secondary" onclick="decideRequest('cancellation', '${r.id}', 'reject')">Reject</button>
              ` : (r.admin_note ? esc(r.admin_note) : "—")}
            </td>
          </tr>`).join("")}
      </tbody>
    </table>
  `;
}

async function renderAddressChangeRequests(body) {
  const reqs = await Api.addressChangeRequests();
  if (!reqs.length) {
    body.innerHTML = `<div class="empty-state">No address change requests.</div>`;
    return;
  }
  body.innerHTML = `
    <table>
      <thead><tr><th>Order #</th><th>Customer</th><th>Requested Address</th><th>Status</th><th>Raised</th><th></th></tr></thead>
      <tbody>
        ${reqs.map(r => {
          const a = r.requested_address || {};
          return `
          <tr>
            <td><b>${esc(r.order_number || "—")}</b></td>
            <td>${esc(r.customer_name || r.customer_email || "—")}</td>
            <td>${esc(a.full_name || "")} &middot; ${esc(a.phone || "")}<br>${esc(a.line1 || "")}${a.line2 ? `, ${esc(a.line2)}` : ""}, ${esc(a.city || "")}, ${esc(a.state || "")} - ${esc(a.pincode || "")}</td>
            <td><span class="badge ${r.status === "pending" ? "req-pending" : r.status === "approved" ? "on" : "off"}">${esc(r.status)}</span></td>
            <td>${fmtIST(r.created_at)}</td>
            <td class="actions">
              ${r.status === "pending" ? `
                <button class="btn" onclick="decideRequest('address', '${r.id}', 'approve')">Approve</button>
                <button class="btn secondary" onclick="decideRequest('address', '${r.id}', 'reject')">Reject</button>
              ` : (r.admin_note ? esc(r.admin_note) : "—")}
            </td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>
  `;
}

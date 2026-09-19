routes.customers = renderCustomers;

async function renderCustomers() {
  const view = document.getElementById("view");
  view.innerHTML = `
    <header class="page-head">
      <h1>Customers</h1>
      <button class="btn secondary owner-only" id="blockEmailBtn">Block an email</button>
    </header>
    <div class="toolbar"><input id="customerSearch" placeholder="Search name, email, or phone…" style="max-width:320px;"></div>
    <div id="customersWrap">${LOADING}</div>
  `;
  document.getElementById("blockEmailBtn").addEventListener("click", () => openBlockEmailForm());
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
      <thead>
        <tr>
          <th>Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Spend</th>
          <th>Joined</th><th>Last Login</th><th>OTP Requests</th><th>Status</th><th></th>
        </tr>
      </thead>
      <tbody>
        ${res.items.map(c => `
          <tr>
            <td>${c.id ? esc(c.name || "—") : `<span style="color:var(--text-dim);">— no signup</span>`}</td>
            <td>${esc(c.email)}</td>
            <td>${esc(c.phone || "—")}</td>
            <td>${c.orders}</td>
            <td>${fmtINR(c.spend)}</td>
            <td>${c.joined ? fmtIST(c.joined) : "—"}</td>
            <td>${c.last_login ? fmtIST(c.last_login) : "—"}</td>
            <td>${c.otp_requests}${c.last_otp_request ? ` <span style="color:var(--text-dim);font-size:12px;">(last ${fmtIST(c.last_otp_request)})</span>` : ""}</td>
            <td>${c.is_blocked ? `<span class="badge off">Blocked</span>` : `<span class="badge on">Active</span>`}</td>
            <td class="actions owner-only">
              ${c.is_blocked
                ? `<button class="btn secondary" onclick="unblockCustomerEmail('${esc(c.email)}')">Unblock</button>`
                : `<button class="btn secondary" onclick="blockCustomerEmail('${esc(c.email)}')">Block</button>`}
              ${c.id
                ? `<button class="btn danger" onclick="removeCustomer('${c.id}', '${esc(c.email)}', ${c.orders})">Delete</button>`
                : `<button class="btn danger" onclick="removeOtpActivity('${esc(c.email)}')">Remove</button>`}
            </td>
          </tr>`).join("")}
      </tbody>
    </table>
    <p style="color:var(--text-dim);font-size:12px;margin-top:8px;">
      ${res.total} total — rows marked "no signup" requested a login OTP but never completed signup.
    </p>
  `;
  wrap._lastQuery = q;
}

async function removeCustomer(id, email, orderCount) {
  const warning = orderCount > 0
    ? `Permanently delete ${email}? This also erases their ${orderCount} order${orderCount === 1 ? "" : "s"}, payments, addresses, cart/wishlist, and reviews. This cannot be undone.`
    : `Permanently delete ${email}? This also erases their addresses, cart/wishlist, and reviews. This cannot be undone.`;
  if (!confirm(warning)) return;
  try {
    await Api.deleteCustomer(id);
    loadCustomers(document.getElementById("customersWrap")._lastQuery);
  } catch (err) { alert(err.message); }
}

async function blockCustomerEmail(email) {
  const reason = prompt(`Block ${email} from logging in or requesting OTPs?\n\nOptional reason (shown in the audit log):`);
  if (reason === null) return; // cancelled
  try {
    await Api.blockEmail(email, reason);
    loadCustomers(document.getElementById("customersWrap")._lastQuery);
  } catch (err) { alert(err.message); }
}

async function removeOtpActivity(email) {
  if (!confirm(`Remove ${email}'s OTP request history? It never completed signup - this just clears the login-activity noise, it's not blocked from trying again.`)) return;
  try {
    await Api.clearOtpActivity(email);
    loadCustomers(document.getElementById("customersWrap")._lastQuery);
  } catch (err) { alert(err.message); }
}

async function unblockCustomerEmail(email) {
  if (!confirm(`Unblock ${email}? They'll be able to log in and request OTPs again.`)) return;
  try {
    await Api.unblockEmail(email);
    loadCustomers(document.getElementById("customersWrap")._lastQuery);
  } catch (err) { alert(err.message); }
}

function openBlockEmailForm() {
  openModal(`
    <h2>Block an email</h2>
    <p style="color:var(--text-dim);font-size:13px;">
      Blocks login and OTP requests for this address, even if it has never signed up -
      use this for an email someone is hammering the login form with.
    </p>
    <div id="formMsg"></div>
    <form id="blockEmailForm">
      <label>Email</label><input id="be_email" type="email" required>
      <label>Reason (optional)</label><input id="be_reason">
      <div class="modal-actions">
        <button type="button" class="btn secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn danger">Block</button>
      </div>
    </form>
  `);
  document.getElementById("blockEmailForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await Api.blockEmail(
        document.getElementById("be_email").value.trim(),
        document.getElementById("be_reason").value.trim(),
      );
      closeModal();
      loadCustomers(document.getElementById("customersWrap")?._lastQuery);
    } catch (err) {
      document.getElementById("formMsg").innerHTML = `<div class="msg error">${esc(err.message)}</div>`;
    }
  });
}

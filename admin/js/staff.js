routes.staff = renderStaff;
routes.audit = renderAudit;
routes.activity = renderActivity;

async function renderStaff() {
  const view = document.getElementById("view");
  view.innerHTML = `
    <header class="page-head"><h1>Staff</h1><button class="btn" id="addStaffBtn">+ Add Staff</button></header>
    <div id="staffWrap">${LOADING}</div>
  `;
  document.getElementById("addStaffBtn").addEventListener("click", () => openStaffForm());
  await loadStaff();
}

async function loadStaff() {
  const wrap = document.getElementById("staffWrap");
  const staff = await Api.staff();
  wrap.innerHTML = `
    <table>
      <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
      <tbody>
        ${staff.map(u => `
          <tr>
            <td>${esc(u.name || "—")}</td>
            <td>${esc(u.email)}</td>
            <td>${esc(u.role)}</td>
            <td><span class="badge on">Active</span></td>
            <td class="actions">${u.id !== CURRENT_USER.id ? `<button class="btn danger" onclick="removeStaff('${u.id}')">Deactivate</button>` : ""}</td>
          </tr>`).join("")}
      </tbody>
    </table>
  `;
}

function openStaffForm() {
  openModal(`
    <h2>Add Staff</h2>
    <div id="formMsg"></div>
    <form id="staffForm">
      <label>Name</label><input id="s_name" required>
      <label>Email</label><input id="s_email" type="email" required>
      <label>Temporary password</label><input id="s_password" type="password" required minlength="8">
      <label>Role</label>
      <select id="s_role"><option value="staff">Staff</option><option value="owner">Owner</option></select>
      <div class="modal-actions">
        <button type="button" class="btn secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn">Create</button>
      </div>
    </form>
  `);
  document.getElementById("staffForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await Api.createStaff({
        name: document.getElementById("s_name").value.trim(),
        email: document.getElementById("s_email").value.trim(),
        password: document.getElementById("s_password").value,
        role: document.getElementById("s_role").value,
      });
      closeModal();
      loadStaff();
    } catch (err) {
      document.getElementById("formMsg").innerHTML = `<div class="msg error">${esc(err.message)}</div>`;
    }
  });
}

async function removeStaff(id) {
  if (!confirm("Deactivate this staff account?")) return;
  try { await Api.deactivateStaff(id); loadStaff(); }
  catch (err) { alert(err.message); }
}

// ==================================================================== audit log (owner only)

async function renderAudit() {
  const view = document.getElementById("view");
  view.innerHTML = `<header class="page-head"><h1>Audit Log</h1></header><div id="auditWrap">${LOADING}</div>`;
  const logs = await Api.auditLog();
  document.getElementById("auditWrap").innerHTML = `
    <table>
      <thead><tr><th>When (IST)</th><th>Action</th><th>Entity</th><th>Detail</th><th>IP Address</th></tr></thead>
      <tbody>
        ${logs.map(l => `
          <tr>
            <td>${fmtIST(l.created_at)}</td>
            <td>${esc(l.action)}</td>
            <td>${esc(l.entity)}</td>
            <td>${esc(JSON.stringify(l.detail))}</td>
            <td class="mono">${esc(l.ip || "—")}</td>
          </tr>`).join("")}
      </tbody>
    </table>
  `;
}

// ==================================================================== activity feed (login/logout/signup)

async function renderActivity() {
  const view = document.getElementById("view");
  view.innerHTML = `<header class="page-head"><h1>Activity</h1></header>
    <p style="color:var(--text-dim);font-size:13px;">Recent sign-ins, sign-ups, and admin logins, with the originating IP address.</p>
    <div id="activityWrap">${LOADING}</div>`;
  const logs = await Api.activity();
  const wrap = document.getElementById("activityWrap");
  if (!logs.length) {
    wrap.innerHTML = `<div class="empty-state">No activity recorded yet.</div>`;
    return;
  }
  wrap.innerHTML = `
    <table>
      <thead><tr><th>When (IST)</th><th>Action</th><th>Who</th><th>Email</th><th>IP Address</th></tr></thead>
      <tbody>
        ${logs.map(l => `
          <tr>
            <td>${fmtIST(l.at)}</td>
            <td><span class="badge ${l.action === "logout" ? "off" : "on"}">${esc(l.action)}</span></td>
            <td>${esc(l.who || "—")}</td>
            <td>${esc(l.email || "—")}</td>
            <td class="mono">${esc(l.ip || "—")}</td>
          </tr>`).join("")}
      </tbody>
    </table>
  `;
}

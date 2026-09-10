routes.bookings = renderBookings;

const BOOKING_STATUSES = ["enquiry", "advance_pending", "confirmed", "completed", "cancelled"];
const BOOKING_STATUS_LABELS = {
  enquiry: "Enquiry", advance_pending: "Advance Pending", confirmed: "Confirmed",
  completed: "Completed", cancelled: "Cancelled",
};

async function renderBookings() {
  const view = document.getElementById("view");
  view.innerHTML = `<header class="page-head"><h1>Bookings</h1></header><div id="bookingsWrap">${LOADING}</div>`;
  const bookings = await Api.bookings();
  window._BOOKINGS_CACHE = bookings;
  const wrap = document.getElementById("bookingsWrap");
  if (!bookings.length) {
    wrap.innerHTML = `<div class="empty-state">No bookings yet.</div>`;
    return;
  }
  wrap.innerHTML = `
    <table>
      <thead><tr><th>Customer</th><th>Phone</th><th>Service Booked</th><th>Event Date</th><th>Slot</th><th>Advance Paid</th><th>Status</th><th>Created</th><th></th></tr></thead>
      <tbody>
        ${bookings.map(b => {
          const details = b.details || {};
          const serviceLabel = [details.category, details.package, details.tier].filter(Boolean).join(" — ") || "—";
          return `
          <tr>
            <td>${esc(b.customer_name)}</td>
            <td>${esc(b.customer_phone)}</td>
            <td>${esc(serviceLabel)}</td>
            <td>${b.event_date || "—"}</td>
            <td>${esc(b.slot || "—")}</td>
            <td>₹${b.advance_paid}</td>
            <td><select onchange="updateBookingStatus('${b.id}', this.value)">
              ${BOOKING_STATUSES.map(s => `<option value="${s}" ${s === b.status ? "selected" : ""}>${s.replace("_", " ")}</option>`).join("")}
            </select></td>
            <td>${fmtIST(b.created_at)}</td>
            <td class="actions"><button class="btn secondary" onclick="viewBooking('${b.id}')">View</button></td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>
  `;
}

async function updateBookingStatus(id, status) {
  try { await Api.updateBookingStatus(id, status); }
  catch (err) { alert(err.message); renderBookings(); }
}

/* ---------------------------------------------------------------- detail modal */

const BK_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* "YYYY-MM-DD" -> {day:"24", mon:"Sep"} without going through Date/timezone
   conversion, since these are plain calendar dates with no time component. */
function bkDayBadge(isoDate) {
  if (!isoDate) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!m) return null;
  return { day: m[3], mon: BK_MONTHS[Number(m[2]) - 1] || "" };
}

/* Each row in details.event_schedule was built client-side (booking-form.js)
   as "<Event Type> — <YYYY-MM-DD>, <start> – <end>" - split it back apart so
   every event can render as its own dated card instead of one raw string. */
function bkParseEventRow(raw) {
  const m = /^(.*?)\s—\s(\d{4}-\d{2}-\d{2}),\s*(.+)$/.exec(raw || "");
  if (!m) return { type: raw || "Event", date: null, time: "" };
  return { type: m[1], date: m[2], time: m[3] };
}

/* Category slugs ("baby-shoot", "pre_wedding") -> a readable event-type label
   ("Baby Shoot", "Pre Wedding") for the single-event schedule card, so it says
   what kind of shoot this is instead of just repeating the package title. */
function bkTitleCase(slug) {
  if (!slug) return "";
  return slug.split(/[-_\s]+/).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function bkField(label, value, mono) {
  if (value == null || value === "" || value === "—") return "";
  return `<div class="bk-field"><span>${esc(label)}</span><b${mono ? ' class="mono"' : ""}>${esc(value)}</b></div>`;
}

function bkEventCard(type, isoDate, time) {
  const badge = bkDayBadge(isoDate);
  return `
    <div class="bk-event-card">
      <div class="bk-event-daybox">
        ${badge ? `<span class="bk-event-day">${esc(badge.day)}</span><span class="bk-event-mon">${esc(badge.mon)}</span>` : `<span class="bk-event-mon">TBD</span>`}
      </div>
      <div class="bk-event-body">
        <b>${esc(type)}</b>
        ${time ? `<span>${esc(time)}</span>` : ""}
      </div>
    </div>`;
}

function viewBooking(id) {
  const b = window._BOOKINGS_CACHE.find(x => x.id === id);
  if (!b) return;
  const details = b.details || {};
  const eventSchedule = Array.isArray(details.event_schedule) ? details.event_schedule : [];
  const equipTags = (details.equipments || "").split(",").map(s => s.trim()).filter(Boolean);
  const statusLabel = BOOKING_STATUS_LABELS[b.status] || b.status;

  const eventsHTML = eventSchedule.length
    ? eventSchedule.map(row => { const e = bkParseEventRow(row); return bkEventCard(e.type, e.date, e.time); }).join("")
    : bkEventCard(bkTitleCase(details.category) || "Photography Shoot", b.event_date, b.slot || "");

  openModal(`
    <div class="bk-modal-head">
      <div>
        ${details.category ? `<span class="bk-kicker">${esc(details.category)}${details.tier ? ` &middot; ${esc(details.tier)}` : ""}</span>` : ""}
        <h2>${esc(details.package || "Photography Booking")}</h2>
      </div>
      <span class="bk-status-badge bk-status-${esc(b.status)}">${esc(statusLabel)}</span>
    </div>
    <p class="bk-meta">Booked ${fmtIST(b.created_at)} &middot; <span class="mono">${esc(b.id)}</span></p>

    <div class="bk-section">
      <h3 class="bk-section-title">Customer</h3>
      <div class="bk-grid-2">
        ${bkField("Name", b.customer_name)}
        ${bkField("Phone", b.customer_phone)}
        ${bkField("Email", b.customer_email)}
        ${bkField("Account", b.user_id, true)}
      </div>
    </div>

    <div class="bk-section">
      <h3 class="bk-section-title">Schedule</h3>
      <div class="bk-events">${eventsHTML}</div>
    </div>

    ${details.venue && details.venue !== "—" ? `
    <div class="bk-section">
      <h3 class="bk-section-title">Venue / Address</h3>
      <p class="bk-venue">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>
        ${esc(details.venue)}
      </p>
    </div>` : ""}

    ${equipTags.length ? `
    <div class="bk-section">
      <h3 class="bk-section-title">Add-ons / Equipment</h3>
      <div class="bk-tags">${equipTags.map(t => `<span class="bk-tag">${esc(t)}</span>`).join("")}</div>
    </div>` : ""}

    ${details.message && details.message !== "—" ? `
    <div class="bk-section">
      <h3 class="bk-section-title">Requirements / Message</h3>
      <p class="bk-quote">${esc(details.message)}</p>
    </div>` : ""}

    <div class="bk-section">
      <h3 class="bk-section-title">Package &amp; Payment</h3>
      <div class="bk-grid-2">
        ${bkField("Package Price", details.price)}
        ${bkField("Advance Paid", b.advance_paid ? fmtINR(b.advance_paid) : "₹0")}
        ${bkField("Product ID", b.product_id, true)}
      </div>
    </div>

    <div class="modal-actions">
      <button type="button" class="btn secondary" onclick="closeModal()">Close</button>
    </div>
  `, true);
}

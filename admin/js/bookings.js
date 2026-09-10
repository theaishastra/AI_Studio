routes.bookings = renderBookings;

const BOOKING_STATUSES = ["enquiry", "advance_pending", "confirmed", "completed", "cancelled"];

async function renderBookings() {
  const view = document.getElementById("view");
  view.innerHTML = `<header class="page-head"><h1>Bookings</h1></header><div id="bookingsWrap">${LOADING}</div>`;
  const bookings = await Api.bookings();
  const wrap = document.getElementById("bookingsWrap");
  if (!bookings.length) {
    wrap.innerHTML = `<div class="empty-state">No bookings yet.</div>`;
    return;
  }
  wrap.innerHTML = `
    <table>
      <thead><tr><th>Customer</th><th>Phone</th><th>Event Date</th><th>Slot</th><th>Advance Paid</th><th>Status</th><th>Created</th></tr></thead>
      <tbody>
        ${bookings.map(b => `
          <tr>
            <td>${esc(b.customer_name)}</td>
            <td>${esc(b.customer_phone)}</td>
            <td>${b.event_date || "—"}</td>
            <td>${esc(b.slot || "—")}</td>
            <td>₹${b.advance_paid}</td>
            <td><select onchange="updateBookingStatus('${b.id}', this.value)">
              ${BOOKING_STATUSES.map(s => `<option value="${s}" ${s === b.status ? "selected" : ""}>${s.replace("_", " ")}</option>`).join("")}
            </select></td>
            <td>${fmtIST(b.created_at)}</td>
          </tr>`).join("")}
      </tbody>
    </table>
  `;
}

async function updateBookingStatus(id, status) {
  try { await Api.updateBookingStatus(id, status); }
  catch (err) { alert(err.message); renderBookings(); }
}

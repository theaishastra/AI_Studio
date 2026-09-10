
    const BOOKING_STATUS_LABELS = {
      enquiry: 'Enquiry Received',
      advance_pending: 'Advance Pending',
      confirmed: 'Confirmed',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };

    let bookingsPageLoginEmail = '';

    function refreshCartBadge() {
      let totalQty = 0;
      try {
        const cart = JSON.parse(localStorage.getItem('sai_studio_cart')) || {};
        totalQty = Object.values(cart).reduce((sum, item) => sum + (item.qty || 0), 0);
      } catch (e) {}
      [document.getElementById('navCartBadge'), document.getElementById('bottomNavCartBadge')].forEach(el => {
        if (!el) return;
        el.textContent = totalQty;
        el.style.display = totalQty > 0 ? 'flex' : 'none';
      });
    }

    function initMyBookingsPage() {
      refreshCartBadge();
      if (isCustomerLoggedIn()) {
        showBookingsPageList();
      } else {
        resetBookingsLoginGate();
      }
    }

    function resetBookingsLoginGate() {
      document.getElementById('bookingsLoginGate').style.display = 'block';
      document.getElementById('bookingsListSection').style.display = 'none';
      bookingsPageLoginEmail = getCustomerEmail() || '';
      document.getElementById('bookingsLoginEmail').value = bookingsPageLoginEmail;
      document.getElementById('bookingsLoginOtp').value = '';
      document.getElementById('bookingsLoginMsg').style.display = 'none';
      document.getElementById('bookingsLoginEmailStep').style.display = 'block';
      document.getElementById('bookingsLoginOtpStep').style.display = 'none';
    }

    function backToBookingsEmailStep() {
      document.getElementById('bookingsLoginEmailStep').style.display = 'block';
      document.getElementById('bookingsLoginOtpStep').style.display = 'none';
      document.getElementById('bookingsLoginMsg').style.display = 'none';
    }

    async function sendBookingsPageOtp() {
      const email = document.getElementById('bookingsLoginEmail').value.trim();
      const msgEl = document.getElementById('bookingsLoginMsg');
      msgEl.style.display = 'none';

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        msgEl.textContent = 'Please enter a valid email address.';
        msgEl.style.display = 'block';
        return;
      }

      const btn = document.getElementById('bookingsSendOtpBtn');
      btn.disabled = true;
      try {
        await CustomerAuth.requestOtp(email);
        bookingsPageLoginEmail = email;
        document.getElementById('bookingsOtpSentTo').textContent = `(sent to ${email})`;
        document.getElementById('bookingsLoginEmailStep').style.display = 'none';
        document.getElementById('bookingsLoginOtpStep').style.display = 'block';
        document.getElementById('bookingsLoginOtp').focus();
      } catch (err) {
        msgEl.textContent = err.message || 'Could not send the OTP. Please try again.';
        msgEl.style.display = 'block';
      } finally {
        btn.disabled = false;
      }
    }

    async function verifyBookingsPageOtp() {
      const code = document.getElementById('bookingsLoginOtp').value.trim();
      const msgEl = document.getElementById('bookingsLoginMsg');
      msgEl.style.display = 'none';

      if (!/^\d{6}$/.test(code)) {
        msgEl.textContent = 'Please enter the 6-digit code.';
        msgEl.style.display = 'block';
        return;
      }

      const btn = document.getElementById('bookingsVerifyOtpBtn');
      btn.disabled = true;
      try {
        await CustomerAuth.verifyOtp(bookingsPageLoginEmail, code);
        window.SaiAuthNav?.refresh();
        await showBookingsPageList();
      } catch (err) {
        msgEl.textContent = err.message || 'That code didn’t work. Please try again.';
        msgEl.style.display = 'block';
      } finally {
        btn.disabled = false;
      }
    }

    async function showBookingsPageList() {
      document.getElementById('bookingsLoginGate').style.display = 'none';
      document.getElementById('bookingsListSection').style.display = 'block';
      const wrap = document.getElementById('bookingsListWrap');
      wrap.innerHTML = '<div class="orders-loading">Loading your bookings&hellip;</div>';
      try {
        const bookings = await CustomerAuth.myBookings();
        renderBookingsPageList(bookings);
      } catch (err) {
        wrap.innerHTML = `<div class="cart-form-msg" style="display:block;">${err.message || 'Could not load your bookings.'}</div>`;
      }
    }

    function renderBookingsPageList(bookings) {
      const wrap = document.getElementById('bookingsListWrap');
      if (!bookings.length) {
        wrap.innerHTML = `
          <div class="cart-empty-state">
            <h2>No photography bookings yet</h2>
            <p>Once you book a shoot, it'll show up here.</p>
            <a href="photography.html" class="cart-continue-btn">Browse Photography Packages</a>
          </div>`;
        return;
      }
      wrap.innerHTML = bookings.map(bookingCardHTML).join('');
    }

    function escapeBookingHTML(s) {
      const d = document.createElement('div');
      d.textContent = s == null ? '' : s;
      return d.innerHTML;
    }

    function bookingCardHTML(booking) {
      const bookedOn = new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const statusLabel = BOOKING_STATUS_LABELS[booking.status] || booking.status;
      const details = booking.details || {};
      const pkg = details.package || 'Photography Booking';
      const tier = details.tier ? ` (${details.tier})` : '';

      const rows = [];
      if (Array.isArray(details.event_schedule) && details.event_schedule.length) {
        details.event_schedule.forEach(ev => rows.push(['Event', ev]));
      } else if (booking.event_date) {
        const eventDate = new Date(booking.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        rows.push(['Event Date', booking.slot ? `${eventDate}, ${booking.slot}` : eventDate]);
      }
      if (details.venue && details.venue !== '—') rows.push(['Venue', details.venue]);
      if (details.equipments) rows.push(['Add-ons', details.equipments]);

      const rowsHTML = rows.map(([label, value]) => `
        <div class="order-item-row">
          <span>${escapeBookingHTML(label)}</span>
          <span>${escapeBookingHTML(value)}</span>
        </div>`).join('');

      const advanceHTML = booking.advance_paid > 0 ? `
        <div class="order-card-total">
          <span>Advance Paid</span>
          <span>&#8377;${Math.round(booking.advance_paid)}</span>
        </div>` : '';

      return `
        <div class="order-card">
          <div class="order-card-head">
            <div>
              <span class="order-number">${escapeBookingHTML(pkg)}${escapeBookingHTML(tier)}</span>
              <span class="order-date">Booked on ${bookedOn}</span>
            </div>
            <span class="order-status-badge order-status-${booking.status}">${statusLabel}</span>
          </div>
          <div class="order-items-list">${rowsHTML}</div>
          ${advanceHTML}
        </div>`;
    }

    function bookingsPageLogout() {
      CustomerAuth.logout();
      window.SaiAuthNav?.refresh();
      resetBookingsLoginGate();
    }

    window.addEventListener('DOMContentLoaded', initMyBookingsPage);

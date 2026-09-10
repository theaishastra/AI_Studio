
    const ORDER_STATUS_LABELS = {
      created: 'Created',
      payment_pending: 'Awaiting Payment',
      cod_confirmed: 'Confirmed (Cash on Delivery)',
      paid: 'Paid',
      in_production: 'In Production',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
    };

    const CANCELLATION_REASONS = [
      { value: 'changed_mind', label: 'Changed my mind' },
      { value: 'found_better_price', label: 'Found a better price elsewhere' },
      { value: 'ordered_by_mistake', label: 'Ordered by mistake' },
      { value: 'delivery_time_too_long', label: 'Delivery time is too long' },
      { value: 'product_defect_expected', label: 'Worried about a product defect' },
      { value: 'duplicate_order', label: 'Accidentally placed twice' },
      { value: 'other', label: 'Other' },
    ];

    let ordersLoginEmail = '';
    let _myOrders = [];
    let _expandedOrderId = null;

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

    function initMyOrdersPage() {
      refreshCartBadge();
      if (isCustomerLoggedIn()) {
        showOrdersList();
      } else {
        resetOrdersLoginGate();
      }
    }

    function resetOrdersLoginGate() {
      document.getElementById('ordersLoginGate').style.display = 'block';
      document.getElementById('ordersListSection').style.display = 'none';
      ordersLoginEmail = getCustomerEmail() || '';
      document.getElementById('ordersLoginEmail').value = ordersLoginEmail;
      document.getElementById('ordersLoginOtp').value = '';
      document.getElementById('ordersLoginMsg').style.display = 'none';
      document.getElementById('ordersLoginEmailStep').style.display = 'block';
      document.getElementById('ordersLoginOtpStep').style.display = 'none';
    }

    function backToOrdersEmailStep() {
      document.getElementById('ordersLoginEmailStep').style.display = 'block';
      document.getElementById('ordersLoginOtpStep').style.display = 'none';
      document.getElementById('ordersLoginMsg').style.display = 'none';
    }

    async function sendOrdersOtp() {
      const email = document.getElementById('ordersLoginEmail').value.trim();
      const msgEl = document.getElementById('ordersLoginMsg');
      msgEl.style.display = 'none';

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        msgEl.textContent = 'Please enter a valid email address.';
        msgEl.style.display = 'block';
        return;
      }

      const btn = document.getElementById('ordersSendOtpBtn');
      btn.disabled = true;
      try {
        await CustomerAuth.requestOtp(email);
        ordersLoginEmail = email;
        document.getElementById('ordersOtpSentTo').textContent = `(sent to ${email})`;
        document.getElementById('ordersLoginEmailStep').style.display = 'none';
        document.getElementById('ordersLoginOtpStep').style.display = 'block';
        document.getElementById('ordersLoginOtp').focus();
      } catch (err) {
        msgEl.textContent = err.message || 'Could not send the OTP. Please try again.';
        msgEl.style.display = 'block';
      } finally {
        btn.disabled = false;
      }
    }

    async function verifyOrdersOtp() {
      const code = document.getElementById('ordersLoginOtp').value.trim();
      const msgEl = document.getElementById('ordersLoginMsg');
      msgEl.style.display = 'none';

      if (!/^\d{6}$/.test(code)) {
        msgEl.textContent = 'Please enter the 6-digit code.';
        msgEl.style.display = 'block';
        return;
      }

      const btn = document.getElementById('ordersVerifyOtpBtn');
      btn.disabled = true;
      try {
        await CustomerAuth.verifyOtp(ordersLoginEmail, code);
        window.SaiAuthNav?.refresh();
        await showOrdersList();
      } catch (err) {
        msgEl.textContent = err.message || 'That code didn’t work. Please try again.';
        msgEl.style.display = 'block';
      } finally {
        btn.disabled = false;
      }
    }

    async function showOrdersList() {
      document.getElementById('ordersLoginGate').style.display = 'none';
      document.getElementById('ordersListSection').style.display = 'block';
      const wrap = document.getElementById('ordersListWrap');
      wrap.innerHTML = '<div class="orders-loading">Loading your orders&hellip;</div>';
      try {
        _myOrders = await CustomerAuth.myOrders();
        renderOrdersList(_myOrders);
      } catch (err) {
        wrap.innerHTML = `<div class="cart-form-msg" style="display:block;">${err.message || 'Could not load your orders.'}</div>`;
      }
    }

    function renderOrdersList(orders) {
      const wrap = document.getElementById('ordersListWrap');
      if (!orders.length) {
        wrap.innerHTML = `
          <div class="cart-empty-state">
            <h2>No orders yet</h2>
            <p>Once you place an order, it'll show up here.</p>
            <a href="index.html" class="cart-continue-btn">Start Shopping</a>
          </div>`;
        return;
      }
      wrap.innerHTML = orders.map(orderCardHTML).join('');
    }

    function escapeOrdHTML(s) {
      const d = document.createElement('div');
      d.textContent = s == null ? '' : s;
      return d.innerHTML;
    }

    function fmtOrdDate(iso) {
      return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function fmtOrdDateTime(iso) {
      return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
    }

    function orderCardHTML(order) {
      const date = fmtOrdDate(order.created_at);
      const statusLabel = ORDER_STATUS_LABELS[order.status] || order.status;
      const itemsHTML = order.items.map(item => `
        <div class="order-item-row">
          <span>${escapeOrdHTML(item.product_snapshot.title || 'Item')} &times;${item.qty}</span>
          <span>&#8377;${Math.round(item.unit_price * item.qty)}</span>
        </div>`).join('');

      const pendingCancel = (order.cancellation_requests || []).find(r => r.status === 'pending');
      const pendingAddr = (order.address_change_requests || []).find(r => r.status === 'pending');
      const expanded = _expandedOrderId === order.id;

      return `
        <div class="order-card">
          <div class="order-card-head">
            <div>
              <span class="order-number">Order ${escapeOrdHTML(order.number)}</span>
              <span class="order-date">${date}</span>
            </div>
            <span class="order-status-badge order-status-${order.status}">${statusLabel}</span>
          </div>
          <div class="order-items-list">${itemsHTML}</div>
          <div class="order-card-total">
            <span>Total</span>
            <span>&#8377;${Math.round(order.total)}</span>
          </div>

          ${orderShipmentSummaryHTML(order)}

          ${pendingCancel ? `<div class="order-request-note">Cancellation requested &mdash; awaiting review.</div>` : ''}
          ${pendingAddr ? `<div class="order-request-note">Address change requested &mdash; awaiting review.</div>` : ''}

          <div class="order-card-actions">
            ${(order.tracking_events || []).length ? `
              <button type="button" class="btn-secondary-cart" onclick="toggleOrderTimeline('${order.id}')">${expanded ? 'Hide Tracking' : 'Track Order'}</button>` : ''}
            ${order.can_cancel ? `<button type="button" class="btn-secondary-cart order-cancel-btn" onclick="openCancelOrderModal('${order.id}')">Cancel Order</button>` : ''}
            ${order.can_request_address_change ? `<button type="button" class="btn-secondary-cart" onclick="openAddressChangeModal('${order.id}')">Change Address</button>` : ''}
          </div>
          ${order.can_request_address_change && order.address_change_deadline ? `
            <div class="order-deadline-note">Address changes accepted until ${fmtOrdDateTime(order.address_change_deadline)}.</div>` : ''}

          ${expanded ? orderTimelineHTML(order) : ''}
        </div>`;
    }

    function orderShipmentSummaryHTML(order) {
      if (!order.carrier && !order.tracking_number && !order.expected_delivery) return '';
      const parts = [];
      if (order.carrier) parts.push(`Carrier: <b>${escapeOrdHTML(order.carrier)}</b>`);
      if (order.tracking_number) {
        parts.push(order.tracking_url
          ? `Tracking #: <a href="${escapeOrdHTML(order.tracking_url)}" target="_blank" rel="noopener"><b>${escapeOrdHTML(order.tracking_number)}</b></a>`
          : `Tracking #: <b>${escapeOrdHTML(order.tracking_number)}</b>`);
      }
      if (order.expected_delivery) parts.push(`Expected by <b>${fmtOrdDate(order.expected_delivery)}</b>`);
      return `<div class="order-shipment-summary">${parts.join(' &middot; ')}</div>`;
    }

    function orderTimelineHTML(order) {
      const events = order.tracking_events || [];
      if (!events.length) return '';
      return `
        <div class="order-timeline">
          ${events.map(ev => `
            <div class="order-timeline-event">
              <span class="order-timeline-dot"></span>
              <div class="order-timeline-body">
                <div class="order-timeline-head"><b>${escapeOrdHTML(ev.title)}</b><span>${fmtOrdDateTime(ev.created_at)}</span></div>
                ${ev.description ? `<p>${escapeOrdHTML(ev.description)}</p>` : ''}
                ${ev.location ? `<span class="order-timeline-loc">${escapeOrdHTML(ev.location)}</span>` : ''}
              </div>
            </div>`).join('')}
        </div>`;
    }

    function toggleOrderTimeline(orderId) {
      _expandedOrderId = _expandedOrderId === orderId ? null : orderId;
      renderOrdersList(_myOrders);
    }

    /* ---------- shared lightweight modal ---------- */

    function openOrdersModal(html) {
      closeOrdersModal();
      const overlay = document.createElement('div');
      overlay.className = 'order-modal-overlay show';
      overlay.id = 'ordersModalOverlay';
      overlay.innerHTML = `<div class="order-modal">${html}</div>`;
      overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOrdersModal(); });
      document.body.appendChild(overlay);
    }

    function closeOrdersModal() {
      document.getElementById('ordersModalOverlay')?.remove();
    }

    /* ---------- cancel order ---------- */

    function openCancelOrderModal(orderId) {
      openOrdersModal(`
        <h3 class="panel-title">Cancel Order</h3>
        <div id="cancelOrderMsg" class="cart-form-msg" style="display:none;"></div>
        <label class="cart-field-label">Reason for cancelling</label>
        <select id="cancelReasonSelect" class="cart-field-input">
          ${CANCELLATION_REASONS.map(r => `<option value="${r.value}">${escapeOrdHTML(r.label)}</option>`).join('')}
        </select>
        <label class="cart-field-label">Anything else we should know? (optional)</label>
        <textarea id="cancelReasonNote" class="cart-field-input" rows="3"></textarea>
        <div class="cart-step-actions">
          <button type="button" class="btn-secondary-cart" onclick="closeOrdersModal()">Keep Order</button>
          <button type="button" class="btn-primary-cart" id="cancelOrderSubmitBtn" onclick="submitCancelOrder('${orderId}')">Submit Cancellation</button>
        </div>
      `);
    }

    async function submitCancelOrder(orderId) {
      const reason = document.getElementById('cancelReasonSelect').value;
      const note = document.getElementById('cancelReasonNote').value.trim();
      const msgEl = document.getElementById('cancelOrderMsg');
      const btn = document.getElementById('cancelOrderSubmitBtn');
      btn.disabled = true;
      try {
        const updated = await CustomerAuth.requestCancellation(orderId, reason, note);
        _myOrders = _myOrders.map(o => o.id === updated.id ? updated : o);
        closeOrdersModal();
        renderOrdersList(_myOrders);
      } catch (err) {
        msgEl.textContent = err.message || 'Could not submit your cancellation. Please try again.';
        msgEl.style.display = 'block';
      } finally {
        btn.disabled = false;
      }
    }

    /* ---------- address change ---------- */

    function openAddressChangeModal(orderId) {
      openOrdersModal(`
        <h3 class="panel-title">Change Delivery Address</h3>
        <p class="cart-login-sub">This will be reviewed by our team before it's applied to your order.</p>
        <div id="addrChangeMsg" class="cart-form-msg" style="display:none;"></div>
        <label class="cart-field-label">Full Name</label>
        <input id="ac_full_name" class="cart-field-input">
        <label class="cart-field-label">Phone</label>
        <input id="ac_phone" class="cart-field-input" inputmode="numeric" maxlength="10">
        <label class="cart-field-label">Address Line 1</label>
        <input id="ac_line1" class="cart-field-input">
        <label class="cart-field-label">Address Line 2 (optional)</label>
        <input id="ac_line2" class="cart-field-input">
        <label class="cart-field-label">City</label>
        <input id="ac_city" class="cart-field-input">
        <label class="cart-field-label">State</label>
        <input id="ac_state" class="cart-field-input">
        <label class="cart-field-label">Pincode</label>
        <input id="ac_pincode" class="cart-field-input" inputmode="numeric" maxlength="6">
        <label class="cart-field-label">Note for our team (optional)</label>
        <textarea id="ac_note" class="cart-field-input" rows="2"></textarea>
        <div class="cart-step-actions">
          <button type="button" class="btn-secondary-cart" onclick="closeOrdersModal()">Cancel</button>
          <button type="button" class="btn-primary-cart" id="addrChangeSubmitBtn" onclick="submitAddressChange('${orderId}')">Submit Request</button>
        </div>
      `);
    }

    async function submitAddressChange(orderId) {
      const msgEl = document.getElementById('addrChangeMsg');
      msgEl.style.display = 'none';

      const data = {
        full_name: document.getElementById('ac_full_name').value.trim(),
        phone: document.getElementById('ac_phone').value.trim(),
        line1: document.getElementById('ac_line1').value.trim(),
        line2: document.getElementById('ac_line2').value.trim() || null,
        city: document.getElementById('ac_city').value.trim(),
        state: document.getElementById('ac_state').value.trim(),
        pincode: document.getElementById('ac_pincode').value.trim(),
        note: document.getElementById('ac_note').value.trim(),
      };

      if (data.full_name.length < 2 || !/^[6-9]\d{9}$/.test(data.phone) || data.line1.length < 3 ||
          data.city.length < 2 || data.state.length < 2 || !/^\d{6}$/.test(data.pincode)) {
        msgEl.textContent = 'Please fill in all required fields correctly.';
        msgEl.style.display = 'block';
        return;
      }

      const btn = document.getElementById('addrChangeSubmitBtn');
      btn.disabled = true;
      try {
        const updated = await CustomerAuth.requestAddressChange(orderId, data);
        _myOrders = _myOrders.map(o => o.id === updated.id ? updated : o);
        closeOrdersModal();
        renderOrdersList(_myOrders);
      } catch (err) {
        msgEl.textContent = err.message || 'Could not submit your request. Please try again.';
        msgEl.style.display = 'block';
      } finally {
        btn.disabled = false;
      }
    }

    function ordersLogout() {
      CustomerAuth.logout();
      window.SaiAuthNav?.refresh();
      resetOrdersLoginGate();
    }

    window.addEventListener('DOMContentLoaded', initMyOrdersPage);

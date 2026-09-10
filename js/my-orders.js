
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

    let ordersLoginEmail = '';

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
        const orders = await CustomerAuth.myOrders();
        renderOrdersList(orders);
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

    function orderCardHTML(order) {
      const date = new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const statusLabel = ORDER_STATUS_LABELS[order.status] || order.status;
      const itemsHTML = order.items.map(item => `
        <div class="order-item-row">
          <span>${item.product_snapshot.title || 'Item'} &times;${item.qty}</span>
          <span>&#8377;${Math.round(item.unit_price * item.qty)}</span>
        </div>`).join('');
      return `
        <div class="order-card">
          <div class="order-card-head">
            <div>
              <span class="order-number">Order ${order.number}</span>
              <span class="order-date">${date}</span>
            </div>
            <span class="order-status-badge order-status-${order.status}">${statusLabel}</span>
          </div>
          <div class="order-items-list">${itemsHTML}</div>
          <div class="order-card-total">
            <span>Total</span>
            <span>&#8377;${Math.round(order.total)}</span>
          </div>
        </div>`;
    }

    function ordersLogout() {
      CustomerAuth.logout();
      window.SaiAuthNav?.refresh();
      resetOrdersLoginGate();
    }

    window.addEventListener('DOMContentLoaded', initMyOrdersPage);

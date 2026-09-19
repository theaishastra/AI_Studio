
    const ORDER_STATUS_LABELS = {
      created: 'Created',
      payment_pending: 'Awaiting Payment',
      cod_confirmed: 'Confirmed (Cash on Delivery)',
      paid: 'Paid',
      in_production: 'Designing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
    };

    // Fixed, order-level milestone stages shown as a horizontal tracker -
    // distinct from the per-admin-checkpoint vertical event log below it.
    // cancelled/refunded orders don't map onto this line at all (see
    // orderStageTimelineHTML) since "how far did it get" isn't the point once
    // an order is called off.
    const STAGE_DEFS = [
      { key: 'placed', label: 'Order Placed', statuses: ['created', 'payment_pending'] },
      { key: 'confirmed', label: 'Order Confirmed', statuses: ['cod_confirmed', 'paid'] },
      { key: 'designing', label: 'Designing', statuses: ['in_production'] },
      { key: 'shipped', label: 'Shipped', statuses: ['shipped'] },
      { key: 'delivered', label: 'Delivered', statuses: ['delivered'] },
    ];

    function orderStageIndex(status) {
      return STAGE_DEFS.findIndex(s => s.statuses.includes(status));
    }

    const REFUND_STATUS_LABELS = {
      pending: 'Refund pending',
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

    /* ---------- item + personalisation rendering ----------
       Storefront pages each record the customer's configuration under their own
       field names (gifts.js/studio.js: photoData/text, corporate.js:
       logoData/engravingText), and every one of them lands verbatim in the order
       item's product_snapshot.customization. Rather than a fixed per-page list,
       the artwork and the message are pulled by known aliases and EVERY other
       scalar the page happened to save is listed as a spec row, so no option a
       customer picked silently disappears from their order history. */

    const CUSTOM_IMAGE_FIELDS = ['photoData', 'logoData', 'imageData', 'artworkData'];
    const CUSTOM_TEXT_FIELDS = ['text', 'engravingText', 'message', 'customText'];

    // Rendered separately (artwork, message) or pure live-preview/internal state
    // with nothing meaningful to tell the customer after the fact (which
    // rendering path the 3D preview used, echoing the product name back, etc).
    // `fields`/`fieldLabels` (Product.input_fields answers) are unpacked
    // separately below rather than hidden entirely.
    const CUSTOM_HIDDEN_FIELDS = new Set([
      ...CUSTOM_IMAGE_FIELDS, ...CUSTOM_TEXT_FIELDS,
      'photoCrop', 'rotationX', 'rotationY', 'zoom',
      'photoZoom', 'photoX', 'photoY', 'photoFit',
      'previewTemplate', 'previewMode', 'fields', 'fieldLabels',
    ]);

    function customFieldLabel(cust, fieldId) {
      return (cust && cust.fieldLabels && cust.fieldLabels[fieldId]) || fieldId;
    }

    function looksLikeUpload(value) {
      return typeof value === 'string' && (value.startsWith('data:') || /^https?:\/\//i.test(value));
    }

    const CUSTOM_FIELD_LABELS = {
      photoName: 'Uploaded File', logoName: 'Uploaded File', fileName: 'Uploaded File',
      finish: 'Finish', technique: 'Technique', color: 'Colour', accent: 'Accent Colour',
      textStyle: 'Text Style', photoLayout: 'Photo Layout', shape: 'Shape',
      size: 'Size', thickness: 'Thickness', stand: 'Stand', background: 'Background',
      lighting: 'Lighting', shadow: 'Shadow', quantity: 'Quantity', purpose: 'Purpose',
      notes: 'Notes', acrylic: 'Acrylic',
    };

    function prettyCustomLabel(key) {
      return CUSTOM_FIELD_LABELS[key] || String(key)
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    }

    function escapeOrdAttr(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
        .replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // Items were saved by whichever page added them, using the image path that
    // page used at the time ("assets/...", "corporate-assets/..."). Only
    // "photography-assets/" actually ships, so old paths are remapped exactly
    // the way the cart page remaps them.
    function resolveOrderImagePath(img) {
      if (!img) return '';
      return String(img).replace(/^(assets|corporate-assets)\//, 'photography-assets/');
    }

    function orderItemUploadedImage(cust) {
      if (!cust) return '';
      for (const field of CUSTOM_IMAGE_FIELDS) {
        const value = cust[field];
        if (typeof value === 'string' && (value.startsWith('data:image/') || /^https?:\/\//.test(value))) return value;
      }
      const fields = cust.fields;
      if (fields && typeof fields === 'object') {
        for (const value of Object.values(fields)) {
          const candidates = Array.isArray(value) ? value : [value];
          const hit = candidates.find(v => typeof v === 'string' && (v.startsWith('data:image/') || /^https?:\/\//.test(v)));
          if (hit) return hit;
        }
      }
      return '';
    }

    function orderItemCustomText(cust) {
      if (!cust) return '';
      for (const field of CUSTOM_TEXT_FIELDS) {
        const value = cust[field];
        if (typeof value === 'string' && value.trim()) return value.trim();
      }
      return '';
    }

    // Most customization fields are flat scalars, but a few (studio.js's
    // acrylic frame options: shape/size/stand/background...) are saved as one
    // nested object. Flattening one level in, with the parent name prefixed
    // onto each label, is what stops that whole group silently vanishing from
    // the order instead of just being unreadable.
    function orderItemCustomSpecs(cust) {
      if (!cust || typeof cust !== 'object') return [];
      const specs = [];
      Object.entries(cust).forEach(([key, value]) => {
        if (CUSTOM_HIDDEN_FIELDS.has(key) || value == null) return;
        if (typeof value === 'string' || typeof value === 'number') {
          const str = String(value).trim();
          if (str && !str.startsWith('data:')) specs.push([prettyCustomLabel(key), str]);
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          const prefix = prettyCustomLabel(key);
          Object.entries(value).forEach(([subKey, subValue]) => {
            if (typeof subValue !== 'string' && typeof subValue !== 'number') return;
            const str = String(subValue).trim();
            if (str) specs.push([`${prefix} ${prettyCustomLabel(subKey)}`, str]);
          });
        }
      });
      const fields = cust.fields;
      if (fields && typeof fields === 'object') {
        Object.entries(fields).forEach(([fieldId, value]) => {
          if (value == null || value === '') return;
          const label = customFieldLabel(cust, fieldId);
          if (Array.isArray(value)) {
            const text = value.filter(v => typeof v === 'string' && !looksLikeUpload(v)).join(', ');
            if (text) specs.push([label, text]);
          } else if (typeof value === 'string' && !looksLikeUpload(value)) {
            specs.push([label, value]);
          }
        });
      }
      return specs;
    }

    const ITEM_STATUS_LABELS = {
      cancel_requested: 'Cancellation requested',
      cancelled: 'Cancelled',
    };

    function orderItemHTML(item, order) {
      const snapshot = item.product_snapshot || {};
      const title = snapshot.title || 'Item';
      const image = resolveOrderImagePath(snapshot.image);
      const customization = snapshot.customization || null;
      const uploaded = orderItemUploadedImage(customization);
      const customText = orderItemCustomText(customization);
      const specs = orderItemCustomSpecs(customization);
      const lineTotal = Math.round(item.unit_price * item.qty);
      const itemStatus = item.status || 'active';
      const activeCount = (order.items || []).filter(i => (i.status || 'active') === 'active').length;
      // Reasons mirror the order-level Cancel Order button below - an item can
      // only be cancelled on its own while it's still active AND the order as
      // a whole is still cancellable AND it isn't the last item left (the
      // backend requires cancelling the whole order at that point instead).
      let itemCancelDisabledReason = '';
      if (!order.can_cancel) {
        itemCancelDisabledReason = ['in_production', 'shipped', 'delivered', 'cancelled', 'refunded'].includes(order.status)
          ? 'This order can no longer be cancelled once it enters production'
          : 'A cancellation request is already pending for this order';
      } else if (activeCount <= 1) {
        itemCancelDisabledReason = 'This is the last item — cancel the whole order instead';
      }
      const canCancelThisItem = itemStatus === 'active' && !itemCancelDisabledReason;

      const personalisation = (uploaded || customText || specs.length) ? `
        <div class="order-item-custom">
          <span class="order-item-custom-title">&#10003; Personalisation</span>
          <div class="order-item-custom-body">
            ${uploaded ? `
              <figure class="order-custom-photo-wrap">
                <img class="order-custom-photo" src="${escapeOrdAttr(uploaded)}" alt="Photo you uploaded for ${escapeOrdAttr(title)}" loading="lazy"
                     title="Click to view full size" onclick="openOrderImagePreview(this.src)">
                <figcaption class="order-custom-photo-label">Your upload</figcaption>
              </figure>` : ''}
            <div class="order-custom-fields">
              ${customText ? `<div class="order-custom-text">&ldquo;${escapeOrdHTML(customText)}&rdquo;</div>` : ''}
              ${specs.length ? `<dl class="order-custom-specs">${specs.map(([label, value]) => `
                <div class="order-custom-spec-row"><dt>${escapeOrdHTML(label)}</dt><dd>${escapeOrdHTML(value)}</dd></div>`).join('')}</dl>` : ''}
            </div>
          </div>
        </div>` : '';

      return `
        <div class="order-item-card${itemStatus !== 'active' ? ' order-item-inactive' : ''}">
          <div class="order-item-thumb">
            ${image
              ? `<img src="${escapeOrdAttr(image)}" alt="${escapeOrdAttr(title)}" loading="lazy" onerror="this.remove();">`
              : ''}
          </div>
          <div class="order-item-main">
            <h4 class="order-item-title">${escapeOrdHTML(title)}</h4>
            <div class="order-item-meta">
              <span>&#8377;${Math.round(item.unit_price)} each</span>
              <span class="order-item-dot">&middot;</span>
              <span>Qty ${item.qty}</span>
              ${ITEM_STATUS_LABELS[itemStatus] ? `<span class="order-item-dot">&middot;</span><span class="order-item-status order-item-status-${itemStatus}">${ITEM_STATUS_LABELS[itemStatus]}</span>` : ''}
            </div>
            ${item.notes ? `<p class="order-item-note">${escapeOrdHTML(item.notes)}</p>` : ''}
            ${personalisation}
            ${itemStatus === 'active' ? (canCancelThisItem
              ? `<button type="button" class="order-item-cancel-btn" onclick="openCancelItemModal('${order.id}', '${item.id}', '${escapeOrdAttr(title).replace(/'/g, "&#39;")}')">Cancel this item</button>`
              : `<button type="button" class="order-item-cancel-btn" disabled title="${escapeOrdAttr(itemCancelDisabledReason)}">Cancel this item</button>
                 <div class="order-action-reason">${escapeOrdHTML(itemCancelDisabledReason)}</div>`) : ''}
          </div>
          <div class="order-item-amount">&#8377;${lineTotal}</div>
        </div>`;
    }

    /* ---------- money summary / address / payment panels ---------- */

    function orderSummaryHTML(order) {
      const rows = [['Subtotal', `&#8377;${Math.round(order.subtotal)}`]];
      if (order.discount > 0) {
        const label = order.coupon_code ? `Discount (${escapeOrdHTML(order.coupon_code)})` : 'Discount';
        rows.push([label, `&minus;&#8377;${Math.round(order.discount)}`]);
      }
      return `
        <div class="order-amount-summary">
          ${rows.map(([label, value]) => `
            <div class="order-amount-row"><span>${label}</span><span>${value}</span></div>`).join('')}
          <div class="order-amount-row order-amount-total"><span>Total</span><span>&#8377;${Math.round(order.total)}</span></div>
        </div>`;
    }

    function orderAddressHTML(order) {
      const address = order.address;
      if (!address) {
        return `
          <div class="order-panel">
            <h5 class="order-panel-title">Delivery Address</h5>
            <p class="order-panel-empty">No delivery address is saved against this order.</p>
          </div>`;
      }
      const streetLines = [address.line1, address.line2].filter(Boolean);
      return `
        <div class="order-panel">
          <h5 class="order-panel-title">Delivery Address</h5>
          <p class="order-address-name">${escapeOrdHTML(address.full_name)}</p>
          ${streetLines.map(line => `<p class="order-address-line">${escapeOrdHTML(line)}</p>`).join('')}
          <p class="order-address-line">${escapeOrdHTML(address.city)}, ${escapeOrdHTML(address.state)} &ndash; ${escapeOrdHTML(address.pincode)}</p>
          <p class="order-address-line order-address-phone">Phone: ${escapeOrdHTML(address.phone)}</p>
          ${order.delivery_slot ? `<p class="order-address-line">Preferred slot: <b>${escapeOrdHTML(order.delivery_slot)}</b></p>` : ''}
        </div>`;
    }

    function orderPaymentHTML(order) {
      const payments = order.payments || [];
      const settled = payments.find(p => p.status === 'refunded') || payments.find(p => p.status === 'captured');
      let method = 'Online Payment';
      let state = 'Awaiting payment';

      if (order.status === 'cod_confirmed') {
        method = 'Cash on Delivery';
        state = 'Pay the delivery agent on arrival';
      } else if (settled && settled.status === 'refunded') {
        state = 'Refunded';
      } else if (settled) {
        state = 'Paid';
      } else if (payments.some(p => p.status === 'failed')) {
        state = 'Last payment attempt failed';
      }

      const refundLabel = REFUND_STATUS_LABELS[order.refund_status];

      return `
        <div class="order-panel">
          <h5 class="order-panel-title">Payment</h5>
          <div class="order-panel-row"><span>Method</span><span>${escapeOrdHTML(method)}</span></div>
          <div class="order-panel-row"><span>Status</span><span>${escapeOrdHTML(state)}</span></div>
          ${settled && settled.razorpay_payment_id
            ? `<div class="order-panel-row"><span>Reference</span><span>${escapeOrdHTML(settled.razorpay_payment_id)}</span></div>` : ''}
          <div class="order-panel-row"><span>Amount</span><span>&#8377;${Math.round(order.total)}</span></div>
          ${refundLabel ? `
          <div class="order-panel-row"><span>Refund</span><span class="order-refund-badge order-refund-${order.refund_status}">${refundLabel}</span></div>` : ''}
        </div>`;
    }

    // Every cancellation / address-change request on the order, not just the
    // pending one - a customer who asked for a change needs to see the outcome
    // (and the address they actually asked for) after staff have decided.
    function orderRequestsHTML(order) {
      const notes = [];
      (order.cancellation_requests || []).forEach(request => {
        const scope = request.item_title ? `&ldquo;${escapeOrdHTML(request.item_title)}&rdquo; ` : '';
        if (request.status === 'pending') {
          notes.push(['pending', `Cancellation requested for ${scope || 'this order'} &mdash; awaiting review.`]);
        } else if (request.status === 'approved') {
          notes.push(['ok', `Cancellation of ${scope || 'this order'}approved${request.admin_note ? ` &mdash; ${escapeOrdHTML(request.admin_note)}` : ''}.`]);
        } else if (request.status === 'rejected') {
          notes.push(['bad', `Cancellation of ${scope || 'this order'}declined${request.admin_note ? ` &mdash; ${escapeOrdHTML(request.admin_note)}` : ''}.`]);
        }
      });
      (order.address_change_requests || []).forEach(request => {
        const a = request.requested_address || {};
        const addr = [a.full_name, a.phone, a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(', ');
        if (request.status === 'pending') {
          notes.push(['pending', `Address change requested &mdash; awaiting review.${addr ? `<br><span class="order-request-addr">${escapeOrdHTML(addr)}</span>` : ''}`]);
        } else if (request.status === 'approved') {
          notes.push(['ok', 'Address change approved &mdash; the delivery address above is the updated one.']);
        } else if (request.status === 'rejected') {
          notes.push(['bad', `Address change declined${request.admin_note ? ` &mdash; ${escapeOrdHTML(request.admin_note)}` : ''}.`]);
        }
      });
      return notes.map(([kind, text]) => `<div class="order-request-note order-request-${kind}">${text}</div>`).join('');
    }

    // Why each action button is disabled right now - reasons mirror the
    // backend's actual eligibility rules (services/policy.py) so the
    // explanation is always true, not just a generic "unavailable".
    function orderCancelDisabledReason(order) {
      if (order.can_cancel) return '';
      if (['in_production', 'shipped', 'delivered', 'cancelled', 'refunded'].includes(order.status)) {
        return order.status === 'in_production'
          ? 'This order can no longer be cancelled once it enters production'
          : 'This order can no longer be cancelled';
      }
      return 'Cancellation request pending review';
    }

    function orderAddressDisabledReason(order) {
      if (order.can_request_address_change) return '';
      if ((order.address_change_requests || []).length > 0) return 'Address change already requested for this order';
      if (['in_production', 'shipped', 'delivered', 'cancelled', 'refunded'].includes(order.status)) {
        return order.status === 'in_production'
          ? 'Address can no longer be changed once your order enters production'
          : 'Address changes aren’t available for this order';
      }
      if (order.address_change_deadline) return 'Address change window has closed';
      return 'Address changes aren’t available for this order';
    }

    function orderCardHTML(order) {
      const date = fmtOrdDate(order.created_at);
      const statusLabel = ORDER_STATUS_LABELS[order.status] || order.status;
      const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);
      const expanded = _expandedOrderId === order.id;
      const hasTracking = (order.tracking_events || []).length > 0;
      const cancelReason = orderCancelDisabledReason(order);
      const addressReason = orderAddressDisabledReason(order);

      return `
        <div class="order-card">
          <div class="order-card-head">
            <div>
              <span class="order-number">Order ${escapeOrdHTML(order.number)}</span>
              <span class="order-date">Placed on ${date} &middot; ${itemCount} item${itemCount === 1 ? '' : 's'}</span>
            </div>
            <span class="order-status-badge order-status-${order.status}">${statusLabel}</span>
          </div>

          <div class="order-section">
            <h5 class="order-section-title">Items in this order</h5>
            <div class="order-items-list">${order.items.map(item => orderItemHTML(item, order)).join('')}</div>
          </div>

          ${orderSummaryHTML(order)}

          <div class="order-panels">
            ${orderAddressHTML(order)}
            ${orderPaymentHTML(order)}
          </div>

          ${orderStageTimelineHTML(order)}
          ${orderRequestsHTML(order)}

          <div class="order-card-actions">
            <div class="order-action">
              <button type="button" class="btn-secondary-cart" ${hasTracking ? '' : 'disabled'} onclick="toggleOrderTimeline('${order.id}')">${expanded ? 'Hide Detailed Updates' : 'View Detailed Updates'}</button>
              ${hasTracking ? '' : `<div class="order-action-reason">Updates will appear once your order is confirmed.</div>`}
            </div>
            <div class="order-action">
              <button type="button" class="btn-secondary-cart order-cancel-btn" ${cancelReason ? 'disabled' : ''} onclick="openCancelOrderModal('${order.id}')">Cancel Order</button>
              ${cancelReason ? `<div class="order-action-reason">${escapeOrdHTML(cancelReason)}</div>` : ''}
            </div>
            <div class="order-action">
              <button type="button" class="btn-secondary-cart" ${addressReason ? 'disabled' : ''} onclick="openAddressChangeModal('${order.id}')">Change Address</button>
              ${addressReason ? `<div class="order-action-reason">${escapeOrdHTML(addressReason)}</div>`
                : (order.address_change_deadline ? `<div class="order-action-reason">Accepted until ${fmtOrdDateTime(order.address_change_deadline)}.</div>` : '')}
            </div>
          </div>

          ${expanded ? orderTimelineHTML(order) : ''}
        </div>`;
    }

    /* ---------- horizontal order-stage tracker ---------- */

    function orderStageTimelineHTML(order) {
      if (order.status === 'cancelled' || order.status === 'refunded') {
        const refundLabel = REFUND_STATUS_LABELS[order.refund_status];
        return `
          <div class="order-stage-banner order-stage-banner-${order.status}">
            <span>${order.status === 'refunded' ? 'This order was refunded.' : 'This order was cancelled.'}</span>
            ${refundLabel ? `<span class="order-refund-badge order-refund-${order.refund_status}">${refundLabel}</span>` : ''}
          </div>
          ${orderShipmentSummaryHTML(order)}`;
      }

      const currentIndex = orderStageIndex(order.status);
      return `
        <div class="order-stage-track">
          ${STAGE_DEFS.map((stage, i) => {
            const state = currentIndex < 0 ? 'upcoming' : i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'upcoming';
            return `
              <div class="order-stage-node order-stage-${state}">
                ${i > 0 ? `<span class="order-stage-connector"></span>` : ''}
                <span class="order-stage-dot"></span>
                <span class="order-stage-label">${escapeOrdHTML(stage.label)}</span>
              </div>`;
          }).join('')}
        </div>
        ${orderShipmentSummaryHTML(order)}`;
    }

    function orderShipmentSummaryHTML(order) {
      if (!order.carrier && !order.tracking_number && !order.expected_delivery) return '';
      const parts = [];
      if (order.carrier) parts.push(`Carrier: <b>${escapeOrdHTML(order.carrier)}</b>`);
      if (order.tracking_number) {
        parts.push(order.tracking_url
          ? `Tracking #: <a href="${escapeOrdAttr(order.tracking_url)}" target="_blank" rel="noopener"><b>${escapeOrdHTML(order.tracking_number)}</b></a>`
          : `Tracking #: <b>${escapeOrdHTML(order.tracking_number)}</b>`);
      }
      if (order.expected_delivery) parts.push(`Expected by <b>${fmtOrdDate(order.expected_delivery)}</b>`);
      return `<div class="order-shipment-summary">${parts.join(' &middot; ')}</div>`;
    }

    /* ---------- full-size preview of the artwork a customer uploaded ---------- */

    function openOrderImagePreview(src) {
      closeOrderImagePreview();
      const overlay = document.createElement('div');
      overlay.className = 'image-preview-overlay';
      overlay.id = 'orderImagePreviewOverlay';
      overlay.innerHTML = `<img src="${escapeOrdAttr(src)}" alt="Your uploaded artwork">`;
      overlay.addEventListener('click', closeOrderImagePreview);
      document.body.appendChild(overlay);
    }

    function closeOrderImagePreview() {
      document.getElementById('orderImagePreviewOverlay')?.remove();
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
        <label class="cart-field-label">Tell us more (required)</label>
        <textarea id="cancelReasonNote" class="cart-field-input" rows="3" placeholder="A few words about why you're cancelling..."></textarea>
        <div class="cart-step-actions">
          <button type="button" class="btn-secondary-cart" onclick="closeOrdersModal()">Keep Order</button>
          <button type="button" class="btn-primary-cart" id="cancelOrderSubmitBtn" onclick="submitCancelOrder('${orderId}')">Submit Cancellation</button>
        </div>
      `);
    }

    // Same form as the whole-order cancel, scoped to one line item - approving
    // this only removes that item's amount from the order, the rest ships as normal.
    function openCancelItemModal(orderId, itemId, itemTitle) {
      openOrdersModal(`
        <h3 class="panel-title">Cancel Item</h3>
        <p class="cart-login-sub">Cancelling &ldquo;${escapeOrdHTML(itemTitle)}&rdquo; only &mdash; the rest of your order is unaffected.</p>
        <div id="cancelOrderMsg" class="cart-form-msg" style="display:none;"></div>
        <label class="cart-field-label">Reason for cancelling</label>
        <select id="cancelReasonSelect" class="cart-field-input">
          ${CANCELLATION_REASONS.map(r => `<option value="${r.value}">${escapeOrdHTML(r.label)}</option>`).join('')}
        </select>
        <label class="cart-field-label">Tell us more (required)</label>
        <textarea id="cancelReasonNote" class="cart-field-input" rows="3" placeholder="A few words about why you're cancelling..."></textarea>
        <div class="cart-step-actions">
          <button type="button" class="btn-secondary-cart" onclick="closeOrdersModal()">Keep Item</button>
          <button type="button" class="btn-primary-cart" id="cancelOrderSubmitBtn" onclick="submitCancelOrder('${orderId}', '${itemId}')">Submit Cancellation</button>
        </div>
      `);
    }

    async function submitCancelOrder(orderId, itemId) {
      const reason = document.getElementById('cancelReasonSelect').value;
      const note = document.getElementById('cancelReasonNote').value.trim();
      const msgEl = document.getElementById('cancelOrderMsg');
      const btn = document.getElementById('cancelOrderSubmitBtn');
      if (note.length < 3) {
        msgEl.textContent = 'Please tell us a bit more about why you\'re cancelling.';
        msgEl.style.display = 'block';
        return;
      }
      btn.disabled = true;
      try {
        const updated = await CustomerAuth.requestCancellation(orderId, reason, note, itemId);
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

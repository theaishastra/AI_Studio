/* Shared renderer/collector/validator for Product.input_fields - the
   admin-configured extra "Customer Input Fields" (upload/dropdown/text) built
   in the admin catalog's field builder (admin/js/catalog.js). Every
   storefront page that has a product detail / customize / add-to-cart panel
   (studio.js, gifts.js, corporate.js, catalog.js, equipment-details.js)
   loads this once and calls the three functions below instead of each
   re-implementing upload/dropdown/text UI for admin-defined fields.

   Values collected here are meant to be merged into the cart line's
   `customization.fields = { [fieldId]: value }` - a key namespace separate
   from each page's own ad hoc customization keys (photoData/text/...), so
   nothing existing has to change shape. See backend's
   services/product_fields.py for the matching server-side validation and
   routers/orders.py's _externalize_customization() for how uploads under
   `fields` get swapped for R2 URLs at checkout. */
(function (global) {
  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : s;
    return d.innerHTML;
  }

  function controlId(container, field) {
    return `${container.id || 'pf'}_${field.id}`;
  }

  const _fileStore = new WeakMap(); // container -> { [fieldId]: File[] }

  function sortedFields(product) {
    return ((product && product.input_fields) || []).slice().sort((a, b) => (a.sort || 0) - (b.sort || 0));
  }

  function renderProductFields(container, product) {
    if (!container) return;
    const fields = sortedFields(product);
    _fileStore.delete(container);
    if (!fields.length) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }
    container.style.display = '';
    container.innerHTML = fields.map(field => renderField(container, field)).join('');
    container.querySelectorAll('.pf-upload-input').forEach(input => {
      input.addEventListener('change', () => handleUploadChange(container, input));
    });
    // Priced dropdowns (Product.input_fields option_prices) - let a page listen for
    // "pf:pricechange" to live-update its own displayed price instead of polling.
    container.querySelectorAll('.pf-dropdown-input[data-priced]').forEach(select => {
      select.addEventListener('change', () => {
        const field = fields.find(f => f.id === select.closest('.pf-field').dataset.fieldId);
        const price = field && field.option_prices ? field.option_prices[select.value] : null;
        container.dispatchEvent(new CustomEvent('pf:pricechange', { bubbles: true, detail: { fieldId: field.id, price } }));
      });
    });
  }

  // The currently selected price from this container's first priced dropdown (if
  // any), or null if the product has none / nothing's priced yet. Callers that need
  // the value synchronously (e.g. at add-to-cart time) use this instead of the event.
  function getSelectedPrice(container, product) {
    if (!container) return null;
    const field = sortedFields(product).find(f => f.type === 'dropdown' && !f.multi_select && f.option_prices && Object.keys(f.option_prices).length);
    if (!field) return null;
    const el = document.getElementById(controlId(container, field));
    if (!el || !el.value) return null;
    const price = field.option_prices[el.value];
    return (price || price === 0) ? price : null;
  }

  function renderField(container, field) {
    const cid = controlId(container, field);
    const req = field.required ? '<span class="pf-required">*</span>' : '';
    const help = field.help_text ? `<div class="pf-help">${esc(field.help_text)}</div>` : '';
    let control = '';
    if (field.type === 'text') {
      control = `<input type="text" class="pf-text-input" id="${cid}" placeholder="${esc(field.placeholder || '')}">`;
    } else if (field.type === 'dropdown') {
      const priced = !field.multi_select && field.option_prices && Object.keys(field.option_prices).length;
      const opts = (field.options || []).map(o => {
        const price = priced ? field.option_prices[o] : null;
        const label = (price || price === 0) ? `${o} — ₹${price}` : o;
        return `<option value="${esc(o)}">${esc(label)}</option>`;
      }).join('');
      control = field.multi_select
        ? `<select multiple class="pf-dropdown-input" id="${cid}" size="${Math.min(Math.max((field.options || []).length, 2), 5)}">${opts}</select>`
        // A priced dropdown always needs a value to price the item by, so (like
        // Studio's old quantity picker) it skips the blank placeholder and starts
        // on its first option instead of forcing the customer to pick one.
        : `<select class="pf-dropdown-input" id="${cid}" ${priced ? `data-priced="true"` : ''}>${priced ? '' : '<option value="">Choose an option</option>'}${opts}</select>`;
    } else if (field.type === 'upload') {
      const max = field.multiple ? (field.max_files || 1) : 1;
      control = `
        <label class="pf-upload-btn" for="${cid}">${field.multiple ? 'Choose photo(s)' : 'Choose a photo'}</label>
        <input type="file" accept="image/*" class="pf-upload-input" id="${cid}" data-max-files="${max}" ${field.multiple ? 'multiple' : ''}>
        <div class="pf-upload-list" id="${cid}_list"></div>`;
    }
    return `
      <div class="pf-field" data-field-id="${esc(field.id)}" data-field-type="${esc(field.type)}">
        <label class="pf-label" for="${cid}">${esc(field.label)}${req}</label>
        ${control}
        ${help}
        <div class="pf-error" id="${cid}_err"></div>
      </div>`;
  }

  function handleUploadChange(container, input) {
    const field = input.closest('.pf-field');
    const fieldId = field.dataset.fieldId;
    const max = parseInt(input.dataset.maxFiles || '1', 10);
    let store = _fileStore.get(container);
    if (!store) { store = {}; _fileStore.set(container, store); }
    const existing = store[fieldId] || [];
    const incoming = Array.from(input.files || []);
    store[fieldId] = existing.concat(incoming).slice(0, max);
    input.value = '';
    renderUploadList(container, input, fieldId, store[fieldId]);
  }

  function renderUploadList(container, input, fieldId, files) {
    const list = document.getElementById(`${input.id}_list`);
    if (!list) return;
    const max = parseInt(input.dataset.maxFiles || '1', 10);
    list.innerHTML = files.map((f, i) => `
      <span class="pf-upload-chip">${esc(f.name)}<button type="button" data-i="${i}" aria-label="Remove file">&times;</button></span>
    `).join('') + (max > 1 ? `<span class="pf-upload-count">${files.length}/${max} files</span>` : '');
    list.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const store = _fileStore.get(container);
        store[fieldId].splice(parseInt(btn.dataset.i, 10), 1);
        renderUploadList(container, input, fieldId, store[fieldId]);
      });
    });
  }

  function fileToDataUri(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function collectProductFields(container, product) {
    const values = {};
    if (!container) return values;
    for (const field of sortedFields(product)) {
      if (field.type === 'text') {
        const el = document.getElementById(controlId(container, field));
        values[field.id] = el ? el.value.trim() : '';
      } else if (field.type === 'dropdown') {
        const el = document.getElementById(controlId(container, field));
        if (!el) { values[field.id] = field.multi_select ? [] : ''; continue; }
        values[field.id] = field.multi_select
          ? Array.from(el.selectedOptions).map(o => o.value)
          : el.value;
      } else if (field.type === 'upload') {
        const store = _fileStore.get(container) || {};
        const files = store[field.id] || [];
        const dataUris = await Promise.all(files.map(fileToDataUri));
        values[field.id] = field.multiple ? dataUris : (dataUris[0] || '');
      }
    }
    return values;
  }

  // Synchronous - reads the current DOM/file-selection state directly (an
  // upload field only needs to know how many files were picked, not their
  // base64 content, so this doesn't need collectProductFields' async
  // FileReader pass). Marks offending .pf-field blocks with .pf-field-error
  // for inline highlighting, same convention as studio.js's
  // validatePreviewOptions(), and returns a list of human-readable messages -
  // call this before collectProductFields()/add-to-cart, every time.
  function validateProductFields(container, product) {
    const errors = [];
    if (!container) return errors;
    container.querySelectorAll('.pf-field').forEach(el => el.classList.remove('pf-field-error'));
    sortedFields(product).forEach(field => {
      let message = null;
      if (field.type === 'text') {
        const el = document.getElementById(controlId(container, field));
        const value = el ? el.value.trim() : '';
        if (field.required && !value) message = `"${field.label}" is required.`;
      } else if (field.type === 'dropdown') {
        const el = document.getElementById(controlId(container, field));
        const selected = el ? (field.multi_select ? Array.from(el.selectedOptions).map(o => o.value) : el.value) : (field.multi_select ? [] : '');
        const empty = field.multi_select ? selected.length === 0 : !selected;
        if (field.required && empty) message = `"${field.label}" is required.`;
      } else if (field.type === 'upload') {
        const store = _fileStore.get(container) || {};
        const files = store[field.id] || [];
        const max = field.multiple ? (field.max_files || 1) : 1;
        if (field.required && files.length === 0) message = `"${field.label}" is required.`;
        else if (files.length > max) message = `"${field.label}" allows at most ${max} file(s).`;
      }
      if (message) {
        errors.push(message);
        const el = container.querySelector(`.pf-field[data-field-id="${CSS.escape(field.id)}"]`);
        if (el) el.classList.add('pf-field-error');
      }
    });
    return errors;
  }

  global.ProductFields = { renderProductFields, collectProductFields, validateProductFields, getSelectedPrice };
})(window);

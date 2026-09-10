/* Shared fetch wrapper for the admin panel. Same origin as the API by default —
   override by setting window.API_BASE before this script loads (e.g. for local
   dev where the admin is opened as a static file instead of via FastAPI). */
const API_BASE = window.API_BASE || "";

function getToken() {
  return localStorage.getItem("admin_token");
}

function setToken(token) {
  localStorage.setItem("admin_token", token);
}

function clearToken() {
  localStorage.removeItem("admin_token");
}

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    if (!location.pathname.endsWith("index.html") && location.pathname !== "/admin/" && location.pathname !== "/admin") {
      location.href = "index.html";
    }
    throw new Error("Not authenticated");
  }

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch (_) {}
    throw new Error(detail);
  }

  if (res.status === 204) return null;
  return res.json();
}

const Api = {
  login: (email, password) => api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => api("/api/auth/me"),

  summary: () => api("/api/admin/summary"),

  pages: () => api("/api/admin/pages"),
  createPage: (data) => api("/api/admin/pages", { method: "POST", body: JSON.stringify(data) }),

  categories: (pageSlug) => api(`/api/admin/categories${pageSlug ? `?page=${encodeURIComponent(pageSlug)}` : ""}`),
  createCategory: (data) => api("/api/admin/categories", { method: "POST", body: JSON.stringify(data) }),
  updateCategory: (id, data) => api(`/api/admin/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCategory: (id) => api(`/api/admin/categories/${id}`, { method: "DELETE" }),
  categoryMedia: (id) => api(`/api/admin/categories/${id}/media`),
  addCategoryMedia: (id, data) => api(`/api/admin/categories/${id}/media`, { method: "POST", body: JSON.stringify(data) }),

  products: (categoryId) => api(`/api/admin/products${categoryId ? `?category_id=${encodeURIComponent(categoryId)}` : ""}`),
  createProduct: (data) => api("/api/admin/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id, data) => api(`/api/admin/products/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteProduct: (id) => api(`/api/admin/products/${id}`, { method: "DELETE" }),
  addProductMedia: (id, data) => api(`/api/admin/products/${id}/media`, { method: "POST", body: JSON.stringify(data) }),

  deleteMedia: (id) => api(`/api/admin/media/${id}`, { method: "DELETE" }),

  coupons: () => api("/api/admin/coupons"),
  createCoupon: (data) => api("/api/admin/coupons", { method: "POST", body: JSON.stringify(data) }),
  updateCoupon: (id, data) => api(`/api/admin/coupons/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCoupon: (id) => api(`/api/admin/coupons/${id}`, { method: "DELETE" }),

  bookings: (status) => api(`/api/admin/bookings${status ? `?status_filter=${encodeURIComponent(status)}` : ""}`),
  updateBookingStatus: (id, status) => api(`/api/admin/bookings/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),

  getSetting: (key) => api(`/api/admin/settings/${key}`).catch(() => null),
  setSetting: (key, value) => api(`/api/admin/settings/${key}`, { method: "PUT", body: JSON.stringify({ value }) }),

  staff: () => api("/api/admin/staff"),
  createStaff: (data) => api("/api/admin/staff", { method: "POST", body: JSON.stringify(data) }),
  deactivateStaff: (id) => api(`/api/admin/staff/${id}`, { method: "DELETE" }),

  auditLog: () => api("/api/admin/audit-log"),
  activity: () => api("/api/admin/activity"),

  orders: (status) => api(`/api/admin/orders${status ? `?status_filter=${encodeURIComponent(status)}` : ""}`),
  updateOrderStatus: (id, status) => api(`/api/admin/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  refundOrder: (orderId) => api(`/api/payments/refund/${orderId}`, { method: "POST" }),

  customers: (q, page = 1) => api(`/api/admin/customers?page=${page}${q ? `&q=${encodeURIComponent(q)}` : ""}`),

  reviews: () => api("/api/admin/reviews"),
  toggleReview: (id) => api(`/api/admin/reviews/${id}/toggle`, { method: "PATCH" }),

  mediaLibrary: () => api("/api/admin/media"),
  uploadMedia: (formData) => {
    const token = getToken();
    return fetch(`${API_BASE}/api/admin/media/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        let detail = res.statusText;
        try { detail = (await res.json()).detail || detail; } catch (_) {}
        throw new Error(detail);
      }
      return res.json();
    });
  },

  allSettings: () => api("/api/admin/settings"),

  homepage: () => api("/api/admin/homepage"),
  setHomepage: (layout) => api("/api/admin/homepage", { method: "PUT", body: JSON.stringify(layout) }),
  resetHomepage: () => api("/api/admin/homepage", { method: "DELETE" }),

  arrange: (categoryId) => api(`/api/admin/arrange/${categoryId}`),
  setArrange: (categoryId, ids) => api("/api/admin/arrange", { method: "PUT", body: JSON.stringify({ category_id: categoryId, ids }) }),
};

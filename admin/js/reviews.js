routes.reviews = renderReviews;

async function renderReviews() {
  const view = document.getElementById("view");
  view.innerHTML = `<header class="page-head"><h1>Reviews</h1></header><div id="reviewsWrap">${LOADING}</div>`;
  await loadReviews();
}

async function loadReviews() {
  const wrap = document.getElementById("reviewsWrap");
  const reviews = await Api.reviews();
  if (!reviews.length) {
    wrap.innerHTML = `<div class="empty-state">No reviews yet.</div>`;
    return;
  }
  wrap.innerHTML = `
    <table>
      <thead><tr><th>Product</th><th>Reviewer</th><th>Rating</th><th>Comment</th><th>Status</th><th></th></tr></thead>
      <tbody>
        ${reviews.map(r => `
          <tr>
            <td>${esc(r.product_title)}</td>
            <td>${esc(r.reviewer)}</td>
            <td>${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</td>
            <td>${esc(r.comment || "—")}</td>
            <td><span class="badge ${r.is_approved ? "on" : "off"}">${r.is_approved ? "Approved" : "Hidden"}</span></td>
            <td class="actions"><button class="btn secondary" onclick="toggleReview('${r.id}')">${r.is_approved ? "Hide" : "Approve"}</button></td>
          </tr>`).join("")}
      </tbody>
    </table>
  `;
}

async function toggleReview(id) {
  try { await Api.toggleReview(id); loadReviews(); }
  catch (err) { alert(err.message); }
}

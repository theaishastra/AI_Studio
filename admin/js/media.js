routes.media = renderMediaLibrary;

async function renderMediaLibrary() {
  const view = document.getElementById("view");
  view.innerHTML = `
    <header class="page-head"><h1>Media Library</h1></header>
    <div class="toolbar">
      <input type="file" id="mediaUploadInput" accept="image/*">
      <span id="uploadStatus" style="color:var(--text-dim);font-size:12px;"></span>
    </div>
    <div class="media-grid" id="mediaGrid">${LOADING}</div>
  `;
  document.getElementById("mediaUploadInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const status = document.getElementById("uploadStatus");
    status.textContent = "Uploading…";
    try {
      const fd = new FormData();
      fd.append("file", file);
      await Api.uploadMedia(fd);
      status.textContent = "";
      e.target.value = "";
      loadMediaGrid();
    } catch (err) {
      status.textContent = err.message;
    }
  });
  await loadMediaGrid();
}

async function loadMediaGrid() {
  const grid = document.getElementById("mediaGrid");
  const items = await Api.mediaLibrary();
  if (!items.length) {
    grid.innerHTML = `<div class="empty-state">No images in the library yet — upload one above.</div>`;
    return;
  }
  grid.innerHTML = items.map(m => `
    <figure class="media-tile" data-id="${m.id}">
      <img src="${esc(mediaUrl(m.url))}" title="Click to copy URL" onclick="copyMediaUrl('${esc(m.url)}')">
      <figcaption>${esc(m.alt || m.url)}</figcaption>
      <button class="media-tile-delete" title="Delete" onclick="deleteMediaLibraryItem('${m.id}')">×</button>
    </figure>
  `).join("");
}

function copyMediaUrl(url) {
  navigator.clipboard.writeText(url).then(() => {
    const s = document.getElementById("uploadStatus");
    if (s) { s.textContent = "URL copied!"; setTimeout(() => (s.textContent = ""), 1500); }
  });
}

async function deleteMediaLibraryItem(id) {
  if (!confirm("Delete this image from the library?")) return;
  try { await Api.deleteMedia(id); loadMediaGrid(); }
  catch (err) { alert(err.message); }
}

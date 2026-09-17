// Sets the API base every other script reads via window.SAI_API_BASE.
// Backend runs on a standalone AWS VM; the frontend is served separately
// (local dev server, GitHub Pages, etc.), so every environment needs an
// absolute URL pointing at the VM.
(function () {
  window.SAI_API_BASE = "http://54.160.240.144";
})();

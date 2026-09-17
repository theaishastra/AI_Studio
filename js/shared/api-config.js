// Sets the API base every other script reads via window.SAI_API_BASE.
// Local dev serves the frontend from a separate origin (e.g. Live Server on
// :5500) than the backend (:8000), so it needs an absolute URL. In every
// other environment (the deployed VM, a real domain) Nginx serves the
// frontend and proxies /api on the SAME origin, so an empty base (relative
// URLs) is correct and survives IP/domain changes with no code edits.
(function () {
  var isLocalDev = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  window.SAI_API_BASE = isLocalDev ? "http://localhost:8000" : "";
})();

// Sets the API base every other script reads via window.SAI_API_BASE.
// Backend runs on a standalone AWS VM behind a Cloudflare Tunnel (HTTPS is
// required so HTTPS frontends like GitHub Pages aren't blocked as mixed
// content). NOTE: this is a free "quick tunnel" - the URL changes if the
// cloudflared service on the VM restarts, so it may need updating.
(function () {
  window.SAI_API_BASE = "https://stranger-lake-structural-upgrade.trycloudflare.com";
})();

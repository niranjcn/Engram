(function() {
  var reloaded = false;
  window.addEventListener('error', function(e) {
    if (reloaded) return;
    if (e.target && (e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK')) {
      reloaded = true;
      e.preventDefault();
      window.location.reload();
    }
  });
  window.addEventListener('unhandledrejection', function(e) {
    if (reloaded) return;
    if (e.reason && e.reason.message && e.reason.message.indexOf('Failed to fetch dynamically imported module') !== -1) {
      reloaded = true;
      window.location.reload();
    }
  });
})();

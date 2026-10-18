// Runs before first paint (classic script) so the page never flashes the wrong theme.
(function () {
  var theme = null;
  try {
    theme = localStorage.getItem('jsquest:theme');
  } catch (e) {
    /* storage can be blocked */
  }
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  document.documentElement.setAttribute('data-theme', theme);
})();

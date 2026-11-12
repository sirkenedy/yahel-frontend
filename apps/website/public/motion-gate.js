/* global document, window */
// Loaded in the head, so it runs before the page is first drawn and does not wait for the page's own script.
// It says that scripts run here, and it brings in the content of a page that was written at build time,
// so a script that is slow, or never arrives, does not leave that page blank.
(function () {
  var html = document.documentElement;
  var canObserve = 'IntersectionObserver' in window;
  // How long a page that will be drawn afresh may stay hidden while its script is on the way: duration.loop.
  var patience = 1400;

  // With scripts, the bar may offer its Menu button in place of its links. If the script that opens the menu
  // cannot be fetched, the links come back.
  html.setAttribute('data-scripts', 'on');
  window.addEventListener(
    'error',
    function (event) {
      if (event.target && event.target.tagName === 'SCRIPT') html.removeAttribute('data-scripts');
    },
    true,
  );
  // Content that arrives on scroll starts hidden only where something can show it again.
  if (canObserve) html.setAttribute('data-motion', 'on');

  function reveal(element) {
    element.setAttribute('data-in', '');
  }

  document.addEventListener('readystatechange', function parsed() {
    document.removeEventListener('readystatechange', parsed);
    var root = document.getElementById('root');
    var page = root && root.getAttribute('data-page');
    if (page === null) return;

    // The build writes `/about` as `about.html`. A host that serves the file under its own name is still serving that page.
    var path = window.location.pathname.replace(/(\/index)?\.html$/, '') || '/';
    if (page !== path + window.location.hash) {
      // Another page was written here (a host answering an unknown address with the home page), or the address
      // points into a section, which the written bar does not mark. The page's script draws it afresh; if it has
      // not by the time patience runs out, what was written is shown.
      var written = root.firstElementChild;
      if (canObserve) {
        window.setTimeout(function () {
          if (written && written.isConnected) root.querySelectorAll('[data-reveal]').forEach(reveal);
        }, patience);
      }
      return;
    }

    // This page was written for this address: the page's script takes the markup over as it stands, and until
    // then the content arrives here, the same way and on the same terms as in the Reveal component.
    if (path !== window.location.pathname) window.history.replaceState(window.history.state, '', path + window.location.search);
    root.setAttribute('data-page-current', '');
    if (!canObserve) return;
    var observer = new window.IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          reveal(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    root.querySelectorAll('[data-reveal]').forEach(function (element) {
      observer.observe(element);
    });
  });
})();

/* global document, window */
// Runs before the page is first drawn. Content that arrives on scroll starts hidden only where a script can show it
// again, so that state is switched on here and not when the page's own script arrives: by then the written HTML
// is on screen, and it would be seen to vanish and come back.
(function () {
  if (!('IntersectionObserver' in window)) return;
  var root = document.documentElement;
  root.setAttribute('data-motion', 'on');
  // If a script cannot be fetched, or stops with an error, nothing may be left to reveal the content: show it all.
  window.addEventListener(
    'error',
    function (event) {
      // An error raised by running code arrives at the window, which has no tag; a file that failed to load arrives at its element.
      var tag = event.target && event.target.tagName;
      if (!tag || tag === 'SCRIPT') root.removeAttribute('data-motion');
    },
    true,
  );
})();

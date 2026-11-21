const CANVAS_TOKEN = '--ws-color-daylight-canvas';

/**
 * Sets the browser's `theme-color` (the address bar and status bar on phones) to the page's canvas, read
 * from the token in force, so it follows the system theme and the in-page switch without a second copy
 * of the colour.
 */
export function syncThemeColour() {
  const canvas = getComputedStyle(document.documentElement).getPropertyValue(CANVAS_TOKEN).trim();
  if (!canvas) return;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.append(meta);
  }
  meta.content = canvas;
}

/** Sets the colour once the styles are in, and again whenever the system switches between light and dark. */
export function followSystemThemeColour() {
  syncThemeColour();
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', syncThemeColour);
}

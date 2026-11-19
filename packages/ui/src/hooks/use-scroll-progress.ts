import { useCallback } from 'react';

const reducedMotion = '(prefers-reduced-motion: reduce)';

/**
 * Ties an element to how far the page has scrolled: returns a ref that keeps `--scroll-progress` on the element
 * between 0 (at the top) and 1 (at `distance` pixels and beyond). CSS turns the number into a transform, so
 * scrolling re-renders nothing. It writes at most once a frame and only when the number changes, reads nothing
 * that forces layout, and does not attach at all when the reader asks for reduced motion. Without script the
 * property is never set, so the CSS fallback decides the resting state.
 */
export function useScrollProgress<T extends HTMLElement = HTMLElement>(distance: number) {
  return useCallback(
    (element: T | null) => {
      if (!element || window.matchMedia?.(reducedMotion).matches) return;
      let frame = 0;
      let written = '';
      const write = () => {
        frame = 0;
        const progress = String(Math.round(Math.min(1, Math.max(0, window.scrollY / distance)) * 1000) / 1000);
        if (progress === written) return;
        written = progress;
        element.style.setProperty('--scroll-progress', progress);
      };
      const onScroll = () => {
        frame ||= requestAnimationFrame(write);
      };
      write();
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', onScroll);
        if (frame) cancelAnimationFrame(frame);
        element.style.removeProperty('--scroll-progress');
      };
    },
    [distance],
  );
}

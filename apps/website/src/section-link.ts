import { useLinkProps, useRouter } from '@tanstack/react-router';
import type { MouseEvent } from 'react';

/**
 * A link to a section of the home page, followed by the router so the page moves there at the router's pace.
 * It names a place on a page, not a page, so it is never marked as the current page.
 */
export function useSectionLink(hash: string) {
  const router = useRouter();
  const link = useLinkProps({ to: '/', hash });
  return {
    ...link,
    href: link.href ?? `/#${hash}`,
    className: undefined,
    'aria-current': undefined,
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      const plainPress = event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
      // The router does not move the page for an address it is already at, and the reader may have scrolled away since.
      const { pathname, hash: at } = router.state.location;
      if (plainPress && pathname === '/' && at === hash) {
        event.preventDefault();
        const scroll = router.options.defaultHashScrollIntoView;
        document.getElementById(hash)?.scrollIntoView(typeof scroll === 'object' ? scroll : undefined);
        return;
      }
      link.onClick?.(event);
    },
  };
}

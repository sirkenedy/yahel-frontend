import { scale } from '@yahel/tokens/tokens.json';
import { Suspense, lazy, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';

const scrolledPast = Number.parseFloat(scale['space.8']);

const subscribeToScroll = (onChange: () => void) => {
  window.addEventListener('scroll', onChange, { passive: true });
  return () => window.removeEventListener('scroll', onChange);
};
const isScrolled = () => window.scrollY > scrolledPast;

export interface SiteBarProps {
  /** The mark, as a link to the home page. */
  brand: ReactNode;
  /** Accessible name of the navigation landmark, for example "Main". */
  navLabel: string;
  /** Links shown at wide widths. Below the site-nav breakpoint they fold away and `menu` takes their place. */
  nav: ReactNode;
  /** A quiet action shown at wide widths only, for example "Sign in". */
  wideAction?: ReactNode;
  /** The one filled action. */
  action: ReactNode;
  /** A `SiteMenu`, shown only below the site-nav breakpoint. */
  menu?: ReactNode;
}

/** The public website's sticky top bar. It sits clear on the page at the top and gains glass once the page has scrolled. */
export function SiteBar({ brand, navLabel, nav, wideAction, action, menu }: SiteBarProps) {
  const scrolled = useSyncExternalStore(subscribeToScroll, isScrolled, () => false);
  return (
    <header className="ws-site-bar" data-scrolled={scrolled ? '' : undefined}>
      <div className="ws-site-bar__inner">
        <div className="ws-site-bar__brand">{brand}</div>
        <nav className="ws-site-bar__nav" aria-label={navLabel}>
          {nav}
        </nav>
        <div className="ws-site-bar__actions">
          {wideAction ? <div className="ws-site-bar__wide">{wideAction}</div> : null}
          {action}
          {menu}
        </div>
      </div>
    </header>
  );
}

export interface SiteMenuProps {
  /** Names the button and the sheet it opens, for example "Menu". */
  label: string;
  /** Names the control that dismisses the sheet, for example "Close". */
  closeLabel: string;
  /** The links. Call `close` when one is chosen, so the sheet does not stay over the new page. */
  children: (close: () => void) => ReactNode;
}

// The sheet brings the dialog machinery with it, and most visits never open it: it is fetched when the
// button is first approached, not with the page.
const loadSheet = () => import('./site-menu-sheet').then((module) => ({ default: module.SiteMenuSheet }));
const SiteMenuSheet = lazy(loadSheet);
const prepareSheet = () => void loadSheet().catch(() => undefined);

/** The top bar's links on a narrow screen: a button that opens them in a sheet. */
export function SiteMenu({ label, closeLabel, children }: SiteMenuProps) {
  const [isOpen, setOpen] = useState(false);
  const [wasOpened, setWasOpened] = useState(false);

  return (
    <>
      <button
        type="button"
        className="ws-button ws-button--plain ws-site-menu__trigger"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onPointerEnter={prepareSheet}
        onFocus={prepareSheet}
        onClick={(event) => {
          // Not every browser focuses a button when it is pressed, and the sheet returns focus to wherever it was.
          event.currentTarget.focus();
          setWasOpened(true);
          setOpen(true);
        }}
      >
        {label}
      </button>
      {wasOpened ? (
        <Suspense fallback={null}>
          <SiteMenuSheet label={label} closeLabel={closeLabel} isOpen={isOpen} onOpenChange={setOpen}>
            {children(() => setOpen(false))}
          </SiteMenuSheet>
        </Suspense>
      ) : null}
    </>
  );
}

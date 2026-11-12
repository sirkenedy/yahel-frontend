import { scale } from '@yahel/tokens/tokens.json';
import { useEffect, useState, useSyncExternalStore } from 'react';
import type { ComponentType, ReactNode } from 'react';
import type { SiteMenuSheetProps } from './site-menu-sheet';

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
  /** Said beside the button when the sheet could not be fetched. It tells the reader to press the button again. */
  errorLabel: string;
  /** The links. Call `close` when one is chosen, so the sheet does not stay over the new page. */
  children: (close: () => void) => ReactNode;
}

// The sheet brings the dialog machinery with it, and most visits never open it: it is fetched when the
// button is first approached, not with the page. A fetch that fails is tried again on the next press.
const loadSheet = () => import('./site-menu-sheet').then((module) => module.SiteMenuSheet);
const prepareSheet = () => void loadSheet().catch(() => undefined);

const foldsAway = `(width > ${scale['breakpoint.site-nav']})`;

/** The top bar's links on a narrow screen: a button that opens them in a sheet. */
export function SiteMenu({ label, closeLabel, errorLabel, children }: SiteMenuProps) {
  const [Sheet, setSheet] = useState<ComponentType<SiteMenuSheetProps> | null>(null);
  const [status, setStatus] = useState<'ready' | 'loading' | 'failed'>('ready');
  const [isOpen, setOpen] = useState(false);

  // The sheet belongs to the page and the width it was opened on: Back, Forward, or a window widened
  // until the button folds away, must not leave it (and its scroll lock) over what comes next.
  useEffect(() => {
    if (!isOpen) return;
    const close = () => setOpen(false);
    const wide = window.matchMedia?.(foldsAway);
    const closeWhenWide = (event: MediaQueryListEvent) => {
      if (event.matches) close();
    };
    window.addEventListener('popstate', close);
    wide?.addEventListener('change', closeWhenWide);
    return () => {
      window.removeEventListener('popstate', close);
      wide?.removeEventListener('change', closeWhenWide);
    };
  }, [isOpen]);

  // Until a script says it runs, the bar keeps its links in view and this button out of it: it could open nothing.
  useEffect(() => document.documentElement.setAttribute('data-scripts', 'on'), []);

  const open = async () => {
    if (Sheet) return setOpen(true);
    setStatus('loading');
    try {
      const loaded = await loadSheet();
      setSheet(() => loaded);
      setStatus('ready');
      setOpen(true);
    } catch {
      setStatus('failed');
    }
  };

  return (
    <>
      <button
        type="button"
        className="ws-button ws-button--plain ws-site-menu__trigger"
        aria-haspopup="dialog"
        aria-expanded={Sheet !== null && isOpen}
        aria-busy={status === 'loading' || undefined}
        onPointerEnter={prepareSheet}
        onFocus={prepareSheet}
        onClick={(event) => {
          // Not every browser focuses a button when it is pressed, and the sheet returns focus to wherever it was.
          event.currentTarget.focus();
          if (status !== 'loading') void open();
        }}
      >
        {label}
      </button>
      {status === 'failed' ? (
        <p role="alert" className="ws-banner ws-banner--warning ws-site-menu__error">
          {errorLabel}
        </p>
      ) : null}
      {Sheet ? (
        <Sheet label={label} closeLabel={closeLabel} isOpen={isOpen} onOpenChange={setOpen}>
          {children(() => setOpen(false))}
        </Sheet>
      ) : null}
    </>
  );
}

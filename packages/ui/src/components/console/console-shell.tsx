import { Button } from 'react-aria-components';
import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { FlowIcon } from '../flow/flow-icon';

const MAIN_ID = 'ws-console-main';
const COMPACT = '(max-width: 899.98px)';

const subscribeCompact = (onChange: () => void) => {
  const query = window.matchMedia?.(COMPACT);
  query?.addEventListener('change', onChange);
  return () => query?.removeEventListener('change', onChange);
};
const isCompactNow = () => window.matchMedia?.(COMPACT).matches ?? false;

/** Whether the console is narrower than its side menu needs: the menu then opens over the page. */
export function useCompactConsole() {
  return useSyncExternalStore(subscribeCompact, isCompactNow, () => false);
}

export interface ConsoleShellLabels {
  /** The link that jumps past the bar and the menu: "Skip to content". */
  skip: string;
  /** The menu button while the menu is out of view or narrowed: "Show menu". */
  showMenu: string;
  /** The menu button while the menu is in view: "Hide menu". */
  hideMenu: string;
  /** The button in the drawer's own header on a narrow screen: "Close menu". */
  closeMenu: string;
  /** Names the side menu's region: "Menu". */
  menu: string;
}

/** What the shell tells the side menu: whether it is narrowed to icons, its id, and what to call to widen it or after a page is chosen. */
export interface ConsoleNavState {
  collapsed: boolean;
  id: string;
  onExpand: () => void;
  onNavigate: () => void;
}

export interface ConsoleShellProps {
  labels: ConsoleShellLabels;
  /** The mark, as a link home. */
  brand: ReactNode;
  /** The search field in the middle of the bar. Hidden on a narrow screen. */
  search?: ReactNode;
  /** Help, the theme switch and the account menu. */
  actions?: ReactNode;
  /** The side menu, told whether it is narrowed to icons. */
  nav: (state: ConsoleNavState) => ReactNode;
  /** One passing confirmation at a time. */
  toast?: ReactNode;
  children: ReactNode;
}

/**
 * The console's frame: a bar across the top, the side menu and the page. On a wide screen the menu button
 * narrows the menu to its icons; on a narrow one the menu is out of view and the button opens it over the page.
 */
export function ConsoleShell({ labels, brand, search, actions, nav, toast, children }: ConsoleShellProps) {
  const navId = useId();
  const compact = useCompactConsole();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const shown = compact ? open : !collapsed;

  const overlay = compact && open;

  useEffect(() => {
    if (!overlay) return;
    navRef.current?.querySelector<HTMLElement>('.ws-console-nav a, .ws-console-nav button')?.focus();
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [overlay]);

  return (
    <div className="ws-console">
      <a className="ws-console__skip" href={`#${MAIN_ID}`}>
        {labels.skip}
      </a>
      <header className="ws-console__bar">
        <span className="ws-console__start">
          <Button ref={toggleRef} className="ws-console-iconbutton" aria-controls={navId} aria-expanded={shown} aria-label={shown ? labels.hideMenu : labels.showMenu} onPress={() => (compact ? setOpen(!open) : setCollapsed(!collapsed))}>
            <FlowIcon name="menu" />
          </Button>
          {brand}
        </span>
        {search ? <div className="ws-console__search-slot">{search}</div> : null}
        <span className="ws-console__actions">{actions}</span>
      </header>
      <div className="ws-console__shell">
        {overlay ? <button type="button" className="ws-console__scrim" data-open tabIndex={-1} aria-label={labels.hideMenu} onClick={() => setOpen(false)} /> : null}
        <aside ref={navRef} className="ws-console-nav-host" aria-label={labels.menu} data-open={overlay || undefined} inert={compact && !open ? true : undefined}>
          {compact ? (
            <div className="ws-console-drawer-head">
              {brand}
              <Button
                className="ws-console-iconbutton"
                aria-label={labels.closeMenu}
                onPress={() => {
                  setOpen(false);
                  toggleRef.current?.focus();
                }}
              >
                <FlowIcon name="close" />
              </Button>
            </div>
          ) : null}
          {nav({ collapsed: !compact && collapsed, id: navId, onExpand: () => setCollapsed(false), onNavigate: () => setOpen(false) })}
        </aside>
        <main id={MAIN_ID} className="ws-console__main" tabIndex={-1}>
          {children}
        </main>
      </div>
      <div className="ws-flow__toasts" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}

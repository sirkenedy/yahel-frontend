import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export interface NavMenuProps {
  /** The button's text, for example "Products". */
  label: string;
  /** The links. Call `close` when one is chosen. */
  children: (close: () => void) => ReactNode;
}

/**
 * A button in the site bar that discloses a panel of links. It is a disclosure, not a menu: the links stay
 * links, reached with Tab. Escape closes it and returns focus to the button; a press outside, or focus
 * moving on, closes it where it is.
 */
export function NavMenu({ label, children }: NavMenuProps) {
  const [isOpen, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      trigger.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={root}
      className="ws-nav-menu"
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button ref={trigger} type="button" className="ws-nav-menu__trigger" aria-expanded={isOpen} aria-controls={panelId} onClick={() => setOpen((open) => !open)}>
        {label}
        <svg className="ws-nav-menu__chevron" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2.5 4.5 6 8l3.5-3.5" />
        </svg>
      </button>
      <div id={panelId} className="ws-nav-menu__panel" inert={!isOpen}>
        {children(() => setOpen(false))}
      </div>
    </div>
  );
}

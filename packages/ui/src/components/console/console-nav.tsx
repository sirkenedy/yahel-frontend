import { Button, Link } from 'react-aria-components';
import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { FlowIcon } from '../flow/flow-icon';
import type { FlowIconName } from '../flow/flow-icon';

/** One entry of the menu: a page (with `href`) or a group of entries (with `children`). Top-level entries carry an icon. */
export interface ConsoleNavItem {
  id: string;
  label: string;
  icon?: FlowIconName;
  href?: string;
  children?: readonly ConsoleNavItem[];
}

export interface ConsoleNavProps {
  id?: string;
  /** Names the menu for assistive technology: "Admin console". */
  label: string;
  /** Shown above the entries: the organisation's name. */
  heading?: string;
  items: readonly ConsoleNavItem[];
  /** The page shown now. Its groups start open. */
  currentId: string | null;
  /** Narrowed to the top-level icons. */
  collapsed?: boolean;
  /** Pressing a group while narrowed widens the menu first. */
  onExpand?: () => void;
  /** Called after a page is chosen, so a menu open over the page can close. */
  onNavigate?: () => void;
  /** Under the entries: upgrade, feedback and the legal links. */
  footer?: ReactNode;
}

/** The ids from the top of the tree down to `id`, or none when it is not in the tree. */
export const pathTo = (items: readonly ConsoleNavItem[], id: string | null): ConsoleNavItem[] => {
  if (!id) return [];
  for (const item of items) {
    if (item.id === id) return [item];
    const below = item.children ? pathTo(item.children, id) : [];
    if (below.length) return [item, ...below];
  }
  return [];
};

/** The Admin console's side menu: every section as a tree that opens a level at a time. */
export function ConsoleNav({ id, label, heading, items, currentId, collapsed = false, onExpand, onNavigate, footer }: ConsoleNavProps) {
  const trail = pathTo(items, currentId);
  const [open, setOpen] = useState(() => new Set(trail.map((item) => item.id)));
  const [shownFor, setShownFor] = useState(currentId);
  if (shownFor !== currentId) {
    setShownFor(currentId);
    setOpen(new Set([...open, ...trail.map((item) => item.id)]));
  }
  const inside = new Set(trail.slice(0, -1).map((item) => item.id));

  const toggle = (group: string) => {
    if (collapsed) {
      onExpand?.();
      setOpen(new Set([...open, group]));
      return;
    }
    const next = new Set(open);
    if (next.has(group)) next.delete(group);
    else next.add(group);
    setOpen(next);
  };

  const render = (item: ConsoleNavItem, depth: number): ReactNode => {
    const style = depth ? ({ '--depth': depth } as CSSProperties) : undefined;
    const icon = depth === 0 && item.icon ? <FlowIcon name={item.icon} /> : null;
    if (item.children) {
      const isOpen = open.has(item.id);
      const groupId = `${id ?? 'nav'}-${item.id}`;
      return (
        <div key={item.id} className="ws-console-nav__branch">
          <Button
            className="ws-console-nav__item"
            style={style}
            data-depth={depth || undefined}
            data-inside={inside.has(item.id) || undefined}
            aria-expanded={isOpen}
            aria-controls={isOpen ? groupId : undefined}
            aria-label={collapsed ? item.label : undefined}
            onPress={() => toggle(item.id)}
          >
            {icon}
            <span className="ws-console-nav__label">{item.label}</span>
            <span className="ws-console-nav__chevron">
              <FlowIcon name="chevron-down" />
            </span>
          </Button>
          {isOpen ? (
            <div id={groupId} className="ws-console-nav__group" role="group" aria-label={item.label}>
              {item.children.map((child) => render(child, depth + 1))}
            </div>
          ) : null}
        </div>
      );
    }
    return (
      <Link
        key={item.id}
        href={item.href}
        className="ws-console-nav__item"
        style={style}
        data-depth={depth || undefined}
        aria-current={item.id === currentId ? 'page' : undefined}
        aria-label={collapsed ? item.label : undefined}
        onPress={onNavigate}
      >
        {icon}
        <span className="ws-console-nav__label">{item.label}</span>
      </Link>
    );
  };

  return (
    <nav id={id} className="ws-console-nav" aria-label={label} data-collapsed={collapsed || undefined}>
      <div className="ws-console-nav__scroll">
        {heading ? <span className="ws-console-nav__head">{heading}</span> : null}
        {items.map((item) => render(item, 0))}
      </div>
      {footer}
    </nav>
  );
}

export interface ConsoleNavFooterProps {
  /** The toggle's names while the footer is shown and hidden. */
  hideLabel: string;
  showLabel: string;
  children: ReactNode;
}

/** The menu's footer, which the administrator can fold away. */
export function ConsoleNavFooter({ hideLabel, showLabel, children }: ConsoleNavFooterProps) {
  const [shown, setShown] = useState(true);
  const bodyId = `ws-console-nav-foot`;
  return (
    <div className="ws-console-nav__foot">
      <Button className="ws-console-nav__foot-toggle" aria-expanded={shown} aria-controls={bodyId} aria-label={shown ? hideLabel : showLabel} onPress={() => setShown(!shown)}>
        <FlowIcon name="chevron-down" />
      </Button>
      {shown ? (
        <div id={bodyId} className="ws-console-nav__group">
          {children}
        </div>
      ) : null}
    </div>
  );
}

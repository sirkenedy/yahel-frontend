import { Children, createContext, useContext, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

type RevealTag = 'div' | 'section' | 'article' | 'h1' | 'h2' | 'h3' | 'p' | 'ul' | 'li';

const RevealIndexContext = createContext(0);

const callbacks = new WeakMap<Element, () => void>();
let observer: IntersectionObserver | undefined;

// One observer for every revealed element on the page. An element is dropped the first time it is seen, so it moves once.
const sharedObserver = () =>
  (observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer?.unobserve(entry.target);
        callbacks.get(entry.target)?.();
        callbacks.delete(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
  ));

export interface RevealProps extends HTMLAttributes<HTMLDivElement> {
  as?: RevealTag;
  /** Position among siblings that arrive together. Inside a `RevealGroup` it is set for you. */
  index?: number;
  /** `rise` fades in and rises. `pop` also grows from a little smaller with a small overshoot, for icons. */
  variant?: 'rise' | 'pop';
  children: ReactNode;
}

/**
 * Content that fades in and rises the first time it scrolls into view. The hidden starting state exists only
 * while the root carries `data-motion="on"`, which is set here once the browser can observe: without script,
 * or without IntersectionObserver, the content is simply visible.
 */
export function Reveal({ as = 'div', index, variant = 'rise', style, children, ...props }: RevealProps) {
  // Every tag in RevealTag takes the same attributes; one stands in for the rest so the element stays typed.
  const Tag = as as 'div';
  const ref = useRef<HTMLDivElement>(null);
  const inherited = useContext(RevealIndexContext);
  const [shown, setShown] = useState(false);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || !('IntersectionObserver' in window)) return;
    document.documentElement.setAttribute('data-motion', 'on');
    const io = sharedObserver();
    callbacks.set(element, () => setShown(true));
    io.observe(element);
    return () => {
      io.unobserve(element);
      callbacks.delete(element);
    };
  }, []);

  return (
    <Tag {...props} ref={ref} data-reveal={variant === 'pop' ? 'pop' : ''} data-in={shown ? '' : undefined} style={{ ...style, '--reveal-index': index ?? inherited } as CSSProperties}>
      <RevealIndexContext value={0}>{children}</RevealIndexContext>
    </Tag>
  );
}

export interface RevealGroupProps extends HTMLAttributes<HTMLDivElement> {
  as?: RevealTag;
  children: ReactNode;
}

/** Siblings that arrive one after another: each direct child's `Reveal` starts one stagger step after the one before. */
export function RevealGroup({ as = 'div', children, ...props }: RevealGroupProps) {
  const Tag = as as 'div';
  return <Tag {...props}>{Children.map(children, (child, position) => <RevealIndexContext value={position}>{child}</RevealIndexContext>)}</Tag>;
}

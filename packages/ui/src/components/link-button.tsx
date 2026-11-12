import type { AnchorHTMLAttributes, ReactNode, Ref } from 'react';

export type LinkButtonVariant = 'filled' | 'inverse' | 'plain';

export interface LinkButtonProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> {
  href: string;
  /** `filled` is the page's main action. `inverse` is the same action on an inverse band. `plain` is a second action, drawn as a link. */
  variant?: LinkButtonVariant;
  /** `large` is the main action of a hero or band. */
  size?: 'regular' | 'large';
  children: ReactNode;
  ref?: Ref<HTMLAnchorElement>;
}

function Chevron() {
  return (
    <svg className="ws-link-button__chevron" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 2.5 9.5 7 5 11.5" />
    </svg>
  );
}

/** Navigation that carries the weight of a button. It goes somewhere, so it is a link. */
export function LinkButton({ variant = 'filled', size = 'regular', children, ...props }: LinkButtonProps) {
  const className = ['ws-button', variant === 'filled' && 'ws-button--primary', 'ws-link-button', `ws-link-button--${variant}`, size === 'large' && 'ws-link-button--large']
    .filter(Boolean)
    .join(' ');
  return (
    <a {...props} className={className}>
      {children}
      {variant === 'plain' ? <Chevron /> : null}
    </a>
  );
}

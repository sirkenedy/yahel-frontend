import type { AnchorHTMLAttributes, ReactNode, Ref } from 'react';
import { Chevron } from './chevron';

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

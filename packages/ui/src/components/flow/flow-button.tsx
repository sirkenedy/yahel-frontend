import { Button as AriaButton, Link } from 'react-aria-components';
import type { ButtonProps as AriaButtonProps, LinkProps as AriaLinkProps } from 'react-aria-components';
import type { ReactNode } from 'react';
import { FlowIcon } from './flow-icon';

/**
 * `primary`: the one indigo action of the screen. `quiet`: the outlined action beside it.
 * `field`: a full-width outlined action the height of a field. `link`: a text action.
 * `round`: an icon-only control; give it an `aria-label`. `destructive`: a small action that removes something.
 */
export type FlowButtonVariant = 'primary' | 'quiet' | 'field' | 'link' | 'round' | 'destructive';

const className = (variant: FlowButtonVariant) => `ws-flow-button ws-flow-button--${variant}`;

export interface FlowButtonProps extends Omit<AriaButtonProps, 'className' | 'children'> {
  variant?: FlowButtonVariant;
  children: ReactNode;
  /** Shown in place of children while `isPending`, so the button says what is happening. */
  pendingLabel?: string;
}

/** An action. While pending it says what is happening and ignores further presses. */
export function FlowButton({ variant = 'quiet', pendingLabel, children, isPending, ...props }: FlowButtonProps) {
  return (
    <AriaButton {...props} isPending={isPending} className={className(variant)}>
      {isPending && pendingLabel ? pendingLabel : children}
      {isPending ? <span className="ws-flow-button__spinner" aria-hidden="true" /> : variant === 'primary' ? <FlowIcon name="forward" /> : null}
    </AriaButton>
  );
}

export interface FlowLinkProps extends Omit<AriaLinkProps, 'className' | 'children'> {
  href: string;
  variant?: FlowButtonVariant;
  children: ReactNode;
}

/** Navigation that looks like a flow action. It is a real link, so it can be opened in a new tab. */
export function FlowLink({ variant = 'link', children, ...props }: FlowLinkProps) {
  return (
    <Link {...props} className={className(variant)}>
      {children}
      {variant === 'primary' ? <FlowIcon name="forward" /> : null}
    </Link>
  );
}

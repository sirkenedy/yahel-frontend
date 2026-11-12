import { Button as AriaButton } from 'react-aria-components';
import type { ButtonProps as AriaButtonProps } from 'react-aria-components';
import type { ReactNode } from 'react';

export type ButtonVariant = 'neutral' | 'primary' | 'tinted' | 'destructive' | 'plain';

export interface ButtonProps extends Omit<AriaButtonProps, 'className' | 'children'> {
  variant?: ButtonVariant;
  pill?: boolean;
  children: ReactNode;
  /** Shown in place of children while `isPending`, so the button says what is happening. */
  pendingLabel?: string;
}

export function Button({ variant = 'neutral', pill = false, pendingLabel, children, isPending, ...props }: ButtonProps) {
  const className = ['ws-button', variant !== 'neutral' && `ws-button--${variant}`, pill && 'ws-button--pill'].filter(Boolean).join(' ');
  return (
    <AriaButton {...props} isPending={isPending} className={className}>
      {isPending && pendingLabel ? pendingLabel : children}
    </AriaButton>
  );
}

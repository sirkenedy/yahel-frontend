import { isApiError } from '@yahel/api-client';
import { FlowButton, FlowLink, FlowReference, FlowState } from '@yahel/ui';
import { Component, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AppFrame } from './app-frame';
import { chromeMessages } from './messages';
import { flowMessages as m } from '../../flow/messages';

const SIGN_IN = '/signin';
const SIGN_UP = '/personal';

/** Where the way out of a failed screen leads, and what it is called. */
export interface ErrorExit {
  href: string;
  label: string;
}

/** The way out that fits where the person was: the start of sign-up from sign-up, the start of sign-in from anywhere else. */
export const errorExitFor = (pathname: string): ErrorExit => (pathname === SIGN_UP || pathname.startsWith(`${SIGN_UP}/`) ? { href: SIGN_UP, label: chromeMessages.startAgain } : { href: SIGN_IN, label: m.backToSignIn });

export interface ErrorScreenProps {
  /** What went wrong. It goes to the console for whoever is debugging; the person is never shown it. */
  error: unknown;
  /** Clears the failure and shows the screen again. */
  onRetry: () => void;
  exit: ErrorExit;
}

// An id to quote is only ever letters, digits and dashes; anything else from a failure is not shown.
const referenceOf = (error: unknown) => (isApiError(error) && error.requestId && /^[\w-]{3,64}$/.test(error.requestId) && error.requestId !== 'unknown' ? error.requestId : null);

/**
 * The "Error" whole-screen state: what a person sees in place of a step that failed to show. It says what
 * to quote, offers a retry, and always has the way back to the start. It is part of the first download,
 * unlike the other whole-screen states, because it is what shows when a download fails.
 */
export function StepError({ error, onRetry, exit }: ErrorScreenProps) {
  const [at] = useState(() => Date.now());
  const reference = referenceOf(error);
  useEffect(() => {
    console.error(error);
    document.title = m.errorPageTitle;
  }, [error]);

  return (
    <FlowState
      tone="danger"
      title={m.errorTitle}
      lede={m.errorLede}
      actions={
        <>
          <FlowButton variant="primary" onPress={onRetry}>
            {m.tryAgain}
          </FlowButton>
          <FlowLink variant="quiet" href={exit.href}>
            {exit.label}
          </FlowLink>
        </>
      }
    >
      <FlowReference title={m.quoteThis}>
        {reference ? <FlowReference.Row label={m.referenceLabel} value={reference} copy={{ label: m.copy, doneLabel: m.copied }} /> : null}
        <FlowReference.Row label={m.timeLabel} value={m.momentOf(at)} />
      </FlowReference>
    </FlowState>
  );
}

/** The same message with the frame around it, for a failure that took the frame down too. */
export function PageError(props: ErrorScreenProps) {
  return (
    <AppFrame links={{ home: props.exit.href, help: null, privacy: null, terms: null }}>
      <StepError {...props} />
    </AppFrame>
  );
}

interface RootErrorBoundaryProps {
  /** Starts the app again from nothing. */
  onRetry: () => void;
  exit: ErrorExit;
  children: ReactNode;
}

/** The last line of defence, around the router itself: whatever fails, the person gets the styled screen. */
export class RootErrorBoundary extends Component<RootErrorBoundaryProps, { error: unknown; failed: boolean }> {
  override state = { error: null as unknown, failed: false };

  static getDerivedStateFromError(error: unknown) {
    return { error, failed: true };
  }

  override render() {
    return this.state.failed ? <PageError error={this.state.error} onRetry={this.props.onRetry} exit={this.props.exit} /> : this.props.children;
  }
}

import { FlowButton, FlowLink, FlowStep } from '@yahel/ui';
import { Component, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AppFrame } from './app-frame';
import { chromeMessages as m } from './messages';

const SIGN_IN = '/signin';
const SIGN_UP = '/personal';

/** Where the way out of a failed screen leads, and what it is called. */
export interface ErrorExit {
  href: string;
  label: string;
}

/** The way out that fits where the person was: the start of sign-up from sign-up, the start of sign-in from anywhere else. */
export const errorExitFor = (pathname: string): ErrorExit => (pathname === SIGN_UP || pathname.startsWith(`${SIGN_UP}/`) ? { href: SIGN_UP, label: m.startAgain } : { href: SIGN_IN, label: m.backToSignIn });

export interface ErrorScreenProps {
  /** What went wrong. It goes to the console for whoever is debugging; the person is never shown it. */
  error: unknown;
  /** Clears the failure and shows the screen again. */
  onRetry: () => void;
  exit: ErrorExit;
}

/** What a person sees in place of a step that failed to show: a plain apology, a retry and the way back to the start. */
export function StepError({ error, onRetry, exit }: ErrorScreenProps) {
  useEffect(() => {
    console.error(error);
    document.title = m.errorPageTitle;
  }, [error]);

  return (
    <FlowStep>
      <FlowStep.Intro>
        <FlowStep.Heading>{m.errorTitle}</FlowStep.Heading>
        <FlowStep.Lede>{m.errorLede}</FlowStep.Lede>
      </FlowStep.Intro>
      <FlowStep.Actions>
        <FlowButton variant="primary" onPress={onRetry}>
          {m.tryAgain}
        </FlowButton>
        <FlowLink variant="quiet" href={exit.href}>
          {exit.label}
        </FlowLink>
      </FlowStep.Actions>
    </FlowStep>
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

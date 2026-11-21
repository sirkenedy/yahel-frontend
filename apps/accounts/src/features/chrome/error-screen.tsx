import { FlowButton, FlowLink, FlowStep } from '@yahel/ui';
import { Component, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AppFrame } from './app-frame';
import { chromeMessages as m } from './messages';

const SIGN_IN = '/signin';

export interface ErrorScreenProps {
  /** What went wrong. It goes to the console for whoever is debugging; the person is never shown it. */
  error: unknown;
  /** Clears the failure and shows the screen again. */
  onRetry: () => void;
}

/** What a person sees in place of a step that failed to show: a plain apology, a retry and the way back to the start. */
export function StepError({ error, onRetry }: ErrorScreenProps) {
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
        <FlowLink variant="quiet" href={SIGN_IN}>
          {m.backToSignIn}
        </FlowLink>
      </FlowStep.Actions>
    </FlowStep>
  );
}

/** The same message with the frame around it, for a failure that took the frame down too. */
export function PageError(props: ErrorScreenProps) {
  return (
    <AppFrame links={{ home: SIGN_IN, help: null, privacy: null, terms: null }}>
      <StepError {...props} />
    </AppFrame>
  );
}

interface RootErrorBoundaryProps {
  /** Starts the app again from nothing. */
  onRetry: () => void;
  children: ReactNode;
}

/** The last line of defence, around the router itself: whatever fails, the person gets the styled screen. */
export class RootErrorBoundary extends Component<RootErrorBoundaryProps, { error: unknown; failed: boolean }> {
  override state = { error: null as unknown, failed: false };

  static getDerivedStateFromError(error: unknown) {
    return { error, failed: true };
  }

  override render() {
    return this.state.failed ? <PageError error={this.state.error} onRetry={this.props.onRetry} /> : this.props.children;
  }
}

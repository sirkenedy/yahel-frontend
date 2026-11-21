import { AccountChip, FlowNotice, FlowStep } from '@yahel/ui';
import type { ReactNode } from 'react';
import { signInMessages as m } from '../messages';
import { useSignInFlow } from '../sign-in-flow';

interface StepFrameProps {
  title: string;
  lede?: string;
  /** What went wrong with the step's request, in plain words. Shown above the fields and announced. */
  failure?: string | null;
  children: ReactNode;
}

/** What every sign-in step shares: the way back, whose account it is, the question, and a failed request. */
export function StepFrame({ title, lede, failure, children }: StepFrameProps) {
  const { state, meta } = useSignInFlow();
  const showsAccount = state.email !== null && state.step !== 'choose' && state.step !== 'email' && state.step !== 'help' && state.step !== 'help-sent';
  return (
    <FlowStep direction={meta.direction}>
      {meta.backHref ? <FlowStep.Back href={meta.backHref}>{m.back}</FlowStep.Back> : null}
      {showsAccount ? <AccountChip email={state.profile?.email ?? state.email ?? ''} /> : null}
      <FlowStep.Intro>
        <FlowStep.Heading>{title}</FlowStep.Heading>
        {lede ? <FlowStep.Lede>{lede}</FlowStep.Lede> : null}
      </FlowStep.Intro>
      {failure ? <FlowNotice tone="danger">{failure}</FlowNotice> : null}
      {children}
    </FlowStep>
  );
}

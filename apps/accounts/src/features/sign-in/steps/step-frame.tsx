import { AccountChip } from '@yahel/ui';
import type { ReactNode } from 'react';
import type { Feedback } from '../../../flow/feedback';
import { FlowStepFrame } from '../../../flow/step-frame';
import type { FeedbackNext } from '../../../flow/step-frame';
import type { FlowRequest } from '../../../flow/use-flow-request';
import type { SignInNext } from '../feedback';
import { stepPath } from '../machine';
import { signInMessages as m } from '../messages';
import { useSignInFlow } from '../sign-in-flow';

interface StepFrameProps {
  title: string;
  lede?: string;
  requests?: readonly FlowRequest[];
  feedback?: Feedback | null;
  toFix?: readonly string[];
  /** What this step's feedback can offer beyond what every sign-in step can. */
  next?: Partial<Record<SignInNext, FeedbackNext | null>>;
  children: ReactNode;
}

/** The shared step frame, given what sign-in knows: the way back, whose account it is, and where its feedback can lead. */
export function StepFrame({ title, lede, requests, feedback, toFix, next, children }: StepFrameProps) {
  const { state, meta } = useSignInFlow();
  const showsAccount = state.email !== null && state.step !== 'choose' && state.step !== 'email' && state.step !== 'help' && state.step !== 'help-sent';

  return (
    <FlowStepFrame
      title={title}
      pageTitle={m.pageTitle(title)}
      lede={lede}
      requests={requests}
      feedback={feedback}
      toFix={toFix}
      next={{ 'reset-password': { label: m.resetYourPassword, href: stepPath('recover') }, 'sign-in-again': { label: m.signInAgain, href: stepPath('password') }, ...next }}
      screens={meta.screens}
      direction={meta.direction}
      back={meta.backHref ? { href: meta.backHref, label: m.back } : null}
      lead={showsAccount ? <AccountChip email={state.profile?.email ?? state.email ?? ''} /> : null}
    >
      {children}
    </FlowStepFrame>
  );
}

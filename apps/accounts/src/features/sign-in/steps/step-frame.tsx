import { AccountChip } from '@yahel/ui';
import type { ReactNode } from 'react';
import { FlowStepFrame } from '../../../flow/step-frame';
import { signInMessages as m } from '../messages';
import { useSignInFlow } from '../sign-in-flow';

interface StepFrameProps {
  title: string;
  lede?: string;
  failure?: string | null;
  children: ReactNode;
}

/** The shared step frame, given what sign-in knows: the way back and whose account it is. */
export function StepFrame({ title, lede, failure, children }: StepFrameProps) {
  const { state, meta } = useSignInFlow();
  const showsAccount = state.email !== null && state.step !== 'choose' && state.step !== 'email' && state.step !== 'help' && state.step !== 'help-sent';

  return (
    <FlowStepFrame
      title={title}
      pageTitle={m.pageTitle(title)}
      lede={lede}
      failure={failure}
      direction={meta.direction}
      back={meta.backHref ? { href: meta.backHref, label: m.back } : null}
      lead={showsAccount ? <AccountChip email={state.profile?.email ?? state.email ?? ''} /> : null}
    >
      {children}
    </FlowStepFrame>
  );
}

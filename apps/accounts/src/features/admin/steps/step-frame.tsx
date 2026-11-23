import { AccountChip } from '@yahel/ui';
import type { ReactNode } from 'react';
import type { Feedback } from '../../../flow/feedback';
import { FlowStepFrame } from '../../../flow/step-frame';
import type { FeedbackNext } from '../../../flow/step-frame';
import type { FlowRequest } from '../../../flow/use-flow-request';
import { useAdminFlow } from '../admin-flow';
import type { AdminNext } from '../feedback';
import { flowMessages as shared } from '../../../flow/messages';
import { adminMessages as m } from '../messages';

interface StepFrameProps {
  title: string;
  lede?: string;
  requests?: readonly FlowRequest[];
  feedback?: Feedback | null;
  toFix?: readonly string[];
  /** What this step's feedback can offer beyond what every admin step can. */
  next?: Partial<Record<AdminNext, FeedbackNext | null>>;
  children: ReactNode;
}

/** The shared step frame, given what the admin flow knows: whose account it is, the way back, and where its feedback can lead. */
export function StepFrame({ title, lede, requests, feedback, toFix, next, children }: StepFrameProps) {
  const { state, meta } = useAdminFlow();
  const { links } = meta;

  return (
    <FlowStepFrame
      title={title}
      pageTitle={m.pageTitle(title)}
      lede={lede}
      requests={requests}
      feedback={feedback}
      toFix={toFix}
      next={{
        'reset-password': { label: shared.resetYourPassword, href: links.resetPassword },
        'sign-in': { label: m.signInToYahel, href: links.signIn },
        support: links.help ? { label: m.contactSupport, href: links.help } : null,
        ...next,
      }}
      screens={meta.screens}
      direction={meta.direction}
      back={meta.backHref ? { href: meta.backHref, label: m.back } : null}
      lead={state.address ? <AccountChip email={state.address} /> : null}
    >
      {children}
    </FlowStepFrame>
  );
}

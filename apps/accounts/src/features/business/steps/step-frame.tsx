import { FlowProgress } from '@yahel/ui';
import type { ReactNode } from 'react';
import type { Feedback } from '../../../flow/feedback';
import { FlowStepFrame } from '../../../flow/step-frame';
import type { FeedbackNext } from '../../../flow/step-frame';
import type { FlowRequest } from '../../../flow/use-flow-request';
import { useBusinessFlow } from '../business-flow';
import type { BusinessNext } from '../feedback';
import { stepPath } from '../machine';
import { businessMessages as m } from '../messages';

interface StepFrameProps {
  title: string;
  lede?: string;
  requests?: readonly FlowRequest[];
  feedback?: Feedback | null;
  toFix?: readonly string[];
  /** What this step's feedback can offer beyond what every step of the flow can. */
  next?: Partial<Record<BusinessNext, FeedbackNext | null>>;
  /** What sits above the question, after the progress count on a step that has one. */
  lead?: ReactNode;
  children: ReactNode;
}

/** The shared step frame, given what the workspace flow knows: the way back, how far along the questions are, and where its feedback can lead. */
export function StepFrame({ title, lede, requests, feedback, toFix, next, lead, children }: StepFrameProps) {
  const { meta } = useBusinessFlow();
  const { links } = meta;
  const progress = meta.progress ? (
    <FlowProgress current={meta.progress.current} total={meta.progress.total}>
      {m.progressParts[meta.progress.part]}
    </FlowProgress>
  ) : null;

  return (
    <FlowStepFrame
      title={title}
      pageTitle={m.pageTitle(title)}
      lede={lede}
      requests={requests}
      feedback={feedback}
      toFix={toFix}
      next={{
        answers: { label: m.backToAdmin, href: stepPath('admin') },
        'sign-in': { label: m.signIn, href: links.signIn },
        'reset-password': { label: m.resetAdminPassword, href: links.signIn },
        support: links.help ? { label: m.contactSupport, href: links.help } : null,
        ...next,
      }}
      screens={meta.screens}
      direction={meta.direction}
      back={meta.backHref ? { href: meta.backHref, label: m.back } : null}
      lead={
        <>
          {progress}
          {lead}
        </>
      }
    >
      {children}
    </FlowStepFrame>
  );
}

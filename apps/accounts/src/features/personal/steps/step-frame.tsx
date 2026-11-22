import { FlowProgress } from '@yahel/ui';
import type { ReactNode } from 'react';
import type { Feedback } from '../../../flow/feedback';
import { FlowStepFrame } from '../../../flow/step-frame';
import type { FeedbackNext } from '../../../flow/step-frame';
import type { FlowRequest } from '../../../flow/use-flow-request';
import type { PersonalNext } from '../feedback';
import { PROGRESS_TOTAL, stepPath } from '../machine';
import { personalMessages as m } from '../messages';
import { usePersonalFlow } from '../personal-flow';

interface StepFrameProps {
  title: string;
  lede?: string;
  requests?: readonly FlowRequest[];
  feedback?: Feedback | null;
  toFix?: readonly string[];
  /** What this step's feedback can offer beyond what every step of the flow can. */
  next?: Partial<Record<PersonalNext, FeedbackNext | null>>;
  /** What sits above the question in place of the progress count. */
  lead?: ReactNode;
  children: ReactNode;
}

/** The shared step frame, given what the personal flow knows: the way back, how far along the questions are, and where its feedback can lead. */
export function StepFrame({ title, lede, requests, feedback, toFix, next, lead, children }: StepFrameProps) {
  const { meta } = usePersonalFlow();
  const progress = meta.progress ? (
    <FlowProgress current={meta.progress.current} total={PROGRESS_TOTAL}>
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
      next={{ review: { label: m.backToReview, href: stepPath('review') }, ...next }}
      screens={meta.screens}
      direction={meta.direction}
      back={meta.backHref ? { href: meta.backHref, label: m.back } : null}
      lead={lead ?? progress}
    >
      {children}
    </FlowStepFrame>
  );
}

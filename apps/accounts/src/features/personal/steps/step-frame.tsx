import { FlowProgress } from '@yahel/ui';
import type { ReactNode } from 'react';
import { FlowStepFrame } from '../../../flow/step-frame';
import { PROGRESS_TOTAL } from '../machine';
import { personalMessages as m } from '../messages';
import { usePersonalFlow } from '../personal-flow';

interface StepFrameProps {
  title: string;
  lede?: string;
  failure?: string | null;
  /** What sits above the question in place of the progress count. */
  lead?: ReactNode;
  children: ReactNode;
}

/** The shared step frame, given what the personal flow knows: the way back and how far along the questions are. */
export function StepFrame({ title, lede, failure, lead, children }: StepFrameProps) {
  const { meta } = usePersonalFlow();
  const progress = meta.progress ? (
    <FlowProgress current={meta.progress.current} total={PROGRESS_TOTAL}>
      {m.progressParts[meta.progress.part]}
    </FlowProgress>
  ) : null;

  return (
    <FlowStepFrame title={title} pageTitle={m.pageTitle(title)} lede={lede} failure={failure} direction={meta.direction} back={meta.backHref ? { href: meta.backHref, label: m.back } : null} lead={lead ?? progress}>
      {children}
    </FlowStepFrame>
  );
}

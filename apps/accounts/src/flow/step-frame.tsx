import { FlowNotice, FlowStep } from '@yahel/ui';
import type { FlowDirection } from '@yahel/ui';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

export interface FlowStepFrameProps {
  /** The question, shown as the step's heading. */
  title: string;
  /** What the tab and the browser's history list call the step. */
  pageTitle: string;
  lede?: ReactNode;
  /** What went wrong with the step's request, in plain words. Shown above the fields and announced. */
  failure?: string | null;
  direction: FlowDirection;
  /** The way back, or `null` on a first step. */
  back: { href: string; label: string } | null;
  /** What sits above the question: how far along the flow is, or whose account it is. */
  lead?: ReactNode;
  children?: ReactNode;
}

/** What every step of every flow shares: the way back, the question, the page title and a failed request. */
export function FlowStepFrame({ title, pageTitle, lede, failure, direction, back, lead, children }: FlowStepFrameProps) {
  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  return (
    <FlowStep direction={direction}>
      {back ? <FlowStep.Back href={back.href}>{back.label}</FlowStep.Back> : null}
      {lead}
      <FlowStep.Intro>
        <FlowStep.Heading>{title}</FlowStep.Heading>
        {lede ? <FlowStep.Lede>{lede}</FlowStep.Lede> : null}
      </FlowStep.Intro>
      {failure ? <FlowNotice tone="danger">{failure}</FlowNotice> : null}
      {children}
    </FlowStep>
  );
}

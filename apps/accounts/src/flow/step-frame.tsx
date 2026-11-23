import { FlowButton, FlowLink, FlowNotice, FlowSlowHint, FlowStep } from '@yahel/ui';
import type { FlowDirection } from '@yahel/ui';
import type { ServiceStatus } from '@yahel/api-client';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Feedback } from './feedback';
import { flowMessages as m } from './messages';
import { StateScreen } from './state-screen';
import type { StateExits } from './state-screen';
import type { FlowRequest } from './use-flow-request';
import { useSecondsLeft, useSlow } from './use-waits';

/** What the person can do about a feedback: go somewhere, or do something here. */
export type FeedbackNext = { label: string; href: string } | { label: string; onPress: () => void };

/** What a whole-screen state needs from the flow it interrupts. */
export interface ScreenFacts {
  account?: string | null;
  exits: StateExits;
  serviceStatus?: ServiceStatus | null;
}

export interface FlowStepFrameProps {
  /** The question, shown as the step's heading. */
  title: string;
  /** What the tab and the browser's history list call the step. */
  pageTitle: string;
  lede?: ReactNode;
  /** The step's requests. The first that has something to tell is told, and a long wait on any is explained. */
  requests?: readonly FlowRequest[];
  /** Something to tell that no request of this step produced: an answer carried over from another step. */
  feedback?: Feedback | null;
  /** Labels of the fields a submit found wrong. Two or more are summed up above the form. */
  toFix?: readonly string[];
  /** The actions the step's feedback can offer, by name. `retry` submits the step's form unless given here; `null` offers none, for a step whose own button is the retry. */
  next?: Readonly<Record<string, FeedbackNext | null | undefined>>;
  screens: ScreenFacts;
  direction: FlowDirection;
  /** The way back, or `null` on a first step. */
  back: { href: string; label: string } | null;
  /** What sits above the question: how far along the flow is, or whose account it is. */
  lead?: ReactNode;
  children?: ReactNode;
}

function Banner({ feedback, action }: { feedback: Extract<Feedback, { place: 'banner' }>; action: ReactNode }) {
  const left = useSecondsLeft(feedback.retryAt);
  const wait = feedback.retryAt ? (left > 0 ? m.tryAgainIn(m.clock(left)) : m.tryAgainNow) : null;
  return (
    <FlowNotice tone={feedback.tone} title={feedback.title} actions={action}>
      {wait ?? feedback.text}
      {feedback.reference ? ` ${m.reference(feedback.reference)}` : null}
    </FlowNotice>
  );
}

/** What every step of every flow shares: the way back, the question, the page title, and whatever a request has to tell. */
export function FlowStepFrame({ title, pageTitle, lede, requests = [], feedback: carried = null, toFix = [], next = {}, screens, direction, back, lead, children }: FlowStepFrameProps) {
  const told = requests.find((request) => request.feedback);
  const feedback = told?.feedback ?? carried;
  const screen = feedback?.place === 'screen' ? feedback : null;
  const slow = useSlow(requests.some((request) => request.isPending));

  useEffect(() => {
    if (!screen) document.title = pageTitle;
  }, [pageTitle, screen]);

  if (screen) {
    return <StateScreen kind={screen.screen} retryAt={screen.retryAt} onRetry={told?.again ?? told?.clear ?? (() => undefined)} {...screens} />;
  }

  /** The control for one of the things a banner offers. `retry` is the step's own form unless the step says otherwise. */
  const actionFor = (offered: string | undefined): ReactNode => {
    if (!offered || next[offered] === null) return null;
    const given = next[offered] ?? (offered === 'retry' && told?.again ? { label: m.tryAgain, onPress: told.again } : null);
    if (!given) return offered === 'retry' ? <FlowStep.Resubmit key={offered}>{m.tryAgain}</FlowStep.Resubmit> : null;
    return 'href' in given ? (
      <FlowLink key={offered} variant="chip" href={given.href}>
        {given.label}
      </FlowLink>
    ) : (
      <FlowButton key={offered} variant="chip" onPress={given.onPress}>
        {given.label}
      </FlowButton>
    );
  };
  const actions = feedback?.place === 'banner' ? [actionFor(feedback.next), actionFor(feedback.also)].filter(Boolean) : [];
  const action = actions.length > 0 ? actions : null;

  return (
    <FlowStep direction={direction}>
      {back ? <FlowStep.Back href={back.href}>{back.label}</FlowStep.Back> : null}
      {lead}
      <FlowStep.Intro>
        <FlowStep.Heading>{title}</FlowStep.Heading>
        {lede ? <FlowStep.Lede>{lede}</FlowStep.Lede> : null}
      </FlowStep.Intro>
      {toFix.length > 1 ? (
        <FlowNotice tone="danger" title={m.thingsToFix(toFix.length)}>
          {m.listOf(toFix)}
        </FlowNotice>
      ) : feedback?.place === 'banner' ? (
        <Banner feedback={feedback} action={action} />
      ) : null}
      {children}
      {slow ? <FlowSlowHint>{m.slow}</FlowSlowHint> : null}
    </FlowStep>
  );
}

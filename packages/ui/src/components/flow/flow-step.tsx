import { createContext, use, useEffect, useId, useRef } from 'react';
import type { FormEventHandler, ReactNode } from 'react';
import { Link } from 'react-aria-components';
import { FlowIcon } from './flow-icon';

export type FlowDirection = 'forward' | 'back';

const HeadingIdContext = createContext<string | null>(null);

const useHeadingId = () => {
  const id = use(HeadingIdContext);
  if (!id) throw new Error('FlowStep parts must be rendered inside <FlowStep>.');
  return id;
};

// A hardware keyboard is likely, so typing can start at once. On touch screens focusing a field would
// throw the on-screen keyboard over the question before it has been read; the heading takes focus instead.
const prefersFieldFocus = () => window.matchMedia?.('(hover: hover) and (pointer: fine)').matches ?? false;

export interface FlowStepProps {
  /** Which way the person is moving through the flow. The step rises from below going forward and settles from above going back. */
  direction?: FlowDirection;
  children: ReactNode;
}

function FlowStepRoot({ direction = 'forward', children }: FlowStepProps) {
  const headingId = useId();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    const field = prefersFieldFocus() ? section.querySelector<HTMLElement>('input:not([type="hidden"]):not([type="checkbox"]):not([aria-hidden="true"]), select, textarea') : null;
    (field ?? document.getElementById(headingId))?.focus({ preventScroll: true });
  }, [headingId]);

  return (
    <HeadingIdContext value={headingId}>
      <section ref={ref} className="ws-flow-step" data-direction={direction} aria-labelledby={headingId}>
        {children}
      </section>
    </HeadingIdContext>
  );
}

function FlowStepBack({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="ws-flow-step__back" href={href}>
      <FlowIcon name="back" />
      {children}
    </Link>
  );
}

/** The question. One per step; it names the step and receives focus when the step appears. */
function FlowStepHeading({ children }: { children: ReactNode }) {
  return (
    <h1 id={useHeadingId()} className="ws-flow-step__heading" tabIndex={-1}>
      {children}
    </h1>
  );
}

function FlowStepIntro({ children }: { children: ReactNode }) {
  return <div className="ws-flow-step__intro">{children}</div>;
}

function FlowStepLede({ children }: { children: ReactNode }) {
  return <p className="ws-flow-step__lede">{children}</p>;
}

function FlowStepBody({ children }: { children: ReactNode }) {
  return <div className="ws-flow-step__body">{children}</div>;
}

/** Wraps the fields and the primary action so Enter in any field submits the step. Validation is the step's own. */
function FlowStepForm({ onSubmit, children }: { onSubmit: FormEventHandler<HTMLFormElement>; children: ReactNode }) {
  return (
    <form className="ws-flow-step__form" onSubmit={onSubmit} noValidate>
      {children}
    </form>
  );
}

/** `pair`: two equal fields that stack on a narrow screen. `date`: day, month, year. `phone`: a short field, then a long one. */
export type FlowRowLayout = 'pair' | 'date' | 'phone';

/** Fields that belong together on one line. Give it a `label` when together they answer one thing, such as a date. */
function FlowStepRow({ layout = 'pair', label, children }: { layout?: FlowRowLayout; label?: string; children: ReactNode }) {
  return (
    <div className={`ws-flow-step__row ws-flow-step__row--${layout}`} role={label ? 'group' : undefined} aria-label={label}>
      {children}
    </div>
  );
}

/** The primary action first, then at most one quiet action beside it. */
function FlowStepActions({ children }: { children: ReactNode }) {
  return <div className="ws-flow-step__actions">{children}</div>;
}

/** Ways out of the step that are not the main path: "Forgot password?", "Use a passkey". `end` puts them at the far side. */
function FlowStepLinks({ align = 'start', children }: { align?: 'start' | 'end'; children: ReactNode }) {
  return (
    <div className="ws-flow-step__links" data-align={align}>
      {children}
    </div>
  );
}

interface FlowStepNoteLinkProps {
  href: string;
  /** Said after the link's name to assistive technology: "opens in a new tab". */
  newTabLabel: string;
  children: ReactNode;
}

/**
 * A link inside small print to something read alongside the step, such as the terms. It opens in a new
 * tab, so what has been answered on this page is not lost by reading it.
 */
function FlowStepNoteLink({ href, newTabLabel, children }: FlowStepNoteLinkProps) {
  return (
    <Link href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="ws-flow-hidden"> ({newTabLabel})</span>
    </Link>
  );
}

/** Small print under the fields: what a choice means, or what pressing the button agrees to. */
function FlowStepNote({ children }: { children: ReactNode }) {
  return <p className="ws-flow-step__note">{children}</p>;
}

/**
 * One question of a flow. Its parts rise in one after another (off under reduced motion), and focus moves
 * into the step when it appears so keyboard and screen-reader users land on the new question.
 */
export const FlowStep = Object.assign(FlowStepRoot, {
  Back: FlowStepBack,
  Intro: FlowStepIntro,
  Heading: FlowStepHeading,
  Lede: FlowStepLede,
  Form: FlowStepForm,
  Body: FlowStepBody,
  Row: FlowStepRow,
  Actions: FlowStepActions,
  Links: FlowStepLinks,
  Note: FlowStepNote,
  NoteLink: FlowStepNoteLink,
});

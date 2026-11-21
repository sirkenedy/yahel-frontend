import type { ReactNode } from 'react';

const twoDigits = (value: number) => String(value).padStart(2, '0');

export interface FlowProgressProps {
  /** The step the person is on, counting from 1. */
  current: number;
  total: number;
  /** What comes after the count: the step's name or the time left, for example "About 90 sec". */
  children: ReactNode;
}

/** "03 / 07 · About 90 sec": how far along the flow is and how much is left. */
export function FlowProgress({ current, total, children }: FlowProgressProps) {
  return (
    <div className="ws-flow-progress">
      <span className="ws-flow-progress__text">
        {twoDigits(current)} / {twoDigits(total)} · {children}
      </span>
      <span className="ws-flow-progress__pips" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => (
          <span key={index} className="ws-flow-progress__pip" data-done={index < current} />
        ))}
      </span>
    </div>
  );
}

interface ReceiptProps {
  /** What is being built: "Creating your account". */
  title: string;
  children: ReactNode;
}

function ReceiptRoot({ title, children }: ReceiptProps) {
  return (
    <section className="ws-flow-receipt">
      <h2 className="ws-flow-receipt__title">{title}</h2>
      <dl className="ws-flow-receipt__rows">{children}</dl>
    </section>
  );
}

/** `done`: answered. `current`: being answered now. `upcoming`: still to come. */
export type ReceiptRowState = 'done' | 'current' | 'upcoming';

interface ReceiptRowProps {
  label: string;
  state?: ReceiptRowState;
  /** The answer, or what will be asked. */
  children: ReactNode;
}

function ReceiptRow({ label, state = 'done', children }: ReceiptRowProps) {
  return (
    <div className="ws-flow-receipt__row" data-state={state}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** The summary that fills in beside the question as the person answers, so nothing at the end is a surprise. */
export const Receipt = Object.assign(ReceiptRoot, { Row: ReceiptRow });

export type { ReceiptProps, ReceiptRowProps };

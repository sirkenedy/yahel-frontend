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
  /** What is being built, as a visible heading: "Creating your account". */
  title?: string;
  /** Names the list for assistive technology when there is no visible heading. */
  label?: string;
  children: ReactNode;
}

function ReceiptRoot({ title, label, children }: ReceiptProps) {
  return (
    <div className="ws-flow-receipt" role="group" aria-label={title ?? label}>
      {title ? <h2 className="ws-flow-receipt__title">{title}</h2> : null}
      <dl className="ws-flow-receipt__rows">{children}</dl>
    </div>
  );
}

/** `done`: answered. `current`: being answered now. `upcoming`: still to come. */
export type ReceiptRowState = 'done' | 'current' | 'upcoming';

interface ReceiptRowProps {
  label: string;
  state?: ReceiptRowState;
  /** A way to change the answer, shown at the end of the line. */
  action?: ReactNode;
  /** The answer, or what will be asked. */
  children: ReactNode;
}

function ReceiptRow({ label, state = 'done', action, children }: ReceiptRowProps) {
  return (
    <div className="ws-flow-receipt__row" data-state={state}>
      <dt>{label}</dt>
      <dd>{children}</dd>
      {action ? <dd className="ws-flow-receipt__action">{action}</dd> : null}
    </div>
  );
}

/** The account as answered so far, line by line, so nothing at the end is a surprise. Each line can carry a way to change it. */
export const Receipt = Object.assign(ReceiptRoot, { Row: ReceiptRow });

export type { ReceiptProps, ReceiptRowProps };

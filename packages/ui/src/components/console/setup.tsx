import type { ReactNode } from 'react';
import { FlowIcon } from '../flow/flow-icon';

export type SetupStepState = 'done' | 'now' | 'next';

export interface SetupRailProps {
  /** For assistive technology: "Setup steps". */
  label: string;
  steps: readonly { label: string; state: SetupStepState }[];
  /** Said after a finished step's name, for assistive technology: "done". */
  doneLabel: string;
  /** Said after the current step's name: "current step". */
  nowLabel: string;
}

/** The setup shell's rail: the steps in order, each done, current or still to come. */
export function SetupRail({ label, steps, doneLabel, nowLabel }: SetupRailProps) {
  return (
    <ol className="ws-console-rail" aria-label={label}>
      {steps.map((step, index) => (
        <li key={step.label} data-state={step.state} aria-current={step.state === 'now' ? 'step' : undefined}>
          <span className="ws-console-rail__dot" aria-hidden="true">
            {step.state === 'done' ? <FlowIcon name="check" /> : index + 1}
          </span>
          <span>
            {step.label}
            {step.state === 'done' ? <span className="ws-flow-hidden">, {doneLabel}</span> : step.state === 'now' ? <span className="ws-flow-hidden">, {nowLabel}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}

export interface SetupStepListProps {
  steps: readonly { title: string; time: string; detail: ReactNode; done?: boolean }[];
}

/** The steps a setup will take, with how long each takes and what it does. */
export function SetupStepList({ steps }: SetupStepListProps) {
  return (
    <ol className="ws-console-steps">
      {steps.map((step, index) => (
        <li key={step.title}>
          <span className="ws-console-rail__dot" data-state={step.done ? 'done' : 'next'} aria-hidden="true">
            {step.done ? <FlowIcon name="check" /> : index + 1}
          </span>
          <span>
            <span className="ws-console-steps__head">
              {step.title}
              <span className="ws-console-steps__time">{step.time}</span>
            </span>
            <span className="ws-console-muted">{step.detail}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

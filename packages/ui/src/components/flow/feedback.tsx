import type { ReactNode } from 'react';
import { FlowIcon } from './flow-icon';

export type FlowNoticeTone = 'info' | 'danger';

export interface FlowNoticeProps {
  /** `danger` is announced at once as an alert; `info` politely as a status. */
  tone?: FlowNoticeTone;
  children: ReactNode;
}

/** A short message inside a step: a reassurance, a confirmation, or a failure with the way forward. */
export function FlowNotice({ tone = 'info', children }: FlowNoticeProps) {
  return (
    <div className={`ws-flow-notice ws-flow-notice--${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <FlowIcon name="info" />
      <span>{children}</span>
    </div>
  );
}

export interface FlowWaitingProps {
  /** What is being waited for: "Waiting for this device". */
  title: string;
  /** What the person should do meanwhile. */
  children: ReactNode;
}

/** A card for a wait the person cannot speed up, such as the device's passkey prompt. */
export function FlowWaiting({ title, children }: FlowWaitingProps) {
  return (
    <div className="ws-flow-waiting" role="status">
      <span className="ws-flow-waiting__spinner" aria-hidden="true" />
      <span className="ws-flow-waiting__text">
        <span className="ws-flow-waiting__title">{title}</span>
        <span className="ws-flow-waiting__detail">{children}</span>
      </span>
    </div>
  );
}

/** The tick that pops in when something has been done. Decorative: the heading beside it says what happened. */
export function SuccessMark() {
  return (
    <span className="ws-flow-success" aria-hidden="true">
      <FlowIcon name="check" />
    </span>
  );
}

/** A labelled rule between two ways of doing the same thing: "or". */
export function FlowDivider({ children }: { children: string }) {
  return <div className="ws-flow-divider">{children}</div>;
}

/** A small fixed label that stays on screen while the app is showing stand-in data. */
export function DemoMarker({ children }: { children: string }) {
  return (
    <div className="ws-flow-demo" role="note">
      {children}
    </div>
  );
}

export type PasswordStrengthScore = 0 | 1 | 2 | 3 | 4;

export interface PasswordStrengthProps {
  /** 0 hides the meter (nothing typed yet); 4 is strong. */
  score: PasswordStrengthScore;
  /** The verdict in words, for example "Good · 14 characters". Never colour alone. */
  children: string;
}

/** Four bars and a verdict in words that update as a new password is typed. */
export function PasswordStrength({ score, children }: PasswordStrengthProps) {
  return (
    <div className="ws-flow-strength" data-score={score} aria-live="polite">
      {score > 0 ? (
        <>
          <span className="ws-flow-strength__bars" aria-hidden="true">
            {[1, 2, 3, 4].map((bar) => (
              <span key={bar} className="ws-flow-strength__bar" data-on={bar <= score} />
            ))}
          </span>
          <span className="ws-flow-strength__label">{children}</span>
        </>
      ) : null}
    </div>
  );
}

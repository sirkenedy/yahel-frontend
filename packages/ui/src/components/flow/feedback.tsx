import type { ReactNode } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import { FlowIcon } from './flow-icon';
import type { FlowIconName } from './flow-icon';

/** What a message is about. `offline` uses the warning colours with its own icon. */
export type FlowTone = 'info' | 'success' | 'warning' | 'danger' | 'offline';
export type FlowNoticeTone = FlowTone;

/** Every tone pairs its colour with an icon, so colour is never the only signal. */
export const toneIcons: Record<FlowTone, FlowIconName> = { info: 'info', success: 'check-circle', warning: 'warning', danger: 'alert', offline: 'offline' };

const interrupts = (tone: FlowTone) => tone === 'danger' || tone === 'warning' || tone === 'offline';

export interface FlowNoticeProps {
  /** `danger`, `warning` and `offline` are announced at once as an alert; `info` and `success` politely as a status. */
  tone?: FlowTone;
  /** What happened, in a few words. With a title the notice is a banner about the whole step. */
  title?: string;
  /** What is safe and what to do. */
  children?: ReactNode;
  /** At most two actions, written as verbs. */
  actions?: ReactNode;
}

/**
 * A message inside a step. Without a title it is a short note: a reassurance or a confirmation. With one
 * it is the banner under the heading: what happened, what is safe, and the way forward.
 */
export function FlowNotice({ tone = 'info', title, children, actions }: FlowNoticeProps) {
  return (
    <div className="ws-flow-notice" data-tone={tone} data-banner={title ? true : undefined} role={interrupts(tone) ? 'alert' : 'status'}>
      <FlowIcon name={toneIcons[tone]} />
      <span className="ws-flow-notice__text">
        {title ? <span className="ws-flow-notice__title">{title}</span> : null}
        {children ? <span>{children}</span> : null}
        {actions ? <span className="ws-flow-notice__actions">{actions}</span> : null}
      </span>
    </div>
  );
}

export interface FlowToastProps {
  tone?: FlowTone;
  /** One line, past tense: what just happened. */
  children: ReactNode;
  /** Accessible name of the close control: "Dismiss". */
  closeLabel: string;
  /** Called when its time is up or it is closed. */
  onClose: () => void;
}

/**
 * A passing confirmation at the bottom of the page. It leaves by itself; its time is the bar's animation,
 * which pauses while the pointer or focus is on it. Render it inside a region that is already on the page
 * (`FlowShell` has one), so assistive technology hears it arrive.
 */
export function FlowToast({ tone = 'success', children, closeLabel, onClose }: FlowToastProps) {
  return (
    <div className="ws-flow-toast" data-tone={tone}>
      <span className="ws-flow-toast__icon">
        <FlowIcon name={toneIcons[tone]} />
      </span>
      <span className="ws-flow-toast__text">{children}</span>
      <AriaButton className="ws-flow-toast__close" aria-label={closeLabel} onPress={onClose}>
        <FlowIcon name="close" />
      </AriaButton>
      <span className="ws-flow-toast__bar" aria-hidden="true" onAnimationEnd={onClose} />
    </div>
  );
}

export interface FlowConnectionBarProps {
  /** The few words that say what happened: "You’re offline." */
  lead: string;
  /** What is safe, and what happens next. */
  children: ReactNode;
}

/** The bar across the top of the page while the device has no connection. It pushes the page down. */
export function FlowConnectionBar({ lead, children }: FlowConnectionBarProps) {
  return (
    <div className="ws-flow-offline" data-tone="offline">
      <FlowIcon name="offline" />
      <span>
        <b>{lead}</b> {children}
      </span>
    </div>
  );
}

/** A quiet line under a busy button once the wait has grown long enough to wonder about. */
export function FlowSlowHint({ children }: { children: ReactNode }) {
  return (
    <p className="ws-flow-hint" role="status">
      <FlowIcon name="clock" />
      {children}
    </p>
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

export interface FlowCalloutProps {
  /** A decorative icon in the tile at the start. */
  icon: ReactNode;
  title: string;
  /** A few words in a pill beside the title, read as part of it: "Required for admins". */
  tag?: string;
  children: ReactNode;
}

/** A card that reassures: one fact in bold and a line that explains it. */
export function FlowCallout({ icon, title, tag, children }: FlowCalloutProps) {
  return (
    <div className="ws-flow-waiting">
      <span className="ws-flow-choice__icon">{icon}</span>
      <span className="ws-flow-waiting__text">
        <span className="ws-flow-waiting__title">
          {title}
          {tag ? <> <span className="ws-flow-choice__tag">{tag}</span></> : null}
        </span>
        <span className="ws-flow-waiting__detail">{children}</span>
      </span>
    </div>
  );
}

export interface FlowPreviewProps {
  /** What is being shown: "Your team’s addresses will look like". */
  label: string;
  /** A short mark at the far side, such as "Your domain". */
  tag?: string;
  /** The start of the value, in plain weight: "you@". */
  lead?: string;
  /** The part of the value that matters, picked out: "northwind.example". */
  children: string;
  /** A decorative icon in a tile at the start, such as the key beside a sign-in. */
  icon?: FlowIconName;
}

/** A card that shows what something will look like once it exists, such as an address on the person's domain. */
export function FlowPreview({ label, tag, lead, icon, children }: FlowPreviewProps) {
  return (
    <p className="ws-flow-preview" data-icon={icon ? true : undefined}>
      {icon ? (
        <span className="ws-flow-preview__icon">
          <FlowIcon name={icon} />
        </span>
      ) : null}
      <span className="ws-flow-preview__label">{label}</span>
      {tag ? <> <span className="ws-flow-choice__tag">{tag}</span></> : null}{' '}
      <span className="ws-flow-preview__value" translate="no">
        {lead}
        <strong>{children}</strong>
      </span>
    </p>
  );
}

function FlowFactsRoot({ children }: { children: ReactNode }) {
  return <ul className="ws-flow-facts">{children}</ul>;
}

function FlowFact({ lead, icon = 'check', children }: { /** The few words that carry the fact, in bold. */ lead: string; /** Decorative: a tick unless the fact is better drawn. */ icon?: FlowIconName; children: ReactNode }) {
  return (
    <li>
      <FlowIcon name={icon} />
      <span>
        <b>{lead}</b> {children}
      </span>
    </li>
  );
}

/** A short ticked list of what will and will not happen. */
export const FlowFacts = Object.assign(FlowFactsRoot, { Item: FlowFact });

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

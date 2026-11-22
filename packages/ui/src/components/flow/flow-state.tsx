import { useState } from 'react';
import type { ReactNode } from 'react';
import { toneIcons } from './feedback';
import type { FlowTone } from './feedback';
import { FlowButton } from './flow-button';
import { FlowIcon } from './flow-icon';
import type { FlowIconName } from './flow-icon';
import { FlowStep } from './flow-step';

export interface FlowStateProps {
  tone: FlowTone;
  /** The large calm icon. The tone's own icon unless another says it better, such as a clock for a wait. */
  icon?: FlowIconName;
  /** What happened, as the page's heading. It takes focus when the state appears. */
  title: string;
  /** What is safe, in a sentence or two. */
  lede: ReactNode;
  /** A note or a reference under the lede. */
  children?: ReactNode;
  /** One way forward, and at most one real alternative. */
  actions: ReactNode;
}

/**
 * A whole-screen state: the person cannot continue from here. It takes the place of the step inside the
 * frame, so the header and footer stay, and it always offers a way out.
 */
export function FlowState({ tone, icon, title, lede, children, actions }: FlowStateProps) {
  return (
    <FlowStep>
      <span className="ws-flow-state__icon" data-tone={tone}>
        <FlowIcon name={icon ?? toneIcons[tone]} />
      </span>
      <FlowStep.Intro>
        <FlowStep.Heading>{title}</FlowStep.Heading>
        <FlowStep.Lede>{lede}</FlowStep.Lede>
      </FlowStep.Intro>
      {children}
      <FlowStep.Actions>{actions}</FlowStep.Actions>
    </FlowStep>
  );
}

function FlowReferenceRoot({ title, children }: { /** "If you contact us, quote this". */ title: string; children: ReactNode }) {
  return (
    <div className="ws-flow-reference">
      <p className="ws-flow-reference__title">{title}</p>
      <dl>{children}</dl>
    </div>
  );
}

interface FlowReferenceRowProps {
  label: string;
  value: string;
  /** Offers to copy the value: the button's two labels, "Copy" and "Copied". */
  copy?: { label: string; doneLabel: string };
}

function FlowReferenceRow({ label, value, copy }: FlowReferenceRowProps) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="ws-flow-reference__row">
      <dt>{label}</dt>
      <dd translate="no">{value}</dd>
      {copy ? (
        <FlowButton variant="chip" onPress={() => void navigator.clipboard?.writeText(value).then(() => setCopied(true))}>
          <span aria-live="polite">{copied ? copy.doneLabel : copy.label}</span>
        </FlowButton>
      ) : null}
    </div>
  );
}

/** What to quote to support: a short labelled list in a card, each value in a fixed-width face. */
export const FlowReference = Object.assign(FlowReferenceRoot, { Row: FlowReferenceRow });

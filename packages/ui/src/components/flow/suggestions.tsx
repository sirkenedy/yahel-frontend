import type { ReactNode } from 'react';

export interface FlowSuggestionsProps {
  /** What the suggestions are: "Also free". */
  label: string;
  /** `FlowButton`s of the `chip` variant. */
  children: ReactNode;
}

/** A labelled row of one-tap answers under a field. */
export function FlowSuggestions({ label, children }: FlowSuggestionsProps) {
  return (
    <div className="ws-flow-suggestions" role="group" aria-label={label}>
      <span aria-hidden="true">{label}</span>
      {children}
    </div>
  );
}

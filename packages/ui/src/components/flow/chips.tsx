import { createContext, use, useId } from 'react';
import type { ReactNode } from 'react';

interface FlowChipsState {
  name: string;
  value: string;
  onChange: (value: string) => void;
}

const FlowChipsContext = createContext<FlowChipsState | null>(null);

export type FlowChipsLayout = 'wrap' | 'compact' | 'segmented';

export interface FlowChipsProps<Value extends string> {
  /** The question the chips answer. Shown above them unless `isLabelHidden`. */
  label: string;
  /** For a control whose purpose is plain from where it sits: the label is then for assistive technology only. */
  isLabelHidden?: boolean;
  value: Value;
  onChange: (value: Value) => void;
  /** `wrap`: separate pills that flow onto further lines. `compact`: the same, closer together, for a run of numbers. `segmented`: two or three joined in one track. */
  layout?: FlowChipsLayout;
  children: ReactNode;
}

/** A few short answers of which exactly one is chosen, as pills. They are native radios: arrow keys move between them. */
export function FlowChips<Value extends string>({ label, isLabelHidden = false, value, onChange, layout = 'wrap', children }: FlowChipsProps<Value>) {
  const name = useId();
  return (
    <FlowChipsContext value={{ name, value, onChange: onChange as (value: string) => void }}>
      <div className="ws-flow-chips">
        <span id={`${name}l`} className={isLabelHidden ? 'ws-flow-hidden' : 'ws-flow-field__label'}>
          {label}
        </span>
        <div className="ws-flow-chips__list" data-layout={layout} role="radiogroup" aria-labelledby={`${name}l`}>
          {children}
        </div>
      </div>
    </FlowChipsContext>
  );
}

export interface FlowChipProps {
  value: string;
  /** A short mark after the words, such as "Save 16%". */
  badge?: string;
  children: ReactNode;
}

/** One pill. The whole pill is the radio's hit target. */
export function FlowChip({ value, badge, children }: FlowChipProps) {
  const group = use(FlowChipsContext);
  if (!group) throw new Error('<FlowChip> must be rendered inside <FlowChips>.');
  return (
    <label className="ws-flow-pill">
      <input type="radio" name={group.name} value={value} checked={group.value === value} onChange={() => group.onChange(value)} />
      <span>{children}</span>
      {badge ? <> <span className="ws-flow-badge">{badge}</span></> : null}
    </label>
  );
}

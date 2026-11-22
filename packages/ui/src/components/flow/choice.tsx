import { createContext, use, useId } from 'react';
import type { ReactNode } from 'react';
import { FlowIcon } from './flow-icon';

interface ChoiceGroupState {
  name: string;
  value: string;
  onChange: (value: string) => void;
  isDisabled: boolean;
}

const ChoiceGroupContext = createContext<ChoiceGroupState | null>(null);

export interface ChoiceGroupProps<Value extends string> {
  /** Names the question the choices answer, for example "Where to send the code". */
  label: string;
  value: Value;
  onChange: (value: Value) => void;
  isDisabled?: boolean;
  children: ReactNode;
}

/** A short list of large options where exactly one is chosen. Arrow keys move between them. */
export function ChoiceGroup<Value extends string>({ label, value, onChange, isDisabled = false, children }: ChoiceGroupProps<Value>) {
  const name = useId();
  return (
    <ChoiceGroupContext value={{ name, value, onChange: onChange as (value: string) => void, isDisabled }}>
      <div className="ws-flow-choices" role="radiogroup" aria-label={label}>
        {children}
      </div>
    </ChoiceGroupContext>
  );
}

export interface ChoiceProps {
  value: string;
  /** A decorative icon in the tile at the start. */
  icon?: ReactNode;
  /** A second line that explains the option. */
  detail?: string;
  children: ReactNode;
}

/** One option. The whole card is the radio's hit target. */
export function Choice({ value, icon, detail, children }: ChoiceProps) {
  const group = use(ChoiceGroupContext);
  if (!group) throw new Error('<Choice> must be rendered inside <ChoiceGroup>.');
  return (
    <label className="ws-flow-choice">
      <input className="ws-flow-choice__input" type="radio" name={group.name} value={value} checked={group.value === value} onChange={() => group.onChange(value)} disabled={group.isDisabled} />
      {icon ? <span className="ws-flow-choice__icon">{icon}</span> : null}
      <span className="ws-flow-choice__text">
        <span className="ws-flow-choice__title">{children}</span>
        {detail ? <span className="ws-flow-choice__detail">{detail}</span> : null}
      </span>
      <span className="ws-flow-choice__dot" aria-hidden="true" />
    </label>
  );
}

export interface FlowCheckboxProps {
  isSelected: boolean;
  onChange: (isSelected: boolean) => void;
  isDisabled?: boolean;
  /** The label. The whole line is the hit target. */
  children: ReactNode;
}

/** A yes-or-no choice that is off unless the person turns it on. */
export function FlowCheckbox({ isSelected, onChange, isDisabled, children }: FlowCheckboxProps) {
  return (
    <label className="ws-flow-check">
      <input type="checkbox" checked={isSelected} onChange={(event) => onChange(event.target.checked)} disabled={isDisabled} />
      <span className="ws-flow-check__box" aria-hidden="true">
        <FlowIcon name="check" />
      </span>
      <span>{children}</span>
    </label>
  );
}

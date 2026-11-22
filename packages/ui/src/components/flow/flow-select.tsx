import { useId } from 'react';
import type { ReactNode, Ref } from 'react';
import { FlowIcon } from './flow-icon';

export interface FlowSelectProps {
  /** Always visible. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Says what is wrong and how to fix it. Setting it marks the field invalid. */
  error?: string;
  name?: string;
  autoComplete?: string;
  /** The value is personal: it is blurred, unless focused, while the shell is hiding private details. */
  isSensitive?: boolean;
  /** The select element, for moving focus to the field when it needs attention. */
  inputRef?: Ref<HTMLSelectElement>;
  /** `<option>` and `<optgroup>` elements. */
  children: ReactNode;
}

/**
 * A choice from a list, the size and shape of a flow field. It is the platform's own select: the list,
 * type-ahead and the phone's picker all come from the browser, and work with every assistive technology.
 */
export function FlowSelect({ label, value, onChange, error, name, autoComplete, isSensitive, inputRef, children }: FlowSelectProps) {
  const id = useId();
  return (
    <div className="ws-flow-field">
      <label className="ws-flow-field__label" htmlFor={id}>
        {label}
      </label>
      <div className="ws-flow-field__control ws-flow-select" data-sensitive={isSensitive || undefined}>
        <select ref={inputRef} id={id} className="ws-flow-field__input" name={name} autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}e` : undefined}>
          {children}
        </select>
        <FlowIcon name="chevron-down" />
      </div>
      {error ? (
        <span id={`${id}e`} className="ws-flow-field__error" role="alert">
          <FlowIcon name="info" />
          <span>{error}</span>
        </span>
      ) : null}
    </div>
  );
}

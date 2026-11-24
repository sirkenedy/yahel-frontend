import { FieldError, Input, Label, Text, TextField as AriaTextField } from 'react-aria-components';
import { useRef } from 'react';
import type { Ref } from 'react';
import { FlowIcon } from './flow-icon';

const disallowed = { digits: /\D/g, alphanumeric: /[^a-z0-9]/gi } as const;

export interface CodeInputProps {
  /** The one label for the whole code, for example "6-digit code". */
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** How many characters the code has. */
  length?: number;
  /** `digits` for codes from an app or a text message, `alphanumeric` for codes that mix letters and numbers. */
  characters?: keyof typeof disallowed;
  help?: string;
  error?: string;
  name?: string;
  isDisabled?: boolean;
  /** The input element, for moving focus to the code when it needs attention. */
  inputRef?: Ref<HTMLInputElement>;
  /** Sends the form as soon as the last character is typed or a whole code is pasted, as pressing its submit button would. On by default. */
  submitWhenFull?: boolean;
}

/**
 * A one-time code drawn as separate boxes. Underneath it is a single text input, so pasting fills every
 * box, Backspace steps back, the browser can offer the code from a message, and a screen reader meets
 * one labelled field instead of six.
 */
export function CodeInput({ label, value, onChange, length = 6, characters = 'digits', help, error, name = 'code', isDisabled, inputRef, submitWhenFull = true }: CodeInputProps) {
  const current = Math.min(value.length, length - 1);
  const input = useRef<HTMLInputElement | null>(null);
  const attach = (element: HTMLInputElement | null) => {
    input.current = element;
    if (typeof inputRef === 'function') inputRef(element);
    else if (inputRef) inputRef.current = element;
  };
  const change = (typed: string) => {
    const next = typed.replace(disallowed[characters], '').slice(0, length);
    onChange(next);
    // Only the change that completes the code sends it, so a code that was refused is not sent again until it is edited.
    // After React has applied the new value, so the form reads the whole code.
    if (submitWhenFull && next.length === length && value.length < length) setTimeout(() => input.current?.form?.requestSubmit(), 0);
  };
  return (
    <AriaTextField
      className="ws-flow-code"
      value={value}
      onChange={change}
      isInvalid={Boolean(error)}
      isDisabled={isDisabled}
      validationBehavior="aria"
      name={name}
      autoComplete="one-time-code"
      inputMode={characters === 'digits' ? 'numeric' : 'text'}
    >
      <Label className="ws-flow-field__label">{label}</Label>
      <div className="ws-flow-code__row">
        {Array.from({ length }, (_, index) => (
          <span key={index} className="ws-flow-code__box" data-current={index === current} aria-hidden="true">
            {value.charAt(index)}
          </span>
        ))}
        <Input ref={attach} className="ws-flow-code__input" spellCheck={false} autoCapitalize="off" autoCorrect="off" />
      </div>
      <FieldError className="ws-flow-field__error">
        <FlowIcon name="alert" />
        <span>{error}</span>
      </FieldError>
      {help ? (
        <Text slot="description" className="ws-flow-field__help">
          {help}
        </Text>
      ) : null}
    </AriaTextField>
  );
}

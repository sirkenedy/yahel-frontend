import { FieldError, Input, Label, Text, TextField as AriaTextField } from 'react-aria-components';

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
}

/**
 * A one-time code drawn as separate boxes. Underneath it is a single text input, so pasting fills every
 * box, Backspace steps back, the browser can offer the code from a message, and a screen reader meets
 * one labelled field instead of six.
 */
export function CodeInput({ label, value, onChange, length = 6, characters = 'digits', help, error, name = 'code', isDisabled }: CodeInputProps) {
  const current = Math.min(value.length, length - 1);
  return (
    <AriaTextField
      className="ws-flow-code"
      value={value}
      onChange={(next) => onChange(next.replace(disallowed[characters], '').slice(0, length))}
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
        <Input className="ws-flow-code__input" spellCheck={false} autoCapitalize="off" autoCorrect="off" />
      </div>
      <FieldError className="ws-flow-field__error">{error}</FieldError>
      {help ? (
        <Text slot="description" className="ws-flow-field__help">
          {help}
        </Text>
      ) : null}
    </AriaTextField>
  );
}

import { FieldError, Input, Label, Text, TextField as AriaTextField, ToggleButton } from 'react-aria-components';
import { useState } from 'react';
import type { TextFieldProps } from './text-field';

export interface PasswordFieldProps extends Omit<TextFieldProps, 'type' | 'inputMode'> {
  /** Accessible name of the control while the password is hidden, for example "Show password". */
  showLabel: string;
  /** Accessible name of the control while the password is shown, for example "Hide password". */
  hideLabel: string;
  isRevealed?: boolean;
  defaultRevealed?: boolean;
  onRevealedChange?: (isRevealed: boolean) => void;
}

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg className="ws-field__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {crossed ? <path d="m4 4 16 16" /> : null}
    </svg>
  );
}

export function PasswordField({ label, help, error, placeholder, showLabel, hideLabel, isRevealed, defaultRevealed = false, onRevealedChange, ...props }: PasswordFieldProps) {
  const [internal, setInternal] = useState(defaultRevealed);
  const revealed = isRevealed ?? internal;
  const change = (next: boolean) => {
    setInternal(next);
    onRevealedChange?.(next);
  };

  return (
    <AriaTextField {...props} type={revealed ? 'text' : 'password'} isInvalid={props.isInvalid ?? Boolean(error)} className="ws-field">
      <Label className="ws-field__label">{label}</Label>
      <div className="ws-field__control">
        <Input className="ws-input ws-input--with-trailing" placeholder={placeholder} />
        <ToggleButton
          className="ws-button ws-button--plain ws-button--icon ws-field__trailing"
          isSelected={revealed}
          onChange={change}
          aria-label={revealed ? hideLabel : showLabel}
        >
          <EyeIcon crossed={revealed} />
        </ToggleButton>
      </div>
      {help && !error ? (
        <Text slot="description" className="ws-field__help">
          {help}
        </Text>
      ) : null}
      <FieldError className="ws-field__error">{error}</FieldError>
    </AriaTextField>
  );
}

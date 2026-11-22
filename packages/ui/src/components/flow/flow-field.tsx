import { FieldError, Input, Label, Text, TextField as AriaTextField, ToggleButton } from 'react-aria-components';
import type { TextFieldProps as AriaTextFieldProps } from 'react-aria-components';
import { useState } from 'react';
import type { ReactNode, Ref } from 'react';
import { FlowIcon } from './flow-icon';

export interface FlowTextFieldProps extends Omit<AriaTextFieldProps, 'className' | 'children'> {
  /** Always visible. */
  label: string;
  help?: string;
  /** Says what is wrong and how to fix it. Setting it marks the field invalid. */
  error?: string;
  /** The input element, for moving focus to the field when it needs attention. */
  inputRef?: Ref<HTMLInputElement>;
  /** Fixed text inside the field after what is typed, such as "@yahel.com". */
  suffix?: string;
  /**
   * Good news about the value, such as "Available". Announced politely; an `error` replaces it. A field
   * that may come to have some passes `null` meanwhile, so the announcing region is there before the news.
   */
  success?: string | null;
  /** The value has a format and meets it: a tick shows inside the field. Never for names. */
  isValid?: boolean;
  /** One link under the error when there is a better path than fixing the value. */
  action?: ReactNode;
  /** The value is personal: it is blurred, unless focused, while the shell is hiding private details. */
  isSensitive?: boolean;
}

interface FieldFrameProps extends FlowTextFieldProps {
  /** A control inside the field's border, after the input. */
  trailing?: ReactNode;
}

function FieldFrame({ label, help, error, trailing, inputRef, suffix, success, isValid, action, isSensitive, ...props }: FieldFrameProps) {
  const invalid = props.isInvalid ?? Boolean(error);
  return (
    <AriaTextField validationBehavior="aria" {...props} isInvalid={invalid} className="ws-flow-field">
      <Label className="ws-flow-field__label">{label}</Label>
      <div className="ws-flow-field__control" data-sensitive={isSensitive || undefined}>
        <Input ref={inputRef} className="ws-flow-field__input" />
        {suffix ? <span className="ws-flow-field__suffix">{suffix}</span> : null}
        {invalid ? <FlowIcon name="alert" /> : isValid ? <FlowIcon name="check-circle" /> : null}
        {trailing}
      </div>
      {success === undefined ? null : (
        <span className="ws-flow-field__success" role="status">
          {success && !error ? (
            <>
              <FlowIcon name="check" />
              {success}
            </>
          ) : null}
        </span>
      )}
      <FieldError className="ws-flow-field__error">
        <FlowIcon name="alert" />
        <span>{error}</span>
      </FieldError>
      {action && invalid ? <span className="ws-flow-field__action">{action}</span> : null}
      {help ? (
        <Text slot="description" className="ws-flow-field__help">
          {help}
        </Text>
      ) : null}
    </AriaTextField>
  );
}

/** The 56 px field of the sign-in and sign-up flows: label above, error and help beneath. */
export function FlowTextField(props: FlowTextFieldProps) {
  return <FieldFrame {...props} />;
}

export interface FlowPasswordFieldProps extends Omit<FlowTextFieldProps, 'type' | 'inputMode' | 'spellCheck'> {
  /** Visible text of the control while the password is hidden: "Show". */
  showText: string;
  /** Visible text of the control while the password is shown: "Hide". */
  hideText: string;
  /** Accessible name while hidden: "Show password". Must contain `showText`. */
  showLabel: string;
  /** Accessible name while shown: "Hide password". Must contain `hideText`. */
  hideLabel: string;
  isRevealed?: boolean;
  onRevealedChange?: (isRevealed: boolean) => void;
}

/** A password field with a show and hide control inside its border. */
export function FlowPasswordField({ showText, hideText, showLabel, hideLabel, isRevealed, onRevealedChange, ...props }: FlowPasswordFieldProps) {
  const [internal, setInternal] = useState(false);
  const revealed = isRevealed ?? internal;
  const change = (next: boolean) => {
    setInternal(next);
    onRevealedChange?.(next);
  };

  return (
    <FieldFrame
      {...props}
      type={revealed ? 'text' : 'password'}
      spellCheck="false"
      trailing={
        <ToggleButton className="ws-flow-field__toggle" isSelected={revealed} isDisabled={props.isDisabled} onChange={change} aria-label={revealed ? hideLabel : showLabel}>
          {revealed ? hideText : showText}
        </ToggleButton>
      }
    />
  );
}

export interface UsernameHintProps {
  /** The account the password on this step belongs to. */
  value: string;
}

/**
 * Tells a password manager which account a password is for, on a step that has a password field but no
 * visible email field. It is a real text input, because managers ignore `type="hidden"`, kept out of
 * sight, out of the tab order and out of the accessibility tree.
 */
export function UsernameHint({ value }: UsernameHintProps) {
  return <input className="ws-flow-username-hint" type="text" name="username" autoComplete="username" value={value} readOnly tabIndex={-1} aria-hidden="true" />;
}

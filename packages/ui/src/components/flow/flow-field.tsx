import { FieldError, Input, Label, Text, TextField as AriaTextField, ToggleButton } from 'react-aria-components';
import type { TextFieldProps as AriaTextFieldProps } from 'react-aria-components';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { FlowIcon } from './flow-icon';

export interface FlowTextFieldProps extends Omit<AriaTextFieldProps, 'className' | 'children'> {
  /** Always visible. */
  label: string;
  help?: string;
  /** Says what is wrong and how to fix it. Setting it marks the field invalid. */
  error?: string;
}

interface FieldFrameProps extends FlowTextFieldProps {
  /** A control inside the field's border, after the input. */
  trailing?: ReactNode;
}

function FieldFrame({ label, help, error, trailing, ...props }: FieldFrameProps) {
  return (
    <AriaTextField validationBehavior="aria" {...props} isInvalid={props.isInvalid ?? Boolean(error)} className="ws-flow-field">
      <Label className="ws-flow-field__label">{label}</Label>
      <div className="ws-flow-field__control">
        <Input className="ws-flow-field__input" />
        {trailing}
      </div>
      <FieldError className="ws-flow-field__error">
        <FlowIcon name="info" />
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

import { FieldError, Input, Label, Text, TextField as AriaTextField } from 'react-aria-components';
import type { TextFieldProps as AriaTextFieldProps } from 'react-aria-components';

export interface TextFieldProps extends Omit<AriaTextFieldProps, 'className' | 'children'> {
  /** Always visible. Placeholder text never replaces it. */
  label: string;
  help?: string;
  /** Says what is wrong and how to fix it. Setting it marks the field invalid. */
  error?: string;
  placeholder?: string;
}

export function TextField({ label, help, error, placeholder, ...props }: TextFieldProps) {
  return (
    <AriaTextField {...props} isInvalid={props.isInvalid ?? Boolean(error)} className="ws-field">
      <Label className="ws-field__label">{label}</Label>
      <Input className="ws-input" placeholder={placeholder} />
      {help && !error ? (
        <Text slot="description" className="ws-field__help">
          {help}
        </Text>
      ) : null}
      <FieldError className="ws-field__error">{error}</FieldError>
    </AriaTextField>
  );
}

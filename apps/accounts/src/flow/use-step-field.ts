import { useRef, useState } from 'react';
import type { FormEvent } from 'react';

export interface StepFieldOptions {
  initial?: string;
  /** What is wrong with the value, in words for the person, or `null` when it can be sent. */
  problemOf: (value: string) => string | null;
  /** Called on submit with a value that has no problem. Leave out when the field is one of several (`submitFields`). */
  onValid?: (value: string) => void;
}

/**
 * One field of a step: its value, its problem, and what submitting does. A problem is found on submit,
 * shown beside the field with focus moved to it, and cleared as soon as the value is edited.
 */
export function useStepField<Control extends HTMLElement = HTMLInputElement>({ initial = '', problemOf, onValid }: StepFieldOptions) {
  const [value, setValue] = useState(initial);
  const [problem, setProblem] = useState<string | null>(null);
  const inputRef = useRef<Control>(null);

  const change = (next: string) => {
    setValue(next);
    setProblem(null);
  };

  /** Shows the value's problem, if it has one, and says whether it can be sent. */
  const check = () => {
    const found = problemOf(value);
    setProblem(found);
    return found === null;
  };

  const focus = () => inputRef.current?.focus();

  /** Shows a problem found outside the step, such as an answer the server refused, and moves focus to the field. */
  const reject = (found: string) => {
    setProblem(found);
    focus();
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (check()) onValid?.(value);
    else focus();
  };

  return { value, change, error: problem ?? undefined, submit, inputRef, check, focus, reject };
}

type CheckedField = Pick<ReturnType<typeof useStepField>, 'check' | 'focus'>;

/**
 * Submits a step that asks for several things at once: call it from the form's submit handler. Every
 * field's problem is shown, focus moves to the first field that has one, and `onValid` runs only when
 * none has. Pass the fields in the order they appear.
 */
export function submitFields(event: FormEvent<HTMLFormElement>, fields: readonly CheckedField[], onValid: () => void) {
  event.preventDefault();
  const refused = fields.filter((field) => !field.check());
  if (refused[0]) refused[0].focus();
  else onValid();
}

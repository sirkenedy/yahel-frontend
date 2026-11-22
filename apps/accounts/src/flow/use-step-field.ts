import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Feedback } from './feedback';

export interface StepFieldOptions {
  initial?: string;
  /** The value, when something other than the field holds it. Give `onChange` with it; `initial` is then unused. */
  value?: string;
  onChange?: (value: string) => void;
  /** What is wrong with the value, in words for the person, or `null` when it can be sent. */
  problemOf: (value: string) => string | null;
  /** Called on submit with a value that has no problem. Leave out when the field is one of several (`useStepFields`). */
  onValid?: (value: string) => void;
  /** The field's label, for the summary a step with several fields shows. */
  label?: string;
  /** The value has a format to get right (an email, a phone number, a password), so it earns a tick once it is. Never a name. */
  hasFormat?: boolean;
  /** What the server said about this field's value (`forField`). Shown until the value is edited; focus moves to the field when it arrives. */
  refusal?: Feedback | null;
}

/**
 * One field of a step: its value, its problem, and what submitting does. Typing for the first time never
 * shows a problem. Leaving a field that was typed in checks it, and so does submitting, which also moves
 * focus to it. From then on it is checked on every key, so the problem goes the moment it is fixed.
 */
export function useStepField<Control extends HTMLElement = HTMLInputElement>({ initial = '', value: held, onChange, problemOf, onValid, label = '', hasFormat = false, refusal = null }: StepFieldOptions) {
  const [own, setOwn] = useState(initial);
  const value = held ?? own;
  const [problem, setProblem] = useState<string | null>(null);
  const [typed, setTyped] = useState(false);
  const [checked, setChecked] = useState(false);
  const [answered, setAnswered] = useState<Feedback | null>(null);
  const inputRef = useRef<Control>(null);
  const refused = refusal && refusal !== answered && refusal.place === 'field' ? refusal.text : null;

  useEffect(() => {
    if (refused) inputRef.current?.focus();
  }, [refused, refusal]);

  const change = (next: string) => {
    if (onChange) onChange(next);
    else setOwn(next);
    setTyped(true);
    setAnswered(refusal);
    setProblem(checked ? problemOf(next) : null);
  };

  /** Shows the value's problem, if it has one, and says whether it can be sent. */
  const check = () => {
    const found = problemOf(value);
    setProblem(found);
    setChecked(true);
    return found === null;
  };

  const blur = () => {
    if (typed) check();
  };

  const focus = () => inputRef.current?.focus();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (check()) onValid?.(value);
    else focus();
  };

  const error = problem ?? refused ?? undefined;
  return { value, change, blur, error, isValid: hasFormat && checked && !error && value.trim() !== '', submit, inputRef, check, focus, label };
}

type CheckedField = Pick<ReturnType<typeof useStepField>, 'check' | 'focus'>;

/**
 * Submits a step that asks for several things at once: call it from the form's submit handler. Every
 * field's problem is shown, focus moves to the first field that has one, and `onValid` runs only when
 * none has. Pass the fields in the order they appear. Says how many fields were refused.
 */
export function submitFields(event: FormEvent<HTMLFormElement>, fields: readonly CheckedField[], onValid: () => void) {
  event.preventDefault();
  const refused = fields.filter((field) => !field.check());
  if (refused[0]) refused[0].focus();
  else onValid();
  return refused.length;
}

type SummarisedField = CheckedField & Pick<ReturnType<typeof useStepField>, 'error' | 'label'>;

/**
 * A step with several fields. After a submit that found problems, `toFix` names the fields that still
 * have one, for the summary above the form; it empties as they are put right.
 */
export function useStepFields(fields: readonly SummarisedField[]) {
  const [refused, setRefused] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>, onValid: () => void) => setRefused(submitFields(event, fields, onValid) > 0);
  return { submit, toFix: refused ? fields.filter((field) => field.error && field.label).map((field) => field.label) : [] };
}

import { useRef, useState } from 'react';
import type { FormEvent } from 'react';

export interface StepFieldOptions {
  initial?: string;
  /** What is wrong with the value, in words for the person, or `null` when it can be sent. */
  problemOf: (value: string) => string | null;
  /** Called on submit with a value that has no problem. */
  onValid: (value: string) => void;
}

/**
 * The one field of a one-question step: its value, its problem, and what submitting does. A problem is
 * found on submit, shown beside the field with focus moved to it, and cleared as soon as the value is edited.
 */
export function useStepField({ initial = '', problemOf, onValid }: StepFieldOptions) {
  const [value, setValue] = useState(initial);
  const [problem, setProblem] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const change = (next: string) => {
    setValue(next);
    setProblem(null);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = problemOf(value);
    setProblem(found);
    if (found) inputRef.current?.focus();
    else onValid(value);
  };

  return { value, change, error: problem ?? undefined, submit, inputRef };
}

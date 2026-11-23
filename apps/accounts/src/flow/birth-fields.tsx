import { FlowSelect, FlowStep, FlowTextField } from '@yahel/ui';
import type { ReactNode } from 'react';
import { readBirthDate } from './birth-date';
import type { BirthDateWords, TypedBirthDate } from './birth-date';
import { datePartOrder, monthNames } from './dates';
import type { BirthDate, DatePart } from './dates';
import type { Feedback } from './feedback';
import { useStepField } from './use-step-field';

export interface BirthFieldsWords extends BirthDateWords {
  locale: string;
  /** Names the three fields together: "Date of birth". */
  birthLabel: string;
  day: string;
  month: string;
  year: string;
}

export interface BirthFieldsOptions {
  initial: BirthDate | null;
  words: BirthFieldsWords;
  minAge: number;
  /** What the server said about the date. It is shown beside the year. */
  refusal?: Feedback | null;
}

// Built once per locale: the order a date is written in, and the months by name.
const written = new Map<string, { order: DatePart[]; months: string[] }>();
const writtenIn = (locale: string) => {
  const known = written.get(locale) ?? { order: datePartOrder(locale), months: monthNames(locale) };
  written.set(locale, known);
  return known;
};

/**
 * The three fields of a date of birth, in the order the locale writes them, for any flow that has to ask.
 * `row` is the fields; `fields` goes to `useStepFields`; `read` gives the date once nothing is wrong with it.
 */
export function useBirthFields({ initial, words, minAge, refusal = null }: BirthFieldsOptions) {
  const { order, months } = writtenIn(words.locale);
  // Each part's problem is read from the whole date, so "31" is refused for April but not for March.
  const typed = (): TypedBirthDate => ({ day: day.value, month: month.value, year: year.value });
  const problemWith = (part: DatePart) => (value: string): string | null => readBirthDate({ ...typed(), [part]: value }, words, minAge).problems[part] ?? null;
  const day = useStepField({ initial: initial ? String(initial.day) : '', problemOf: problemWith('day'), label: words.day });
  const month = useStepField<HTMLSelectElement>({ initial: initial ? String(initial.month) : '', problemOf: problemWith('month'), label: words.month });
  const year = useStepField({ initial: initial ? String(initial.year) : '', problemOf: problemWith('year'), label: words.year, refusal });

  const parts: Record<DatePart, ReactNode> = {
    day: <FlowTextField key="day" label={words.day} name="bday-day" inputMode="numeric" autoComplete="bday-day" maxLength={2} value={day.value} onChange={day.change} onBlur={day.blur} error={day.error} inputRef={day.inputRef} isSensitive />,
    month: (
      <FlowSelect key="month" label={words.month} name="bday-month" autoComplete="bday-month" value={month.value} onChange={month.change} error={month.error} inputRef={month.inputRef} isSensitive>
        <option value="">{words.month}</option>
        {months.map((name, index) => (
          <option key={name} value={index + 1}>
            {name}
          </option>
        ))}
      </FlowSelect>
    ),
    year: <FlowTextField key="year" label={words.year} name="bday-year" inputMode="numeric" autoComplete="bday-year" maxLength={4} value={year.value} onChange={year.change} onBlur={year.blur} error={year.error} inputRef={year.inputRef} isSensitive />,
  };
  const fields = { day, month, year };

  return {
    row: (
      <FlowStep.Row layout="date" label={words.birthLabel}>
        {order.map((part) => parts[part])}
      </FlowStep.Row>
    ),
    fields: order.map((part) => fields[part]),
    read: () => readBirthDate(typed(), words, minAge).birth,
  };
}

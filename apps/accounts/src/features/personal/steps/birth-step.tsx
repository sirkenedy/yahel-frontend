import { FlowButton, FlowNotice, FlowSelect, FlowStep, FlowTextField } from '@yahel/ui';
import { useState } from 'react';
import { useStepField, useStepFields } from '../../../flow/use-step-field';
import { refusals } from '../feedback';
import { datePartOrder, monthNames } from '../dates';
import type { Gender } from '../machine';
import { personalMessages as m } from '../messages';
import { usePersonalFlow } from '../personal-flow';
import { readBirthDate } from '../validation';
import { StepFrame } from './step-frame';

const order = datePartOrder(m.locale);
const months = monthNames(m.locale);
const genders = Object.entries(m.genders) as [Gender, string][];

export function BirthStep() {
  const { state, actions } = usePersonalFlow();
  const [gender, setGender] = useState(state.gender);
  const [explained, setExplained] = useState(false);
  // Each part's problem is read from the whole date, so "31" is refused for April but not for March.
  const typed = (): Record<'day' | 'month' | 'year', string> => ({ day: day.value, month: month.value, year: year.value });
  const problemWith = (part: 'day' | 'month' | 'year') => (value: string): string | null => readBirthDate({ ...typed(), [part]: value }).problems[part] ?? null;
  const day = useStepField({ initial: state.birth ? String(state.birth.day) : '', problemOf: problemWith('day'), label: m.day });
  const month = useStepField<HTMLSelectElement>({ initial: state.birth ? String(state.birth.month) : '', problemOf: problemWith('month'), label: m.month });
  const year = useStepField({ initial: state.birth ? String(state.birth.year) : '', problemOf: problemWith('year'), label: m.year, refusal: state.rejection?.step === 'birth' ? refusals.underage : null });

  const parts = {
    day: <FlowTextField key="day" label={m.day} name="bday-day" inputMode="numeric" autoComplete="bday-day" maxLength={2} value={day.value} onChange={day.change} onBlur={day.blur} error={day.error} inputRef={day.inputRef} isSensitive />,
    month: (
      <FlowSelect key="month" label={m.month} name="bday-month" autoComplete="bday-month" value={month.value} onChange={month.change} error={month.error} inputRef={month.inputRef} isSensitive>
        <option value="">{m.month}</option>
        {months.map((name, index) => (
          <option key={name} value={index + 1}>
            {name}
          </option>
        ))}
      </FlowSelect>
    ),
    year: <FlowTextField key="year" label={m.year} name="bday-year" inputMode="numeric" autoComplete="bday-year" maxLength={4} value={year.value} onChange={year.change} onBlur={year.blur} error={year.error} inputRef={year.inputRef} isSensitive />,
  };
  const fields = { day, month, year };
  const form = useStepFields(order.map((part) => fields[part]));

  const submit = () => {
    const { birth } = readBirthDate(typed());
    if (birth) actions.enterBirth(birth, gender);
  };

  return (
    <StepFrame title={m.birthTitle} lede={m.birthLede} toFix={form.toFix}>
      <FlowStep.Form onSubmit={(event) => form.submit(event, submit)}>
        <FlowStep.Body>
          <FlowStep.Row layout="date" label={m.birthLabel}>
            {order.map((part) => parts[part])}
          </FlowStep.Row>
          <FlowSelect label={m.gender} name="sex" autoComplete="sex" value={gender} onChange={(next) => setGender(next as Gender)} isSensitive>
            {genders.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </FlowSelect>
          <FlowButton variant="link" aria-expanded={explained} onPress={() => setExplained(!explained)}>
            {m.whyWeAsk}
          </FlowButton>
          {explained ? <FlowNotice>{m.whyWeAskAnswer}</FlowNotice> : null}
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary">
            {m.continue}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
    </StepFrame>
  );
}

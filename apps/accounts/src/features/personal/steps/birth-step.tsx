import { FlowButton, FlowNotice, FlowSelect, FlowStep } from '@yahel/ui';
import { useState } from 'react';
import { useBirthFields } from '../../../flow/birth-fields';
import { useStepFields } from '../../../flow/use-step-field';
import { refusals } from '../feedback';
import type { Gender } from '../machine';
import { personalMessages as m } from '../messages';
import { usePersonalFlow } from '../personal-flow';
import { MIN_AGE } from '../validation';
import { StepFrame } from './step-frame';

const genders = Object.entries(m.genders) as [Gender, string][];

export function BirthStep() {
  const { state, actions } = usePersonalFlow();
  const [gender, setGender] = useState(state.gender);
  const [explained, setExplained] = useState(false);
  const birthDate = useBirthFields({ initial: state.birth, words: m, minAge: MIN_AGE, refusal: state.rejection?.step === 'birth' ? refusals.underage : null });
  const form = useStepFields(birthDate.fields);
  const submit = () => {
    const birth = birthDate.read();
    if (birth) actions.enterBirth(birth, gender);
  };

  return (
    <StepFrame title={m.birthTitle} lede={m.birthLede} toFix={form.toFix}>
      <FlowStep.Form onSubmit={(event) => form.submit(event, submit)}>
        <FlowStep.Body>
          {birthDate.row}
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

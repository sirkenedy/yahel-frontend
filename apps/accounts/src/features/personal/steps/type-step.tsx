import { Choice, ChoiceGroup, FlowButton, FlowIcon, FlowStep } from '@yahel/ui';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { personalMessages as m } from '../messages';
import { usePersonalFlow } from '../personal-flow';
import { StepFrame } from './step-frame';

export function TypeStep() {
  const { actions } = usePersonalFlow();
  const [kind, setKind] = useState<'personal' | 'business'>('personal');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (kind === 'personal') actions.startPersonal();
    else actions.startBusiness();
  };

  return (
    <StepFrame title={m.typeTitle} lede={m.typeLede}>
      <FlowStep.Form onSubmit={submit}>
        <FlowStep.Body>
          <ChoiceGroup label={m.typeLabel} value={kind} onChange={setKind}>
            <Choice value="personal" icon={<FlowIcon name="person" />} detail={m.typePersonalDetail}>
              {m.typePersonal}
            </Choice>
            <Choice value="business" icon={<FlowIcon name="building" />} detail={m.typeBusinessDetail}>
              {m.typeBusiness}
            </Choice>
          </ChoiceGroup>
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

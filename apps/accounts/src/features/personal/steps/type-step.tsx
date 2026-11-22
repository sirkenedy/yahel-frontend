import { Choice, ChoiceGroup, FlowButton, FlowIcon, FlowNotice, FlowStep } from '@yahel/ui';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { personalMessages as m } from '../messages';
import { usePersonalFlow } from '../personal-flow';
import { StepFrame } from './step-frame';

export function TypeStep() {
  const { actions, meta } = usePersonalFlow();
  const [kind, setKind] = useState<'personal' | 'business'>('personal');
  const [stopped, setStopped] = useState(false);

  const choose = (next: 'personal' | 'business') => {
    setKind(next);
    setStopped(false);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (kind === 'personal') actions.startPersonal();
    else if (meta.offers.business) actions.startBusiness();
    else setStopped(true);
  };

  return (
    <StepFrame title={m.typeTitle} lede={m.typeLede}>
      <FlowStep.Form onSubmit={submit}>
        <FlowStep.Body>
          <ChoiceGroup label={m.typeLabel} value={kind} onChange={choose}>
            <Choice value="personal" icon={<FlowIcon name="person" />} detail={m.typePersonalDetail}>
              {m.typePersonal}
            </Choice>
            <Choice value="business" icon={<FlowIcon name="building" />} detail={m.typeBusinessDetail}>
              {m.typeBusiness}
            </Choice>
          </ChoiceGroup>
          {stopped ? <FlowNotice>{m.businessUnavailable}</FlowNotice> : null}
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

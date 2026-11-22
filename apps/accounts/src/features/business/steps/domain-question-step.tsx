import { Choice, ChoiceGroup, FlowButton, FlowIcon, FlowStep } from '@yahel/ui';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useBusinessFlow } from '../business-flow';
import { businessMessages as m } from '../messages';
import { StepFrame } from './step-frame';

export function DomainQuestionStep() {
  const { state, actions } = useBusinessFlow();
  const [source, setSource] = useState(state.domainSource);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    actions.chooseDomainSource(source);
  };

  return (
    <StepFrame title={m.domainQuestionTitle} lede={m.domainQuestionLede}>
      <FlowStep.Form onSubmit={submit}>
        <FlowStep.Body>
          <ChoiceGroup label={m.domainQuestionLabel} value={source} onChange={setSource}>
            <Choice value="owned" icon={<FlowIcon name="globe" />} detail={m.ownDomainDetail}>
              {m.ownDomain}
            </Choice>
            <Choice value="bought" icon={<FlowIcon name="plus" />} detail={m.buyDomainDetail}>
              {m.buyDomain}
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

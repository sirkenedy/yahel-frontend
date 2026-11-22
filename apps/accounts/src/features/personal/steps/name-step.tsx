import { FlowButton, FlowStep, FlowTextField } from '@yahel/ui';
import { submitFields, useStepField } from '../../../flow/use-step-field';
import { personalMessages as m } from '../messages';
import { usePersonalFlow } from '../personal-flow';
import { firstNameProblem, lastNameProblem } from '../validation';
import { StepFrame } from './step-frame';

export function NameStep() {
  const { state, actions } = usePersonalFlow();
  const first = useStepField({ initial: state.firstName, problemOf: firstNameProblem });
  const last = useStepField({ initial: state.lastName, problemOf: lastNameProblem });

  return (
    <StepFrame title={m.nameTitle} lede={m.nameLede}>
      <FlowStep.Form onSubmit={(event) => submitFields(event, [first, last], () => actions.enterName(first.value.trim(), last.value.trim()))}>
        <FlowStep.Row>
          <FlowTextField label={m.firstName} name="given-name" autoComplete="given-name" value={first.value} onChange={first.change} error={first.error} inputRef={first.inputRef} isRequired />
          <FlowTextField label={m.lastName} name="family-name" autoComplete="family-name" help={m.optional} value={last.value} onChange={last.change} error={last.error} inputRef={last.inputRef} />
        </FlowStep.Row>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary">
            {m.continue}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
    </StepFrame>
  );
}

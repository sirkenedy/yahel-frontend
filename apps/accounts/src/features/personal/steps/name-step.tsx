import { FlowButton, FlowStep, FlowTextField } from '@yahel/ui';
import { useStepFields, useStepField } from '../../../flow/use-step-field';
import { personalMessages as m } from '../messages';
import { usePersonalFlow } from '../personal-flow';
import { firstNameProblem, lastNameProblem } from '../validation';
import { StepFrame } from './step-frame';

export function NameStep() {
  const { state, actions } = usePersonalFlow();
  const first = useStepField({ initial: state.firstName, problemOf: firstNameProblem, label: m.firstName });
  const last = useStepField({ initial: state.lastName, problemOf: lastNameProblem, label: m.lastName });
  const form = useStepFields([first, last]);

  return (
    <StepFrame title={m.nameTitle} lede={m.nameLede} toFix={form.toFix}>
      <FlowStep.Form onSubmit={(event) => form.submit(event, () => actions.enterName(first.value.trim(), last.value.trim()))}>
        <FlowStep.Row>
          <FlowTextField label={m.firstName} name="given-name" autoComplete="given-name" value={first.value} onChange={first.change} onBlur={first.blur} error={first.error} inputRef={first.inputRef} isRequired />
          <FlowTextField label={m.lastName} name="family-name" autoComplete="family-name" help={m.optional} value={last.value} onChange={last.change} onBlur={last.blur} error={last.error} inputRef={last.inputRef} />
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

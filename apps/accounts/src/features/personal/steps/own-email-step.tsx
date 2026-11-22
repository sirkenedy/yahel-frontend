import { FlowButton, FlowStep, FlowTextField } from '@yahel/ui';
import { useStepField } from '../../../flow/use-step-field';
import { personalMessages as m } from '../messages';
import { usePersonalFlow } from '../personal-flow';
import { refusals } from '../feedback';
import { ownEmailProblem } from '../validation';
import { StepFrame } from './step-frame';

export function OwnEmailStep() {
  const { state, actions } = usePersonalFlow();
  const email = useStepField({ initial: state.ownEmail, problemOf: ownEmailProblem, hasFormat: true, onValid: (value) => actions.chooseOwnEmail(value.trim().toLowerCase()), refusal: state.rejection?.step === 'own-email' ? refusals['not-personal'] : null });

  return (
    <StepFrame title={m.ownEmailTitle} lede={m.ownEmailLede}>
      <FlowStep.Form onSubmit={email.submit}>
        <FlowStep.Body>
          <FlowTextField label={m.ownEmailLabel} name="email" type="email" inputMode="email" autoComplete="email" spellCheck="false" value={email.value} onChange={email.change} onBlur={email.blur} isValid={email.isValid} error={email.error} inputRef={email.inputRef} isRequired />
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary">
            {m.continue}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
      <FlowStep.Links>
        <FlowButton variant="link" onPress={actions.useYahelAddress}>
          {m.useYahelAddress}
        </FlowButton>
      </FlowStep.Links>
    </StepFrame>
  );
}

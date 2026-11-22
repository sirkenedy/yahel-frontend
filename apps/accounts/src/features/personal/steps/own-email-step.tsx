import { FlowButton, FlowStep, FlowTextField } from '@yahel/ui';
import { useStepField } from '../../../flow/use-step-field';
import { personalMessages as m } from '../messages';
import { usePersonalFlow } from '../personal-flow';
import { ownEmailProblem } from '../validation';
import { StepFrame } from './step-frame';

export function OwnEmailStep() {
  const { state, actions } = usePersonalFlow();
  const email = useStepField({ initial: state.ownEmail, problemOf: ownEmailProblem, onValid: (value) => actions.chooseOwnEmail(value.trim().toLowerCase()) });
  const refused = state.rejection?.step === 'own-email' && email.value === state.ownEmail;

  return (
    <StepFrame title={m.ownEmailTitle} lede={m.ownEmailLede}>
      <FlowStep.Form onSubmit={email.submit}>
        <FlowStep.Body>
          <FlowTextField label={m.ownEmailLabel} name="email" type="email" inputMode="email" autoComplete="email" spellCheck="false" value={email.value} onChange={email.change} error={email.error ?? (refused ? m.ownEmailNotPersonal : undefined)} inputRef={email.inputRef} isRequired />
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

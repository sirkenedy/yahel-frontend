import { FlowButton, FlowStep, FlowSuggestions, FlowTextField } from '@yahel/ui';
import { useStepField } from '../../../flow/use-step-field';
import { personalMessages as m } from '../messages';
import { usePersonalFlow } from '../personal-flow';
import { addressProblem, normaliseAddress } from '../validation';
import { StepFrame } from './step-frame';

export function AddressStep() {
  const { state, actions, meta } = usePersonalFlow();
  const { status, alternatives } = state.addressCheck;
  const taken = alternatives.length > 0 ? m.addressTaken : m.addressTakenPlain;
  const name = useStepField({ initial: state.username, problemOf: (value) => addressProblem(value) ?? (status === 'taken' ? taken : null), onValid: actions.chooseAddress });
  // Refused when the account was being created: said until the name is changed.
  const refused = state.rejection?.step === 'address' && name.value === state.username;

  const change = (typed: string) => {
    const next = normaliseAddress(typed);
    name.change(next);
    actions.considerAddress(next);
  };

  return (
    <StepFrame title={m.addressTitle} lede={m.addressLede}>
      <FlowStep.Form onSubmit={name.submit}>
        <FlowStep.Body>
          <FlowTextField
            label={m.addressLabel}
            name="username"
            autoComplete="username"
            spellCheck="false"
            suffix={`@${meta.mailDomain}`}
            value={name.value}
            onChange={change}
            error={name.error ?? (status === 'taken' || refused ? taken : undefined)}
            success={status === 'available' ? m.addressAvailable : null}
            help={status === 'checking' ? m.addressChecking : status === 'unknown' ? m.addressUnchecked : undefined}
            inputRef={name.inputRef}
            isRequired
          />
          {alternatives.length > 0 ? (
            <FlowSuggestions label={m.alsoFree}>
              {alternatives.map((alternative) => (
                <FlowButton key={alternative} variant="chip" onPress={() => change(alternative)}>
                  {alternative}
                </FlowButton>
              ))}
            </FlowSuggestions>
          ) : null}
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary">
            {m.continue}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
      <FlowStep.Links>
        <FlowButton variant="link" onPress={actions.useOwnEmail}>
          {m.useOwnEmail}
        </FlowButton>
      </FlowStep.Links>
    </StepFrame>
  );
}

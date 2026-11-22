import { FlowButton, FlowStep, FlowSuggestions, FlowTextField } from '@yahel/ui';
import type { FormEvent } from 'react';
import { useStepField } from '../../../flow/use-step-field';
import { personalMessages as m } from '../messages';
import { usePersonalFlow } from '../personal-flow';
import { addressProblem, normaliseAddress } from '../validation';
import { StepFrame } from './step-frame';

export function AddressStep() {
  const { state, actions, meta } = usePersonalFlow();
  const { status, alternatives } = state.addressCheck;
  const taken = alternatives.length > 0 ? m.addressTaken : m.addressTakenPlain;
  const name = useStepField({ value: state.addressDraft, onChange: actions.typeAddress, problemOf: addressProblem, onValid: actions.chooseAddress });
  // Refused when the account was being created: said until the name is changed.
  const refused = state.rejection?.step === 'address' && name.value === state.username;

  const change = (typed: string) => name.change(normaliseAddress(typed));

  // What the server said about the last name checked is not a fact about the next one typed, so it is not
  // part of the field's own problem; a name known to be taken is simply not sent.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    if (status !== 'taken') return name.submit(event);
    event.preventDefault();
    name.focus();
  };

  return (
    <StepFrame title={m.addressTitle} lede={m.addressLede}>
      <FlowStep.Form onSubmit={submit}>
        <FlowStep.Body>
          <FlowTextField
            label={m.addressLabel}
            name="username"
            autoComplete="username"
            spellCheck="false"
            suffix={`@${meta.mailDomain}`}
            value={name.value}
            onChange={change}
            onBlur={name.blur}
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

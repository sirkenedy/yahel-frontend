import { FlowButton, FlowPasswordField, FlowStep, PasswordStrength, UsernameHint } from '@yahel/ui';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { passwordStrength } from '../../../flow/credentials';
import { useStepField } from '../../../flow/use-step-field';
import { personalMessages as m } from '../messages';
import { usePersonalFlow } from '../personal-flow';
import { passwordProblem } from '../validation';
import { StepFrame } from './step-frame';

export function PasswordStep() {
  const { state, actions } = usePersonalFlow();
  const [revealed, setRevealed] = useState(false);
  const password = useStepField({ initial: state.password ?? '', problemOf: passwordProblem, onValid: actions.choosePassword });
  const score = passwordStrength(password.value, state.firstName);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    // A revealed password is hidden again before anything else happens, so it is not left on screen.
    setRevealed(false);
    password.submit(event);
  };

  return (
    <StepFrame title={m.passwordTitle} lede={m.passwordLede}>
      <FlowStep.Form onSubmit={submit}>
        <FlowStep.Body>
          <UsernameHint value={state.address} />
          <FlowPasswordField
            label={m.passwordLabel}
            name="new-password"
            autoComplete="new-password"
            help={m.passwordHelp}
            showText={m.show}
            hideText={m.hide}
            showLabel={m.showPassword}
            hideLabel={m.hidePassword}
            isRevealed={revealed}
            onRevealedChange={setRevealed}
            value={password.value}
            onChange={password.change}
            error={password.error}
            inputRef={password.inputRef}
            isRequired
          />
          <PasswordStrength score={score}>{m.strength(m.strengthVerdicts[score], password.value.length)}</PasswordStrength>
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

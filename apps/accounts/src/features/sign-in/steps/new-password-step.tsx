import { FlowButton, FlowPasswordField, FlowStep, PasswordStrength, UsernameHint } from '@yahel/ui';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { signInMessages as m } from '../messages';
import { useSignInFlow } from '../sign-in-flow';
import { forField } from '../../../flow/feedback';
import { useStepField } from '../../../flow/use-step-field';
import { newPasswordProblem, passwordStrength } from '../validation';
import { StepFrame } from './step-frame';

export function NewPasswordStep() {
  const { state, actions, meta } = useSignInFlow();
  const [revealed, setRevealed] = useState(false);
  const request = meta.requests.newPassword;
  const password = useStepField({ problemOf: newPasswordProblem, onValid: actions.saveNewPassword, hasFormat: true, refusal: forField(request.feedback, 'password') });
  const score = passwordStrength(password.value, state.email?.split('@')[0]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    setRevealed(false);
    password.submit(event);
  };

  return (
    <StepFrame title={m.newPasswordTitle} lede={m.newPasswordLede} requests={[request]}>
      <FlowStep.Form onSubmit={submit}>
        <FlowStep.Body>
          <UsernameHint value={state.email ?? ''} />
          <FlowPasswordField
            label={m.newPasswordLabel}
            name="new-password"
            autoComplete="new-password"
            help={m.newPasswordHelp}
            showText={m.show}
            hideText={m.hide}
            showLabel={m.showPassword}
            hideLabel={m.hidePassword}
            isRevealed={revealed}
            onRevealedChange={setRevealed}
            value={password.value}
            onChange={password.change}
            onBlur={password.blur}
            isValid={password.isValid}
            error={password.error}
            inputRef={password.inputRef}
            isRequired
          />
          <PasswordStrength score={score}>{m.strength(m.strengthVerdicts[score], password.value.length)}</PasswordStrength>
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary" isPending={request.isPending} pendingLabel={m.saving}>
            {m.saveAndSignIn}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
    </StepFrame>
  );
}

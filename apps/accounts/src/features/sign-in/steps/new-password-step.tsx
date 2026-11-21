import { FlowButton, FlowPasswordField, FlowStep, PasswordStrength } from '@yahel/ui';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { signInMessages as m } from '../messages';
import { useSignInFlow } from '../sign-in-flow';
import { newPasswordProblem, passwordStrength } from '../validation';
import { StepFrame } from './step-frame';

export function NewPasswordStep() {
  const { state, actions, meta } = useSignInFlow();
  const [password, setPassword] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const request = meta.requests.newPassword;
  const score = passwordStrength(password, state.email?.split('@')[0]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRevealed(false);
    const found = newPasswordProblem(password);
    setProblem(found);
    if (found) event.currentTarget.querySelector<HTMLInputElement>('input[name="new-password"]')?.focus();
    else actions.saveNewPassword(password);
  };

  return (
    <StepFrame title={m.newPasswordTitle} lede={m.newPasswordLede} failure={request.failure}>
      <FlowStep.Form onSubmit={submit}>
        <FlowStep.Body>
          {/* Lets a password manager pair the password with the account it is for. */}
          <input type="hidden" name="username" autoComplete="username" value={state.email ?? ''} readOnly />
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
            value={password}
            onChange={(next) => {
              setPassword(next);
              setProblem(null);
            }}
            error={problem ?? undefined}
            isRequired
          />
          <PasswordStrength score={score}>{m.strength(m.strengthVerdicts[score], password.length)}</PasswordStrength>
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

import { FlowButton, FlowLink, FlowPasswordField, FlowStep } from '@yahel/ui';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { stepPath } from '../machine';
import { signInMessages as m } from '../messages';
import { useSignInFlow } from '../sign-in-flow';
import { StepFrame } from './step-frame';

export function PasswordStep() {
  const { state, actions, meta } = useSignInFlow();
  const [password, setPassword] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const request = meta.requests.password;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // A revealed password is hidden again before anything else happens, so it is not left on screen.
    setRevealed(false);
    if (password === '') {
      setProblem(m.passwordRequired);
      event.currentTarget.querySelector<HTMLInputElement>('input[name="password"]')?.focus();
      return;
    }
    actions.signInWithPassword(password);
  };

  return (
    <StepFrame title={m.passwordTitle} failure={request.failure}>
      <FlowStep.Form onSubmit={submit}>
        <FlowStep.Body>
          {/* Lets a password manager pair the password with the account it is for. */}
          <input type="hidden" name="username" autoComplete="username" value={state.email ?? ''} readOnly />
          <FlowPasswordField
            label={m.passwordLabel}
            name="password"
            autoComplete="current-password"
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
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary" isPending={request.isPending} pendingLabel={m.signingIn}>
            {m.signIn}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
      <FlowStep.Links>
        <FlowLink href={stepPath('recover')}>{m.forgotPassword}</FlowLink>
        {meta.offers.passkey ? (
          <FlowButton variant="link" onPress={actions.startPasskey}>
            {m.usePasskey}
          </FlowButton>
        ) : null}
      </FlowStep.Links>
    </StepFrame>
  );
}

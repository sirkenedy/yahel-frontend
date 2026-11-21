import { FlowButton, FlowLink, FlowPasswordField, FlowStep, UsernameHint } from '@yahel/ui';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { stepPath } from '../machine';
import { signInMessages as m } from '../messages';
import { useSignInFlow } from '../sign-in-flow';
import { useStepField } from '../../../flow/use-step-field';
import { StepFrame } from './step-frame';

const prompts = { 'challenge-expired': m.challengeExpired, 'reset-done': m.resetDoneSignInFailed } as const;

export function PasswordStep() {
  const { state, actions, meta } = useSignInFlow();
  const [revealed, setRevealed] = useState(false);
  const request = meta.requests.password;
  const password = useStepField({ problemOf: (value) => (value === '' ? m.passwordRequired : null), onValid: actions.signInWithPassword });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    // A revealed password is hidden again before anything else happens, so it is not left on screen.
    setRevealed(false);
    password.submit(event);
  };

  return (
    <StepFrame title={m.passwordTitle} failure={request.failure ?? (state.passwordPrompt ? prompts[state.passwordPrompt] : null)}>
      <FlowStep.Form onSubmit={submit}>
        <FlowStep.Body>
          <UsernameHint value={state.email ?? ''} />
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
            value={password.value}
            onChange={password.change}
            error={password.error}
            inputRef={password.inputRef}
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

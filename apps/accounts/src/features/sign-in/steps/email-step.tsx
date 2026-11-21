import { FlowButton, FlowDivider, FlowIcon, FlowLink, FlowStep, FlowTextField } from '@yahel/ui';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { stepPath } from '../machine';
import { signInMessages as m } from '../messages';
import { useSignInFlow } from '../sign-in-flow';
import { emailProblem } from '../validation';
import { StepFrame } from './step-frame';

export function EmailStep() {
  const { state, actions, meta } = useSignInFlow();
  const [email, setEmail] = useState(state.email ?? '');
  const [problem, setProblem] = useState<string | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = emailProblem(email);
    setProblem(found);
    if (found) event.currentTarget.querySelector<HTMLInputElement>('input[name="email"]')?.focus();
    else actions.enterEmail(email.trim());
  };

  return (
    <StepFrame title={m.emailTitle} lede={m.emailLede}>
      <FlowStep.Form onSubmit={submit}>
        <FlowStep.Body>
          <FlowTextField
            label={m.emailLabel}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username webauthn"
            spellCheck="false"
            value={email}
            onChange={(next) => {
              setEmail(next);
              setProblem(null);
            }}
            error={problem ?? undefined}
            isRequired
          />
          {meta.offers.passkey ? (
            <>
              <FlowDivider>{m.or}</FlowDivider>
              <FlowButton variant="field" onPress={actions.startPasskey}>
                <FlowIcon name="passkey" />
                {m.passkeySignIn}
              </FlowButton>
            </>
          ) : null}
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary">
            {m.continue}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
      {meta.offers.help ? (
        <FlowStep.Links>
          <FlowLink href={stepPath('help')}>{m.forgotEmail}</FlowLink>
        </FlowStep.Links>
      ) : null}
    </StepFrame>
  );
}

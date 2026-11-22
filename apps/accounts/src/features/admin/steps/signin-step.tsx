import { FlowButton, FlowLink, FlowPasswordField, FlowStep, FlowTextField, UsernameHint } from '@yahel/ui';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { isEmailShaped } from '../../../flow/credentials';
import { forField } from '../../../flow/feedback';
import { submitFields, useStepField } from '../../../flow/use-step-field';
import { useAdminFlow } from '../admin-flow';
import { carried } from '../feedback';
import { adminMessages as m } from '../messages';
import { StepFrame } from './step-frame';

const emailProblem = (value: string) => (value.trim() === '' ? m.emailRequired : isEmailShaped(value) ? null : m.emailInvalid);

/** The address arrives from workspace sign-up and is shown, not asked for; arriving any other way, it is asked for here. */
export function SignInStep() {
  const { state, actions, meta } = useAdminFlow();
  const [revealed, setRevealed] = useState(false);
  const request = meta.requests.password;
  const asksAddress = !state.handedOver;
  const email = useStepField({ initial: state.email ?? '', problemOf: emailProblem, label: m.emailLabel, hasFormat: true });
  const password = useStepField({ problemOf: (value) => (value === '' ? m.passwordRequired : null), label: m.passwordLabel, refusal: forField(request.feedback, 'password') });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    // A revealed password is hidden again before anything else happens, so it is not left on screen.
    setRevealed(false);
    submitFields(event, asksAddress ? [email, password] : [password], () => actions.signIn(password.value, asksAddress ? email.value.trim().toLowerCase() : undefined));
  };

  return (
    <StepFrame title={m.signInTitle} lede={asksAddress ? m.signInLedeTyped : m.signInLede} requests={[request]} feedback={state.signInPrompt ? carried[state.signInPrompt] : null}>
      <FlowStep.Form onSubmit={submit}>
        <FlowStep.Body>
          {asksAddress ? (
            <FlowTextField label={m.emailLabel} name="email" type="email" inputMode="email" autoComplete="username" spellCheck="false" value={email.value} onChange={email.change} onBlur={email.blur} isValid={email.isValid} error={email.error} inputRef={email.inputRef} isRequired />
          ) : (
            <UsernameHint value={state.email ?? ''} />
          )}
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
        <FlowLink href={meta.links.resetPassword}>{m.forgotPassword}</FlowLink>
      </FlowStep.Links>
    </StepFrame>
  );
}

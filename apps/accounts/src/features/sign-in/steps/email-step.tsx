import { FlowButton, FlowDivider, FlowIcon, FlowLink, FlowStep, FlowTextField } from '@yahel/ui';
import { stepPath } from '../machine';
import { signInMessages as m } from '../messages';
import { useSignInFlow } from '../sign-in-flow';
import { useStepField } from '../../../flow/use-step-field';
import { emailProblem } from '../validation';
import { StepFrame } from './step-frame';

export function EmailStep() {
  const { state, actions, meta } = useSignInFlow();
  const email = useStepField({ initial: state.email ?? '', problemOf: emailProblem, onValid: (value) => actions.enterEmail(value.trim()) });

  return (
    <StepFrame title={m.emailTitle} lede={m.emailLede}>
      <FlowStep.Form onSubmit={email.submit}>
        <FlowStep.Body>
          <FlowTextField label={m.emailLabel} name="email" type="email" inputMode="email" autoComplete="username" spellCheck="false" value={email.value} onChange={email.change} error={email.error} inputRef={email.inputRef} isRequired />
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

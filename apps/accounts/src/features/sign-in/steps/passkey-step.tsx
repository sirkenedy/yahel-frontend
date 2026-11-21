import { FlowButton, FlowLink, FlowNotice, FlowStep, FlowWaiting } from '@yahel/ui';
import { stepPath } from '../machine';
import { signInMessages as m } from '../messages';
import { useSignInFlow } from '../sign-in-flow';
import { StepFrame } from './step-frame';

export function PasskeyStep() {
  const { state, actions, meta } = useSignInFlow();
  const request = meta.requests.passkey;

  return (
    <StepFrame title={m.passkeyTitle} lede={m.passkeyLede} failure={request.failure}>
      <FlowStep.Body>
        {request.isPending ? <FlowWaiting title={m.passkeyWaiting}>{m.passkeyWaitingDetail}</FlowWaiting> : null}
        {state.passkeyCancelled && !request.isPending ? <FlowNotice>{m.passkeyCancelled}</FlowNotice> : null}
      </FlowStep.Body>
      <FlowStep.Links>
        <FlowLink href={stepPath(state.email ? 'password' : 'email')}>{m.usePasswordInstead}</FlowLink>
        <FlowButton variant="link" onPress={actions.startPasskey} isDisabled={request.isPending}>
          {m.tryAgain}
        </FlowButton>
      </FlowStep.Links>
    </StepFrame>
  );
}

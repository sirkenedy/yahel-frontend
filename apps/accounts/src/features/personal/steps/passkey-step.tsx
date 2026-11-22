import { FlowButton, FlowNotice, FlowStep, FlowWaiting } from '@yahel/ui';
import { personalMessages as m } from '../messages';
import { usePersonalFlow } from '../personal-flow';
import { StepFrame } from './step-frame';

export function PasskeyStep() {
  const { state, actions, meta } = usePersonalFlow();
  const request = meta.requests.passkey;

  return (
    <StepFrame title={m.passkeyTitle} lede={m.passkeyLede} requests={[request]}>
      <FlowStep.Body>
        {request.isPending ? <FlowWaiting title={m.passkeyWaiting}>{m.passkeyWaitingDetail}</FlowWaiting> : null}
        {state.passkeyCancelled && !request.isPending ? <FlowNotice>{m.passkeyCancelled}</FlowNotice> : null}
      </FlowStep.Body>
      <FlowStep.Links>
        <FlowButton variant="link" onPress={actions.continueWithoutPasskey}>
          {m.usePasswordInstead}
        </FlowButton>
        {request.isPending ? null : (
          <FlowButton variant="link" onPress={actions.startPasskey}>
            {m.tryAgain}
          </FlowButton>
        )}
      </FlowStep.Links>
    </StepFrame>
  );
}

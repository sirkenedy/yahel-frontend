import { FlowButton, FlowNotice, FlowStep, FlowWaiting } from '@yahel/ui';
import { flowMessages as shared } from '../../../flow/messages';
import { useAdminFlow } from '../admin-flow';
import { adminMessages as m } from '../messages';
import { StepFrame } from './step-frame';

export function PasskeyStep() {
  const { state, actions, meta } = useAdminFlow();
  const request = meta.requests.passkey;

  return (
    <StepFrame title={m.passkeyTitle} lede={m.passkeyLede} requests={[request]} next={{ retry: null }}>
      <FlowStep.Body>
        {request.isPending ? <FlowWaiting title={m.passkeyWaiting}>{m.passkeyWaitingDetail(state.address ?? '')}</FlowWaiting> : null}
        {state.passkeyCancelled && !request.isPending ? <FlowNotice>{state.passkeyRequired ? m.passkeyCancelled : m.passkeyCancelledAdvised}</FlowNotice> : null}
        {state.passkeyUnprepared && !request.isPending ? <FlowNotice>{shared.passkeyUnprepared}</FlowNotice> : null}
      </FlowStep.Body>
      {request.isPending ? null : (
        <FlowStep.Actions>
          <FlowButton variant="primary" onPress={actions.startPasskey}>
            {m.tryAgain}
          </FlowButton>
        </FlowStep.Actions>
      )}
    </StepFrame>
  );
}

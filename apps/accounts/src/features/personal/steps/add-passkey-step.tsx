import { FlowButton, FlowCallout, FlowIcon, FlowStep } from '@yahel/ui';
import { flowMessages as shared } from '../../../flow/messages';
import { personalMessages as m } from '../messages';
import { usePersonalFlow } from '../personal-flow';
import { StepFrame } from './step-frame';

export function AddPasskeyStep() {
  const { state, actions, meta } = usePersonalFlow();
  const made = state.passkey !== null;

  return (
    <StepFrame title={m.addPasskeyTitle} lede={m.addPasskeyLede} requests={[meta.requests.passkey]}>
      <FlowStep.Body>
        <FlowCallout icon={<FlowIcon name="passkey" />} title={made ? m.passkeyReady : m.passwordStillWorks}>
          {made ? m.passkeyReadyDetail : m.passwordStillWorksDetail}
        </FlowCallout>
      </FlowStep.Body>
      <FlowStep.Actions>
        {made ? (
          <FlowButton variant="primary" onPress={actions.continueWithoutPasskey}>
            {m.continue}
          </FlowButton>
        ) : (
          <>
            <FlowButton variant="primary" onPress={actions.startPasskey} isPending={meta.passkeyPreparing} pendingLabel={shared.passkeyPreparing}>
              {m.addPasskey}
            </FlowButton>
            <FlowButton variant="quiet" onPress={actions.continueWithoutPasskey}>
              {m.notNow}
            </FlowButton>
          </>
        )}
      </FlowStep.Actions>
    </StepFrame>
  );
}

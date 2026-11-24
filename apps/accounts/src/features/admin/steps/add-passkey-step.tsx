import { FlowButton, FlowCallout, FlowIcon, FlowNotice, FlowStep } from '@yahel/ui';
import { flowMessages as shared } from '../../../flow/messages';
import { useAdminFlow } from '../admin-flow';
import { adminMessages as m } from '../messages';
import { StepFrame } from './step-frame';

/**
 * A passkey is recommended for admins, not required (F-98): "Not now" opens Admin without one. A device that
 * cannot make one says so and offers the same way on.
 */
export function AddPasskeyStep() {
  const { state, actions, meta } = useAdminFlow();
  const { passkey: request } = meta.requests;
  const done = state.hasPasskey;

  if (!done && !meta.passkeySupported) {
    return (
      <StepFrame title={m.addPasskeyTitle} lede={m.addPasskeyLede}>
        <FlowStep.Body>
          <FlowNotice tone="warning" title={m.unsupportedTitle}>
            {m.unsupportedAdvised}
          </FlowNotice>
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton variant="primary" onPress={actions.openAdmin}>
            {m.continueToAdmin}
          </FlowButton>
        </FlowStep.Actions>
      </StepFrame>
    );
  }

  return (
    <StepFrame title={done ? m.passkeyDoneTitle : m.addPasskeyTitle} lede={done ? m.passkeyDoneLede : m.addPasskeyLede} requests={done ? [] : [request]}>
      <FlowStep.Body>
        <FlowCallout icon={<FlowIcon name="passkey" />} title={done ? m.passkeySavedOption : m.passkeyOption} tag={done ? undefined : m.passkeyAdvised}>
          {done ? m.passkeySavedDetail : m.passkeyOptionDetail}
        </FlowCallout>
      </FlowStep.Body>
      <FlowStep.Actions>
        {done ? (
          <FlowButton variant="primary" onPress={actions.openAdmin}>
            {m.continueToAdmin}
          </FlowButton>
        ) : (
          <>
            {/* Pending while an earlier prompt is still open (left with Back) or the challenge is on its way: a press then would open nothing. */}
            <FlowButton variant="primary" onPress={actions.startPasskey} isPending={request.isPending || meta.passkeyPreparing} pendingLabel={request.isPending ? m.passkeyWaiting : shared.passkeyPreparing}>
              {m.addPasskey}
            </FlowButton>
            <FlowButton variant="quiet" onPress={actions.openAdmin} isDisabled={request.isPending}>
              {m.notNow}
            </FlowButton>
          </>
        )}
      </FlowStep.Actions>
    </StepFrame>
  );
}

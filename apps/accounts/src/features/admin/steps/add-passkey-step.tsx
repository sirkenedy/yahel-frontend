import { FlowButton, FlowCallout, FlowIcon, FlowNotice, FlowStep } from '@yahel/ui';
import { flowMessages as shared } from '../../../flow/messages';
import { useAdminFlow } from '../admin-flow';
import { adminMessages as m } from '../messages';
import { StepFrame } from './step-frame';

/**
 * Admins must use a passkey (the design brief), so there is no "Not now": Admin opens from here only once
 * one exists. A device that cannot make one says so and offers only to sign out. The rule itself is the
 * server's to enforce; see the admin-access stand-in.
 */
export function AddPasskeyStep() {
  const { state, actions, meta } = useAdminFlow();
  const { passkey: request, signOut } = meta.requests;
  const done = state.hasPasskey;

  if (!done && !meta.passkeySupported) {
    return (
      <StepFrame title={m.addPasskeyTitle} lede={m.addPasskeyLede} requests={[signOut]}>
        <FlowStep.Body>
          <FlowNotice tone="warning" title={m.unsupportedTitle}>
            {m.unsupported}
          </FlowNotice>
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton variant="primary" onPress={actions.signOut} isPending={signOut.isPending} pendingLabel={m.signingOut}>
            {m.signOut}
          </FlowButton>
        </FlowStep.Actions>
      </StepFrame>
    );
  }

  return (
    <StepFrame title={done ? m.passkeyDoneTitle : m.addPasskeyTitle} lede={done ? m.passkeyDoneLede : m.addPasskeyLede} requests={done ? [] : [request]}>
      <FlowStep.Body>
        <FlowCallout icon={<FlowIcon name="passkey" />} title={done ? m.passkeySavedOption : m.passkeyOption} tag={done ? undefined : m.passkeyRequired}>
          {done ? m.passkeySavedDetail : m.passkeyOptionDetail}
        </FlowCallout>
      </FlowStep.Body>
      <FlowStep.Actions>
        {done ? (
          <FlowButton variant="primary" onPress={actions.openAdmin}>
            {m.continueToAdmin}
          </FlowButton>
        ) : (
          // Pending while an earlier prompt is still open (left with Back) or the challenge is on its way: a press then would open nothing.
          <FlowButton variant="primary" onPress={actions.startPasskey} isPending={request.isPending || meta.passkeyPreparing} pendingLabel={request.isPending ? m.passkeyWaiting : shared.passkeyPreparing}>
            {m.addPasskey}
          </FlowButton>
        )}
      </FlowStep.Actions>
    </StepFrame>
  );
}

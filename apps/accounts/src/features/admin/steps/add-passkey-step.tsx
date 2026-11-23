import { FlowButton, FlowCallout, FlowIcon, FlowNotice, FlowStep } from '@yahel/ui';
import { flowMessages as shared } from '../../../flow/messages';
import { useAdminFlow } from '../admin-flow';
import { adminMessages as m } from '../messages';
import { StepFrame } from './step-frame';

/**
 * Admins must use a passkey (the design brief), so there is no "Not now": Admin opens from here only once
 * one exists. A device that cannot make one says so and offers only to sign out. The rule itself is the
 * server's to enforce: the words say Admin is closed without one only when the server says it enforces
 * that (`passkeyRequired`), and otherwise recommend one (F-86).
 */
export function AddPasskeyStep() {
  const { state, actions, meta } = useAdminFlow();
  const { passkey: request, signOut } = meta.requests;
  const done = state.hasPasskey;
  const required = state.passkeyRequired;
  const lede = required ? m.addPasskeyLede : m.addPasskeyLedeAdvised;

  if (!done && !meta.passkeySupported) {
    return (
      <StepFrame title={m.addPasskeyTitle} lede={lede} requests={[signOut]}>
        <FlowStep.Body>
          <FlowNotice tone="warning" title={m.unsupportedTitle}>
            {required ? m.unsupported : m.unsupportedAdvised}
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
    <StepFrame title={done ? (required ? m.passkeyDoneTitle : m.passkeyDoneTitleAdvised) : m.addPasskeyTitle} lede={done ? m.passkeyDoneLede : lede} requests={done ? [] : [request]}>
      <FlowStep.Body>
        <FlowCallout icon={<FlowIcon name="passkey" />} title={done ? m.passkeySavedOption : m.passkeyOption} tag={done ? undefined : required ? m.passkeyRequired : m.passkeyAdvised}>
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

import { FlowButton, FlowStep } from '@yahel/ui';
import { signInMessages as m } from '../messages';
import { useSignInFlow } from '../sign-in-flow';
import { StepFrame } from './step-frame';

export function DoneStep() {
  const { state, actions, meta } = useSignInFlow();
  const { signOut } = meta.requests;

  return (
    <StepFrame title={m.doneTitle(state.profile?.firstName ?? null)} lede={m.doneLede}>
      <FlowStep.Actions>
        <FlowButton variant="primary" onPress={actions.continueToApp} isDisabled={signOut.isPending}>
          {m.openYahel}
        </FlowButton>
        <FlowButton variant="quiet" onPress={actions.signOut} isPending={signOut.isPending} pendingLabel={m.signingOut}>
          {m.useAnother}
        </FlowButton>
      </FlowStep.Actions>
    </StepFrame>
  );
}

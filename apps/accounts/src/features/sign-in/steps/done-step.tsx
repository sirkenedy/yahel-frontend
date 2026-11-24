import { FlowButton, FlowStep } from '@yahel/ui';
import { signInMessages as m } from '../messages';
import { useSignInFlow } from '../sign-in-flow';
import { StepFrame } from './step-frame';

export function DoneStep() {
  const { state, actions } = useSignInFlow();

  return (
    <StepFrame title={m.doneTitle(state.profile?.firstName ?? null)} lede={m.doneLede}>
      <FlowStep.Actions>
        <FlowButton variant="primary" onPress={actions.continueToApp}>
          {m.openYahel}
        </FlowButton>
        {/* Another account is added beside this one: nobody is signed out to get there. */}
        <FlowButton variant="quiet" onPress={actions.showChooser}>
          {m.useAnother}
        </FlowButton>
      </FlowStep.Actions>
    </StepFrame>
  );
}

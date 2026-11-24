import { FlowButton, FlowLink, FlowNotice, FlowStep, FlowWaiting } from '@yahel/ui';
import { useBusinessFlow } from '../business-flow';
import { stepPath } from '../machine';
import { businessMessages as m } from '../messages';
import { StepFrame } from './step-frame';

export function CreatingStep() {
  const { state, actions, meta } = useBusinessFlow();
  const request = meta.requests.create;
  const { isPending, feedback } = request;
  const { created } = state.creation;

  // A whole-screen state takes the step's place from the frame below; anything else is told on the step's own failed screen.
  if (feedback && feedback.place !== 'screen' && !isPending) {
    return (
      <StepFrame title={m.creatingFailedTitle} lede={created ? m.createdButUnfinished : m.creatingFailedLede} requests={[request]} next={{ retry: null }}>
        <FlowStep.Actions>
          <FlowButton variant="primary" onPress={actions.createWorkspace}>
            {m.tryAgain}
          </FlowButton>
          {created ? null : (
            <FlowLink variant="quiet" href={stepPath('admin')}>
              {m.backToAdmin}
            </FlowLink>
          )}
        </FlowStep.Actions>
        {created ? null : (
          <FlowStep.Links>
            <FlowButton variant="link" onPress={actions.startAgain}>
              {m.startAgain}
            </FlowButton>
          </FlowStep.Links>
        )}
      </StepFrame>
    );
  }

  return (
    <StepFrame title={m.creatingTitle(state.businessName)} lede={m.creatingLede(state.adminAddress)} requests={[request]}>
      <FlowStep.Body>
        <FlowWaiting title={m.almostThere}>{m.fewSeconds}</FlowWaiting>
        {/* Shown only if the wait ended with nothing to do, which a press of Back can cause. */}
        {isPending ? null : <FlowNotice tone="warning">{m.nothingHappening}</FlowNotice>}
      </FlowStep.Body>
    </StepFrame>
  );
}

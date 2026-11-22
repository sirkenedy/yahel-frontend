import { FlowButton, FlowLink, FlowNotice, FlowStep, FlowWaiting } from '@yahel/ui';
import { stepPath } from '../machine';
import { personalMessages as m } from '../messages';
import { usePersonalFlow } from '../personal-flow';
import { StepFrame } from './step-frame';

export function CreatingStep() {
  const { state, actions, meta } = usePersonalFlow();
  const request = meta.requests.create;
  const { isPending, feedback } = request;
  const { created, stage } = state.creation;

  // A whole-screen state takes the step's place from the frame below; anything else is told on the step's own failed screen.
  if (feedback && feedback.place !== 'screen' && !isPending) {
    return (
      <StepFrame title={m.creatingFailedTitle} lede={created ? m.createdButUnfinished : m.creatingFailedLede} requests={[request]} next={{ retry: null }}>
        <FlowStep.Actions>
          <FlowButton variant="primary" onPress={actions.createAccount}>
            {m.tryAgain}
          </FlowButton>
          {created ? null : (
            <FlowLink variant="quiet" href={stepPath('review')}>
              {m.backToReview}
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
    <StepFrame title={m.creatingTitle} lede={state.addressKind === 'own' ? m.creatingLedeOwnEmail(state.address) : m.creatingLede(state.address)} requests={[request]}>
      <FlowStep.Body>
        <FlowWaiting title={m.creatingStages[stage]}>{m.creatingDetail}</FlowWaiting>
        {/* Shown only if the wait ended with nothing to do, which a press of Back can cause. */}
        {isPending ? null : <FlowNotice tone="warning">{m.nothingHappening}</FlowNotice>}
      </FlowStep.Body>
    </StepFrame>
  );
}

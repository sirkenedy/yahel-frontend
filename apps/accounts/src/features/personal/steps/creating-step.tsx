import { FlowButton, FlowLink, FlowNotice, FlowStep, FlowWaiting } from '@yahel/ui';
import { stepPath } from '../machine';
import { personalMessages as m } from '../messages';
import { usePersonalFlow } from '../personal-flow';
import { StepFrame } from './step-frame';

export function CreatingStep() {
  const { state, actions, meta } = usePersonalFlow();
  const { isPending, failure } = meta.requests.create;
  const { created, stage } = state.creation;

  if (failure && !isPending) {
    return (
      <StepFrame title={m.creatingFailedTitle} lede={created ? m.createdButUnfinished : m.creatingFailedLede} failure={failure}>
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
    <StepFrame title={m.creatingTitle} lede={state.addressKind === 'own' ? m.creatingLedeOwnEmail(state.address) : m.creatingLede(state.address)}>
      <FlowStep.Body>
        <FlowWaiting title={m.creatingStages[stage]}>{m.creatingDetail}</FlowWaiting>
        {/* Shown only if the wait ended with nothing to do, which a press of Back can cause. */}
        {isPending ? null : <FlowNotice>{m.unexpected}</FlowNotice>}
      </FlowStep.Body>
    </StepFrame>
  );
}

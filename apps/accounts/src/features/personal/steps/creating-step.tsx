import { FlowButton, FlowLink, FlowNotice, FlowStep, FlowWaiting } from '@yahel/ui';
import { stepPath } from '../machine';
import { personalMessages as m } from '../messages';
import { usePersonalFlow } from '../personal-flow';
import { StepFrame } from './step-frame';

export function CreatingStep() {
  const { state, actions, meta } = usePersonalFlow();
  const { isPending, failure } = meta.requests.create;
  const { created, stage } = state.creation;

  if (state.existingAccount && !isPending) {
    return (
      <StepFrame title={m.creatingFailedTitle} failure={m.existingAccount}>
        <FlowStep.Actions>
          <FlowLink variant="primary" href={meta.links.signIn}>
            {m.signInInstead}
          </FlowLink>
        </FlowStep.Actions>
      </StepFrame>
    );
  }

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
      </StepFrame>
    );
  }

  return (
    <StepFrame title={m.creatingTitle} lede={m.creatingLede(state.address)}>
      <FlowStep.Body>
        <FlowWaiting title={m.creatingStages[stage]}>{m.creatingDetail}</FlowWaiting>
        {/* Shown only if the wait ended with nothing to do, which a press of Back can cause. */}
        {isPending ? null : <FlowNotice>{m.unexpected}</FlowNotice>}
      </FlowStep.Body>
    </StepFrame>
  );
}

import { BrandMoment, FlowButton, FlowIcon, FlowLinkCard, FlowNotice, FlowStep } from '@yahel/ui';
import { stepPath } from '../machine';
import { personalMessages as m } from '../messages';
import { usePersonalFlow } from '../personal-flow';
import { StepFrame } from './step-frame';

export function ReadyStep() {
  const { state, actions, meta } = usePersonalFlow();

  return (
    <StepFrame title={m.readyTitle(state.firstName)} lede={m.readyLede(state.address)} lead={<BrandMoment />}>
      <FlowStep.Body>
        {state.creation.unsaved.map((part) => (
          <FlowNotice key={part} tone="warning">{m.unsaved[part]}</FlowNotice>
        ))}
        {state.contactInvited ? (
          <FlowNotice tone="success">{m.trustInvited(state.contactInvited)}</FlowNotice>
        ) : meta.offers.contact ? (
          <FlowLinkCard href={stepPath('contact')} icon={<FlowIcon name="people" />} title={m.trustTitle}>
            {m.trustDetail}
          </FlowLinkCard>
        ) : null}
      </FlowStep.Body>
      <FlowStep.Actions>
        <FlowButton variant="primary" onPress={actions.continueToApp}>
          {m.openYahel}
        </FlowButton>
      </FlowStep.Actions>
    </StepFrame>
  );
}

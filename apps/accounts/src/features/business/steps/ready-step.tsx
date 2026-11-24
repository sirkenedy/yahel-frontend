import { BrandMoment, FlowButton, FlowPreview, FlowStep } from '@yahel/ui';
import { useBusinessFlow } from '../business-flow';
import { businessMessages as m } from '../messages';
import { StepFrame } from './step-frame';

/**
 * The workspace and its administrator exist, but nobody is signed in yet: the phone check comes first (F-97). So
 * the address is shown as the admin sign-in, not as an account signed in to, whatever the drawing says.
 */
export function ReadyStep() {
  const { state, actions, meta } = useBusinessFlow();

  return (
    <StepFrame title={m.readyTitle} lede={meta.offers.billing ? m.readyLedeTrial : m.readyLede} lead={<BrandMoment />}>
      <FlowStep.Body>
        <FlowPreview label={m.adminSignIn} icon="key">
          {state.adminAddress}
        </FlowPreview>
      </FlowStep.Body>
      <FlowStep.Actions>
        <FlowButton variant="primary" onPress={actions.checkPhone}>
          {m.continue}
        </FlowButton>
      </FlowStep.Actions>
    </StepFrame>
  );
}

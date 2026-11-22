import { BrandMoment, FlowCallout, FlowIcon, FlowLink, FlowNotice, FlowStep } from '@yahel/ui';
import { useBusinessFlow } from '../business-flow';
import { businessMessages as m } from '../messages';
import { StepFrame } from './step-frame';

export function ReadyStep() {
  const { state, meta } = useBusinessFlow();

  return (
    <StepFrame title={m.readyTitle(state.businessName)} lede={m.readyLede} lead={<BrandMoment />}>
      <FlowStep.Body>
        <FlowCallout icon={<FlowIcon name="person" />} title={state.adminAddress}>
          {m.adminSignIn}
        </FlowCallout>
        <FlowNotice>{m.readyCodeNote(state.adminAddress)}</FlowNotice>
      </FlowStep.Body>
      <FlowStep.Actions>
        <FlowLink variant="primary" href={meta.links.adminSignIn}>
          {m.signInToAdmin}
        </FlowLink>
      </FlowStep.Actions>
    </StepFrame>
  );
}

import { BrandMoment, FlowLink, FlowNotice, FlowPreview, FlowStep } from '@yahel/ui';
import { useBusinessFlow } from '../business-flow';
import { businessMessages as m } from '../messages';
import { StepFrame } from './step-frame';

export function ReadyStep() {
  const { state, meta } = useBusinessFlow();

  return (
    <StepFrame title={m.readyTitle(state.businessName)} lede={m.readyLede} lead={<BrandMoment />}>
      <FlowStep.Body>
        <FlowPreview label={m.adminSignIn}>{state.adminAddress}</FlowPreview>
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

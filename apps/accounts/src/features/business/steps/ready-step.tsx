import { BrandMoment, FlowLink, FlowNotice, FlowPreview, FlowStep } from '@yahel/ui';
import { useBusinessFlow } from '../business-flow';
import { businessMessages as m } from '../messages';
import { StepFrame } from './step-frame';

export function ReadyStep() {
  const { state, meta } = useBusinessFlow();
  // No answer named a workspace: the address's sign-in was proven this person's, which does not prove a workspace exists (F-72).
  const unsure = state.creation.tenantId === null;
  const title = unsure ? m.unsureTitle : m.readyTitle(state.businessName);
  const lede = unsure ? (state.payment ? `${m.unsureLede(state.businessName)} ${m.unsureNotCharged}` : m.unsureLede(state.businessName)) : m.readyLede;

  return (
    <StepFrame title={title} lede={lede} lead={<BrandMoment />}>
      <FlowStep.Body>
        <FlowPreview label={m.adminSignIn}>{state.adminAddress}</FlowPreview>
        <FlowNotice title={m.readyCodeTitle}>{m.readyCodeNote(state.adminAddress, state.domain)}</FlowNotice>
      </FlowStep.Body>
      <FlowStep.Actions>
        <FlowLink variant="primary" href={meta.links.adminSignIn}>
          {m.signInToAdmin}
        </FlowLink>
      </FlowStep.Actions>
    </StepFrame>
  );
}

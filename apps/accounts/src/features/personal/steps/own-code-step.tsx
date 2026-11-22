import { FlowButton, FlowLink, FlowStep } from '@yahel/ui';
import { EmailedCodeForm } from '../../../flow/emailed-code-form';
import { personalMessages as m } from '../messages';
import { usePersonalFlow } from '../personal-flow';
import { StepFrame } from './step-frame';

export function OwnCodeStep() {
  const { state, actions, meta } = usePersonalFlow();
  const { confirmEmail: request, resendEmailCode: resend } = meta.requests;

  return (
    <StepFrame title={m.ownCodeTitle} lede={m.ownCodeLede(state.address)} requests={[request, resend]} next={{ resend: { label: m.sendNewCode, onPress: actions.resendEmailCode } }}>
      <EmailedCodeForm words={m} request={request} resend={resend} onSubmit={actions.confirmEmail} onResend={actions.resendEmailCode}>
        <FlowButton variant="link" onPress={actions.useDifferentAddress} isDisabled={request.isPending}>
          {m.useDifferentAddress}
        </FlowButton>
        <FlowLink href={meta.links.signIn}>{m.signInInstead}</FlowLink>
      </EmailedCodeForm>
      <FlowStep.Note>{m.ownCodeHint}</FlowStep.Note>
    </StepFrame>
  );
}

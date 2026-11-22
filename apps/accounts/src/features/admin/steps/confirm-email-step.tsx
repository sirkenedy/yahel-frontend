import { EmailedCodeForm } from '../../../flow/emailed-code-form';
import { flowMessages as shared } from '../../../flow/messages';
import { useAdminFlow } from '../admin-flow';
import { StepFrame } from './step-frame';

/** Shown when sign-in answers that the password is right but the new administrator's address has never been confirmed. */
export function ConfirmEmailStep() {
  const { state, actions, meta } = useAdminFlow();
  const { confirmEmail: request, resendEmailCode: resend } = meta.requests;

  return (
    <StepFrame title={shared.confirmStepTitle} lede={shared.confirmStepLede(state.address ?? '')} requests={[request, resend]} next={{ resend: { label: shared.emailedCode.sendNewCode, onPress: actions.resendEmailCode } }}>
      <EmailedCodeForm words={shared.emailedCode} request={request} resend={resend} onSubmit={actions.confirmEmail} onResend={actions.resendEmailCode} />
    </StepFrame>
  );
}

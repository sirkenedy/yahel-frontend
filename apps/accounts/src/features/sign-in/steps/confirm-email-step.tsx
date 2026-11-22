import { EmailedCodeForm } from '../../../flow/emailed-code-form';
import { flowMessages } from '../../../flow/messages';
import { signInMessages as m } from '../messages';
import { useSignInFlow } from '../sign-in-flow';
import { StepFrame } from './step-frame';

/** Shown when sign-in answers that the password is right but the address has never been confirmed. */
export function ConfirmEmailStep() {
  const { state, actions, meta } = useSignInFlow();
  const { confirmEmail: request, resendEmailCode: resend } = meta.requests;

  return (
    <StepFrame title={m.confirmStepTitle} lede={m.confirmStepLede(state.email ?? '')} requests={[request, resend]} next={{ resend: { label: m.sendNewCode, onPress: actions.resendEmailCode } }}>
      <EmailedCodeForm words={flowMessages.emailedCode} request={request} resend={resend} onSubmit={actions.confirmEmail} onResend={actions.resendEmailCode} />
    </StepFrame>
  );
}

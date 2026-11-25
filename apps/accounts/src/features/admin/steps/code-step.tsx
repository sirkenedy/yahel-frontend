import { CodeInput, FlowButton, FlowStep } from '@yahel/ui';
import { useMaskedNumber } from '../../../flow/countries';
import { forField } from '../../../flow/feedback';
import { ResendLink } from '../../../flow/resend-link';
import { useStepField } from '../../../flow/use-step-field';
import { flowMessages as shared } from '../../../flow/messages';
import { useAdminFlow } from '../admin-flow';
import { adminMessages as m } from '../messages';
import { CODE_LENGTH, codeProblem } from '../validation';
import { StepFrame } from './step-frame';

export function CodeStep() {
  const { state, actions, meta } = useAdminFlow();
  const { verifyPhone: request, resendPhoneCode: resend } = meta.requests;
  const masked = useMaskedNumber(state.phone?.country ?? '', state.phone?.number ?? '');
  const code = useStepField({ problemOf: codeProblem, onValid: actions.verifyPhone, refusal: forField(request.feedback, 'code') });

  return (
    <StepFrame title={m.codeTitle} lede={m.codeLede(state.phone ? masked : '')} requests={[request, resend]} next={{ resend: { label: shared.emailedCode.sendNewCode, onPress: actions.resendPhoneCode } }}>
      <FlowStep.Form onSubmit={code.submit}>
        <FlowStep.Body>
          <CodeInput label={shared.emailedCode.codeLabel} length={CODE_LENGTH} characters="alphanumeric" value={code.value} onChange={code.change} error={code.error} inputRef={code.inputRef} />
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary" isPending={request.isPending} pendingLabel={shared.emailedCode.verifying}>
            {shared.emailedCode.verify}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
      <FlowStep.Links>
        <ResendLink request={resend} onPress={actions.resendPhoneCode} label={shared.emailedCode.sendNewCode} waitLabel={shared.emailedCode.sendNewCodeIn} pendingLabel={shared.emailedCode.sending} />
      </FlowStep.Links>
    </StepFrame>
  );
}

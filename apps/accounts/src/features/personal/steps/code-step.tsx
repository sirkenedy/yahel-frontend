import { CodeInput, FlowButton, FlowStep } from '@yahel/ui';
import { forField } from '../../../flow/feedback';
import { ResendLink } from '../../../flow/resend-link';
import { useStepField } from '../../../flow/use-step-field';
import { maskedNumber } from '../../../flow/countries';
import { personalMessages as m } from '../messages';
import { usePersonalFlow } from '../personal-flow';
import { CODE_LENGTH, codeProblem } from '../validation';
import { StepFrame } from './step-frame';

export function CodeStep() {
  const { state, actions, meta } = usePersonalFlow();
  const { verifyPhone: request, resendPhoneCode: resend } = meta.requests;
  const code = useStepField({ problemOf: codeProblem, onValid: actions.verifyPhone, refusal: forField(request.feedback, 'code') });

  return (
    <StepFrame title={m.codeTitle} lede={m.codeLede(maskedNumber(state.recovery.country, state.recovery.phone))} requests={[request, resend]} next={{ resend: { label: m.sendNewCode, onPress: actions.resendPhoneCode } }}>
      <FlowStep.Form onSubmit={code.submit}>
        <FlowStep.Body>
          <CodeInput label={m.codeLabel} length={CODE_LENGTH} characters="alphanumeric" value={code.value} onChange={code.change} error={code.error} inputRef={code.inputRef} />
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary" isPending={request.isPending} pendingLabel={m.verifying}>
            {m.verify}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
      <FlowStep.Links>
        <ResendLink request={resend} onPress={actions.resendPhoneCode} label={m.sendNewCode} waitLabel={m.sendNewCodeIn} pendingLabel={m.sending} />
        <FlowButton variant="link" onPress={actions.skipPhone} isDisabled={request.isPending}>
          {m.skipForNow}
        </FlowButton>
      </FlowStep.Links>
    </StepFrame>
  );
}

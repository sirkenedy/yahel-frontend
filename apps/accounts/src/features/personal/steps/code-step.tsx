import { CodeInput, FlowButton, FlowNotice, FlowStep } from '@yahel/ui';
import { useStepField } from '../../../flow/use-step-field';
import { maskedNumber } from '../countries';
import { personalMessages as m } from '../messages';
import { usePersonalFlow } from '../personal-flow';
import { CODE_LENGTH, codeProblem } from '../validation';
import { StepFrame } from './step-frame';

export function CodeStep() {
  const { state, actions, meta } = usePersonalFlow();
  const { verifyPhone: request, resendPhoneCode: resend } = meta.requests;
  const code = useStepField({ problemOf: codeProblem, onValid: actions.verifyPhone });

  return (
    <StepFrame title={m.codeTitle} lede={m.codeLede(maskedNumber(state.recovery.country, state.recovery.phone))} failure={request.failure ?? resend.failure}>
      <FlowStep.Form onSubmit={code.submit}>
        <FlowStep.Body>
          <CodeInput label={m.codeLabel} length={CODE_LENGTH} characters="alphanumeric" value={code.value} onChange={code.change} error={code.error} inputRef={code.inputRef} />
          {state.phoneCodeResent ? <FlowNotice>{m.newCodeSent}</FlowNotice> : null}
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary" isPending={request.isPending} pendingLabel={m.verifying}>
            {m.verify}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
      <FlowStep.Links>
        <FlowButton variant="link" onPress={actions.resendPhoneCode} isPending={resend.isPending} pendingLabel={m.sending}>
          {m.sendNewCode}
        </FlowButton>
        <FlowButton variant="link" onPress={actions.skipPhone} isDisabled={request.isPending}>
          {m.skipForNow}
        </FlowButton>
      </FlowStep.Links>
    </StepFrame>
  );
}

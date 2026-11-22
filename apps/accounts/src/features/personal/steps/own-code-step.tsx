import { CodeInput, FlowButton, FlowLink, FlowStep } from '@yahel/ui';
import { forField } from '../../../flow/feedback';
import { ResendLink } from '../../../flow/resend-link';
import { useStepField } from '../../../flow/use-step-field';
import { personalMessages as m } from '../messages';
import { usePersonalFlow } from '../personal-flow';
import { CODE_LENGTH, codeProblem } from '../validation';
import { StepFrame } from './step-frame';

export function OwnCodeStep() {
  const { state, actions, meta } = usePersonalFlow();
  const { confirmEmail: request, resendEmailCode: resend } = meta.requests;
  const code = useStepField({ problemOf: codeProblem, onValid: actions.confirmEmail, refusal: forField(request.feedback, 'code') });

  return (
    <StepFrame title={m.ownCodeTitle} lede={m.ownCodeLede(state.address)} requests={[request, resend]} next={{ resend: { label: m.sendNewCode, onPress: actions.resendEmailCode } }}>
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
        <ResendLink request={resend} onPress={actions.resendEmailCode} label={m.sendNewCode} waitLabel={m.sendNewCodeIn} pendingLabel={m.sending} />
        <FlowButton variant="link" onPress={actions.useDifferentAddress} isDisabled={request.isPending}>
          {m.useDifferentAddress}
        </FlowButton>
        <FlowLink href={meta.links.signIn}>{m.signInInstead}</FlowLink>
      </FlowStep.Links>
      <FlowStep.Note>{m.ownCodeHint}</FlowStep.Note>
    </StepFrame>
  );
}

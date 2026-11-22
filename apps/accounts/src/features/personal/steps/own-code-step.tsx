import { CodeInput, FlowButton, FlowLink, FlowNotice, FlowStep } from '@yahel/ui';
import { useStepField } from '../../../flow/use-step-field';
import { personalMessages as m } from '../messages';
import { usePersonalFlow } from '../personal-flow';
import { CODE_LENGTH, codeProblem } from '../validation';
import { StepFrame } from './step-frame';

export function OwnCodeStep() {
  const { state, actions, meta } = usePersonalFlow();
  const { confirmEmail: request, resendEmailCode: resend } = meta.requests;
  const code = useStepField({ problemOf: codeProblem, onValid: actions.confirmEmail });

  return (
    <StepFrame title={m.ownCodeTitle} lede={m.ownCodeLede(state.address)} failure={request.failure ?? resend.failure}>
      <FlowStep.Form onSubmit={code.submit}>
        <FlowStep.Body>
          <CodeInput label={m.codeLabel} length={CODE_LENGTH} characters="alphanumeric" value={code.value} onChange={code.change} error={code.error} inputRef={code.inputRef} />
          {state.emailCodeResent ? <FlowNotice>{m.newCodeSent}</FlowNotice> : null}
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary" isPending={request.isPending} pendingLabel={m.verifying}>
            {m.verify}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
      <FlowStep.Links>
        <FlowButton variant="link" onPress={actions.resendEmailCode} isPending={resend.isPending} pendingLabel={m.sending}>
          {m.sendNewCode}
        </FlowButton>
        <FlowLink href={meta.links.signIn}>{m.signInInstead}</FlowLink>
      </FlowStep.Links>
      <FlowStep.Note>{m.ownCodeHint}</FlowStep.Note>
    </StepFrame>
  );
}

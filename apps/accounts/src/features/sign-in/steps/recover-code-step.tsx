import { CodeInput, FlowButton, FlowNotice, FlowStep } from '@yahel/ui';
import { signInMessages as m } from '../messages';
import { useSignInFlow } from '../sign-in-flow';
import { useStepField } from '../../../flow/use-step-field';
import { StepFrame } from './step-frame';

const CODE_LENGTH = 6;

export function RecoverCodeStep() {
  const { state, actions, meta } = useSignInFlow();
  const resend = meta.requests.resendResetCode;
  const code = useStepField({ problemOf: (value) => (value.length === CODE_LENGTH ? null : m.recoverCodeIncomplete), onValid: actions.enterResetCode });

  return (
    <StepFrame title={m.recoverCodeTitle} lede={m.recoverCodeLede} failure={resend.failure ?? (state.resetCodeRejected ? m.recoverCodeRejected : null)}>
      <FlowStep.Form onSubmit={code.submit}>
        <FlowStep.Body>
          <CodeInput label={m.recoverCodeLabel} length={CODE_LENGTH} characters="alphanumeric" value={code.value} onChange={code.change} error={code.error} inputRef={code.inputRef} />
          {state.resetCodeResent ? <FlowNotice>{m.newCodeSent}</FlowNotice> : null}
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary">
            {m.verify}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
      <FlowStep.Links>
        <FlowButton variant="link" onPress={actions.resendResetCode} isPending={resend.isPending} pendingLabel={m.sendingCode}>
          {m.sendNewCode}
        </FlowButton>
      </FlowStep.Links>
    </StepFrame>
  );
}

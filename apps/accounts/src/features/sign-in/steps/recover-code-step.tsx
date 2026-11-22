import { CodeInput, FlowButton, FlowStep } from '@yahel/ui';
import { forField } from '../../../flow/feedback';
import { ResendLink } from '../../../flow/resend-link';
import { useStepField } from '../../../flow/use-step-field';
import { carried } from '../feedback';
import { signInMessages as m } from '../messages';
import { useSignInFlow } from '../sign-in-flow';
import { StepFrame } from './step-frame';

const CODE_LENGTH = 6;

export function RecoverCodeStep() {
  const { state, actions, meta } = useSignInFlow();
  const resend = meta.requests.resendResetCode;
  // Why the person is back here, until a new code has been asked for.
  const rejected = state.resetCodeRejected && !state.resetCodeResent ? carried[state.resetCodeSpent ? 'spent' : 'wrong'] : null;
  const code = useStepField({ problemOf: (value) => (value.length === CODE_LENGTH ? null : m.recoverCodeIncomplete), onValid: actions.enterResetCode, refusal: forField(rejected, 'code') });

  return (
    <StepFrame title={m.recoverCodeTitle} lede={m.recoverCodeLede} requests={[resend]} feedback={rejected} next={{ resend: { label: m.sendNewCode, onPress: actions.resendResetCode } }}>
      <FlowStep.Form onSubmit={code.submit}>
        <FlowStep.Body>
          <CodeInput label={m.recoverCodeLabel} length={CODE_LENGTH} characters="alphanumeric" value={code.value} onChange={code.change} error={code.error} inputRef={code.inputRef} />
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary">
            {m.verify}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
      <FlowStep.Links>
        <ResendLink request={resend} onPress={actions.resendResetCode} label={m.sendNewCode} waitLabel={m.sendNewCodeIn} pendingLabel={m.sendingCode} />
      </FlowStep.Links>
    </StepFrame>
  );
}

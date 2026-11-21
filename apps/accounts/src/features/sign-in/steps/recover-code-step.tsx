import { CodeInput, FlowButton, FlowNotice, FlowStep } from '@yahel/ui';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { signInMessages as m } from '../messages';
import { useSignInFlow } from '../sign-in-flow';
import { StepFrame } from './step-frame';

const CODE_LENGTH = 6;

export function RecoverCodeStep() {
  const { state, actions, meta } = useSignInFlow();
  const [code, setCode] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const resend = meta.requests.resendResetCode;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (code.length === CODE_LENGTH) return actions.enterResetCode(code);
    setProblem(m.recoverCodeIncomplete);
    event.currentTarget.querySelector<HTMLInputElement>('input[name="code"]')?.focus();
  };

  return (
    <StepFrame title={m.recoverCodeTitle} lede={m.recoverCodeLede} failure={resend.failure ?? (state.resetCodeRejected ? m.recoverCodeRejected : null)}>
      <FlowStep.Form onSubmit={submit}>
        <FlowStep.Body>
          <CodeInput
            label={m.recoverCodeLabel}
            length={CODE_LENGTH}
            characters="alphanumeric"
            value={code}
            onChange={(next) => {
              setCode(next);
              setProblem(null);
            }}
            error={problem ?? undefined}
          />
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

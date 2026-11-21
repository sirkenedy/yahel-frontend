import { CodeInput, FlowButton, FlowNotice, FlowStep, FlowTextField } from '@yahel/ui';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { signInMessages as m } from '../messages';
import { useSignInFlow } from '../sign-in-flow';
import { StepFrame } from './step-frame';

const CODE_LENGTH = 6;

export function CodeStep() {
  const { state, actions, meta } = useSignInFlow();
  const [code, setCode] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  // Backup codes are longer than six characters, so they get an ordinary field instead of the boxes.
  const [usingBackup, setUsingBackup] = useState(false);
  const { code: request, textCode } = meta.requests;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = code.trim();
    const found = usingBackup ? (value === '' ? m.backupRequired : null) : value.length === CODE_LENGTH ? null : m.codeIncomplete;
    setProblem(found);
    if (found) event.currentTarget.querySelector<HTMLInputElement>('input[name="code"]')?.focus();
    else actions.verifyCode(value);
  };

  const change = (next: string) => {
    setCode(next);
    setProblem(null);
  };

  const switchKind = () => {
    setUsingBackup(!usingBackup);
    change('');
  };

  return (
    <StepFrame title={m.codeTitle} lede={usingBackup ? m.backupLede : m.codeLede} failure={request.failure ?? textCode.failure}>
      <FlowStep.Form onSubmit={submit}>
        <FlowStep.Body>
          {usingBackup ? (
            <FlowTextField label={m.backupLabel} name="code" autoComplete="off" spellCheck="false" value={code} onChange={change} error={problem ?? undefined} isRequired />
          ) : (
            <CodeInput label={m.codeLabel} length={CODE_LENGTH} value={code} onChange={change} error={problem ?? undefined} />
          )}
          {state.textedTo ? <FlowNotice>{m.textSent(state.textedTo)}</FlowNotice> : null}
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary" isPending={request.isPending} pendingLabel={m.verifying}>
            {m.verify}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
      <FlowStep.Links>
        {meta.offers.textCode && !usingBackup ? (
          <FlowButton variant="link" onPress={actions.sendTextCode} isPending={textCode.isPending} pendingLabel={m.sendingText}>
            {m.textMeACode}
          </FlowButton>
        ) : null}
        <FlowButton variant="link" onPress={switchKind}>
          {usingBackup ? m.useAppCode : m.useBackupCode}
        </FlowButton>
      </FlowStep.Links>
    </StepFrame>
  );
}

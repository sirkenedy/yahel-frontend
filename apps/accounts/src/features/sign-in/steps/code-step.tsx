import { CodeInput, FlowButton, FlowNotice, FlowStep, FlowTextField } from '@yahel/ui';
import { useState } from 'react';
import { signInMessages as m } from '../messages';
import { useSignInFlow } from '../sign-in-flow';
import { forField } from '../../../flow/feedback';
import { useStepField } from '../../../flow/use-step-field';
import { StepFrame } from './step-frame';

const CODE_LENGTH = 6;

export function CodeStep() {
  const { state, actions, meta } = useSignInFlow();
  // Backup codes are longer than six characters, so they get an ordinary field instead of the boxes.
  const [usingBackup, setUsingBackup] = useState(false);
  const { code: request, textCode } = meta.requests;
  const code = useStepField({
    problemOf: (value) => (usingBackup ? (value.trim() === '' ? m.backupRequired : null) : value.length === CODE_LENGTH ? null : m.codeIncomplete),
    onValid: (value) => actions.verifyCode(value.trim()),
    refusal: forField(request.feedback, 'code'),
  });

  const switchKind = () => {
    setUsingBackup(!usingBackup);
    code.change('');
  };

  return (
    <StepFrame title={m.codeTitle} lede={usingBackup ? m.backupLede : m.codeLede} requests={[request, textCode]}>
      <FlowStep.Form onSubmit={code.submit}>
        <FlowStep.Body>
          {usingBackup ? (
            <FlowTextField label={m.backupLabel} name="code" autoComplete="off" spellCheck="false" value={code.value} onChange={code.change} error={code.error} inputRef={code.inputRef} isRequired />
          ) : (
            <CodeInput label={m.codeLabel} length={CODE_LENGTH} value={code.value} onChange={code.change} error={code.error} inputRef={code.inputRef} />
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

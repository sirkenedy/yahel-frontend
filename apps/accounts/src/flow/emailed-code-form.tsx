import { CodeInput, FlowButton, FlowStep } from '@yahel/ui';
import type { ReactNode } from 'react';
import { EMAILED_CODE_LENGTH } from './credentials';
import { forField } from './feedback';
import { ResendLink } from './resend-link';
import type { FlowRequest } from './use-flow-request';
import { useStepField } from './use-step-field';

export interface EmailedCodeWords {
  codeLabel: string;
  codeIncomplete: string;
  verify: string;
  verifying: string;
  sendNewCode: string;
  sendNewCodeIn: (clock: string) => string;
  sending: string;
}

export interface EmailedCodeFormProps {
  words: EmailedCodeWords;
  /** Submitting the code, and asking for another. A refusal that names the `code` field is shown beside the boxes. */
  request: FlowRequest;
  resend: FlowRequest;
  onSubmit: (code: string) => void;
  onResend: () => void;
  /** Further ways out, after "Send a new code". */
  children?: ReactNode;
}

/** The form every flow uses to take the code emailed to confirm an address: the six boxes, Verify, and a new code after a pause. */
export function EmailedCodeForm({ words, request, resend, onSubmit, onResend, children }: EmailedCodeFormProps) {
  const code = useStepField({ problemOf: (value) => (value.length === EMAILED_CODE_LENGTH ? null : words.codeIncomplete), onValid: onSubmit, refusal: forField(request.feedback, 'code') });

  return (
    <>
      <FlowStep.Form onSubmit={code.submit}>
        <FlowStep.Body>
          <CodeInput label={words.codeLabel} length={EMAILED_CODE_LENGTH} characters="alphanumeric" value={code.value} onChange={code.change} error={code.error} inputRef={code.inputRef} />
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary" isPending={request.isPending} pendingLabel={words.verifying}>
            {words.verify}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
      <FlowStep.Links>
        <ResendLink request={resend} onPress={onResend} label={words.sendNewCode} waitLabel={words.sendNewCodeIn} pendingLabel={words.sending} />
        {children}
      </FlowStep.Links>
    </>
  );
}

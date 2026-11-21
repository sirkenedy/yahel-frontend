import { FlowButton, FlowNotice, FlowStep, FlowTextField } from '@yahel/ui';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { signInMessages as m } from '../messages';
import { useSignInFlow } from '../sign-in-flow';
import { StepFrame } from './step-frame';

export function HelpStep() {
  const { actions, meta } = useSignInFlow();
  const [contact, setContact] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const request = meta.requests.help;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (contact.trim() === '') {
      setProblem(m.helpRequired);
      event.currentTarget.querySelector<HTMLInputElement>('input[name="contact"]')?.focus();
      return;
    }
    actions.requestHelp(contact.trim());
  };

  return (
    <StepFrame title={m.helpTitle} lede={m.helpLede} failure={request.failure}>
      <FlowStep.Form onSubmit={submit}>
        <FlowStep.Body>
          <FlowTextField
            label={m.helpLabel}
            name="contact"
            autoComplete="email"
            spellCheck="false"
            value={contact}
            onChange={(next) => {
              setContact(next);
              setProblem(null);
            }}
            error={problem ?? undefined}
            isRequired
          />
          <FlowNotice>{m.helpPromise}</FlowNotice>
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary" isPending={request.isPending} pendingLabel={m.sendingRequest}>
            {m.sendRequest}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
    </StepFrame>
  );
}

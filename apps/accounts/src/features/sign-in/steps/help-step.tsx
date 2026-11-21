import { FlowButton, FlowNotice, FlowStep, FlowTextField } from '@yahel/ui';
import { signInMessages as m } from '../messages';
import { useSignInFlow } from '../sign-in-flow';
import { useStepField } from '../../../flow/use-step-field';
import { StepFrame } from './step-frame';

export function HelpStep() {
  const { actions, meta } = useSignInFlow();
  const request = meta.requests.help;
  const contact = useStepField({ problemOf: (value) => (value.trim() === '' ? m.helpRequired : null), onValid: (value) => actions.requestHelp(value.trim()) });

  return (
    <StepFrame title={m.helpTitle} lede={m.helpLede} failure={request.failure}>
      <FlowStep.Form onSubmit={contact.submit}>
        <FlowStep.Body>
          <FlowTextField label={m.helpLabel} name="contact" autoComplete="email" spellCheck="false" value={contact.value} onChange={contact.change} error={contact.error} inputRef={contact.inputRef} isRequired />
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

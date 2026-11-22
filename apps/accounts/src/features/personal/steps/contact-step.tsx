import { FlowButton, FlowFacts, FlowLink, FlowStep, FlowTextField } from '@yahel/ui';
import { useStepField } from '../../../flow/use-step-field';
import { stepPath } from '../machine';
import { personalMessages as m } from '../messages';
import { usePersonalFlow } from '../personal-flow';
import { contactProblem } from '../validation';
import { StepFrame } from './step-frame';

export function ContactStep() {
  const { state, actions, meta } = usePersonalFlow();
  const request = meta.requests.inviteContact;
  const contact = useStepField({ problemOf: (value) => contactProblem(value, [state.address, state.recovery.email]), hasFormat: true, onValid: (value) => actions.inviteContact(value.trim().toLowerCase()) });

  return (
    <StepFrame title={m.contactTitle} lede={m.contactLede} requests={[request]}>
      <FlowStep.Form onSubmit={contact.submit}>
        <FlowStep.Body>
          <FlowTextField label={m.contactLabel} name="contact-email" type="email" inputMode="email" autoComplete="off" spellCheck="false" value={contact.value} onChange={contact.change} onBlur={contact.blur} isValid={contact.isValid} error={contact.error} inputRef={contact.inputRef} isRequired />
          <FlowFacts>
            {m.contactFacts.map(([lead, rest]) => (
              <FlowFacts.Item key={lead} lead={lead}>
                {rest}
              </FlowFacts.Item>
            ))}
          </FlowFacts>
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary" isPending={request.isPending} pendingLabel={m.sending}>
            {m.sendInvitation}
          </FlowButton>
          <FlowLink variant="quiet" href={stepPath('ready')}>
            {m.notNow}
          </FlowLink>
        </FlowStep.Actions>
      </FlowStep.Form>
    </StepFrame>
  );
}

import { FlowButton, FlowStep, FlowTextField } from '@yahel/ui';
import { useStepField, useStepFields } from '../../../flow/use-step-field';
import { useBusinessFlow } from '../business-flow';
import { businessMessages as m } from '../messages';
import { contactEmailProblem, firstNameProblem, lastNameProblem } from '../validation';
import { StepFrame } from './step-frame';

export function YouStep() {
  const { state, actions, meta } = useBusinessFlow();
  const asksEmail = meta.offers.contactEmail;
  const first = useStepField({ initial: state.firstName, problemOf: firstNameProblem, label: m.firstName });
  const last = useStepField({ initial: state.lastName, problemOf: lastNameProblem, label: m.lastName });
  const email = useStepField({ initial: state.contactEmail, problemOf: contactEmailProblem, label: m.contactEmail, hasFormat: true });
  const form = useStepFields([first, last, ...(asksEmail ? [email] : [])]);

  const submit = () => actions.enterYou({ firstName: first.value.trim(), lastName: last.value.trim(), contactEmail: asksEmail ? email.value.trim() : '' });

  return (
    <StepFrame title={m.youTitle} lede={asksEmail ? m.youLedeWithEmail : m.youLede} toFix={form.toFix}>
      <FlowStep.Form onSubmit={(event) => form.submit(event, submit)}>
        <FlowStep.Body>
          <FlowStep.Row>
            <FlowTextField label={m.firstName} name="given-name" autoComplete="given-name" value={first.value} onChange={first.change} onBlur={first.blur} error={first.error} inputRef={first.inputRef} isRequired isSensitive />
            <FlowTextField label={m.lastName} name="family-name" autoComplete="family-name" value={last.value} onChange={last.change} onBlur={last.blur} error={last.error} inputRef={last.inputRef} isSensitive />
          </FlowStep.Row>
          {asksEmail ? (
            <FlowTextField label={m.contactEmail} name="email" type="email" inputMode="email" autoComplete="email" spellCheck="false" help={m.contactEmailHelp} value={email.value} onChange={email.change} onBlur={email.blur} isValid={email.isValid} error={email.error} inputRef={email.inputRef} isRequired isSensitive />
          ) : null}
          {state.prefilledFrom ? <FlowStep.Note>{m.prefilledFrom(state.prefilledFrom)}</FlowStep.Note> : null}
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary">
            {m.continue}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
    </StepFrame>
  );
}

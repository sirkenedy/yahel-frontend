import { FlowButton, FlowStep, FlowTextField } from '@yahel/ui';
import { countryProblem } from '../../../flow/countries';
import { forField } from '../../../flow/feedback';
import { CountrySelect } from '../../../flow/country-select';
import { useStepField, useStepFields } from '../../../flow/use-step-field';
import { useAdminFlow } from '../admin-flow';
import { adminMessages as m } from '../messages';
import { phoneProblem } from '../validation';
import { StepFrame } from './step-frame';

export function PhoneStep() {
  const { state, actions, meta } = useAdminFlow();
  const request = meta.requests.sendPhoneCode;
  // A number given earlier (the business phone, for a bought domain) is where the step starts.
  const known = state.phone ?? state.suggestedPhone;
  const country = useStepField<HTMLSelectElement>({ initial: known?.country ?? '', problemOf: countryProblem, label: m.country });
  const phone = useStepField({ initial: known?.number ?? '', problemOf: phoneProblem, label: m.mobileNumber, hasFormat: true, refusal: forField(request.feedback, 'phone') });

  const form = useStepFields([country, phone]);

  return (
    <StepFrame title={m.phoneTitle} lede={m.phoneLede} requests={[request]} toFix={form.toFix}>
      <FlowStep.Form onSubmit={(event) => form.submit(event, () => actions.sendPhoneCode({ country: country.value, number: phone.value.trim() }))}>
        <FlowStep.Body>
          <FlowStep.Row layout="phone">
            <CountrySelect label={m.country} locale={m.locale} value={country.value} onChange={country.change} error={country.error} inputRef={country.inputRef} forPhone />
            <FlowTextField label={m.mobileNumber} name="tel-national" type="tel" inputMode="tel" autoComplete="tel-national" value={phone.value} onChange={phone.change} onBlur={phone.blur} isValid={phone.isValid} error={phone.error} inputRef={phone.inputRef} isSensitive isRequired />
          </FlowStep.Row>
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary" isPending={request.isPending} pendingLabel={m.sendingCode}>
            {m.sendCode}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
    </StepFrame>
  );
}

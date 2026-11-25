import { FlowButton, FlowStep, FlowTextField } from '@yahel/ui';
import { useState } from 'react';
import { forField } from '../../../flow/feedback';
import { CountrySelect } from '../../../flow/country-select';
import { useStepField } from '../../../flow/use-step-field';
import { useAdminFlow } from '../admin-flow';
import { adminMessages as m } from '../messages';
import { phoneProblem } from '../validation';
import { StepFrame } from './step-frame';

const DEFAULT_COUNTRY = 'NG';

export function PhoneStep() {
  const { state, actions, meta } = useAdminFlow();
  const request = meta.requests.sendPhoneCode;
  // A number given earlier (the business phone, for a bought domain) is where the step starts.
  const known = state.phone ?? state.suggestedPhone;
  const [country, setCountry] = useState(known?.country ?? DEFAULT_COUNTRY);
  const phone = useStepField({ initial: known?.number ?? '', problemOf: phoneProblem, onValid: (number) => actions.sendPhoneCode({ country, number: number.trim() }), label: m.mobileNumber, hasFormat: true, refusal: forField(request.feedback, 'phone') });

  return (
    <StepFrame title={m.phoneTitle} lede={m.phoneLede} requests={[request]}>
      <FlowStep.Form onSubmit={phone.submit}>
        <FlowStep.Body>
          <FlowStep.Row layout="phone">
            <CountrySelect label={m.country} groups={m.countryGroups} locale={m.locale} suggested={DEFAULT_COUNTRY} value={country} onChange={setCountry} forPhone />
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

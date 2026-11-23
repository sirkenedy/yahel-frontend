import { FlowButton, FlowSelect, FlowStep, FlowTextField } from '@yahel/ui';
import { useState } from 'react';
import { useStepFields, useStepField } from '../../../flow/use-step-field';
import { africanCountries, namedCountries, otherCountries } from '../../../flow/countries';
import type { PhoneCountry } from '../../../flow/countries';
import { DEFAULT_PHONE_COUNTRY } from '../machine';
import { personalMessages as m } from '../messages';
import { usePersonalFlow } from '../personal-flow';
import { recoveryProblems } from '../validation';
import { StepFrame } from './step-frame';

const africa = namedCountries(africanCountries, m.locale);
const world = namedCountries(otherCountries, m.locale);
const suggested = africa.filter((country) => country.iso === DEFAULT_PHONE_COUNTRY);

// The dialling code comes first so it stays in view when the closed field is too narrow for the whole name.
const options = (countries: (PhoneCountry & { name: string })[]) =>
  countries.map((country) => (
    <option key={country.iso} value={country.iso}>
      {country.dial} {country.name}
    </option>
  ));

export function RecoveryStep() {
  const { state, actions } = usePersonalFlow();
  const [country, setCountry] = useState(state.recovery.country);
  // Each field is judged with the other as it stands and itself as just typed.
  const problems = (typed: { phone?: string; email?: string }): { phone?: string; email?: string } => recoveryProblems({ phone: phone.value, email: email.value, ...typed }, state.address);
  const phone = useStepField({ initial: state.recovery.phone, problemOf: (value): string | null => problems({ phone: value }).phone ?? null, label: m.mobileNumber, hasFormat: true });
  const email = useStepField({ initial: state.recovery.email, problemOf: (value): string | null => problems({ email: value }).email ?? null, label: m.recoveryEmail, hasFormat: true });
  const form = useStepFields([phone, email]);

  return (
    <StepFrame title={m.recoveryTitle} lede={m.recoveryLede} toFix={form.toFix}>
      <FlowStep.Form onSubmit={(event) => form.submit(event, () => actions.enterRecovery({ country, phone: phone.value.trim(), email: email.value.trim().toLowerCase() }))}>
        <FlowStep.Body>
          <FlowStep.Row layout="phone">
            <FlowSelect label={m.country} name="tel-country-code" autoComplete="tel-country-code" value={country} onChange={setCountry} isSensitive>
              <optgroup label={m.countryGroups.suggested}>{options(suggested)}</optgroup>
              <optgroup label={m.countryGroups.africa}>{options(africa.filter((entry) => entry.iso !== DEFAULT_PHONE_COUNTRY))}</optgroup>
              <optgroup label={m.countryGroups.world}>{options(world)}</optgroup>
            </FlowSelect>
            <FlowTextField label={m.mobileNumber} name="tel-national" type="tel" inputMode="tel" autoComplete="tel-national" value={phone.value} onChange={phone.change} onBlur={phone.blur} isValid={phone.isValid} error={phone.error} inputRef={phone.inputRef} isSensitive />
          </FlowStep.Row>
          <FlowTextField label={m.recoveryEmail} name="recovery-email" type="email" inputMode="email" autoComplete="email" spellCheck="false" help={m.recoveryEmailHelp} value={email.value} onChange={email.change} onBlur={email.blur} isValid={email.isValid} error={email.error} inputRef={email.inputRef} isSensitive />
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary">
            {m.continue}
          </FlowButton>
          <FlowButton variant="quiet" onPress={actions.skipRecovery}>
            {m.skip}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
    </StepFrame>
  );
}

import { FlowButton, FlowStep, FlowTextField } from '@yahel/ui';
import { useState } from 'react';
import { useStepFields, useStepField } from '../../../flow/use-step-field';
import { PhoneCountrySelect } from '../../../flow/phone-country-select';
import { DEFAULT_PHONE_COUNTRY } from '../machine';
import { personalMessages as m } from '../messages';
import { usePersonalFlow } from '../personal-flow';
import { recoveryProblems } from '../validation';
import { StepFrame } from './step-frame';

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
            <PhoneCountrySelect label={m.country} groups={m.countryGroups} locale={m.locale} suggested={DEFAULT_PHONE_COUNTRY} value={country} onChange={setCountry} />
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

import { FlowButton, FlowNotice, FlowStep, FlowTextField } from '@yahel/ui';
import { useState } from 'react';
import { CountrySelect } from '../../../flow/country-select';
import { useStepField, useStepFields } from '../../../flow/use-step-field';
import { useBusinessFlow } from '../business-flow';
import { NIGERIA } from '../machine';
import { businessMessages as m } from '../messages';
import { cityProblem, phoneProblem, streetProblem } from '../validation';
import { RegionField, useRegion } from './region-field';
import { StepFrame } from './step-frame';

/** The business's address. For a domain bought here it is also what the registry is given; otherwise it is asked for from checkout, for invoices. */
export function RegistrantStep() {
  const { state, actions } = useBusinessFlow();
  const known = state.address;
  const inNigeria = state.country === NIGERIA;
  const buying = state.domainSource === 'bought';
  const [phoneCountry, setPhoneCountry] = useState(known?.phoneCountry ?? state.country);
  const [more, setMore] = useState(Boolean(known?.street2 || known?.localArea || known?.postalCode));
  const [street2, setStreet2] = useState(known?.street2 ?? '');
  const [localArea, setLocalArea] = useState(known?.localArea ?? '');
  const [postalCode, setPostalCode] = useState(known?.postalCode ?? '');
  const street = useStepField({ initial: known?.street ?? '', problemOf: streetProblem, label: m.street });
  const city = useStepField({ initial: known?.city ?? '', problemOf: cityProblem, label: m.city });
  const region = useRegion(state.country, known?.state);
  const phone = useStepField({ initial: known?.phone ?? '', problemOf: phoneProblem, label: m.phone, hasFormat: true });
  const form = useStepFields([street, city, region.field, phone]);

  const submit = () => actions.enterAddress({ street: street.value.trim(), street2: street2.trim(), city: city.value.trim(), state: region.field.value.trim(), localArea: inNigeria ? localArea.trim() : '', postalCode: postalCode.trim(), phoneCountry, phone: phone.value.trim() });

  return (
    <StepFrame title={buying ? m.registrantTitle(state.domain) : m.addressTitle} lede={buying ? m.registrantLede : m.addressLede} toFix={form.toFix}>
      <FlowStep.Form onSubmit={(event) => form.submit(event, submit)}>
        <FlowStep.Body>
          <FlowTextField label={m.street} name="address-line1" autoComplete="address-line1" value={street.value} onChange={street.change} onBlur={street.blur} error={street.error} inputRef={street.inputRef} isRequired isSensitive />
          <FlowStep.Row>
            <FlowTextField label={m.city} name="address-level2" autoComplete="address-level2" value={city.value} onChange={city.change} onBlur={city.blur} error={city.error} inputRef={city.inputRef} isRequired isSensitive />
            <RegionField region={region} name="address-level1" autoComplete="address-level1" />
          </FlowStep.Row>
          <FlowStep.Row layout="phone">
            <CountrySelect label={m.phoneCountry} locale={m.locale} value={phoneCountry} onChange={setPhoneCountry} forPhone />
            <FlowTextField label={m.phone} name="tel-national" type="tel" inputMode="tel" autoComplete="tel-national" value={phone.value} onChange={phone.change} onBlur={phone.blur} isValid={phone.isValid} error={phone.error} inputRef={phone.inputRef} isRequired isSensitive />
          </FlowStep.Row>
          <FlowButton variant="link" aria-expanded={more} onPress={() => setMore(!more)}>
            {more ? m.fewerAddress : inNigeria ? m.moreAddress : m.moreAddressElsewhere}
          </FlowButton>
          {more ? (
            <>
              <FlowTextField label={m.street2} name="address-line2" autoComplete="address-line2" help={m.optional} value={street2} onChange={setStreet2} isSensitive />
              {inNigeria ? <FlowTextField label={m.localArea} name="address-level3" autoComplete="off" help={m.optional} value={localArea} onChange={setLocalArea} isSensitive /> : null}
              <FlowTextField label={m.postalCode} name="postal-code" inputMode={inNigeria ? 'numeric' : 'text'} autoComplete="postal-code" help={m.optional} value={postalCode} onChange={setPostalCode} isSensitive />
            </>
          ) : null}
          {buying ? <FlowNotice tone="success">{m.privacyOn(state.domain)}</FlowNotice> : null}
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary">
            {buying ? m.continue : m.saveAddress}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
    </StepFrame>
  );
}

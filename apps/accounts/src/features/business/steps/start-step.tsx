import { FlowButton, FlowChip, FlowChips, FlowLink, FlowSelect, FlowStep, FlowTextField } from '@yahel/ui';
import { useState } from 'react';
import { namedCountries } from '../../../flow/countries';
import { useStepField } from '../../../flow/use-step-field';
import { useBusinessFlow } from '../business-flow';
import { businessCountries } from '../countries';
import { DEFAULT_COUNTRY, teamSizes } from '../machine';
import { businessMessages as m } from '../messages';
import { businessNameProblem } from '../validation';
import { StepFrame } from './step-frame';

const africa = namedCountries(businessCountries.african, m.locale);
const world = namedCountries(businessCountries.other, m.locale);
const suggested = africa.filter((country) => country.iso === DEFAULT_COUNTRY);
const options = (countries: typeof africa) =>
  countries.map((country) => (
    <option key={country.iso} value={country.iso}>
      {country.name}
    </option>
  ));

export function StartStep() {
  const { state, actions, meta } = useBusinessFlow();
  const [size, setSize] = useState(state.size);
  const [country, setCountry] = useState(state.country);
  const name = useStepField({ initial: state.businessName, problemOf: businessNameProblem, onValid: (businessName) => actions.enterBusiness({ businessName: businessName.trim(), size, country }) });

  return (
    <StepFrame title={m.startTitle} lede={m.startLede}>
      <FlowStep.Form onSubmit={name.submit}>
        <FlowStep.Body>
          <FlowTextField label={m.businessName} name="organization" autoComplete="organization" value={name.value} onChange={name.change} onBlur={name.blur} error={name.error} inputRef={name.inputRef} isRequired />
          <FlowChips label={m.sizeLabel} value={size} onChange={setSize}>
            {teamSizes.map((option) => (
              <FlowChip key={option} value={option}>
                {m.sizes[option]}
              </FlowChip>
            ))}
          </FlowChips>
          <FlowSelect label={m.country} name="country" autoComplete="country" value={country} onChange={setCountry}>
            <optgroup label={m.countryGroups.suggested}>{options(suggested)}</optgroup>
            <optgroup label={m.countryGroups.africa}>{options(africa.filter((entry) => entry.iso !== DEFAULT_COUNTRY))}</optgroup>
            <optgroup label={m.countryGroups.other}>{options(world)}</optgroup>
          </FlowSelect>
          <FlowStep.Note>{m.countryHelp}</FlowStep.Note>
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary">
            {m.continue}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
      <FlowStep.Links>
        <FlowLink href={meta.links.personal}>{m.personalInstead}</FlowLink>
      </FlowStep.Links>
    </StepFrame>
  );
}

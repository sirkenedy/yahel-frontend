import { FlowButton, FlowChip, FlowChips, FlowLink, FlowStep, FlowTextField } from '@yahel/ui';
import { useState } from 'react';
import { countryProblem } from '../../../flow/countries';
import { CountrySelect } from '../../../flow/country-select';
import { useStepField, useStepFields } from '../../../flow/use-step-field';
import { useBusinessFlow } from '../business-flow';
import { teamSizes } from '../machine';
import { businessMessages as m } from '../messages';
import { businessNameProblem } from '../validation';
import { StepFrame } from './step-frame';

export function StartStep() {
  const { state, actions, meta } = useBusinessFlow();
  const [size, setSize] = useState(state.size);
  const name = useStepField({ initial: state.businessName, problemOf: businessNameProblem, label: m.businessName });
  const country = useStepField<HTMLButtonElement>({ initial: state.country, problemOf: countryProblem, label: m.country });
  const form = useStepFields([name, country]);

  return (
    <StepFrame title={m.startTitle} lede={m.startLede} toFix={form.toFix}>
      <FlowStep.Form onSubmit={(event) => form.submit(event, () => actions.enterBusiness({ businessName: name.value.trim(), size, country: country.value }))}>
        <FlowStep.Body>
          <FlowTextField label={m.businessName} name="organization" autoComplete="organization" value={name.value} onChange={name.change} onBlur={name.blur} error={name.error} inputRef={name.inputRef} isRequired />
          <FlowChips label={m.sizeLabel} value={size} onChange={setSize}>
            {teamSizes.map((option) => (
              <FlowChip key={option} value={option}>
                {m.sizes[option]}
              </FlowChip>
            ))}
          </FlowChips>
          <CountrySelect label={m.country} locale={m.locale} value={country.value} onChange={country.change} error={country.error} inputRef={country.inputRef} />
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

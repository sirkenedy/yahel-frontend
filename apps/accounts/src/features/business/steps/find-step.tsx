import { Choice, ChoiceGroup, FlowButton, FlowNotice, FlowStep, FlowTextField } from '@yahel/ui';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useBusinessFlow } from '../business-flow';
import { businessMessages as m } from '../messages';
import { StepFrame } from './step-frame';

export function FindStep() {
  const { state, actions } = useBusinessFlow();
  const { offers, bought } = state;
  const [asked, setAsked] = useState(false);
  const searchField = useRef<HTMLInputElement>(null);
  const found = offers.status === 'ready' ? offers.value : [];
  const gone = state.rejection?.step === 'find';

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (bought) return actions.continueWithDomain();
    setAsked(true);
    searchField.current?.focus();
  };

  return (
    <StepFrame title={m.findTitle} lede={m.findLede}>
      <FlowStep.Form onSubmit={submit}>
        <FlowStep.Body>
          {gone ? <FlowNotice tone="warning">{m.pickedDomainGone}</FlowNotice> : null}
          <FlowTextField label={m.searchLabel} name="domain-search" autoComplete="off" spellCheck="false" value={state.search} onChange={actions.typeSearch} error={asked && !bought ? m.chooseDomain : undefined} inputRef={searchField} />
          {found.length > 0 ? (
            <>
              <ChoiceGroup label={m.results} value={bought?.domain ?? ''} onChange={(domain) => actions.pickDomain(found.find((offer) => offer.domain === domain)!)}>
                {found.map((offer) => (
                  <Choice key={offer.domain} value={offer.domain} tag={offer.bestMatch ? m.bestMatch : undefined} meta={m.aYear(m.money(offer.yearly))}>
                    {offer.domain}
                  </Choice>
                ))}
              </ChoiceGroup>
              <FlowStep.Note>{m.resultsNote}</FlowStep.Note>
            </>
          ) : (
            <FlowStep.Note>{offers.status === 'loading' ? m.searching : offers.status === 'failed' ? m.searchFailed : m.noResults}</FlowStep.Note>
          )}
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary">
            {m.continue}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
      <FlowStep.Links>
        <FlowButton variant="link" onPress={actions.ownInstead}>
          {m.ownInstead}
        </FlowButton>
      </FlowStep.Links>
    </StepFrame>
  );
}

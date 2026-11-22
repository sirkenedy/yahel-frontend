import { FlowButton, FlowChip, FlowChips, FlowLink, FlowNotice, FlowStep, FlowTextField, PlanCard } from '@yahel/ui';
import { useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { forField } from '../../../flow/feedback';
import { useStepField } from '../../../flow/use-step-field';
import { useBusinessFlow } from '../business-flow';
import { businessMessages as m } from '../messages';
import { PricingUnavailable } from './pricing-unavailable';
import { StepFrame } from './step-frame';

export function PlanStep() {
  const { state, actions, meta } = useBusinessFlow();
  const { plan, quote, promo } = state;
  const request = meta.requests.applyPromo;
  const [promoOpen, setPromoOpen] = useState(false);
  const code = useStepField({ problemOf: (value) => (value.trim() === '' ? m.promoRequired : null), refusal: forField(request.feedback, 'promo') });

  if (plan.status !== 'ready') {
    return (
      <StepFrame title={m.planTitlePending}>
        <FlowStep.Body>
          <PricingUnavailable status={plan.status} onRetry={actions.retryPricing} />
        </FlowStep.Body>
      </StepFrame>
    );
  }

  const offer = plan.value;
  const trial = quote.value?.trial ?? state.seats <= offer.trial.maxSeats;
  const regular = offer.seatPrice[state.period];
  const reduced = promo ? (quote.value?.discountedSeatPrice ?? null) : null;

  const applyPromo = () => {
    if (code.check()) actions.applyPromo(code.value.trim());
    else code.focus();
  };
  // The promo code sits inside the step's form, where Enter would otherwise mean "Continue to checkout".
  const applyOnEnter = (event: KeyboardEvent) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    applyPromo();
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    actions.choosePlan();
  };

  return (
    <StepFrame title={trial ? m.planTitleTrial(offer.trial.days) : m.planTitle(offer.name)} lede={trial ? m.planLedeTrial(offer.trial.maxSeats) : m.planLede(offer.trial.maxSeats)} requests={[request]}>
      <FlowStep.Form onSubmit={submit}>
        <FlowStep.Body>
          <FlowChips label={m.billing} isLabelHidden layout="segmented" value={state.period} onChange={actions.choosePeriod}>
            <FlowChip value="monthly">{m.monthly}</FlowChip>
            <FlowChip value="yearly" badge={m.save(offer.yearlySaving)}>
              {m.yearly}
            </FlowChip>
          </FlowChips>
          <PlanCard name={offer.name} price={m.money(reduced ?? regular)} was={reduced ? { price: m.money(regular), label: m.was } : undefined} unit={m.perPersonMonth} features={offer.features}>
            {promo ? (
              <FlowNotice
                tone="success"
                actions={
                  <FlowButton variant="chip" aria-label={m.removePromo(promo.code)} onPress={actions.removePromo}>
                    {m.remove}
                  </FlowButton>
                }
              >
                {m.promoApplied(promo.code, promo.percent, promo.months)}
              </FlowNotice>
            ) : promoOpen ? (
              <>
                <FlowTextField label={m.promoLabel} name="promo-code" autoComplete="off" spellCheck="false" value={code.value} onChange={code.change} error={code.error} inputRef={code.inputRef} onKeyDown={applyOnEnter} />
                <FlowButton variant="quiet" onPress={applyPromo} isPending={request.isPending} pendingLabel={m.applying}>
                  {m.apply}
                </FlowButton>
              </>
            ) : (
              <FlowButton variant="link" onPress={() => setPromoOpen(true)}>
                {m.addPromo}
              </FlowButton>
            )}
          </PlanCard>
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary">
            {m.toCheckout}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
      {meta.links.help ? (
        <FlowStep.Links>
          <FlowLink href={meta.links.help}>{m.enterprise(offer.enterpriseFrom)}</FlowLink>
        </FlowStep.Links>
      ) : null}
    </StepFrame>
  );
}

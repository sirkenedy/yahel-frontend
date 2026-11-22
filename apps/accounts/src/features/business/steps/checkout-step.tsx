import { FlowButton, FlowChip, FlowChips, FlowNotice, FlowStep, FlowTextField, OrderSummary, Receipt } from '@yahel/ui';
import { useState } from 'react';
import type { FormEvent, KeyboardEvent, ReactNode } from 'react';
import { useStepField, useStepFields } from '../../../flow/use-step-field';
import { useBusinessFlow } from '../business-flow';
import { brandOf, formatCardNumber, formatExpiry, formatSecurityCode } from '../card';
import { businessMessages as m } from '../messages';
import { cardNumberProblem, expiryProblemOf, largeTeamProblem, nameOnCardProblem, securityCodeProblem } from '../validation';
import { PricingUnavailable } from './pricing-unavailable';
import { StepFrame } from './step-frame';

const MORE = 'more';
const countryNames = new Intl.DisplayNames(m.locale, { type: 'region' });

const named = (name: string, href: string | null): ReactNode =>
  href ? (
    <FlowStep.NoteLink href={href} newTabLabel={m.opensInNewTab}>
      {name}
    </FlowStep.NoteLink>
  ) : (
    name
  );

/**
 * The order, then the card. Card number, expiry, security code and name live in this screen's fields and
 * nowhere else: they are handed to `actions.pay` once and are gone when the screen is. This is the design
 * over a stand-in, not a payment form (see `workspace-billing.ts`).
 */
export function CheckoutStep() {
  const { state, actions, meta } = useBusinessFlow();
  const { plan, quote, address } = state;
  const { links } = meta;
  const request = meta.requests.pay;
  const [addressAsked, setAddressAsked] = useState(false);
  const largest = plan.value?.trial.maxSeats ?? 10;
  const [manyTyped, setManyTyped] = useState(state.seats > largest ? String(state.seats) : '');
  const many = useStepField({ value: manyTyped, onChange: (typed) => chooseMany(typed.replace(/\D/g, '').slice(0, 4)), problemOf: (value) => (state.seats > largest ? largeTeamProblem(value, largest) : null), label: m.seatsMoreLabel });
  const number = useStepField({ problemOf: cardNumberProblem, label: m.cardNumber, hasFormat: true });
  const expiry = useStepField({ problemOf: (value) => expiryProblemOf(value), label: m.expiry, hasFormat: true });
  const securityCode = useStepField({ problemOf: securityCodeProblem, label: m.securityCode, hasFormat: true });
  const cardName = useStepField({ initial: [state.firstName, state.lastName].filter(Boolean).join(' '), problemOf: nameOnCardProblem, label: m.nameOnCard });
  const form = useStepFields([many, number, expiry, securityCode, cardName]);

  function chooseMany(typed: string) {
    setManyTyped(typed);
    if (largeTeamProblem(typed, largest) === null) actions.chooseSeats(Number(typed));
  }

  if (plan.status !== 'ready' || quote.status !== 'ready') {
    return (
      <StepFrame title={m.checkoutTitle}>
        <FlowStep.Body>
          <PricingUnavailable status={plan.status === 'failed' || quote.status === 'failed' ? 'failed' : 'loading'} onRetry={actions.retryPricing} />
        </FlowStep.Body>
      </StepFrame>
    );
  }

  const offer = plan.value;
  const sums = quote.value;
  const due = m.money(sums.dueToday);
  const firstCharge = sums.schedule.find((charge) => charge.from !== null);
  const chooseChip = (value: string) => {
    if (value !== MORE) return actions.chooseSeats(Number(value));
    chooseMany(String(Math.max(state.seats, largest + 1)));
  };

  // The number of people sits inside the payment form, where Enter would otherwise pay: it only checks the number.
  const checkManyOnEnter = (event: KeyboardEvent) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    many.check();
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    setAddressAsked(true);
    form.submit(event, () => {
      if (address) actions.pay({ number: number.value, expiry: expiry.value, securityCode: securityCode.value, name: cardName.value.trim() });
    });
  };

  return (
    <StepFrame title={m.checkoutTitle} lede={sums.trial && firstCharge?.from ? m.checkoutLedeTrial(m.dayOf(firstCharge.from)) : m.checkoutLede(largest)} requests={[request]} toFix={form.toFix}>
      <FlowStep.Form onSubmit={submit}>
        <FlowStep.Split
          lead={
            <>
              <FlowChips label={m.seatsLabel} layout="compact" value={state.seats > largest ? MORE : String(state.seats)} onChange={chooseChip}>
                {Array.from({ length: largest }, (_, index) => (
                  <FlowChip key={index} value={String(index + 1)}>
                    {index + 1}
                  </FlowChip>
                ))}
                <FlowChip value={MORE}>{m.moreSeats(largest + 1)}</FlowChip>
              </FlowChips>
              {state.seats > largest ? <FlowTextField label={m.seatsMoreLabel} name="seats" inputMode="numeric" autoComplete="off" value={many.value} onChange={many.change} onBlur={many.blur} error={many.error} inputRef={many.inputRef} onKeyDown={checkManyOnEnter} /> : null}
              {sums.trial ? (
                <FlowStep.Note>{m.seatsHelpTrial}</FlowStep.Note>
              ) : (
                <FlowNotice
                  tone="warning"
                  title={m.noTrialTitle(largest)}
                  actions={
                    <FlowButton variant="chip" onPress={() => actions.chooseSeats(largest)}>
                      {m.tryWith(largest)}
                    </FlowButton>
                  }
                >
                  {m.noTrialText(sums.seats, m.money(sums.planToday), offer.trial.days)}
                </FlowNotice>
              )}
            </>
          }
          aside={
            <OrderSummary
              title={m.orderSummary}
              action={
                <FlowButton variant="link" onPress={() => actions.edit('plan')}>
                  {m.changePlan}
                </FlowButton>
              }
            >
              <OrderSummary.Item title={offer.name} amount={sums.trial ? undefined : m.billedToday} badge={sums.trial ? m.trialBadge(offer.trial.days) : undefined}>
                {m.planLine(sums.period, sums.seats)}
              </OrderSummary.Item>
              <OrderSummary.Schedule label={m.schedule}>
                {sums.schedule.map((charge) => (
                  <OrderSummary.Charge key={`${charge.kind}${charge.from}`} when={charge.from ? m.from(m.dayOf(charge.from)) : m.today} amount={m.chargeAmount(charge)}>
                    {m.charge(charge, sums.period)}
                  </OrderSummary.Charge>
                ))}
              </OrderSummary.Schedule>
              <OrderSummary.Note>
                {sums.promo ? `${m.promoApplied(sums.promo.code, sums.promo.percent, sums.promo.months)}. ` : null}
                {m.seatsNote(sums.seats, sums.taxRate)}
              </OrderSummary.Note>
              {sums.domain ? (
                <OrderSummary.Item title={sums.domain.name} amount={m.perYear(m.money(sums.domain.yearly))}>
                  {m.domainLine}
                </OrderSummary.Item>
              ) : null}
              <OrderSummary.Total label={m.dueToday} suffix={m.plusVat}>
                {due}
              </OrderSummary.Total>
            </OrderSummary>
          }
        >
          <Receipt label={m.yourOrder}>
            <Receipt.Row label={m.rowBusiness} detail={m.businessDetail(m.sizeDetails[state.size], countryNames.of(state.country) ?? state.country)} action={edit(m.editBusiness, () => actions.edit('business'))}>
              {state.businessName}
            </Receipt.Row>
            <Receipt.Row label={m.rowDomain} detail={state.domainSource === 'bought' ? m.domainBought : m.domainOwned} action={edit(m.editDomain, () => actions.edit('domain'))}>
              {state.domain}
            </Receipt.Row>
            <Receipt.Row label={m.rowAdmin} detail={m.adminDetail} action={edit(m.editAdmin, () => actions.edit('admin'))}>
              {state.adminAddress}
            </Receipt.Row>
            <Receipt.Row label={m.businessAddress} state={address ? 'done' : 'upcoming'} action={edit(address ? m.editAddress : m.addAddress, () => actions.edit('address'), address ? m.edit : m.addAddress)}>
              {address ? [address.street, address.street2, address.localArea, address.city, address.state, address.postalCode].filter(Boolean).join(', ') : null}
            </Receipt.Row>
          </Receipt>
          {addressAsked && !address ? <FlowNotice tone="danger">{m.addressRequired}</FlowNotice> : null}
          <FlowStep.Subheading>{m.cardDetails}</FlowStep.Subheading>
          <FlowTextField
            label={m.cardNumber}
            name="cc-number"
            inputMode="numeric"
            autoComplete="cc-number"
            help={m.cardBrands}
            suffix={brandOf(number.value) ?? undefined}
            value={number.value}
            onChange={(typed) => number.change(formatCardNumber(typed))}
            onBlur={number.blur}
            isValid={number.isValid}
            error={number.error}
            inputRef={number.inputRef}
            isRequired
            isSensitive
          />
          <FlowStep.Row layout="halves">
            <FlowTextField label={m.expiry} name="cc-exp" inputMode="numeric" autoComplete="cc-exp" help={m.expiryHelp} value={expiry.value} onChange={(typed) => expiry.change(formatExpiry(typed))} onBlur={expiry.blur} isValid={expiry.isValid} error={expiry.error} inputRef={expiry.inputRef} isRequired isSensitive />
            <FlowTextField label={m.securityCode} name="cc-csc" inputMode="numeric" autoComplete="cc-csc" help={m.securityCodeHelp} value={securityCode.value} onChange={(typed) => securityCode.change(formatSecurityCode(typed))} onBlur={securityCode.blur} isValid={securityCode.isValid} error={securityCode.error} inputRef={securityCode.inputRef} isRequired isSensitive />
          </FlowStep.Row>
          <FlowTextField label={m.nameOnCard} name="cc-name" autoComplete="cc-name" value={cardName.value} onChange={cardName.change} onBlur={cardName.blur} error={cardName.error} inputRef={cardName.inputRef} isRequired isSensitive />
          <FlowNotice>{m.demoPayment}</FlowNotice>
          <FlowStep.Note>
            {m.agreeByPaying}
            {named(m.businessAgreement, links.businessTerms)}
            {m.and}
            {named(m.trialTerms, links.trialTerms)}
            {sums.domain ? m.and : null}
            {sums.domain ? named(m.domainAgreement, links.domainTerms) : null}. {sums.trial ? m.renewsAfterTrial : m.renews}
          </FlowStep.Note>
        </FlowStep.Split>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary" isPending={request.isPending} pendingLabel={m.checkingCard}>
            {sums.trial ? (sums.domain ? m.payAndStartTrial(due) : m.startTrial) : m.payAndStart(due)}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
    </StepFrame>
  );
}

const edit = (name: string, onPress: () => void, label: string = m.edit) => (
  <FlowButton variant="link" aria-label={name === label ? undefined : name} onPress={onPress}>
    {label}
  </FlowButton>
);

import { FlowButton, FlowCheckbox, FlowNotice, FlowPreview, FlowSelect, FlowStep, FlowTextField } from '@yahel/ui';
import { useState } from 'react';
import { useStepField, useStepFields } from '../../../flow/use-step-field';
import { useBusinessFlow } from '../business-flow';
import { brandOf, formatCardNumber, formatExpiry, formatSecurityCode } from '../card';
import { NIGERIA, nigerianStates } from '../countries';
import { businessMessages as m } from '../messages';
import { cardNumberProblem, cityProblem, expiryProblemOf, nameOnCardProblem, securityCodeProblem, stateProblem, streetProblem } from '../validation';
import { PricingUnavailable } from './pricing-unavailable';
import { StepFrame } from './step-frame';

/**
 * The payment partner's page, as drawn. Card number, expiry, security code and name live in this screen's fields
 * and nowhere else: they are handed to `actions.pay` once and are gone when the screen is. This is the design over
 * a stand-in, not a payment form (see `workspace-billing.ts`).
 */
export function GatewayStep() {
  const { state, actions, meta } = useBusinessFlow();
  const { quote } = state;
  const request = meta.requests.pay;
  const [sameAddress, setSameAddress] = useState(true);
  const number = useStepField({ problemOf: cardNumberProblem, label: m.cardNumber, hasFormat: true });
  const expiry = useStepField({ problemOf: (value) => expiryProblemOf(value), label: m.expiry, hasFormat: true });
  const securityCode = useStepField({ problemOf: securityCodeProblem, label: m.securityCode, hasFormat: true });
  const cardName = useStepField({ initial: [state.firstName, state.lastName].filter(Boolean).join(' '), problemOf: nameOnCardProblem, label: m.nameOnCard });
  const inNigeria = state.country === NIGERIA;
  const [postalCode, setPostalCode] = useState('');
  const street = useStepField({ problemOf: streetProblem, label: m.street });
  const city = useStepField({ problemOf: cityProblem, label: m.city });
  const region = useStepField<HTMLInputElement & HTMLSelectElement>({ problemOf: (value) => stateProblem(value, state.country), label: inNigeria ? m.state : m.region });
  const form = useStepFields(sameAddress ? [number, expiry, securityCode, cardName] : [number, expiry, securityCode, cardName, street, city, region]);

  if (quote.status !== 'ready') {
    return (
      <StepFrame title={m.gatewayTitle}>
        <FlowStep.Body>
          <PricingUnavailable status={quote.status} onRetry={actions.retryPricing} />
        </FlowStep.Body>
      </StepFrame>
    );
  }

  const sums = quote.value;
  const due = m.money(sums.dueToday);
  const paying = (
    <FlowPreview label={m.securePage} icon="lock" lead={`${m.paying} ${m.payee(state.businessName)} · `}>
      {`${due} ${m.payingToday}`}
    </FlowPreview>
  );

  const billingAddress = sameAddress ? null : { street: street.value.trim(), city: city.value.trim(), state: region.value.trim(), postalCode: postalCode.trim(), country: state.country };

  return (
    <StepFrame title={m.gatewayTitle} lede={sums.trial ? m.gatewayLedeTrial : m.gatewayLede} requests={[request]} toFix={form.toFix} lead={paying}>
      <FlowStep.Form onSubmit={(event) => form.submit(event, () => actions.pay({ number: number.value, expiry: expiry.value, securityCode: securityCode.value, name: cardName.value.trim(), billingAddress }))}>
        <FlowStep.Body>
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
          <FlowCheckbox isSelected={sameAddress} onChange={setSameAddress}>
            {m.sameAddress}
          </FlowCheckbox>
          {sameAddress ? null : (
            <FlowStep.Group title={m.billingAddress} lede={m.billingAddressLede}>
              <FlowTextField label={m.street} name="billing-address-line1" autoComplete="billing address-line1" value={street.value} onChange={street.change} onBlur={street.blur} error={street.error} inputRef={street.inputRef} isRequired isSensitive />
              <FlowStep.Row>
                <FlowTextField label={m.city} name="billing-address-level2" autoComplete="billing address-level2" value={city.value} onChange={city.change} onBlur={city.blur} error={city.error} inputRef={city.inputRef} isRequired isSensitive />
                {inNigeria ? (
                  <FlowSelect label={m.state} name="billing-address-level1" autoComplete="billing address-level1" value={region.value} onChange={region.change} error={region.error} inputRef={region.inputRef} isSensitive>
                    <option value="">{m.chooseState}</option>
                    {nigerianStates.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </FlowSelect>
                ) : (
                  <FlowTextField label={m.region} name="billing-address-level1" autoComplete="billing address-level1" value={region.value} onChange={region.change} onBlur={region.blur} error={region.error} inputRef={region.inputRef} isRequired isSensitive />
                )}
              </FlowStep.Row>
              <FlowTextField label={m.postalCode} name="billing-postal-code" inputMode={inNigeria ? 'numeric' : 'text'} autoComplete="billing postal-code" help={m.optional} value={postalCode} onChange={setPostalCode} isSensitive />
            </FlowStep.Group>
          )}
          <FlowNotice>{m.demoPayment}</FlowNotice>
          <FlowStep.Note>{m.partnerNote}</FlowStep.Note>
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary" isPending={request.isPending} pendingLabel={m.checkingCard}>
            {sums.dueToday.amount > 0 ? m.payDue(due) : m.verifyCard}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
    </StepFrame>
  );
}

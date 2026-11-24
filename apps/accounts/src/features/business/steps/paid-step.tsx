import { FlowButton, FlowStep, Receipt, SuccessMark } from '@yahel/ui';
import { useBusinessFlow } from '../business-flow';
import { businessMessages as m } from '../messages';
import { StepFrame } from './step-frame';

/** The order is paid and the trial (or the plan) has started; Admin, and the passkey it recommends, are next. */
export function PaidStep() {
  const { state, actions } = useBusinessFlow();
  const offer = state.plan.value;
  const sums = state.quote.value;
  const days = offer?.trial.days ?? 0;
  const trial = sums?.trial ?? true;
  const domain = sums?.domain?.name ?? null;
  const lede = `${trial ? m.paidLedeTrial(days, offer?.name ?? '') : m.paidLede(offer?.name ?? '')}${domain ? m.paidDomain(domain) : ''}`;

  return (
    <StepFrame title={trial ? m.paidTitleTrial : m.paidTitle} lede={lede} lead={<SuccessMark />}>
      <FlowStep.Body>
        {offer && sums ? (
          <Receipt label={m.paidSummary}>
            <Receipt.Row label={m.rowPlan} detail={m.people(sums.seats)}>
              {offer.name}
            </Receipt.Row>
            <Receipt.Row label={m.rowToday} detail={domain ? m.domainRegistration : undefined}>
              {m.money(sums.dueToday)}
            </Receipt.Row>
            {trial ? (
              <Receipt.Row label={m.rowNextCharge} detail={m.cancelInAdmin}>
                {m.afterTrial(days)}
              </Receipt.Row>
            ) : null}
          </Receipt>
        ) : null}
      </FlowStep.Body>
      <FlowStep.Actions>
        <FlowButton variant="primary" onPress={actions.goToAdmin}>
          {m.goToAdmin}
        </FlowButton>
      </FlowStep.Actions>
    </StepFrame>
  );
}

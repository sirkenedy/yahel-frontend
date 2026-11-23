import { CodeInput, FlowButton, FlowStep, PaymentCardChip } from '@yahel/ui';
import { forField } from '../../../flow/feedback';
import { ResendLink } from '../../../flow/resend-link';
import { useStepField } from '../../../flow/use-step-field';
import { useBusinessFlow } from '../business-flow';
import { businessMessages as m } from '../messages';
import { CARD_CODE_LENGTH, cardCodeProblem } from '../validation';
import { StepFrame } from './step-frame';

/** The bank's one-time code. It goes from the boxes into one request and is kept nowhere. */
export function CardCodeStep() {
  const { state, actions, meta } = useBusinessFlow();
  const { confirmCard: request, resendCardCode: resend } = meta.requests;
  const code = useStepField({ problemOf: cardCodeProblem, onValid: actions.confirmCard, refusal: forField(request.feedback, 'code') });
  const card = state.payment?.card;
  const sums = state.quote.value;
  const sentTo = state.payment?.sentTo ?? m.bankPhone;

  return (
    <StepFrame
      title={m.cardCodeTitle}
      lede={sums && !sums.trial ? m.cardCodeLede(sentTo, m.money(sums.dueToday)) : m.cardCodeLedeTrial(sentTo)}
      requests={[request, resend]}
      next={{ resend: { label: m.sendNewCode, onPress: actions.resendCardCode } }}
      lead={card ? <PaymentCardChip brand={card.brand ?? undefined} lastFour={card.lastFour} label={m.cardEnding(card.brand, card.lastFour)} /> : undefined}
    >
      <FlowStep.Form onSubmit={code.submit}>
        <FlowStep.Body>
          <CodeInput label={m.cardCodeLabel} length={CARD_CODE_LENGTH} value={code.value} onChange={code.change} error={code.error} inputRef={code.inputRef} />
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary" isPending={request.isPending} pendingLabel={m.confirming}>
            {m.confirm}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
      <FlowStep.Links>
        <ResendLink request={resend} onPress={actions.resendCardCode} label={m.sendNewCode} waitLabel={m.sendNewCodeIn} pendingLabel={m.sending} />
        <FlowButton variant="link" onPress={actions.useDifferentCard} isDisabled={request.isPending}>
          {m.differentCard}
        </FlowButton>
      </FlowStep.Links>
    </StepFrame>
  );
}

import { FlowButton, FlowStep, FlowTextField } from '@yahel/ui';
import { useStepField } from '../../../flow/use-step-field';
import { useBusinessFlow } from '../business-flow';
import { domainClaimedBanner, refusalFor } from '../feedback';
import { businessMessages as m } from '../messages';
import { domainProblem, normaliseDomain } from '../validation';
import { StepFrame } from './step-frame';

export function DomainStep() {
  const { state, actions, meta } = useBusinessFlow();
  const request = meta.requests.checkDomain;
  const refusal = refusalFor(state.rejection, 'domain');
  const domain = useStepField({ initial: state.ownedDomain, problemOf: domainProblem, hasFormat: true, onValid: (value) => actions.checkDomain(normaliseDomain(value)), refusal });
  const claimed = refusal !== null && state.rejection?.reason === 'claimed';

  return (
    <StepFrame title={m.domainTitle} lede={m.domainLede} requests={[request]} feedback={claimed ? domainClaimedBanner : null}>
      <FlowStep.Form onSubmit={domain.submit}>
        <FlowStep.Body>
          <FlowTextField
            label={m.domainLabel}
            name="domain"
            inputMode="url"
            autoComplete="off"
            spellCheck="false"
            value={domain.value}
            onChange={domain.change}
            onBlur={domain.blur}
            isValid={domain.isValid}
            success={domain.isValid ? m.domainLooksGood : null}
            error={domain.error}
            inputRef={domain.inputRef}
            isRequired
          />
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary" isPending={request.isPending} pendingLabel={m.checking}>
            {m.continue}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
      {meta.offers.domainsForSale ? (
        <FlowStep.Links>
          <FlowButton variant="link" onPress={actions.buyInstead}>
            {m.buyInstead}
          </FlowButton>
        </FlowStep.Links>
      ) : null}
    </StepFrame>
  );
}

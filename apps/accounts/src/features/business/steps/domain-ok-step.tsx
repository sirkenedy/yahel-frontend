import { FlowButton, FlowPreview, FlowStep } from '@yahel/ui';
import { useBusinessFlow } from '../business-flow';
import { businessMessages as m } from '../messages';
import { StepFrame } from './step-frame';

export function DomainOkStep() {
  const { state, actions, meta } = useBusinessFlow();

  return (
    <StepFrame title={m.domainOkTitle(state.businessName)} lede={m.domainOkLede}>
      <FlowStep.Body>
        <FlowPreview label={m.teamAddresses} tag={m.yourDomain} lead={m.anyone}>
          {state.ownedDomain}
        </FlowPreview>
      </FlowStep.Body>
      <FlowStep.Actions>
        <FlowButton variant="primary" onPress={actions.confirmDomain}>
          {m.useThisDomain}
        </FlowButton>
      </FlowStep.Actions>
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

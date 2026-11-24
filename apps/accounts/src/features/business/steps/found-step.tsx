import { FlowButton, FlowCallout, FlowFacts, FlowIcon, FlowStep } from '@yahel/ui';
import { useBusinessFlow } from '../business-flow';
import { businessMessages as m } from '../messages';
import { StepFrame } from './step-frame';

/** The domain picked, held while sign-up finishes: what it gives the team, when it is paid for, and who registers it. */
export function FoundStep() {
  const { state, actions } = useBusinessFlow();
  const offer = state.bought;
  if (!offer) return null;

  return (
    <StepFrame title={m.foundTitle(offer.domain)} lede={m.foundLede}>
      <FlowStep.Body>
        <FlowCallout icon={<FlowIcon name="globe" />} title={offer.domain} tag={m.available}>
          {m.perYear(m.money(offer.yearly))}
        </FlowCallout>
        <FlowFacts>
          <FlowFacts.Item icon="mail" lead={m.foundTeamLead(offer.domain)}>
            {m.foundTeam}
          </FlowFacts.Item>
          <FlowFacts.Item icon="cart" lead={m.foundBuyLead}>
            {m.foundBuy}
          </FlowFacts.Item>
          <FlowFacts.Item icon="shield" lead={m.foundRegistrarLead}>
            {m.foundRegistrar}
          </FlowFacts.Item>
        </FlowFacts>
      </FlowStep.Body>
      <FlowStep.Actions>
        <FlowButton variant="primary" onPress={actions.continueWithDomain}>
          {m.continue}
        </FlowButton>
      </FlowStep.Actions>
      <FlowStep.Links>
        <FlowButton variant="link" onPress={actions.ownInstead}>
          {m.ownInsteadLong}
        </FlowButton>
      </FlowStep.Links>
    </StepFrame>
  );
}

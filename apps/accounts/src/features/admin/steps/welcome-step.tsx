import { FlowButton, FlowFacts, FlowStep } from '@yahel/ui';
import type { ReactNode } from 'react';
import { useAdminFlow } from '../admin-flow';
import { adminMessages as m } from '../messages';
import { StepFrame } from './step-frame';

/** An agreement by name, linked where its address is known. */
const named = (name: string, href: string | null): ReactNode =>
  href ? (
    <FlowStep.NoteLink href={href} newTabLabel={m.opensInNewTab}>
      {name}
    </FlowStep.NoteLink>
  ) : (
    name
  );

/** What being an administrator means, said once before Admin opens. */
export function WelcomeStep() {
  const { state, actions, meta } = useAdminFlow();
  const { links } = meta;

  return (
    <StepFrame title={m.welcomeTitle}>
      <FlowStep.Body>
        <FlowFacts>
          <FlowFacts.Item icon="building" lead={m.welcomeBelongs(state.address ?? '', state.organisation ?? m.yourOrganisation)}>
            {m.welcomeDecide}
          </FlowFacts.Item>
          <FlowFacts.Item icon="people" lead={m.welcomeManage(state.domain ?? '')}>
            {m.welcomeManageDetail}
          </FlowFacts.Item>
          <FlowFacts.Item icon="eye" lead={m.welcomeTeam}>
            {m.welcomeTeamDetail}
          </FlowFacts.Item>
          <FlowFacts.Item icon="shield" lead={m.welcomeAgreement}>
            {m.welcomeAgreementCovered}
            {named(m.businessAgreement, links.businessTerms)}
            {m.andOur}
            {named(m.privacyPolicy, links.privacy)}.
          </FlowFacts.Item>
        </FlowFacts>
      </FlowStep.Body>
      <FlowStep.Actions>
        <FlowButton variant="primary" onPress={actions.understand}>
          {m.understand}
        </FlowButton>
      </FlowStep.Actions>
    </StepFrame>
  );
}

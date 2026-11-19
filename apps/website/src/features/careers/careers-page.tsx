import { LinkButton, Reveal, RevealGroup, SegmentedTabs } from '@yahel/ui';
import { careersMessages as m } from './messages';
import { RoleList } from './role-list';
import { openRoles } from './roles';
import type { Team } from './roles';

const teamTabs = [{ id: 'all', label: m.allTeams }, ...(Object.keys(m.teams) as Team[]).map((team) => ({ id: team, label: m.teams[team] }))] as const;

export function CareersPage() {
  return (
    <>
      <title>{m.documentTitle}</title>
      <RevealGroup as="section" className="site-container site-hero">
        <Reveal as="p" className="ws-eyebrow">
          {m.eyebrow}
        </Reveal>
        <Reveal as="h1" className="ws-display-xl">
          {m.title}
        </Reveal>
        <Reveal as="p" className="ws-lead site-measure">
          {m.lead}
        </Reveal>
        <Reveal>
          <LinkButton href="#roles" size="large">
            {m.rolesAction}
          </LinkButton>
        </Reveal>
      </RevealGroup>

      <section className="site-section site-section--surface">
        <div className="site-container site-stack">
          <Reveal as="h2" className="ws-display-l site-heading">
            {m.workTitle}
          </Reveal>
          <RevealGroup className="site-points">
            {m.work.map((item) => (
              <Reveal key={item.title} className="site-point">
                <h3 className="ws-display-heading">{item.title}</h3>
                <p className="ws-secondary">{item.text}</p>
              </Reveal>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section id="roles" className="site-section">
        <RevealGroup className="site-container careers-open">
          <Reveal as="h2" className="ws-display-l">
            {m.rolesTitle}
          </Reveal>
          <Reveal>
            <SegmentedTabs label={m.teamsLabel} tabs={teamTabs}>
              {(team) => <RoleList roles={team === 'all' ? openRoles : openRoles.filter((role) => role.team === team)} />}
            </SegmentedTabs>
          </Reveal>
          <Reveal as="p" className="ws-secondary">
            {m.contact}
          </Reveal>
        </RevealGroup>
      </section>
    </>
  );
}

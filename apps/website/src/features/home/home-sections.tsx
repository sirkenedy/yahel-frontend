import { LinkButton, Reveal, RevealGroup } from '@yahel/ui';
import { homeMessages as m } from './messages';

function Points({ points }: { points: readonly string[] }) {
  return (
    <ul className="ws-ticks">
      {points.map((point) => (
        <li key={point}>{point}</li>
      ))}
    </ul>
  );
}

/** Who it is for: yourself, or your organisation. Each card carries its own action. */
export function HomeAccounts({ signInUrl }: { signInUrl: string }) {
  const { personal, business } = m.accounts;
  return (
    <section id="accounts" className="site-section">
      <div className="site-container site-stack">
        <Reveal className="home-intro">
          <p className="ws-eyebrow">{m.accounts.eyebrow}</p>
          <h2 className="ws-display-l">{m.accounts.title}</h2>
          <p className="ws-lead">{m.accounts.lead}</p>
        </Reveal>
        <RevealGroup className="home-accounts">
          <Reveal>
            <div className="home-account home-lift">
              <span className="home-account__avatar" aria-hidden="true">
                {personal.initials}
              </span>
              <h3 className="ws-display-title">{personal.title}</h3>
              <p className="home-account__text">{personal.text}</p>
              <Points points={personal.points} />
              <LinkButton href={signInUrl}>{personal.action}</LinkButton>
            </div>
          </Reveal>
          <Reveal>
            <div className="home-account home-account--inverse home-lift">
              <span className="home-account__avatar" aria-hidden="true">
                {business.initials}
              </span>
              <h3 className="ws-display-title">{business.title}</h3>
              <p className="home-account__text">{business.text}</p>
              <Points points={business.points} />
              <LinkButton href={signInUrl} variant="inverse">
                {business.action}
              </LinkButton>
            </div>
          </Reveal>
        </RevealGroup>
      </div>
    </section>
  );
}

/** Whether it is safe. */
export function HomeSecurity() {
  return (
    <section id="security" className="site-section site-section--surface">
      <div className="site-container site-stack">
        <Reveal className="home-intro">
          <p className="ws-eyebrow">{m.security.eyebrow}</p>
          <h2 className="ws-display-l">{m.security.title}</h2>
        </Reveal>
        <RevealGroup className="site-points">
          {m.security.points.map((point) => (
            <Reveal key={point.title} className="site-point">
              <h3 className="ws-display-heading">{point.title}</h3>
              <p className="ws-secondary">{point.text}</p>
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

/** What it costs. Prices and storage that are not decided stay as marked placeholders. */
export function HomePlans() {
  return (
    <section id="plans" className="site-section">
      <div className="site-container site-stack">
        <Reveal className="home-intro">
          <p className="ws-eyebrow">{m.plans.eyebrow}</p>
          <h2 className="ws-display-l">{m.plans.title}</h2>
        </Reveal>
        <RevealGroup className="home-plans">
          {m.plans.plans.map((plan) => (
            <Reveal key={plan.name} className="home-plan">
              <h3 className="home-plan__name">{plan.name}</h3>
              <p className="ws-display-l">{plan.price}</p>
              <p className="ws-secondary">{plan.text}</p>
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

export function HomeClosing({ signInUrl }: { signInUrl: string }) {
  return (
    <section className="site-container site-band-section">
      <Reveal className="site-band home-band">
        <h2 className="ws-display-l site-heading">{m.closing.title}</h2>
        <LinkButton href={signInUrl} variant="inverse" size="large">
          {m.closing.action}
        </LinkButton>
      </Reveal>
    </section>
  );
}

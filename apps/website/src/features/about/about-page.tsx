import { LinkButton, Reveal, RevealGroup } from '@yahel/ui';
import { aboutMessages as m } from './messages';

export function AboutPage() {
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
      </RevealGroup>

      <section className="site-section site-section--surface">
        <div className="site-container site-stack">
          <Reveal as="h2" className="ws-display-l site-heading">
            {m.valuesTitle}
          </Reveal>
          <RevealGroup className="about-values">
            {m.values.map((value) => (
              <Reveal key={value.title} className="about-value">
                <h3 className="ws-display-heading">{value.title}</h3>
                <p className="ws-secondary">{value.text}</p>
              </Reveal>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section className="site-section">
        <RevealGroup className="site-container about-cards">
          <Reveal className="about-card">
            <h2 className="ws-display-title">{m.storyTitle}</h2>
            <p className="ws-secondary">{m.story}</p>
          </Reveal>
          <Reveal className="about-card">
            <h2 className="ws-display-title">{m.whereTitle}</h2>
            <p className="ws-secondary">{m.where}</p>
            <p className="ws-secondary">{m.contact}</p>
          </Reveal>
        </RevealGroup>
      </section>

      <section className="site-container site-band-section">
        <Reveal className="site-band">
          <h2 className="ws-display-l site-heading">{m.bandTitle}</h2>
          <LinkButton href="/careers" variant="inverse" size="large">
            {m.bandAction}
          </LinkButton>
        </Reveal>
      </section>
    </>
  );
}

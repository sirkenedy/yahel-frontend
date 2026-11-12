import { LinkButton, Reveal, RevealGroup } from '@yahel/ui';
import { homeMessages as m } from './messages';

export function HomeHero({ signInUrl }: { signInUrl: string }) {
  return (
    <RevealGroup as="section" className="site-container site-hero site-hero--centred">
      <title>{m.documentTitle}</title>
      <Reveal as="p" className="ws-eyebrow">
        {m.eyebrow}
      </Reveal>
      <Reveal as="h1" className="ws-display-xl">
        {m.title}
      </Reveal>
      <Reveal as="p" className="ws-lead site-measure">
        {m.lead}
      </Reveal>
      <Reveal className="site-actions">
        <LinkButton href={signInUrl} size="large">
          {m.createAccount}
        </LinkButton>
        <LinkButton href="#accounts" variant="plain" size="large">
          {m.business}
        </LinkButton>
      </Reveal>
    </RevealGroup>
  );
}

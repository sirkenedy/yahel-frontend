import { AppIcon, LinkButton, Reveal, RevealGroup } from '@yahel/ui';
import type { AppIconName } from '@yahel/ui';
import { HeroWindow } from './hero-window';
import type { HomeProduct, SectionLink } from './home-types';
import { homeMessages as m } from './messages';

export interface HomeHeroProps {
  signInUrl: string;
  products: readonly HomeProduct[];
  /** Shows a product in the Products section and moves focus there. */
  onPickProduct: (id: AppIconName) => void;
  productsLink: SectionLink;
  accountsLink: SectionLink;
}

// The four blocks of text come first; the icons follow them one stagger step apart, and the window arrives with the first icon.
const blocksBeforeIcons = 4;

export function HomeHero({ signInUrl, products, onPickProduct, productsLink, accountsLink }: HomeHeroProps) {
  return (
    <RevealGroup as="section" className="site-container site-hero site-hero--centred home-hero">
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
        <LinkButton {...accountsLink} variant="plain" size="large">
          {m.business}
        </LinkButton>
      </Reveal>
      <ul className="home-dock" aria-label={m.dockLabel}>
        {products.map((product, position) => (
          <Reveal as="li" key={product.id} variant="pop" index={blocksBeforeIcons + position}>
            <a
              {...productsLink}
              href={productsLink.href}
              className="home-dock__icon home-lift"
              aria-label={product.name}
              onClick={(event) => {
                onPickProduct(product.id);
                productsLink.onClick?.(event);
              }}
            >
              <AppIcon app={product.id} />
            </a>
          </Reveal>
        ))}
      </ul>
      <Reveal eager className="home-window-frame" index={blocksBeforeIcons}>
        <HeroWindow />
      </Reveal>
    </RevealGroup>
  );
}

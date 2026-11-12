import { AppIcon, LinkButton, Reveal, SegmentedTabs } from '@yahel/ui';
import type { AppIconName } from '@yahel/ui';
import { useEffect, useRef } from 'react';
import type { HomeProduct, SectionLink } from './home-types';
import { homeMessages } from './messages';

const m = homeMessages.products;

export interface HomeProductsProps {
  products: readonly HomeProduct[];
  selectedId: AppIconName;
  /** Rises each time a product is picked from elsewhere on the site. The selected tab then takes focus. */
  picks: number;
  onSelect: (id: AppIconName) => void;
  productsLink: SectionLink;
}

function ProductPanel({ product, productsLink }: { product: HomeProduct; productsLink: SectionLink }) {
  return (
    <div className="home-product" data-product={product.id}>
      <div className="home-product__text">
        <span className="home-product__icon">
          <AppIcon app={product.id} />
        </span>
        <h3 className="ws-display-title">{product.name}</h3>
        <p className="ws-lead home-product__line">{product.line}</p>
        {/* The product addresses do not exist yet: until they do, the link stays on this section. */}
        <LinkButton {...productsLink} variant="plain" size="large">
          {m.open(product.host)}
        </LinkButton>
      </div>
      <div className="home-mock" aria-hidden="true">
        <p className="home-mock__bar">{product.host}</p>
        <div className="home-mock__body">
          <div className="home-mock__side">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="home-mock__main">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomeProducts({ products, selectedId, picks, onSelect, productsLink }: HomeProductsProps) {
  const selectedTab = useRef<HTMLDivElement>(null);
  const answered = useRef(picks);

  // The link that picked the product brings the section into view; focus follows without scrolling a second time.
  // The tabs redraw once more after this render, so the newly selected tab is there to focus a frame later.
  useEffect(() => {
    if (picks === answered.current) return;
    answered.current = picks;
    const frame = requestAnimationFrame(() => selectedTab.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [picks]);

  return (
    <section id="products" className="site-section site-section--surface home-products">
      <div className="site-container site-stack">
        <Reveal className="home-intro">
          <p className="ws-eyebrow">{m.eyebrow}</p>
          <h2 className="ws-display-l">{m.title}</h2>
          <p className="ws-lead">{m.lead}</p>
        </Reveal>
        <Reveal index={1}>
          <SegmentedTabs
            label={m.tabsLabel}
            tabs={products.map((product) => ({ id: product.id, label: product.name, marker: <span className="home-dot" data-product={product.id} aria-hidden="true" /> }))}
            selectedId={selectedId}
            onSelectionChange={onSelect}
            selectedTabRef={selectedTab}
          >
            {(id) => <ProductPanel product={products.find((product) => product.id === id)!} productsLink={productsLink} />}
          </SegmentedTabs>
        </Reveal>
      </div>
    </section>
  );
}

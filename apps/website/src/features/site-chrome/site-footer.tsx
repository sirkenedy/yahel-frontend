import { Link, useLocation } from '@tanstack/react-router';
import { useId } from 'react';
import type { ReactNode } from 'react';
import type { ChromeProduct, ProductLinksProps } from './chrome-types';
import { chromeMessages as m } from './messages';
import { SectionLink } from './section-link';

// Products fill two columns: the first five, then the rest.
const firstColumn = 5;

function Column({ title, children }: { title: string; children: ReactNode[] }) {
  const titleId = useId();
  return (
    <div className="site-footer__column">
      <h2 id={titleId} className="site-footer__title">
        {title}
      </h2>
      <ul aria-labelledby={titleId}>
        {children.map((link, position) => (
          <li key={position}>{link}</li>
        ))}
      </ul>
    </div>
  );
}

/** The home page's footer: every product, the company's pages, and where trust is explained. */
function FullFooter({ products, onPickProduct }: ProductLinksProps) {
  const productLink = (product: ChromeProduct) => (
    <SectionLink key={product.id} hash="products" onChoose={() => onPickProduct(product.id)}>
      {product.name}
    </SectionLink>
  );
  return (
    <footer className="site-footer site-footer--full">
      <div className="site-container">
        <nav className="site-footer__columns" aria-label={m.footerLabel}>
          <Column title={m.footerProducts}>{products.slice(0, firstColumn).map(productLink)}</Column>
          <Column title={m.footerMoreProducts}>{products.slice(firstColumn).map(productLink)}</Column>
          <Column title={m.footerCompany}>
            {[
              <Link to="/about">{m.about}</Link>,
              <Link to="/careers">{m.careers}</Link>,
              <SectionLink hash="plans">{m.plans}</SectionLink>,
            ]}
          </Column>
          {/* Privacy, Terms and Help have no pages yet: they stay as placeholders that lead to the top of the page. */}
          <Column title={m.footerTrust}>
            {[
              <SectionLink hash="security">{m.security}</SectionLink>,
              <SectionLink hash="top">{m.privacy}</SectionLink>,
              <SectionLink hash="top">{m.terms}</SectionLink>,
              <SectionLink hash="top">{m.help}</SectionLink>,
            ]}
          </Column>
        </nav>
        <div className="site-footer__row">
          <span>{m.copyright}</span>
          <span>{m.language}</span>
        </div>
      </div>
    </footer>
  );
}

export function SiteFooter({ products, onPickProduct }: ProductLinksProps) {
  const isHome = useLocation({ select: (location) => location.pathname === '/' });
  if (isHome) return <FullFooter products={products} onPickProduct={onPickProduct} />;
  return (
    <footer className="site-footer">
      <div className="site-container site-footer__row">
        <span>{m.copyright}</span>
        <nav className="site-footer__links" aria-label={m.footerLabel}>
          <Link to="/" activeOptions={{ exact: true }}>
            {m.home}
          </Link>
          <Link to="/about">{m.about}</Link>
          <Link to="/careers">{m.careers}</Link>
          <a href="#top">{m.privacy}</a>
          <a href="#top">{m.terms}</a>
        </nav>
      </div>
    </footer>
  );
}

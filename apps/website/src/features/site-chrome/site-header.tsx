import { Link, useLinkProps, useLocation } from '@tanstack/react-router';
import markUrl from '@yahel/ui/assets/logo/mark.svg';
import { AppIcon, LinkButton, NavMenu, SiteBar, SiteMenu } from '@yahel/ui';
import type { ProductLinksProps } from './chrome-types';
import { chromeMessages as m } from './messages';
import { SectionLink } from './section-link';

function PageLinks({ onChoose }: { onChoose?: () => void }) {
  return (
    <>
      <Link to="/about" onClick={onChoose}>
        {m.about}
      </Link>
      <Link to="/careers" onClick={onChoose}>
        {m.careers}
      </Link>
    </>
  );
}

function Links({ onChoose }: { onChoose?: () => void }) {
  return (
    <>
      <Link to="/" hash="products" activeOptions={{ exact: true, includeHash: true }} onClick={onChoose}>
        {m.products}
      </Link>
      <PageLinks onChoose={onChoose} />
    </>
  );
}

/** On the home page the bar also leads to the page's own sections. */
function HomeSectionLinks({ onChoose }: { onChoose?: () => void }) {
  return (
    <>
      <SectionLink hash="accounts" onChoose={onChoose}>
        {m.forBusiness}
      </SectionLink>
      <SectionLink hash="security" onChoose={onChoose}>
        {m.security}
      </SectionLink>
      <SectionLink hash="plans" onChoose={onChoose}>
        {m.plans}
      </SectionLink>
      <PageLinks onChoose={onChoose} />
    </>
  );
}

function ProductsMenu({ products, onPickProduct }: ProductLinksProps) {
  return (
    <NavMenu label={m.products} fallback={<SectionLink hash="products">{m.products}</SectionLink>}>
      {(close) =>
        products.map((product) => (
          <SectionLink
            key={product.id}
            hash="products"
            onChoose={() => {
              onPickProduct(product.id);
              close();
            }}
          >
            <AppIcon app={product.id} />
            <span className="ws-nav-menu__name">{product.name}</span>
            <span className="ws-nav-menu__detail">{product.host}</span>
          </SectionLink>
        ))
      }
    </NavMenu>
  );
}

// The mark goes home but is not a page in the navigation: only a link in the list may be marked as the current page.
function Brand() {
  const link = useLinkProps({ to: '/' });
  return (
    <a {...link} aria-label={m.homeLabel} aria-current={undefined}>
      <img src={markUrl} alt="" />
      {m.brand}
    </a>
  );
}

export function SiteHeader({ signInUrl, products, onPickProduct }: { signInUrl: string } & ProductLinksProps) {
  const isHome = useLocation({ select: (location) => location.pathname === '/' });
  return (
    <SiteBar
      brand={<Brand />}
      navLabel={m.navLabel}
      nav={
        isHome ? (
          <>
            <ProductsMenu products={products} onPickProduct={onPickProduct} />
            <HomeSectionLinks />
          </>
        ) : (
          <Links />
        )
      }
      wideAction={isHome ? <a href={signInUrl}>{m.signIn}</a> : undefined}
      action={<LinkButton href={signInUrl}>{m.createAccount}</LinkButton>}
      menu={
        <SiteMenu label={m.menu} closeLabel={m.closeMenu} errorLabel={m.menuFailed}>
          {(close) => (
            <>
              {isHome ? (
                <>
                  <SectionLink hash="products" onChoose={close}>
                    {m.products}
                  </SectionLink>
                  <HomeSectionLinks onChoose={close} />
                </>
              ) : (
                <Links onChoose={close} />
              )}
              <a href={signInUrl}>{m.signIn}</a>
            </>
          )}
        </SiteMenu>
      }
    />
  );
}

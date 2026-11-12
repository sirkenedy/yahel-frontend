import { Link, useLinkProps, useLocation } from '@tanstack/react-router';
import markUrl from '@yahel/ui/assets/logo/mark.svg';
import { LinkButton, SiteBar, SiteMenu } from '@yahel/ui';
import { chromeMessages as m } from './messages';

function Links({ onChoose }: { onChoose?: () => void }) {
  return (
    <>
      <Link to="/" hash="products" activeOptions={{ exact: true, includeHash: true }} onClick={onChoose}>
        {m.products}
      </Link>
      <Link to="/about" onClick={onChoose}>
        {m.about}
      </Link>
      <Link to="/careers" onClick={onChoose}>
        {m.careers}
      </Link>
    </>
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

export function SiteHeader({ signInUrl }: { signInUrl: string }) {
  const isHome = useLocation({ select: (location) => location.pathname === '/' });
  return (
    <SiteBar
      brand={<Brand />}
      navLabel={m.navLabel}
      nav={<Links />}
      wideAction={isHome ? <a href={signInUrl}>{m.signIn}</a> : undefined}
      action={<LinkButton href={signInUrl}>{m.createAccount}</LinkButton>}
      menu={
        <SiteMenu label={m.menu} closeLabel={m.closeMenu} errorLabel={m.menuFailed}>
          {(close) => (
            <>
              <Links onChoose={close} />
              <a href={signInUrl}>{m.signIn}</a>
            </>
          )}
        </SiteMenu>
      }
    />
  );
}

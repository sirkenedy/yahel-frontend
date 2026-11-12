import { Link, useLocation } from '@tanstack/react-router';
import markUrl from '@yahel/ui/assets/logo/mark.svg';
import { LinkButton, SiteBar, SiteMenu } from '@yahel/ui';
import { chromeMessages as m } from './messages';

const careersPath = '/careers';

function Links({ onChoose }: { onChoose?: () => void }) {
  return (
    <>
      <Link to="/" hash="products" activeOptions={{ exact: true, includeHash: true }} onClick={onChoose}>
        {m.products}
      </Link>
      <Link to="/about" onClick={onChoose}>
        {m.about}
      </Link>
      <a href={careersPath} onClick={onChoose}>
        {m.careers}
      </a>
    </>
  );
}

export function SiteHeader({ signInUrl }: { signInUrl: string }) {
  const isHome = useLocation({ select: (location) => location.pathname === '/' });
  return (
    <SiteBar
      brand={
        <Link to="/" aria-label={m.homeLabel}>
          <img src={markUrl} alt="" />
          {m.brand}
        </Link>
      }
      navLabel={m.navLabel}
      nav={<Links />}
      wideAction={isHome ? <a href={signInUrl}>{m.signIn}</a> : undefined}
      action={<LinkButton href={signInUrl}>{m.createAccount}</LinkButton>}
      menu={
        <SiteMenu label={m.menu} closeLabel={m.closeMenu}>
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

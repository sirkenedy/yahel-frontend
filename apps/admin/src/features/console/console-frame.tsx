import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useRouter } from '@tanstack/react-router';
import type { AccountsApp, Session } from '@yahel/auth';
import { AccountMenu, Button, Card, FlowIcon } from '@yahel/ui';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { forgetAccountData } from './access';
import type { ConsoleWorkspace } from './access';
import { consoleMessages as m, menuMessages } from './messages';
import { accountsQuery, useAccountMenu } from './use-account-menu';
import { useTheme } from './use-theme';

export interface ConsoleFrameProps {
  session: Session;
  accountsApp: AccountsApp;
  /** The main app as the account in `slot`. */
  appHome: (slot: number) => string;
  workspace: ConsoleWorkspace;
  slot: string;
  children: ReactNode;
}

/** Admin's frame: the mark, the workspace, the theme switch and the account menu; a side navigation; the page. */
export function ConsoleFrame({ session, accountsApp, appHome, workspace, slot, children }: ConsoleFrameProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme, toggle } = useTheme();
  const menu = useAccountMenu(session, {
    home: (next) => void navigate({ to: '/u/$slot', params: { slot: String(next) } }),
    manage: (next) => new URL('account', appHome(next)).href,
    signIn: () => window.location.assign(accountsApp.signIn()),
    addAccount: () => window.location.assign(accountsApp.addAccount()),
    signInTo: (handle) => window.location.assign(accountsApp.signInTo(handle)),
  });

  // Another tab signed this account out, or gave its slot to another account: drop what it cached and let the guard decide again.
  useEffect(
    () =>
      session.subscribe((event) => {
        if (event.type !== 'accounts-changed') forgetAccountData(queryClient);
        void queryClient.invalidateQueries({ queryKey: accountsQuery(session).queryKey }, { cancelRefetch: false });
        if (event.type !== 'accounts-changed') void router.invalidate();
      }),
    [session, queryClient, router],
  );

  return (
    <div className="console">
      <header className="console__bar ws-glass">
        <Link to="/u/$slot" params={{ slot }} className="console__brand" aria-label={m.home}>
          <img src="/favicon.svg" alt="" />
          <span>{m.brand}</span>
          <span className="console__product">{m.product}</span>
        </Link>
        <span className="console__workspace" title={m.workspace(workspace.name)}>
          {workspace.name}
        </span>
        <span className="grow" />
        <a className="console__app" href={appHome(Number(slot))}>
          {m.goToYahel}
        </a>
        <Button variant="plain" aria-label={theme === 'dark' ? m.switchToLight : m.switchToDark} onPress={toggle}>
          <FlowIcon name={theme === 'dark' ? 'sun' : 'moon'} />
        </Button>
        {menu ? <AccountMenu {...menu} labels={menuMessages} /> : null}
      </header>
      <div className="console__body">
        <nav className="console__nav" aria-label={m.navigation}>
          <Link to="/u/$slot" params={{ slot }} activeOptions={{ exact: true }} className="console__nav-item">
            <FlowIcon name="building" />
            {m.navHome}
          </Link>
          <Link to="/u/$slot/domains" params={{ slot }} className="console__nav-item">
            <FlowIcon name="globe" />
            {m.navDomains}
          </Link>
          <span className="console__nav-item" aria-disabled="true">
            <FlowIcon name="people" />
            {m.navUsers}
            <span className="ws-tag">{m.comingSoon}</span>
          </span>
        </nav>
        <main className="console__main">{children}</main>
      </div>
    </div>
  );
}

/** What Admin shows when it cannot tell who is signed in, or read the workspace: what happened and a retry. */
export function ConsoleError({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="console__failed">
      <Card className="stack" role="alert">
        <h1 className="ws-title-2">{m.failedTitle}</h1>
        <p>{m.failed}</p>
        <div className="row">
          <Button variant="primary" onPress={onRetry}>
            {m.tryAgain}
          </Button>
        </div>
      </Card>
    </main>
  );
}

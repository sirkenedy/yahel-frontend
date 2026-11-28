import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useRouter, useRouterState } from '@tanstack/react-router';
import { forgetAccountData, refreshAccounts } from '@yahel/auth';
import type { AccountsApp, Session } from '@yahel/auth';
import { AccountMenu, AdminMark, ConsoleNav, ConsoleNavFooter, ConsoleSearch, ConsoleShell, FlowButton, FlowIcon, FlowLink, FlowToast } from '@yahel/ui';
import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { dismissToast, useToast } from '../../toast';
import type { ConsoleWorkspace } from './access';
import { consoleMessages as m, menuMessages } from './messages';
import { navIdOf, navItems, navPages } from './nav-tree';
import { useAccountMenu } from './use-account-menu';
import { useTheme } from './use-theme';

export interface ConsoleLinks {
  /** The main app as the account in `slot`. */
  appHome: (slot: number) => string;
  helpUrl: string | null;
  feedbackUrl: string | null;
  privacyUrl: string | null;
  termsUrl: string | null;
}

export interface ConsoleFrameProps {
  session: Session;
  accountsApp: AccountsApp;
  links: ConsoleLinks;
  workspace: ConsoleWorkspace;
  slot: string;
  children: ReactNode;
}

/** Admin's frame: the bar (menu, mark, search, help, theme, account), the side menu, the page and its toast. */
export function ConsoleFrame({ session, accountsApp, links, workspace, slot, children }: ConsoleFrameProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const toast = useToast();
  const { theme, toggle } = useTheme();
  const items = useMemo(() => navItems(slot), [slot]);
  const pages = useMemo(() => navPages(slot), [slot]);
  const menu = useAccountMenu(session, {
    home: (next) => void navigate({ to: '/u/$slot', params: { slot: String(next) } }),
    manage: (next) => new URL('account', links.appHome(next)).href,
    signIn: () => window.location.assign(accountsApp.signIn()),
    addAccount: () => window.location.assign(accountsApp.addAccount()),
    signInTo: (handle) => window.location.assign(accountsApp.signInTo(handle)),
  });

  // Another tab signed this account out, or gave its slot to another account: drop what it cached and let the guard decide again.
  useEffect(
    () =>
      session.subscribe((event) => {
        if (event.type === 'accounts-changed') {
          void refreshAccounts(queryClient);
          return;
        }
        forgetAccountData(queryClient);
        void router.invalidate();
      }),
    [session, queryClient, router],
  );

  const legal = links.privacyUrl || links.termsUrl;
  const footer =
    links.feedbackUrl || legal ? (
      <ConsoleNavFooter hideLabel={m.footHide} showLabel={m.footShow}>
        {links.feedbackUrl ? (
          <a className="ws-console-nav__item" href={links.feedbackUrl}>
            <FlowIcon name="mail" />
            <span className="ws-console-nav__label">{m.feedback}</span>
          </a>
        ) : null}
        <p className="ws-console-nav__legal">
          {m.copyright(new Date().getFullYear())}
          {links.termsUrl ? (
            <>
              <br />
              <a href={links.termsUrl}>{m.terms}</a>
            </>
          ) : null}
          {links.privacyUrl ? (
            <>
              {links.termsUrl ? ' · ' : <br />}
              <a href={links.privacyUrl}>{m.privacy}</a>
            </>
          ) : null}
        </p>
      </ConsoleNavFooter>
    ) : null;

  return (
    <ConsoleShell
      labels={{ skip: m.skip, showMenu: m.showMenu, hideMenu: m.hideMenu }}
      brand={
        <FlowLink href={`/u/${slot}/`} variant="link" aria-label={m.home}>
          <AdminMark label={m.brand} word={m.word} product={m.product} />
        </FlowLink>
      }
      search={<ConsoleSearch label={m.search} placeholder={m.searchPlaceholder} emptyLabel={m.searchEmpty} items={pages} onSelect={(id) => void router.navigate({ href: pages.find((page) => page.id === id)?.href ?? `/u/${slot}/` })} />}
      actions={
        <>
          {links.helpUrl ? (
            <FlowLink href={links.helpUrl} variant="round" aria-label={m.help}>
              <FlowIcon name="help" />
            </FlowLink>
          ) : null}
          <FlowButton variant="round" aria-label={theme === 'dark' ? m.switchToLight : m.switchToDark} onPress={toggle}>
            <FlowIcon name={theme === 'dark' ? 'sun' : 'moon'} />
          </FlowButton>
          {menu ? <AccountMenu {...menu} privacyHref={links.privacyUrl} termsHref={links.termsUrl} labels={menuMessages} /> : null}
        </>
      }
      nav={({ collapsed, id, onExpand, onNavigate }) => (
        <ConsoleNav id={id} label={m.navigation} heading={workspace.name} items={items} currentId={navIdOf(pathname)} collapsed={collapsed} onExpand={onExpand} onNavigate={onNavigate} footer={footer} />
      )}
      toast={
        toast ? (
          <FlowToast key={toast.id} tone={toast.tone} closeLabel={m.toastClose} onClose={dismissToast}>
            {toast.text}
          </FlowToast>
        ) : null
      }
    >
      {children}
    </ConsoleShell>
  );
}

/** What Admin shows when it cannot tell who is signed in, or read the workspace: what happened and a retry. */
export function ConsoleError({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="ws-console console-failed">
      <div className="ws-console-empty" role="alert">
        <h1 className="ws-console-section-title">{m.failedTitle}</h1>
        <p>{m.failed}</p>
        <FlowButton variant="primary" onPress={onRetry}>
          {m.tryAgain}
        </FlowButton>
      </div>
    </main>
  );
}

/** While Admin checks who is signed in and reads the workspace. */
export function ConsoleLoading() {
  return (
    <div className="ws-console console-failed" role="status" aria-label={m.loading}>
      <div className="ws-skeleton app-loading__bar" />
    </div>
  );
}

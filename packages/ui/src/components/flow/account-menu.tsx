import { Button } from 'react-aria-components';
import { useEffect, useId, useRef, useState } from 'react';
import { AccountFace } from './account';
import type { AccountKind } from './account';
import { FlowIcon } from './flow-icon';

export interface AccountMenuAccount {
  /** Stable for the account in this browser: what the callbacks are given back. */
  id: string;
  name: string;
  email: string;
  kind: AccountKind;
  initials?: string | null;
  avatarUrl?: string | null;
  /** Under the address: the organisation, "Personal" or "Signed out". */
  status: string;
  signedIn: boolean;
}

export interface AccountMenuLabels {
  /** Names the avatar button, for example "Account: amara@yahel.com". */
  trigger: (email: string) => string;
  panel: string;
  signedInAs: string;
  manage: string;
  signOut: string;
  others: string;
  /** Read out before an account row's visible text, saying what pressing it does: "Switch to". */
  switchTo: string;
  signInTo: string;
  signOutOf: (email: string) => string;
  signIn: string;
  add: string;
  signOutAll: string;
  privacy: string;
  terms: string;
}

export interface AccountMenuProps {
  current: Omit<AccountMenuAccount, 'id' | 'status' | 'signedIn'> & { badge: string };
  others: AccountMenuAccount[];
  labels: AccountMenuLabels;
  manageHref: string | null;
  privacyHref?: string | null;
  termsHref?: string | null;
  /** While an action is under way the menu's actions ignore further presses. */
  isBusy?: boolean;
  onSignOut: () => void;
  onPick: (id: string) => void;
  onSignOutOf: (id: string) => void;
  onAdd: () => void;
  onSignOutAll: () => void;
}

/**
 * The avatar at the top of a signed-in screen and the panel it opens: the account in use, the others in
 * this browser, and the ways to add, switch and sign out. Opening it moves focus to "Manage your account";
 * Escape closes it and returns focus to the avatar; a press outside closes it.
 */
export function AccountMenu({ current, others, labels, manageHref, privacyHref, termsHref, isBusy = false, onSignOut, onPick, onSignOutOf, onAdd, onSignOutAll }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const first = useRef<HTMLElement | null>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    first.current?.focus({ preventScroll: true });
    const outside = (event: PointerEvent | FocusEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  const then = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <div className="ws-flow-menu" ref={root}>
      <Button ref={trigger} className="ws-flow-menu__trigger" aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? panelId : undefined} onPress={() => setOpen(!open)}>
        <span className="ws-flow-hidden">{labels.trigger(current.email)}</span>
        <AccountFace name={current.name} email={current.email} kind={current.kind} initials={current.initials} avatarUrl={current.avatarUrl} size="small" />
      </Button>
      {open ? (
        <div id={panelId} className="ws-flow-menu__panel" role="dialog" aria-label={labels.panel}>
          <section className="ws-flow-menu__current" aria-label={labels.signedInAs}>
            <div className="ws-flow-menu__who">
              <AccountFace name={current.name} email={current.email} kind={current.kind} initials={current.initials} avatarUrl={current.avatarUrl} size="large" />
              <span className="ws-flow-menu__names">
                <span className="ws-flow-menu__name">{current.name}</span>
                <span className="ws-flow-menu__email" translate="no">
                  {current.email}
                </span>
                <span className="ws-flow-menu__badge">{current.badge}</span>
              </span>
            </div>
            <div className="ws-flow-menu__actions">
              {manageHref ? (
                <a ref={(node) => void (first.current = node)} className="ws-flow-menu__button ws-flow-menu__button--grow" href={manageHref}>
                  {labels.manage}
                </a>
              ) : null}
              <Button ref={(node) => void (manageHref ? null : (first.current = node))} className="ws-flow-menu__button" onPress={then(onSignOut)} isDisabled={isBusy}>
                {labels.signOut}
              </Button>
            </div>
          </section>
          {others.length > 0 ? (
            <>
              <h2 className="ws-flow-menu__heading">{labels.others}</h2>
              <ul className="ws-flow-menu__accounts">
                {others.map((account) => (
                  <li key={account.id} className="ws-flow-menu__account">
                    <Button className="ws-flow-menu__row" onPress={then(() => onPick(account.id))} isDisabled={isBusy}>
                      <span className="ws-flow-hidden">{account.signedIn ? labels.switchTo : labels.signInTo} </span>
                      <AccountFace name={account.name} email={account.email} kind={account.kind} initials={account.initials} avatarUrl={account.avatarUrl} presence={account.signedIn ? 'signed-in' : 'signed-out'} />
                      <span className="ws-flow-menu__names">
                        <span className="ws-flow-menu__row-name">{account.name}</span>
                        <span className="ws-flow-menu__email" translate="no">
                          {account.email}
                        </span>
                        <span className="ws-flow-menu__status">{account.status}</span>
                      </span>
                    </Button>
                    {account.signedIn ? (
                      <Button className="ws-flow-menu__pill" aria-label={labels.signOutOf(account.email)} onPress={() => onSignOutOf(account.id)} isDisabled={isBusy}>
                        {labels.signOut}
                      </Button>
                    ) : (
                      <span className="ws-flow-menu__hint" aria-hidden="true">
                        {labels.signIn}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <div className="ws-flow-menu__rule" />
          <Button className="ws-flow-menu__row ws-flow-menu__row--action" onPress={then(onAdd)} isDisabled={isBusy}>
            <span className="ws-flow-avatar ws-flow-avatar--tint" aria-hidden="true">
              <FlowIcon name="plus" />
            </span>
            {labels.add}
          </Button>
          <Button className="ws-flow-menu__row ws-flow-menu__row--action" onPress={then(onSignOutAll)} isDisabled={isBusy}>
            <span className="ws-flow-avatar ws-flow-avatar--outline" aria-hidden="true">
              <FlowIcon name="sign-out" />
            </span>
            {labels.signOutAll}
          </Button>
          {privacyHref || termsHref ? (
            <p className="ws-flow-menu__footer">
              {privacyHref ? <a href={privacyHref}>{labels.privacy}</a> : null}
              {privacyHref && termsHref ? <span aria-hidden="true">·</span> : null}
              {termsHref ? <a href={termsHref}>{labels.terms}</a> : null}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

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
  signedIn: boolean;
}

export interface AccountMenuLabels {
  /** Names the avatar button, for example "Account: amara@yahel.com". */
  trigger: (email: string) => string;
  panel: string;
  signedInAs: string;
  manage: string;
  signOut: string;
  /** Names the list of the other accounts. */
  others: string;
  showOthers: string;
  hideOthers: string;
  /** Read out before an account row's visible text, saying what pressing it does: "Switch to". */
  switchTo: string;
  signInTo: string;
  signOutOf: (email: string) => string;
  /** The tooltip on an account's sign-out button. */
  signOutThis: string;
  /** After the address of an account that is signed out. */
  signedOut: string;
  add: string;
  signOutAll: string;
  privacy: string;
  terms: string;
}

export interface AccountMenuProps {
  /** `badge` is left out while it is not yet known which kind of account this is, rather than guessed. */
  current: Omit<AccountMenuAccount, 'id' | 'signedIn'> & { badge?: string | null };
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
  const [othersShown, setOthersShown] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const first = useRef<HTMLElement | null>(null);
  const panelId = useId();
  const listId = useId();
  const hasOthers = others.length > 0;

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
              <AccountFace name={current.name} email={current.email} kind={current.kind} initials={current.initials} avatarUrl={current.avatarUrl} size="medium" />
              <span className="ws-flow-menu__names">
                <span className="ws-flow-menu__name">{current.name}</span>
                <span className="ws-flow-menu__email" translate="no" data-blurtext>
                  {current.email}
                </span>
                {current.badge ? <span className="ws-flow-menu__badge">{current.badge}</span> : null}
              </span>
              {hasOthers ? (
                <Button className="ws-flow-menu__toggle" aria-label={othersShown ? labels.hideOthers : labels.showOthers} aria-expanded={othersShown} aria-controls={othersShown ? listId : undefined} onPress={() => setOthersShown(!othersShown)}>
                  <span className="ws-flow-menu__glyph" title={othersShown ? labels.hideOthers : labels.showOthers}>
                    <FlowIcon name="chevron-down" />
                  </span>
                </Button>
              ) : null}
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
          {hasOthers && othersShown ? (
            <ul id={listId} className="ws-flow-menu__accounts" aria-label={labels.others}>
              {others.map((account) => (
                <li key={account.id} className="ws-flow-menu__account">
                  <Button className="ws-flow-menu__row ws-flow-menu__row--account" onPress={then(() => onPick(account.id))} isDisabled={isBusy}>
                    <span className="ws-flow-hidden">{account.signedIn ? labels.switchTo : labels.signInTo} </span>
                    <AccountFace name={account.name} email={account.email} kind={account.kind} initials={account.initials} avatarUrl={account.avatarUrl} size="small" presence={account.signedIn ? 'signed-in' : 'signed-out'} />
                    <span className="ws-flow-menu__names">
                      <span className="ws-flow-menu__row-name">{account.name}</span>
                      <span className="ws-flow-menu__line">
                        <span className="ws-flow-menu__email" translate="no" data-blurtext>
                          {account.email}
                        </span>
                        {account.signedIn ? null : <>
                            <span aria-hidden="true">·</span>
                            <span>{labels.signedOut}</span>
                          </>}
                      </span>
                    </span>
                  </Button>
                  {account.signedIn ? (
                    <Button className="ws-flow-menu__row-out" aria-label={labels.signOutOf(account.email)} onPress={() => onSignOutOf(account.id)} isDisabled={isBusy}>
                      <span className="ws-flow-menu__glyph" title={labels.signOutThis}>
                        <FlowIcon name="sign-out" />
                      </span>
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
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

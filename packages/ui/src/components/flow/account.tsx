import { Button } from 'react-aria-components';
import type { ReactNode, Ref } from 'react';
import { FlowIcon } from './flow-icon';

export type AccountKind = 'person' | 'organisation';

const personInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

// An organisation account is marked by its domain's initial in a rounded square: shape, not colour alone.
const initialsFor = (kind: AccountKind, name: string, email: string) =>
  kind === 'organisation' ? (email.split('@')[1] ?? email).charAt(0).toUpperCase() : personInitials(name) || email.charAt(0).toUpperCase();

/** Only a web address may become an image source: anything else from data is ignored (rulebook 4.3). */
const imageAddress = (url: string | null | undefined) => {
  if (!url) return null;
  try {
    return ['https:', 'http:'].includes(new URL(url).protocol) ? url : null;
  } catch {
    return null;
  }
};

export interface AccountFaceProps {
  name: string;
  email: string;
  kind?: AccountKind;
  /** The server's initials, used for a person in place of ones made from the name. */
  initials?: string | null;
  avatarUrl?: string | null;
  size?: 'small' | 'regular' | 'medium' | 'large';
  /** A green dot for an account that is signed in; a dimmed face for one that is not. */
  presence?: 'signed-in' | 'signed-out';
}

/** An account's picture, or its initials: a person's in a circle, an organisation's domain letter in a rounded square. */
export function AccountFace({ name, email, kind = 'person', initials, avatarUrl, size = 'regular', presence }: AccountFaceProps) {
  const image = imageAddress(avatarUrl);
  const letters = kind === 'person' && initials?.trim() ? initials.trim().slice(0, 2).toUpperCase() : initialsFor(kind, name, email);
  return (
    <span className={`ws-flow-face${presence === 'signed-out' ? ' ws-flow-face--away' : ''}`} aria-hidden="true">
      <span className={`ws-flow-avatar ws-flow-avatar--${kind}${size === 'regular' ? '' : ` ws-flow-avatar--${size}`}`} translate="no">
        {image ? <img className="ws-flow-avatar__image" src={image} alt="" referrerPolicy="no-referrer" /> : letters}
      </span>
      {presence === 'signed-in' ? <span className="ws-flow-face__presence" /> : null}
    </span>
  );
}

export interface AccountChipProps {
  email: string;
}

/** Shows which account the current step is about. */
export function AccountChip({ email }: AccountChipProps) {
  return (
    <div className="ws-flow-chip">
      <span className="ws-flow-avatar ws-flow-avatar--small" aria-hidden="true">
        {email.charAt(0).toUpperCase()}
      </span>
      <span className="ws-flow-chip__email" translate="no">
        {email}
      </span>
    </div>
  );
}

export interface AccountAvatarProps {
  name: string;
  /** Says whose account is in use, read in place of the initials: "Signed in as amara@yahel.com". */
  label: string;
}

/** The signed-in person's initials in the header, so every signed-in screen shows whose account it is. */
export function AccountAvatar({ name, label }: AccountAvatarProps) {
  return (
    <span className="ws-flow-avatar" translate="no">
      <span aria-hidden="true">{personInitials(name)}</span>
      <span className="ws-flow-hidden">{label}</span>
    </span>
  );
}

interface AccountListProps {
  /** Names the list, for example "Accounts on this device". */
  label: string;
  children: ReactNode;
}

function AccountListRoot({ label, children }: AccountListProps) {
  return (
    <ul className="ws-flow-accounts" aria-label={label}>
      {children}
    </ul>
  );
}

interface AccountListAccountProps {
  name: string;
  email: string;
  kind?: AccountKind;
  initials?: string | null;
  avatarUrl?: string | null;
  presence?: 'signed-in' | 'signed-out';
  /** Shown at the end of the row: "Personal", an organisation's name, "Signed out". */
  detail?: string;
  /** Read out before the row's visible text to say what pressing it does, for example "Switch to". */
  actionPrefix: string;
  onPress: () => void;
  isDisabled?: boolean;
  /** A control that sits after the row, such as "Remove". */
  children?: ReactNode;
}

function AccountListAccount({ name, email, kind = 'person', initials, avatarUrl, presence, detail, actionPrefix, onPress, isDisabled, children }: AccountListAccountProps) {
  return (
    <li className="ws-flow-accounts__item">
      <Button className="ws-flow-accounts__row" onPress={onPress} isDisabled={isDisabled}>
        <span className="ws-flow-hidden">{actionPrefix} </span>
        <AccountFace name={name} email={email} kind={kind} initials={initials} avatarUrl={avatarUrl} presence={presence} />
        <span className="ws-flow-accounts__who">
          <span className="ws-flow-accounts__name">{name}</span>
          <span className="ws-flow-accounts__email" translate="no">
            {email}
          </span>
        </span>
        {detail ? <span className="ws-flow-accounts__detail">{detail}</span> : null}
      </Button>
      {children}
    </li>
  );
}

interface AccountListActionProps {
  onPress: () => void;
  ref?: Ref<HTMLButtonElement>;
  children: ReactNode;
}

function AccountListAction({ onPress, ref, children }: AccountListActionProps) {
  return (
    <li className="ws-flow-accounts__item">
      <Button ref={ref} className="ws-flow-accounts__row ws-flow-accounts__row--action" onPress={onPress}>
        <span className="ws-flow-avatar ws-flow-avatar--outline" aria-hidden="true">
          <FlowIcon name="plus" />
        </span>
        {children}
      </Button>
    </li>
  );
}

/** The accounts known on this device, one row each, with a last row for anything else. */
export const AccountList = Object.assign(AccountListRoot, { Account: AccountListAccount, Action: AccountListAction });

export type { AccountListProps, AccountListAccountProps };

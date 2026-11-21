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
  /** Shown at the end of the row: "Personal", an organisation's name, "Signed out". */
  detail?: string;
  /** Read out before the row's visible text to say what pressing it does, for example "Continue as". */
  actionPrefix: string;
  onPress: () => void;
  isDisabled?: boolean;
  /** A control that sits after the row, such as "Remove". */
  children?: ReactNode;
}

function AccountListAccount({ name, email, kind = 'person', detail, actionPrefix, onPress, isDisabled, children }: AccountListAccountProps) {
  return (
    <li className="ws-flow-accounts__item">
      <Button className="ws-flow-accounts__row" onPress={onPress} isDisabled={isDisabled}>
        <span className="ws-flow-hidden">{actionPrefix} </span>
        <span className={`ws-flow-avatar ws-flow-avatar--${kind}`} aria-hidden="true">
          {initialsFor(kind, name, email)}
        </span>
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

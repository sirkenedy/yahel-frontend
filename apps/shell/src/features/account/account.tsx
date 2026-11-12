import type { Profile } from '@yahel/api-client';
import { Avatar, Card } from '@yahel/ui';

export const accountMessages = {
  homeTitle: 'Home',
  accountTitle: 'Account',
  personal: 'Personal',
  manage: 'Manage account',
  back: 'Back to home',
  signOut: 'Sign out',
  signingOut: 'Signing out',
  name: 'Name',
  email: 'Email',
  accountId: 'Account ID',
  notSet: 'Not set',
} as const;

export const displayName = (profile: Profile) =>
  profile.displayName?.trim() || [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.email;

export function ProfileSummary({ profile }: { profile: Profile }) {
  const name = displayName(profile);
  return (
    <div className="row">
      <Avatar name={name} src={profile.photo?.urls?.thumbnail ?? profile.photo?.url} />
      <div className="grow">
        <div className="ws-headline">{name}</div>
        <div className="ws-footnote ws-secondary">{profile.email}</div>
      </div>
      <span className="ws-tag ws-tag--accent">{accountMessages.personal}</span>
    </div>
  );
}

export function ProfileDetails({ profile }: { profile: Profile }) {
  const m = accountMessages;
  return (
    <Card>
      <dl className="details">
        <div>
          <dt>{m.name}</dt>
          <dd>{profile.displayName?.trim() || [profile.firstName, profile.lastName].filter(Boolean).join(' ') || m.notSet}</dd>
        </div>
        <div>
          <dt>{m.email}</dt>
          <dd>{profile.email}</dd>
        </div>
        <div>
          <dt>{m.accountId}</dt>
          <dd>{profile.globalId}</dd>
        </div>
      </dl>
    </Card>
  );
}

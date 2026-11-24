import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AccountFace, AccountList } from './account';
import { AccountMenu } from './account-menu';
import type { AccountMenuProps } from './account-menu';

const labels = {
  trigger: (email: string) => `Account: ${email}`,
  panel: 'Accounts',
  signedInAs: 'Signed in as',
  manage: 'Manage your account',
  signOut: 'Sign out',
  others: 'Other accounts on this device',
  switchTo: 'Switch to',
  signInTo: 'Sign in to',
  signOutOf: (email: string) => `Sign out of ${email}`,
  signIn: 'Sign in',
  add: 'Add another account',
  signOutAll: 'Sign out of all accounts',
  privacy: 'Privacy',
  terms: 'Terms',
};

const setup = (overrides: Partial<AccountMenuProps> = {}) => {
  const props: AccountMenuProps = {
    current: { name: 'Amara Okafor', email: 'amara.okafor@yahel.example', kind: 'person', badge: 'Personal account' },
    others: [
      { id: 'h-1', name: 'Amara Okafor', email: 'amara@northwind.example', kind: 'organisation', status: 'Northwind Studio', signedIn: true },
      { id: 'h-2', name: 'Tunde Bakare', email: 'tunde@yahel.example', kind: 'person', status: 'Signed out', signedIn: false },
    ],
    labels,
    manageHref: 'https://app.yahel.example/u/0/account',
    privacyHref: 'https://yahel.example/privacy',
    termsHref: 'https://yahel.example/terms',
    onSignOut: vi.fn(),
    onPick: vi.fn(),
    onSignOutOf: vi.fn(),
    onAdd: vi.fn(),
    onSignOutAll: vi.fn(),
    ...overrides,
  };
  render(
    <>
      <AccountMenu {...props} />
      <p>Outside</p>
    </>,
  );
  return props;
};

const open = () => userEvent.click(screen.getByRole('button', { name: 'Account: amara.okafor@yahel.example' }));

describe('AccountMenu', () => {
  it('opens on the avatar, focuses “Manage your account” and shows the account in use', async () => {
    setup();
    const trigger = screen.getByRole('button', { name: 'Account: amara.okafor@yahel.example' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await open();

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const panel = screen.getByRole('dialog', { name: 'Accounts' });
    expect(screen.getByRole('link', { name: 'Manage your account' })).toHaveFocus();
    expect(screen.getByRole('link', { name: 'Manage your account' })).toHaveAttribute('href', 'https://app.yahel.example/u/0/account');
    const current = within(panel).getByRole('region', { name: 'Signed in as' });
    expect(current).toHaveTextContent('Amara Okafor');
    expect(current).toHaveTextContent('Personal account');
    expect(within(panel).getByRole('heading', { name: 'Other accounts on this device' })).toBeInTheDocument();
    expect(within(panel).getByRole('link', { name: 'Privacy' })).toBeInTheDocument();
  });

  it('closes on Escape and gives focus back to the avatar, and closes on a press outside', async () => {
    setup();
    await open();
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Account: amara.okafor@yahel.example' })).toHaveFocus();

    await open();
    await userEvent.click(screen.getByText('Outside'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('switches to a signed-in account, offers a sign-in for a signed-out one, and signs another out in place', async () => {
    const props = setup();
    await open();

    await userEvent.click(screen.getByRole('button', { name: 'Sign out of amara@northwind.example' }));
    expect(props.onSignOutOf).toHaveBeenCalledWith('h-1');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign out of tunde@yahel.example' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: new RegExp(`^Sign in to.*tunde@yahel\\.example`) }));
    expect(props.onPick).toHaveBeenCalledWith('h-2');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await open();
    await userEvent.click(screen.getByRole('button', { name: new RegExp(`^Switch to.*amara@northwind\\.example`) }));
    expect(props.onPick).toHaveBeenLastCalledWith('h-1');
  });

  it('signs out, adds an account and signs out of all, closing as it goes', async () => {
    const props = setup();
    for (const [name, callback] of [
      ['Sign out', props.onSignOut],
      ['Add another account', props.onAdd],
      ['Sign out of all accounts', props.onSignOutAll],
    ] as const) {
      await open();
      await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: new RegExp(`^${name}$`) }));
      expect(callback).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    }
  });

  it('ignores presses while busy, and without a settings address focuses “Sign out” first', async () => {
    const props = setup({ isBusy: true, manageHref: null, others: [] });
    await open();

    expect(screen.queryByRole('link', { name: 'Manage your account' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Other accounts on this device' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Sign out of all accounts' }));
    expect(props.onSignOutAll).not.toHaveBeenCalled();
  });
});

describe('AccountFace', () => {
  it('shows a picture only from a web address, and the initials otherwise', () => {
    const { container, rerender } = render(<AccountFace name="Amara Okafor" email="amara@yahel.example" avatarUrl="https://cdn.yahel.example/a.png" />);
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://cdn.yahel.example/a.png');

    rerender(<AccountFace name="Amara Okafor" email="amara@yahel.example" avatarUrl="javascript:alert(1)" initials="ao" />);
    expect(container.querySelector('img')).toBeNull();
    expect(container).toHaveTextContent('AO');
  });

  it('marks an account in the chooser as signed in, or dims it as signed out', () => {
    render(
      <AccountList label="Accounts">
        <AccountList.Account name="Amara Okafor" email="amara@yahel.example" presence="signed-in" actionPrefix="Switch to" onPress={() => undefined} />
        <AccountList.Account name="Tunde Bakare" email="tunde@yahel.example" presence="signed-out" actionPrefix="Sign in to" onPress={() => undefined} />
      </AccountList>,
    );

    expect(screen.getByRole('button', { name: /^Switch to/ })).toHaveTextContent('AO');
    expect(screen.getByRole('button', { name: /^Sign in to/ })).toHaveTextContent('TB');
  });
});

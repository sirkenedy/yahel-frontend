import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dismissToast, useToast } from '../../toast';
import { actionMessages as a, personWords as w, roleWords as r, userMessages as m } from './messages';
import { admin, invited, member, owner, suspended, testSession } from './test-session';
import { UserPage } from './user-page';

const navigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }));

function Toast() {
  const toast = useToast();
  return toast ? <p role="status">{toast.text}</p> : null;
}

const kofi = member({ _id: 'm-5', globalIdentityId: 'g-5', ouPath: '/lagos', jobTitle: 'Operations lead' });

const show = (id: string, overrides: Record<string, unknown> = {}) => {
  const all = { update: vi.fn(async () => ({})), suspend: vi.fn(async () => ({})), reactivate: vi.fn(async () => ({})), remove: vi.fn(async () => null), resendInvite: vi.fn(async () => null), cancelInvite: vi.fn(async () => null), ...overrides };
  const { session, wrapper, api } = testSession([owner, admin, invited, suspended, kofi], all);
  render(
    <>
      <UserPage session={session} tenantId="t-1" memberId={id} slot="0" organisation="Northwind Studio" crumbs={[{ label: 'Users' }]} crumbsLabel="Breadcrumb" />
      <Toast />
    </>,
    { wrapper },
  );
  return api.tenants.members as typeof api.tenants.members & typeof all;
};

beforeEach(() => {
  dismissToast();
  navigate.mockReset();
});

describe('UserPage', () => {
  it('shows the person with their unit, role card and profile, and the parts that come later', async () => {
    show('m-5');
    expect(await screen.findByRole('heading', { level: 1, name: w.unnamed })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: m.unitChip('Lagos office') })).toBeInTheDocument();
    expect(screen.getByText(r.MEMBER.name)).toBeInTheDocument();
    expect(screen.getByText('Operations lead')).toBeInTheDocument();
    expect(screen.getByText(m.securityLater)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: a.signOut })).toBeDisabled();
  });

  it('names the signed-in administrator and keeps their own access locked with the reason', async () => {
    show('m-me');
    expect(await screen.findByRole('heading', { level: 1, name: 'Amara Okafor' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: m.removeUser })).toBeDisabled();
    expect(screen.getByText(new RegExp(a.why.owner))).toBeInTheDocument();
  });

  it('suspends after listing what it means', async () => {
    const api = show('m-5');
    await userEvent.click(await screen.findByRole('button', { name: a.suspend }));
    const dialog = screen.getByRole('alertdialog', { name: a.suspendDialog.title(a.thisPerson) });
    expect(dialog).toHaveTextContent(a.suspendDialog.points(null)[3]!);
    await userEvent.click(within(dialog).getByRole('button', { name: a.suspend }));
    expect(api.suspend).toHaveBeenCalledWith('t-1', 'm-5');
  });

  it('deletes only after the person ticks that nothing is handed over, then goes back to Users', async () => {
    const api = show('m-5');
    await userEvent.click(await screen.findByRole('button', { name: m.removeUser }));
    await userEvent.click(screen.getByRole('button', { name: new RegExp(a.remove.delete) }));
    const confirm = screen.getByRole('button', { name: a.remove.confirm(a.thisPerson) });
    expect(confirm).toBeDisabled();
    await userEvent.click(screen.getByRole('checkbox', { name: a.remove.understand(a.thisPerson) }));
    await userEvent.click(confirm);
    expect(api.remove).toHaveBeenCalledWith('t-1', 'm-5');
    expect(navigate).toHaveBeenCalledWith({ to: '/u/$slot/users', params: { slot: '0' } });
  });

  it('makes someone a super admin from the role panel', async () => {
    const api = show('m-5');
    await userEvent.click(await screen.findByRole('button', { name: m.change }));
    await userEvent.click(screen.getByRole('radio', { name: new RegExp(r.ADMIN.name) }));
    await userEvent.click(screen.getByRole('button', { name: a.role.saveRole }));
    expect(api.update).toHaveBeenCalledWith('t-1', 'm-5', { role: 'ADMIN' });
  });

  it('moves someone to another unit', async () => {
    const api = show('m-5');
    await userEvent.click(await screen.findByRole('button', { name: m.unitChip('Lagos office') }));
    await userEvent.click(screen.getByRole('radio', { name: /Design team/ }));
    await userEvent.click(screen.getByRole('button', { name: a.unit.move('Design team') }));
    expect(api.changeUnit).toHaveBeenCalledWith('t-1', 'm-5', 'ou-design');
  });

  it('resends sign-in details to someone invited', async () => {
    const api = show('m-2');
    await userEvent.click(await screen.findByRole('button', { name: a.resend }));
    expect(api.resendInvite).toHaveBeenCalled();
    expect(await screen.findByText(a.done_.resent(a.thisPerson).replace(/^s/, 'S'))).toBeInTheDocument();
  });

  it('restores access for someone suspended', async () => {
    const api = show('m-4');
    await userEvent.click(await screen.findByRole('button', { name: a.restoreAccess }));
    expect(api.reactivate).toHaveBeenCalledWith('t-1', 'm-4');
  });

  it('says when the person is no longer in the organisation', async () => {
    show('m-gone');
    expect(await screen.findByText(m.gone)).toBeInTheDocument();
  });
});

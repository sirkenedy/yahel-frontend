import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '@yahel/api-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dismissToast, useToast } from '../../toast';
import { actionMessages as m } from './messages';
import { personOf } from './people';
import { admin, invited, me, member, owner, testSession } from './test-session';
import { UserActions, lockOf } from './user-actions';

const navigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }));

function Toast() {
  const toast = useToast();
  return toast ? <p role="status">{toast.text}</p> : null;
}

const user = member({ _id: 'm-5', globalIdentityId: 'g-5' });
const everyone = [owner, admin, invited, user].map((one) => personOf(one, me));
const at = (id: string) => everyone.find((person) => person.member._id === id)!;

const show = (id: string, overrides: Record<string, unknown> = {}) => {
  const { session, wrapper, api } = testSession([owner, admin, invited, user], {
    update: vi.fn(async () => ({})),
    suspend: vi.fn(async () => ({})),
    reactivate: vi.fn(async () => ({})),
    remove: vi.fn(async () => null),
    resendInvite: vi.fn(async () => null),
    cancelInvite: vi.fn(async () => null),
    ...overrides,
  });
  render(
    <>
      <UserActions session={session} tenantId="t-1" slot="0" organisation="Northwind Studio" person={at(id)} everyone={everyone} />
      <Toast />
    </>,
    { wrapper },
  );
  return { api: api.tenants.members as Record<string, ReturnType<typeof vi.fn>>, user: userEvent.setup() };
};

describe('UserActions', () => {
  beforeEach(() => {
    dismissToast();
    navigate.mockReset();
  });

  it('confirms making someone an admin, naming the change, then says it is done', async () => {
    const { api, user: u } = show('m-5');
    await u.click(screen.getByRole('button', { name: m.makeAdmin }));
    const dialog = screen.getByRole('alertdialog', { name: m.confirm.makeAdminTitle(m.thisPerson) });
    expect(dialog).toHaveTextContent('Admins can manage people');
    await u.click(screen.getAllByRole('button', { name: m.makeAdmin }).at(-1)!);
    expect(api.update).toHaveBeenCalledWith('t-1', 'm-5', { role: 'ADMIN' });
    expect(await screen.findByRole('status')).toHaveTextContent('This person is now an admin.');
  });

  it('says what deleting does and does not transfer, and goes back to Users', async () => {
    const { api, user: u } = show('m-5');
    await u.click(screen.getByRole('button', { name: m.delete }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent('nothing is transferred');
    await u.click(screen.getAllByRole('button', { name: m.delete }).at(-1)!);
    expect(api.remove).toHaveBeenCalledWith('t-1', 'm-5');
    expect(navigate).toHaveBeenCalledWith({ to: '/u/$slot/users', params: { slot: '0' } });
  });

  it('cancelling the dialog changes nothing', async () => {
    const { api, user: u } = show('m-5');
    await u.click(screen.getByRole('button', { name: m.suspend }));
    await u.click(screen.getByRole('button', { name: m.cancel }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(api.suspend).not.toHaveBeenCalled();
  });

  it('keeps the owner’s and your own controls in view, disabled, with the reason', () => {
    show('m-me');
    expect(screen.getByRole('button', { name: m.suspend })).toBeDisabled();
    expect(screen.getByRole('button', { name: m.delete })).toBeDisabled();
    expect(screen.getByRole('button', { name: m.delete })).toHaveAccessibleDescription(m.why.owner);
  });

  it('resends an invitation, and says when it needs your own second step', async () => {
    const { api, user: u } = show('m-2', { resendInvite: vi.fn(async () => Promise.reject(new ApiError({ status: 403, code: 'MFA_REQUIRED', message: 'x' }))) });
    await u.click(screen.getByRole('button', { name: m.resend }));
    expect(api.resendInvite).toHaveBeenCalledWith('t-1', 'm-2');
    expect(await screen.findByRole('status')).toHaveTextContent(m.failed.secondStep);
    expect(screen.queryByRole('button', { name: m.suspend })).not.toBeInTheDocument();
  });

  it('finds why a person cannot be changed', () => {
    expect(lockOf(at('m-me'), everyone, 'Amara')).toBe(m.why.owner);
    expect(lockOf(personOf(admin, { ...me, id: 'g-3' }), everyone, 'x')).toBe(m.why.you);
    const alone = [personOf(member({ _id: 'a', role: 'ADMIN' }), me)];
    expect(lockOf(alone[0]!, alone, 'Kofi')).toBe(m.why.lastAdmin('Kofi'));
    expect(lockOf(at('m-5'), everyone, 'x')).toBeNull();
  });
});

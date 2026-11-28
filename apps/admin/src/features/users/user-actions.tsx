import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { isApiError } from '@yahel/api-client';
import type { Session } from '@yahel/auth';
import { notify } from '../../toast';
import { actionMessages as m } from './messages';
import type { Person } from './people';
import { memberQuery } from './queries';
import type { Unit } from './units';

/** Why an administrator may not change `person`'s role or access, or `null` when they may. Shown beside the disabled controls. */
export function lockOf(person: Person, everyone: readonly Person[], name: string) {
  if (person.member.role === 'OWNER') return m.why.owner;
  if (person.isYou) return m.why.you;
  const admins = everyone.filter(({ member }) => member.status === 'active' && (member.role === 'OWNER' || member.role === 'ADMIN'));
  if (person.member.role === 'ADMIN' && admins.length <= 1) return m.why.lastAdmin(name);
  return null;
}

export const failureOf = (error: unknown) => {
  if (!isApiError(error)) return m.failed.server;
  if (error.status === 0) return m.failed.offline;
  switch (error.code) {
    case 'FORBIDDEN':
      return m.failed.forbidden;
    case 'SEAT_LIMIT_REACHED':
      return m.failed.seats;
    case 'MFA_REQUIRED':
      return m.failed.secondStep;
    case 'RESOURCE_NOT_FOUND':
      return m.failed.gone;
    case 'VALIDATION_ERROR':
      return m.failed.state;
    default:
      return m.failed.server;
  }
};

export type MemberChange =
  | { kind: 'role'; role: 'ADMIN' | 'MEMBER'; roleName: string }
  | { kind: 'suspend' }
  | { kind: 'reactivate' }
  | { kind: 'delete' }
  | { kind: 'resend' }
  | { kind: 'cancelInvite' }
  | { kind: 'unit'; unit: Unit }
  | { kind: 'profile'; jobTitle: string; department: string };

export interface MemberChangeContext {
  session: Session;
  tenantId: string;
  slot: string;
  memberId: string;
  name: string;
}

const said = (change: MemberChange, name: string) => {
  const done = m.done_;
  switch (change.kind) {
    case 'role':
      return done.role(name, change.roleName);
    case 'suspend':
      return done.suspended(name);
    case 'reactivate':
      return done.reactivated(name);
    case 'delete':
      return done.deleted(name);
    case 'resend':
      return done.resent(name);
    case 'cancelInvite':
      return done.cancelled(name);
    case 'unit':
      return done.moved(name, change.unit.name);
    case 'profile':
      return done.saved(name);
  }
};

/** One change to one person, on the endpoints that exist: a toast says what happened, and the people lists are fetched again. */
export function useMemberChange({ session, tenantId, slot, memberId: id, name }: MemberChangeContext, onDone?: () => void) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const api = session.api.tenants.members;
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['users', tenantId] }, { cancelRefetch: false });

  return useMutation({
    mutationFn: async (change: MemberChange) => {
      switch (change.kind) {
        case 'role':
          return api.update(tenantId, id, { role: change.role });
        case 'suspend':
          return api.suspend(tenantId, id);
        case 'reactivate':
          return api.reactivate(tenantId, id);
        case 'delete':
          return api.remove(tenantId, id);
        case 'resend':
          return api.resendInvite(tenantId, id);
        case 'cancelInvite':
          return api.cancelInvite(tenantId, id);
        case 'unit':
          return api.changeUnit(tenantId, id, change.unit._id);
        case 'profile':
          return api.update(tenantId, id, { jobTitle: change.jobTitle, department: change.department });
      }
    },
    onSuccess: async (_, change) => {
      onDone?.();
      const text = said(change, name);
      notify(text.charAt(0).toUpperCase() + text.slice(1));
      if (change.kind === 'delete' || change.kind === 'cancelInvite') {
        queryClient.removeQueries({ queryKey: memberQuery(session, tenantId, id).queryKey });
        await navigate({ to: '/u/$slot/users', params: { slot } });
      }
      await refresh();
    },
    onError: async (error) => {
      onDone?.();
      notify(failureOf(error), 'danger');
      await refresh();
    },
  });
}

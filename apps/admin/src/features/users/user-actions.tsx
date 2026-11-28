import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { isApiError } from '@yahel/api-client';
import type { Session } from '@yahel/auth';
import { ConsoleCard, ConsoleDialog, FlowButton } from '@yahel/ui';
import { useId, useState } from 'react';
import { notify } from '../../toast';
import { actionMessages as m } from './messages';
import { nameOf } from './people';
import type { Person } from './people';
import { memberQuery, membersQuery } from './queries';

type Action = 'makeAdmin' | 'removeAdmin' | 'suspend' | 'reactivate' | 'delete' | 'resend' | 'cancelInvite';

/** Why an administrator may not change `person`'s role or access, or `null` when they may. Shown beside the disabled controls. */
export function lockOf(person: Person, everyone: readonly Person[], name: string) {
  if (person.member.role === 'OWNER') return m.why.owner;
  if (person.isYou) return m.why.you;
  const admins = everyone.filter(({ member }) => member.status === 'active' && (member.role === 'OWNER' || member.role === 'ADMIN'));
  if (person.member.role === 'ADMIN' && admins.length <= 1) return m.why.lastAdmin(name);
  return null;
}

const failureOf = (error: unknown) => {
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

export interface UserActionsProps {
  session: Session;
  tenantId: string;
  slot: string;
  organisation: string;
  person: Person;
  everyone: readonly Person[];
}

/**
 * What an administrator can do to one person, on the endpoints that exist. A change of role, suspending and
 * deleting are confirmed in a dialog that names the change. The owner, yourself and the last administrator
 * cannot be changed: the controls stay in view, disabled, with the reason.
 */
export function UserActions({ session, tenantId, slot, organisation, person, everyone }: UserActionsProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const reasonId = useId();
  const [confirming, setConfirming] = useState<Action | null>(null);
  const name = nameOf(person);
  const { member } = person;
  const lock = lockOf(person, everyone, name);
  const api = session.api.tenants.members;

  const run = useMutation({
    mutationFn: async (action: Action) => {
      switch (action) {
        case 'makeAdmin':
          return api.update(tenantId, member._id, { role: 'ADMIN' });
        case 'removeAdmin':
          return api.update(tenantId, member._id, { role: 'MEMBER' });
        case 'suspend':
          return api.suspend(tenantId, member._id);
        case 'reactivate':
          return api.reactivate(tenantId, member._id);
        case 'delete':
          return api.remove(tenantId, member._id);
        case 'resend':
          return api.resendInvite(tenantId, member._id);
        case 'cancelInvite':
          return api.cancelInvite(tenantId, member._id);
      }
    },
    onSuccess: async (_, action) => {
      setConfirming(null);
      const said = { makeAdmin: m.done.madeAdmin, removeAdmin: m.done.removedAdmin, suspend: m.done.suspended, reactivate: m.done.reactivated, delete: m.done.deleted, resend: m.done.resent, cancelInvite: m.done.cancelled }[action];
      notify(said(name));
      if (action === 'delete' || action === 'cancelInvite') {
        queryClient.removeQueries({ queryKey: memberQuery(session, tenantId, member._id).queryKey });
        await navigate({ to: '/u/$slot/users', params: { slot } });
      }
      await queryClient.invalidateQueries({ queryKey: membersQuery(session, tenantId).queryKey.slice(0, 2) });
    },
    onError: async (error) => {
      setConfirming(null);
      notify(failureOf(error), 'danger');
      await queryClient.invalidateQueries({ queryKey: membersQuery(session, tenantId).queryKey.slice(0, 2) });
    },
  });

  const confirmed: Partial<Record<Action, { title: string; body: string; extra?: string; verb: string; destructive?: boolean }>> = {
    makeAdmin: { title: m.confirm.makeAdminTitle(name), body: m.confirm.makeAdmin(organisation), verb: m.makeAdmin },
    removeAdmin: { title: m.confirm.removeAdminTitle(name), body: m.confirm.removeAdmin(organisation), verb: m.removeAdmin },
    suspend: { title: m.confirm.suspendTitle(name), body: m.confirm.suspend(organisation), verb: m.suspend, destructive: true },
    delete: { title: m.confirm.deleteTitle(name), body: m.confirm.delete(organisation), extra: m.confirm.deleteUndo, verb: m.delete, destructive: true },
    cancelInvite: { title: m.confirm.cancelInviteTitle(name), body: m.confirm.cancelInvite, verb: m.cancelInvite, destructive: true },
  };
  const ask = (action: Action) => (confirmed[action] ? setConfirming(action) : run.mutate(action));
  const pending = (action: Action) => run.isPending && run.variables === action;
  const locked = { isDisabled: !!lock || run.isPending, 'aria-describedby': lock ? reasonId : undefined };
  const dialog = confirming ? confirmed[confirming] : undefined;
  const invitedNow = member.status === 'invited';

  return (
    <>
      <div className="user-actions" role="group" aria-label={m.label}>
        {invitedNow ? (
          <>
            <FlowButton onPress={() => ask('resend')} isPending={pending('resend')} pendingLabel={m.working} isDisabled={run.isPending}>
              {m.resend}
            </FlowButton>
            <FlowButton onPress={() => ask('cancelInvite')} isDisabled={run.isPending || person.isYou}>
              {m.cancelInvite}
            </FlowButton>
          </>
        ) : (
          <>
            <FlowButton isDisabled aria-describedby={`${reasonId}-reset`}>
              {m.resetPassword}
            </FlowButton>
            {member.role === 'ADMIN' ? (
              <FlowButton onPress={() => ask('removeAdmin')} {...locked}>
                {m.removeAdmin}
              </FlowButton>
            ) : (
              <FlowButton onPress={() => ask('makeAdmin')} {...locked} isDisabled={locked.isDisabled || member.role === 'OWNER'}>
                {m.makeAdmin}
              </FlowButton>
            )}
            {member.status === 'suspended' ? (
              <FlowButton onPress={() => ask('reactivate')} isPending={pending('reactivate')} pendingLabel={m.working} {...locked}>
                {m.reactivate}
              </FlowButton>
            ) : (
              <FlowButton onPress={() => ask('suspend')} {...locked}>
                {m.suspend}
              </FlowButton>
            )}
          </>
        )}
      </div>
      {lock ? (
        <p id={reasonId} className="ws-console-note">
          {lock}
        </p>
      ) : null}
      {invitedNow ? null : (
        <p id={`${reasonId}-reset`} className="ws-console-note">
          {m.resetLater}
        </p>
      )}
      {invitedNow ? null : (
        <ConsoleCard title={m.deleteTitle(name)} icon="warning">
          <p className="ws-console-muted">{m.deleteLede}</p>
          <div className="user-actions">
            <FlowButton variant="destructive" onPress={() => ask('delete')} {...locked}>
              {m.delete}
            </FlowButton>
          </div>
        </ConsoleCard>
      )}
      <ConsoleDialog
        isOpen={!!dialog}
        onOpenChange={(open) => (open || run.isPending ? undefined : setConfirming(null))}
        title={dialog?.title ?? ''}
        actions={
          <>
            <FlowButton variant="quiet" onPress={() => setConfirming(null)} isDisabled={run.isPending}>
              {m.cancel}
            </FlowButton>
            {confirming && dialog ? (
              <FlowButton variant={dialog.destructive ? 'destructive' : 'primary'} onPress={() => run.mutate(confirming)} isPending={run.isPending} pendingLabel={m.working}>
                {dialog.verb}
              </FlowButton>
            ) : null}
          </>
        }
      >
        <p>{dialog?.body}</p>
        {dialog?.extra ? <p>{dialog.extra}</p> : null}
      </ConsoleDialog>
    </>
  );
}

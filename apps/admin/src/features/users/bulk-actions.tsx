import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Session } from '@yahel/auth';
import { BulkBar, BulkButton, ConsoleDialog, ConsoleMenu, FlowButton } from '@yahel/ui';
import { useId, useState } from 'react';
import { notify } from '../../toast';
import { bulkMessages as m } from './messages';
import type { Person } from './people';
import { lockOf } from './user-actions';
import type { Unit } from './units';

type Change = { kind: 'move'; unit: Unit } | { kind: 'suspend' } | { kind: 'delete' };

export interface BulkActionsProps {
  session: Session;
  tenantId: string;
  organisation: string;
  selected: readonly Person[];
  everyone: readonly Person[];
  units: readonly Unit[];
  onClear: () => void;
}

/**
 * What can be done to several people at once. Each change is one request per person, because the API has no
 * bulk endpoint for them; suspending and deleting are confirmed first, and the people who can't be changed
 * (yourself, the owner, the last administrator) keep those two actions disabled with the reason.
 */
export function BulkActions({ session, tenantId, organisation, selected, everyone, units, onClear }: BulkActionsProps) {
  const queryClient = useQueryClient();
  const reasonId = useId();
  const [confirming, setConfirming] = useState<'suspend' | 'delete' | null>(null);
  const api = session.api.tenants.members;
  const locked = selected.some((person) => lockOf(person, everyone, '') !== null);
  const notActive = selected.some((person) => person.member.status !== 'active');

  const run = useMutation({
    mutationFn: async (change: Change) => {
      const results = await Promise.allSettled(
        selected.map(({ member }) => (change.kind === 'move' ? api.changeUnit(tenantId, member._id, change.unit._id) : change.kind === 'suspend' ? api.suspend(tenantId, member._id) : api.remove(tenantId, member._id))),
      );
      return results.filter((result) => result.status === 'fulfilled').length;
    },
    onSuccess: async (done, change) => {
      setConfirming(null);
      if (done < selected.length) notify(m.partly(done, selected.length), 'danger');
      else notify(change.kind === 'move' ? m.moved(done, change.unit.name) : change.kind === 'suspend' ? m.suspended(done) : m.deleted(done));
      onClear();
      await queryClient.invalidateQueries({ queryKey: ['users', tenantId] }, { cancelRefetch: false });
    },
  });

  const reasons = [locked ? m.locked : null, !locked && notActive ? m.notActive : null, m.resetLater].filter(Boolean);

  return (
    <>
      <BulkBar label={m.label} count={m.count(selected.length)} clearLabel={m.clear} onClear={onClear}>
        <ConsoleMenu
          look="bulk"
          icon="unit"
          label={m.move}
          items={units.map((unit) => ({ id: unit._id, label: unit.name }))}
          isDisabled={run.isPending}
          onAction={(id) => {
            const unit = units.find((one) => one._id === id);
            if (unit) run.mutate({ kind: 'move', unit });
          }}
        />
        <BulkButton isDisabled aria-describedby={reasonId}>
          {m.resetPasswords}
        </BulkButton>
        <BulkButton isDisabled={locked || notActive || run.isPending} aria-describedby={reasonId} onPress={() => setConfirming('suspend')}>
          {m.suspend}
        </BulkButton>
        <BulkButton isDisabled={locked || run.isPending} aria-describedby={reasonId} onPress={() => setConfirming('delete')}>
          {m.delete}
        </BulkButton>
      </BulkBar>
      <p id={reasonId} className="ws-console-note">
        {reasons.join(' ')}
      </p>
      <ConsoleDialog
        isOpen={!!confirming}
        onOpenChange={(open) => (open || run.isPending ? undefined : setConfirming(null))}
        title={confirming === 'delete' ? m.deleteTitle(selected.length) : m.suspendTitle(selected.length)}
        actions={
          <>
            <FlowButton variant="quiet" onPress={() => setConfirming(null)} isDisabled={run.isPending}>
              {m.cancel}
            </FlowButton>
            <FlowButton variant="destructive" isPending={run.isPending} pendingLabel={m.working} onPress={() => confirming && run.mutate({ kind: confirming })}>
              {confirming === 'delete' ? m.delete : m.suspend}
            </FlowButton>
          </>
        }
      >
        <p>{confirming === 'delete' ? m.deleteBody(organisation) : m.suspendBody}</p>
      </ConsoleDialog>
    </>
  );
}

import { Choice, ChoiceGroup, ConsoleDialog, FlowButton, FlowCheckbox, FlowNotice } from '@yahel/ui';
import { useState } from 'react';
import { actionMessages as m, userMessages as u } from './messages';
import type { useMemberChange } from './user-actions';

type Run = ReturnType<typeof useMemberChange>;

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
}

const closeUnlessBusy = (run: Run | null, onClose: () => void) => (open: boolean) => (open || run?.isPending ? undefined : onClose());

/** Suspending: a pause, with what it means listed. */
export function SuspendDialog({ isOpen, onClose, name, address, run }: DialogProps & { address: string | null; run: Run }) {
  return (
    <ConsoleDialog
      isOpen={isOpen}
      onOpenChange={closeUnlessBusy(run, onClose)}
      title={m.suspendDialog.title(name)}
      lede={m.suspendDialog.lede}
      actions={
        <>
          <FlowButton variant="quiet" onPress={onClose} isDisabled={run.isPending}>
            {m.cancel}
          </FlowButton>
          <FlowButton variant="destructive" isPending={run.isPending} pendingLabel={m.working} onPress={() => run.mutate({ kind: 'suspend' })}>
            {m.suspend}
          </FlowButton>
        </>
      }
    >
      <ul className="user-points">
        {m.suspendDialog.points(address).map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </ConsoleDialog>
  );
}

/** Removing someone: suspend instead, or delete after saying plainly that nothing is handed over. */
export function RemoveDialog({ isOpen, onClose, name, run, canSuspend }: DialogProps & { run: Run; canSuspend: boolean }) {
  const [step, setStep] = useState<'choose' | 'delete'>('choose');
  const [understood, setUnderstood] = useState(false);
  const close = () => {
    setStep('choose');
    setUnderstood(false);
    onClose();
  };
  if (step === 'choose')
    return (
      <ConsoleDialog
        isOpen={isOpen}
        onOpenChange={closeUnlessBusy(run, close)}
        role="dialog"
        title={m.remove.title(name)}
        lede={m.remove.lede}
        closeLabel={m.close}
        actions={
          <FlowButton variant="quiet" onPress={close} isDisabled={run.isPending}>
            {m.cancel}
          </FlowButton>
        }
      >
        <div className="user-choices">
          <FlowButton variant="field" isDisabled={!canSuspend || run.isPending} onPress={() => run.mutate({ kind: 'suspend' })}>
            <span className="ws-console-person__text">
              <span>{m.remove.suspendInstead}</span>
              <span className="ws-console-person__sub">{m.remove.suspendInsteadDetail}</span>
            </span>
          </FlowButton>
          <FlowButton variant="field" isDisabled={run.isPending} onPress={() => setStep('delete')}>
            <span className="ws-console-person__text">
              <span>{m.remove.delete}</span>
              <span className="ws-console-person__sub">{m.remove.deleteDetail}</span>
            </span>
          </FlowButton>
        </div>
      </ConsoleDialog>
    );
  return (
    <ConsoleDialog
      isOpen={isOpen}
      onOpenChange={closeUnlessBusy(run, close)}
      title={m.remove.handoverTitle(name)}
      lede={m.remove.handoverLede}
      actions={
        <>
          <FlowButton variant="quiet" onPress={() => setStep('choose')} isDisabled={run.isPending}>
            {m.back}
          </FlowButton>
          <FlowButton variant="destructive" isDisabled={!understood} isPending={run.isPending} pendingLabel={m.working} onPress={() => run.mutate({ kind: 'delete' })}>
            {m.remove.confirm(name)}
          </FlowButton>
        </>
      }
    >
      <FlowNotice tone="info">{m.remove.handoverLater}</FlowNotice>
      <FlowCheckbox isSelected={understood} onChange={setUnderstood}>
        {m.remove.understand(name)}
      </FlowCheckbox>
    </ConsoleDialog>
  );
}

/** Withdrawing an invitation someone has not used. */
export function CancelInviteDialog({ isOpen, onClose, name, run }: DialogProps & { run: Run }) {
  return (
    <ConsoleDialog
      isOpen={isOpen}
      onOpenChange={closeUnlessBusy(run, onClose)}
      title={m.cancelInviteTitle(name)}
      actions={
        <>
          <FlowButton variant="quiet" onPress={onClose} isDisabled={run.isPending}>
            {m.back}
          </FlowButton>
          <FlowButton variant="destructive" isPending={run.isPending} pendingLabel={m.working} onPress={() => run.mutate({ kind: 'cancelInvite' })}>
            {m.cancelInvite}
          </FlowButton>
        </>
      }
    >
      <p>{m.cancelInviteBody}</p>
    </ConsoleDialog>
  );
}

/** Resetting a password, as designed; the API has no endpoint for it yet, so it stops short and says so. */
export function ResetPasswordDialog({ isOpen, onClose, name }: DialogProps) {
  const r = m.reset;
  return (
    <ConsoleDialog
      isOpen={isOpen}
      onOpenChange={(open) => (open ? undefined : onClose())}
      role="dialog"
      title={r.title(name)}
      lede={r.lede}
      closeLabel={m.close}
      actions={
        <>
          <FlowButton variant="quiet" onPress={onClose}>
            {m.cancel}
          </FlowButton>
          <FlowButton variant="primary" isDisabled>
            {m.resetPassword}
          </FlowButton>
        </>
      }
    >
      <FlowNotice tone="info">{r.later}</FlowNotice>
      <ChoiceGroup label={r.how} value="generate" onChange={() => undefined} isDisabled>
        <Choice value="generate" detail={r.generateDetail}>
          {r.generate}
        </Choice>
        <Choice value="own" detail={r.ownDetail}>
          {r.own}
        </Choice>
      </ChoiceGroup>
      <FlowCheckbox isSelected isDisabled onChange={() => undefined}>
        {r.askChange}
      </FlowCheckbox>
      <FlowCheckbox isSelected={false} isDisabled onChange={() => undefined}>
        {r.signOut}
      </FlowCheckbox>
    </ConsoleDialog>
  );
}

/** Bringing back deleted mail and files, as designed; not in the API yet. */
export function RestoreDataDialog({ isOpen, onClose, name }: DialogProps) {
  return (
    <ConsoleDialog
      isOpen={isOpen}
      onOpenChange={(open) => (open ? undefined : onClose())}
      role="dialog"
      title={m.restoreData.title(name)}
      lede={m.restoreData.lede}
      closeLabel={m.close}
      actions={
        <>
          <FlowButton variant="quiet" onPress={onClose}>
            {m.cancel}
          </FlowButton>
          <FlowButton variant="primary" isDisabled>
            {u.restore}
          </FlowButton>
        </>
      }
    >
      <FlowNotice tone="info">{m.restoreData.later}</FlowNotice>
    </ConsoleDialog>
  );
}

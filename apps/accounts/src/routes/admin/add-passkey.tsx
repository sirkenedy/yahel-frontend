import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/admin/machine';
import { stepInsteadOf } from '../../features/admin/route-guard';
import { AddPasskeyStep } from '../../features/admin/steps/add-passkey-step';

export const Route = createFileRoute('/admin/add-passkey')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('add-passkey', context.admin, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: AddPasskeyStep,
});

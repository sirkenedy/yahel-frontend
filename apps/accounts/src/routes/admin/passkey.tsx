import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/admin/machine';
import { stepInsteadOf } from '../../features/admin/route-guard';
import { PasskeyStep } from '../../features/admin/steps/passkey-step';

export const Route = createFileRoute('/admin/passkey')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('passkey', context.admin, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: PasskeyStep,
});

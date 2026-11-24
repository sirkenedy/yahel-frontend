import { createFileRoute, redirect } from '@tanstack/react-router';
import { pathOf, stepInsteadOf } from '../../features/admin/route-guard';
import { PasskeyStep } from '../../features/admin/steps/passkey-step';

export const Route = createFileRoute('/admin/passkey')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('passkey', context.admin, context.facts);
    if (instead) throw redirect({ to: pathOf(instead), replace: true });
  },
  component: PasskeyStep,
});

import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/admin/machine';
import { dropProof, stepInsteadOf } from '../../features/admin/route-guard';
import { ConfirmEmailStep } from '../../features/admin/steps/confirm-email-step';

export const Route = createFileRoute('/admin/confirm-email')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('confirm-email', context.admin, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  // The password proven for this step is held only while it is on screen.
  onLeave: ({ context }) => dropProof(context.admin),
  component: ConfirmEmailStep,
});

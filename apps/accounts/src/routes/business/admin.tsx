import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/business/machine';
import { stepInsteadOf } from '../../features/business/route-guard';
import { AdminStep } from '../../features/business/steps/admin-step';

export const Route = createFileRoute('/business/admin')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('admin', context.business, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: AdminStep,
});

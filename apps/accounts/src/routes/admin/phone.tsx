import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/admin/machine';
import { stepInsteadOf } from '../../features/admin/route-guard';
import { PhoneStep } from '../../features/admin/steps/phone-step';

export const Route = createFileRoute('/admin/phone')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('phone', context.admin, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: PhoneStep,
});

import { createFileRoute, redirect } from '@tanstack/react-router';
import { pathOf, stepInsteadOf } from '../../features/admin/route-guard';
import { PhoneStep } from '../../features/admin/steps/phone-step';

export const Route = createFileRoute('/admin/phone')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('phone', context.admin, context.facts);
    if (instead) throw redirect({ to: pathOf(instead), replace: true });
  },
  component: PhoneStep,
});

import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/admin/machine';
import { stepInsteadOf } from '../../features/admin/route-guard';
import { WelcomeStep } from '../../features/admin/steps/welcome-step';

export const Route = createFileRoute('/admin/welcome')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('welcome', context.admin, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: WelcomeStep,
});

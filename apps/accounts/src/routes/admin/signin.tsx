import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/admin/machine';
import { stepInsteadOf } from '../../features/admin/route-guard';
import { SignInStep } from '../../features/admin/steps/signin-step';

export const Route = createFileRoute('/admin/signin')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('signin', context.admin, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: SignInStep,
});

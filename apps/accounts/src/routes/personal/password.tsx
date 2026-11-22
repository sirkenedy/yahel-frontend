import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/personal/machine';
import { stepInsteadOf } from '../../features/personal/route-guard';
import { PasswordStep } from '../../features/personal/steps/password-step';

export const Route = createFileRoute('/personal/password')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('password', context.personal, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: PasswordStep,
});

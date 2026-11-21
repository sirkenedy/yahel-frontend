import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/sign-in/machine';
import { stepInsteadOf } from '../../features/sign-in/route-guard';
import { PasswordStep } from '../../features/sign-in/steps/password-step';

export const Route = createFileRoute('/signin/password')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('password', context.signIn, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: PasswordStep,
});

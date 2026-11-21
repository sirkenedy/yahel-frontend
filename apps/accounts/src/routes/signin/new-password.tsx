import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/sign-in/machine';
import { stepInsteadOf } from '../../features/sign-in/route-guard';
import { NewPasswordStep } from '../../features/sign-in/steps/new-password-step';

export const Route = createFileRoute('/signin/new-password')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('new-password', context.signIn, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: NewPasswordStep,
});

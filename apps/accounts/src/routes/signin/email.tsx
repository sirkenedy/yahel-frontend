import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/sign-in/machine';
import { stepInsteadOf } from '../../features/sign-in/route-guard';
import { EmailStep } from '../../features/sign-in/steps/email-step';

export const Route = createFileRoute('/signin/email')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('email', context.signIn, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: EmailStep,
});

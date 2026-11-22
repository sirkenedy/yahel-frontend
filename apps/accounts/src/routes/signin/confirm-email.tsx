import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/sign-in/machine';
import { dropProof, stepInsteadOf } from '../../features/sign-in/route-guard';
import { ConfirmEmailStep } from '../../features/sign-in/steps/confirm-email-step';

export const Route = createFileRoute('/signin/confirm-email')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('confirm-email', context.signIn, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  onLeave: ({ context }) => dropProof(context.signIn),
  component: ConfirmEmailStep,
});

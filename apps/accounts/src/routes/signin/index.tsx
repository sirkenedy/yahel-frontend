import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/sign-in/machine';
import { stepInsteadOf } from '../../features/sign-in/route-guard';

export const Route = createFileRoute('/signin/')({
  beforeLoad: ({ context }) => {
    throw redirect({ to: stepPath(stepInsteadOf('choose', context.signIn, context.facts) ?? 'choose'), replace: true });
  },
});

import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/personal/machine';
import { forgetSignUp, stepInsteadOf } from '../../features/personal/route-guard';

export const Route = createFileRoute('/personal/')({
  beforeLoad: ({ context }) => {
    // The entry address is where sign-up starts: arriving here begins again, unless an account is already being made.
    forgetSignUp(context.personal, { unlessUnderway: true });
    throw redirect({ to: stepPath(stepInsteadOf('type', context.personal, context.facts) ?? 'type'), replace: true });
  },
});

import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/sign-in/machine';
import { stepInsteadOf } from '../../features/sign-in/route-guard';
import { PasskeyStep } from '../../features/sign-in/steps/passkey-step';

export const Route = createFileRoute('/signin/passkey')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('passkey', context.signIn, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: PasskeyStep,
});

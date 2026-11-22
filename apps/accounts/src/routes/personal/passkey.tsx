import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/personal/machine';
import { stepInsteadOf } from '../../features/personal/route-guard';
import { PasskeyStep } from '../../features/personal/steps/passkey-step';

export const Route = createFileRoute('/personal/passkey')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('passkey', context.personal, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: PasskeyStep,
});

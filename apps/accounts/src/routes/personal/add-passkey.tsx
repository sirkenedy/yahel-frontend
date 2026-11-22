import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/personal/machine';
import { stepInsteadOf } from '../../features/personal/route-guard';
import { AddPasskeyStep } from '../../features/personal/steps/add-passkey-step';

export const Route = createFileRoute('/personal/add-passkey')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('add-passkey', context.personal, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: AddPasskeyStep,
});

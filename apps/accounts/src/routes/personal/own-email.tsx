import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/personal/machine';
import { stepInsteadOf } from '../../features/personal/route-guard';
import { OwnEmailStep } from '../../features/personal/steps/own-email-step';

export const Route = createFileRoute('/personal/own-email')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('own-email', context.personal, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: OwnEmailStep,
});

import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/personal/machine';
import { stepInsteadOf } from '../../features/personal/route-guard';
import { ReadyStep } from '../../features/personal/steps/ready-step';

export const Route = createFileRoute('/personal/ready')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('ready', context.personal, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: ReadyStep,
});

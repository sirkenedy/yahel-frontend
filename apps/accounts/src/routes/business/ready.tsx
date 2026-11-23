import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/business/machine';
import { stepInsteadOf } from '../../features/business/route-guard';
import { ReadyStep } from '../../features/business/steps/ready-step';

export const Route = createFileRoute('/business/ready')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('ready', context.business, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: ReadyStep,
});

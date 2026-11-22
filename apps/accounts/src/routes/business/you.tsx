import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/business/machine';
import { stepInsteadOf } from '../../features/business/route-guard';
import { YouStep } from '../../features/business/steps/you-step';

export const Route = createFileRoute('/business/you')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('you', context.business, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: YouStep,
});

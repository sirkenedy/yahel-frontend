import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/business/machine';
import { stepInsteadOf } from '../../features/business/route-guard';
import { FoundStep } from '../../features/business/steps/found-step';

export const Route = createFileRoute('/business/found')({
  beforeLoad: ({ context }) => {
    const instead = stepInsteadOf('found', context.business, context.facts);
    if (instead) throw redirect({ to: stepPath(instead), replace: true });
  },
  component: FoundStep,
});
